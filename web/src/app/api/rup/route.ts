import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/response";

const rupQuerySchema = z.object({
  q: z.string().trim().optional(),
  tahunAnggaran: z.coerce.number().int().optional(),
  sumberDana: z.string().trim().optional(),
  unitPengusul: z.string().trim().optional(),
  statusSirup: z
    .enum([
      "BELUM_INPUT",
      "PROSES_VERIFIKASI",
      "MENUNGGU_PPTK",
      "MENUNGGU_PPK",
      "MENUNGGU_KPA_PA",
      "SUDAH_TAYANG",
      "REVISI_PAGU",
      "DITARIK",
    ])
    .optional(),
});

const createRupSchema = z.object({
  kodeRup: z.string().trim().min(1, "Kode RUP wajib diisi."),
  namaPaket: z.string().trim().min(1, "Nama paket wajib diisi."),
  unitPengusul: z.string().trim().min(1, "Unit pengusul wajib diisi."),
  sumberDana: z.string().trim().min(1, "Sumber dana wajib diisi."),
  pagu: z.coerce.number().min(0, "Pagu tidak boleh negatif."),
  metodePengadaan: z.enum([
    "TENDER",
    "NON_TENDER",
    "E_PURCHASING",
    "PENGADAAN_LANGSUNG",
    "SWAKELOLA",
  ]),
  jadwalPemilihan: z.string().trim().optional(),
  tahunAnggaran: z.coerce
    .number()
    .int()
    .min(2000, "Tahun anggaran tidak valid."),
  statusSirup: z
    .enum([
      "BELUM_INPUT",
      "PROSES_VERIFIKASI",
      "MENUNGGU_PPTK",
      "MENUNGGU_PPK",
      "MENUNGGU_KPA_PA",
      "SUDAH_TAYANG",
      "REVISI_PAGU",
      "DITARIK",
    ])
    .default("BELUM_INPUT"),
  catatan: z.string().trim().optional(),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = rupQuerySchema.safeParse({
    q: searchParams.get("q") ?? undefined,
    tahunAnggaran: searchParams.get("tahunAnggaran") ?? undefined,
    sumberDana: searchParams.get("sumberDana") ?? undefined,
    unitPengusul: searchParams.get("unitPengusul") ?? undefined,
    statusSirup: searchParams.get("statusSirup") ?? undefined,
  });

  if (!parsed.success) {
    return apiError("Filter RUP tidak valid.", 422);
  }

  const { q, tahunAnggaran, sumberDana, unitPengusul, statusSirup } =
    parsed.data;
  const where: Prisma.RencanaUmumPengadaanWhereInput = {
    ...(tahunAnggaran ? { tahunAnggaran } : {}),
    ...(sumberDana ? { sumberDana } : {}),
    ...(unitPengusul ? { unitPengusul } : {}),
    ...(statusSirup ? { statusSirup } : {}),
    ...(q
      ? {
          OR: [
            { kodeRup: { contains: q } },
            { namaPaket: { contains: q } },
            { unitPengusul: { contains: q } },
          ],
        }
      : {}),
  };

  const data = await prisma.rencanaUmumPengadaan.findMany({
    where,
    orderBy: [{ tahunAnggaran: "desc" }, { createdAt: "desc" }],
    take: 100,
  });

  return apiSuccess(data, "Data RUP berhasil diambil.");
}

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = createRupSchema.safeParse(json);

  if (!parsed.success) {
    return apiError(
      "Data RUP tidak valid.",
      422,
      parsed.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    );
  }

  const { pagu, jadwalPemilihan, catatan, ...data } = parsed.data;

  try {
    const rup = await prisma.rencanaUmumPengadaan.create({
      data: {
        ...data,
        pagu: new Prisma.Decimal(pagu),
        jadwalPemilihan: jadwalPemilihan || undefined,
        catatan: catatan || undefined,
      },
    });

    return apiSuccess(rup, "Data RUP berhasil disimpan.", { status: 201 });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return apiError("Kode RUP sudah digunakan.", 409, [
        { field: "kodeRup", message: "Kode RUP harus unik." },
      ]);
    }

    return apiError("Data RUP gagal disimpan.", 500);
  }
}
