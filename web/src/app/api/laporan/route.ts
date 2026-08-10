import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/response";

const createReportSchema = z.object({
  judul: z.string().trim().min(1, "Judul laporan wajib diisi."),
  jenis: z.enum(["PAKET", "REALISASI", "KONTRAK", "RISIKO", "AUDIT"]),
  tahunAnggaran: z.coerce.number().int().min(2000).optional(),
  periode: z.string().trim().optional(),
  fileUrl: z.string().trim().optional(),
  status: z.enum(["DRAFT", "TERBIT", "ARSIP"]).default("DRAFT"),
  catatan: z.string().trim().optional(),
});

function formatZodError(error: z.ZodError) {
  return error.issues.map((issue) => ({
    field: issue.path.join("."),
    message: issue.message,
  }));
}

export async function GET() {
  const [paket, kontrak, progres, realisasi, risiko, laporan] =
    await Promise.all([
      prisma.paketPengadaan.count(),
      prisma.kontrak.count(),
      prisma.progresPaket.count(),
      prisma.realisasiBelanja.aggregate({ _sum: { nilaiRealisasi: true } }),
      prisma.risikoMitigasi.count(),
      prisma.laporanTersimpan.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
    ]);

  return apiSuccess(
    {
      laporan,
      summary: {
        totalPaket: paket,
        totalKontrak: kontrak,
        totalProgres: progres,
        totalRisiko: risiko,
        totalRealisasi: realisasi._sum.nilaiRealisasi?.toString() ?? "0",
      },
    },
    "Data laporan berhasil diambil.",
  );
}

export async function POST(request: Request) {
  const parsed = createReportSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return apiError(
      "Data laporan tidak valid.",
      422,
      formatZodError(parsed.error),
    );
  }

  const { periode, fileUrl, catatan, ...data } = parsed.data;

  const report = await prisma.laporanTersimpan.create({
    data: {
      ...data,
      periode: periode || undefined,
      fileUrl: fileUrl || undefined,
      catatan: catatan || undefined,
    },
  });

  return apiSuccess(report, "Laporan berhasil disimpan.", { status: 201 });
}
