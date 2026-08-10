import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/response";

const createRealisasiSchema = z.object({
  paketId: z.string().trim().optional(),
  kontrakId: z.string().trim().optional(),
  sumberDana: z.string().trim().min(1, "Sumber dana wajib diisi."),
  tahunAnggaran: z.coerce.number().int().min(2000),
  nilaiPagu: z.coerce.number().min(0).default(0),
  nilaiHps: z.coerce.number().min(0).default(0),
  nilaiKontrak: z.coerce.number().min(0).default(0),
  nilaiRealisasi: z.coerce.number().min(0).default(0),
  tanggalBayar: z.string().trim().optional(),
  nomorBukti: z.string().trim().optional(),
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
  const data = await prisma.realisasiBelanja.findMany({
    include: {
      paket: { select: { namaPaket: true, unitPemohon: true } },
      kontrak: { select: { nomorKontrak: true, penyedia: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return apiSuccess(data, "Data realisasi berhasil diambil.");
}

export async function POST(request: Request) {
  const parsed = createRealisasiSchema.safeParse(
    await request.json().catch(() => null),
  );

  if (!parsed.success) {
    return apiError(
      "Data realisasi tidak valid.",
      422,
      formatZodError(parsed.error),
    );
  }

  const {
    paketId,
    kontrakId,
    nilaiPagu,
    nilaiHps,
    nilaiKontrak,
    nilaiRealisasi,
    tanggalBayar,
    nomorBukti,
    catatan,
    ...data
  } = parsed.data;

  const realisasi = await prisma.realisasiBelanja.create({
    data: {
      ...data,
      paketId: paketId || undefined,
      kontrakId: kontrakId || undefined,
      nilaiPagu: new Prisma.Decimal(nilaiPagu),
      nilaiHps: new Prisma.Decimal(nilaiHps),
      nilaiKontrak: new Prisma.Decimal(nilaiKontrak),
      nilaiRealisasi: new Prisma.Decimal(nilaiRealisasi),
      tanggalBayar: toDate(tanggalBayar),
      nomorBukti: nomorBukti || undefined,
      catatan: catatan || undefined,
    },
  });

  return apiSuccess(realisasi, "Data realisasi berhasil disimpan.", {
    status: 201,
  });
}
