import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/response";

const createPenyediaSchema = z.object({
  nama: z.string().trim().min(1, "Nama penyedia wajib diisi."),
  npwp: z.string().trim().optional(),
  alamat: z.string().trim().optional(),
  kontakPerson: z.string().trim().optional(),
  email: z.string().trim().email("Email tidak valid.").optional().or(z.literal("")),
  telepon: z.string().trim().optional(),
  kategori: z.string().trim().optional(),
  status: z.enum(["AKTIF", "NONAKTIF", "BLACKLIST"]).default("AKTIF"),
  catatan: z.string().trim().optional(),
});

function formatZodError(error: z.ZodError) {
  return error.issues.map((issue) => ({
    field: issue.path.join("."),
    message: issue.message,
  }));
}

export async function GET() {
  const data = await prisma.penyedia.findMany({
    orderBy: { nama: "asc" },
    take: 100,
  });

  return apiSuccess(data, "Data penyedia berhasil diambil.");
}

export async function POST(request: Request) {
  const parsed = createPenyediaSchema.safeParse(
    await request.json().catch(() => null),
  );

  if (!parsed.success) {
    return apiError(
      "Data penyedia tidak valid.",
      422,
      formatZodError(parsed.error),
    );
  }

  try {
    const penyedia = await prisma.penyedia.create({
      data: {
        ...parsed.data,
        npwp: parsed.data.npwp || undefined,
        alamat: parsed.data.alamat || undefined,
        kontakPerson: parsed.data.kontakPerson || undefined,
        email: parsed.data.email || undefined,
        telepon: parsed.data.telepon || undefined,
        kategori: parsed.data.kategori || undefined,
        catatan: parsed.data.catatan || undefined,
      },
    });

    return apiSuccess(penyedia, "Data penyedia berhasil disimpan.", {
      status: 201,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return apiError("Nama penyedia sudah digunakan.", 409);
    }

    return apiError("Data penyedia gagal disimpan.", 500);
  }
}
