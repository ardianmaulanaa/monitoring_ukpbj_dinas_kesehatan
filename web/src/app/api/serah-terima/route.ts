import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/response";

const createSerahTerimaSchema = z.object({
  paketId: z.string().trim().optional(),
  kontrakId: z.string().trim().optional(),
  nomorDokumen: z.string().trim().min(1, "Nomor dokumen wajib diisi."),
  tanggalDokumen: z.string().trim().optional(),
  pemeriksa: z.string().trim().optional(),
  status: z.enum(["RENCANA", "BERJALAN", "SELESAI", "TERLAMBAT"]).default("BERJALAN"),
  catatan: z.string().trim().optional(),
});

function toDate(value?: string) {
  if (!value) return undefined;
  return new Date(`${value}T00:00:00`);
}

function formatZodError(error: z.ZodError) {
  return error.issues.map((issue) => ({
    field: issue.path.join("."),
    message: issue.message,
  }));
}

export async function GET() {
  const data = await prisma.serahTerima.findMany({
    include: {
      paket: { select: { namaPaket: true, unitPemohon: true } },
      kontrak: { select: { nomorKontrak: true, penyedia: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return apiSuccess(data, "Data serah terima berhasil diambil.");
}

export async function POST(request: Request) {
  const parsed = createSerahTerimaSchema.safeParse(
    await request.json().catch(() => null),
  );

  if (!parsed.success) {
    return apiError(
      "Data serah terima tidak valid.",
      422,
      formatZodError(parsed.error),
    );
  }

  const { paketId, kontrakId, tanggalDokumen, pemeriksa, catatan, ...data } =
    parsed.data;

  try {
    const serahTerima = await prisma.serahTerima.create({
      data: {
        ...data,
        paketId: paketId || undefined,
        kontrakId: kontrakId || undefined,
        tanggalDokumen: toDate(tanggalDokumen),
        pemeriksa: pemeriksa || undefined,
        catatan: catatan || undefined,
      },
    });

    return apiSuccess(serahTerima, "Data serah terima berhasil disimpan.", {
      status: 201,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return apiError("Nomor dokumen sudah digunakan.", 409);
    }

    return apiError("Data serah terima gagal disimpan.", 500);
  }
}
