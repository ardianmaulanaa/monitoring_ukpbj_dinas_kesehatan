import { cookies, headers } from "next/headers";
import { z } from "zod";
import { isDatabaseConnectionError } from "@/lib/database-errors";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/response";
import {
  hashPassword,
  shouldRehashPassword,
  verifyPassword,
} from "@/lib/password";
import {
  sessionCookieName,
  sessionMaxAgeSeconds,
  signSessionToken,
} from "@/lib/jwt";

const loginSchema = z.object({
  email: z.string().trim().email("Email tidak valid.").toLowerCase(),
  password: z.string().min(1, "Password wajib diisi."),
});

export const preferredRegion = "sin1";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(json);

  if (!parsed.success) {
    return apiError(
      "Data login tidak valid.",
      422,
      parsed.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    );
  }

  try {
    const user = await prisma.user.findUnique({
      where: {
        email: parsed.data.email,
      },
      select: {
        id: true,
        name: true,
        email: true,
        passwordHash: true,
        status: true,
        roles: {
          select: {
            role: {
              select: {
                code: true,
              },
            },
          },
        },
      },
    });

    if (!user || user.status !== "ACTIVE") {
      return apiError("Email atau password salah.", 401);
    }

    const passwordIsValid = await verifyPassword(
      parsed.data.password,
      user.passwordHash,
    );

    if (!passwordIsValid) {
      return apiError("Email atau password salah.", 401);
    }

    const roles = user.roles.map((userRole) => userRole.role.code);
    const token = signSessionToken({
      sub: user.id,
      email: user.email,
      name: user.name,
      roles,
    });

    const cookieStore = await cookies();
    cookieStore.set(sessionCookieName, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: sessionMaxAgeSeconds,
      path: "/",
    });

    const headerStore = await headers();
    const ipAddress =
      headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
    const userAgent = headerStore.get("user-agent");
    const shouldRefreshPasswordHash = shouldRehashPassword(user.passwordHash);

    const response = apiSuccess(
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          roles,
        },
      },
      "Login berhasil.",
    );

    void (async () => {
      const refreshedPasswordHash = shouldRefreshPasswordHash
        ? await hashPassword(parsed.data.password)
        : null;

      await prisma.$transaction([
        prisma.user.update({
          where: {
            id: user.id,
          },
          data: {
            lastLoginAt: new Date(),
            ...(refreshedPasswordHash
              ? { passwordHash: refreshedPasswordHash }
              : {}),
          },
        }),
        prisma.auditLog.create({
          data: {
            userId: user.id,
            action: "LOGIN",
            entity: "User",
            entityId: user.id,
            ipAddress,
            userAgent,
          },
        }),
      ]);
    })().catch((error) => {
      console.error("Gagal mencatat audit login.", error);
    });

    return response;
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      console.error("Database tidak dapat dihubungi saat login.", error);

      return apiError(
        "Database tidak dapat dihubungi. Periksa koneksi internet atau konfigurasi DATABASE_URL.",
        503,
      );
    }

    throw error;
  }
}
