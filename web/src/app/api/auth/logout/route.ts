import { cookies, headers } from "next/headers";
import { getCurrentUser } from "@/lib/auth";
import { sessionCookieName } from "@/lib/jwt";
import { prisma } from "@/lib/prisma";
import { apiSuccess } from "@/lib/response";

export async function POST() {
  const user = await getCurrentUser();
  const cookieStore = await cookies();

  cookieStore.delete(sessionCookieName);

  if (user) {
    const headerStore = await headers();
    const ipAddress =
      headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
    const userAgent = headerStore.get("user-agent");

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "LOGOUT",
        entity: "User",
        entityId: user.id,
        ipAddress,
        userAgent,
      },
    });
  }

  return apiSuccess(null, "Logout berhasil.");
}
