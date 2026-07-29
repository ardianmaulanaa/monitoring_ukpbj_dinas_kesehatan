import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/response";

const createPaketSchema = z.object({
  kodePaket: z.string().trim().min(1, "Kode paket wajib diisi."),
  namaPaket: z.string().trim().min(1, "Nama paket wajib diisi."),
  unitPemohon: z.string().trim().min(1, "Unit pemohon wajib diisi."),
  satuanKerja: z.string().trim().optional(),
  tahunAnggaran: z.coerce
    .number()
    .int()
    .min(2000, "Tahun anggaran tidak valid."),
  sumberDana: z.string().trim().min(1, "Sumber dana wajib diisi."),
  jenisPengadaan: z.enum(["BARANG", "JASA"]).default("BARANG"),
  kategori: z.string().trim().min(1, "Kategori wajib diisi."),
  metodePengadaan: z.enum([
    "TENDER",
    "NON_TENDER",
    "E_PURCHASING",
    "PENGADAAN_LANGSUNG",
    "SWAKELOLA",
  ]),
  pagu: z.coerce.number().min(0, "Pagu tidak boleh negatif."),
  hps: z.coerce.number().min(0, "HPS tidak boleh negatif."),
  statusPaket: z
    .enum([
      "PERENCANAAN",
      "SIAP_DIPROSES",
      "PEMILIHAN",
      "PEMENANG_DITETAPKAN",
      "KONTRAK",
      "SELESAI",
      "GAGAL",
      "BATAL",
      "TERLAMBAT",
    ])
    .default("PERENCANAAN"),
  prioritas: z.enum(["RENDAH", "NORMAL", "TINGGI", "MENDESAK"]),
  ppkPenanggungJawab: z.string().trim().optional(),
  rencanaMulai: z.string().trim().optional(),
  rencanaSelesai: z.string().trim().optional(),
  lokasiPelaksanaan: z.string().trim().optional(),
  catatan: z.string().trim().optional(),
});

function toDate(value?: string) {
  if (!value) return undefined;
  return new Date(`${value}T00:00:00`);
}

export async function GET() {
  const data = await prisma.paketPengadaan.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return apiSuccess(data, "Data paket berhasil diambil.");
}

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = createPaketSchema.safeParse(json);

  if (!parsed.success) {
    return apiError(
      "Data paket tidak valid.",
      422,
      parsed.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    );
  }

  const {
    pagu,
    hps,
    satuanKerja,
    ppkPenanggungJawab,
    rencanaMulai,
    rencanaSelesai,
    lokasiPelaksanaan,
    catatan,
    ...data
  } = parsed.data;

  try {
    const paket = await prisma.paketPengadaan.create({
      data: {
        ...data,
        pagu: new Prisma.Decimal(pagu),
        hps: new Prisma.Decimal(hps),
        satuanKerja: satuanKerja || undefined,
        ppkPenanggungJawab: ppkPenanggungJawab || undefined,
        rencanaMulai: toDate(rencanaMulai),
        rencanaSelesai: toDate(rencanaSelesai),
        lokasiPelaksanaan: lokasiPelaksanaan || undefined,
        catatan: catatan || undefined,
      },
    });

    return apiSuccess(paket, "Data paket berhasil disimpan.", {
      status: 201,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return apiError("Kode paket sudah digunakan.", 409, [
        { field: "kodePaket", message: "Kode paket harus unik." },
      ]);
    }

    return apiError("Data paket gagal disimpan.", 500);
  }
}
