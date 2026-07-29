import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/response";

const createBarangSchema = z.object({
  kodeBarang: z.string().trim().min(1, "Kode barang wajib diisi."),
  namaBarang: z.string().trim().min(1, "Nama barang wajib diisi."),
  kategori: z.string().trim().min(1, "Kategori wajib diisi."),
  spesifikasi: z.string().trim().min(1, "Spesifikasi wajib diisi."),
  satuan: z.string().trim().min(1, "Satuan wajib diisi."),
  jumlahKebutuhan: z.coerce
    .number()
    .int()
    .min(0, "Jumlah kebutuhan tidak boleh negatif."),
  hargaSatuan: z.coerce.number().min(0, "Harga satuan tidak boleh negatif."),
  tkdnPersen: z.coerce
    .number()
    .min(0, "TKDN tidak boleh negatif.")
    .max(100, "TKDN maksimal 100%.")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  isPdn: z.coerce.boolean().optional(),
  prioritas: z.enum(["RENDAH", "NORMAL", "TINGGI", "MENDESAK"]),
  lokasiPenerimaan: z.string().trim().optional(),
  catatan: z.string().trim().optional(),
  status: z.enum(["AKTIF", "NONAKTIF"]).optional(),
});

export async function GET() {
  const data = await prisma.dataBarang.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return apiSuccess(data, "Data barang berhasil diambil.");
}

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = createBarangSchema.safeParse(json);

  if (!parsed.success) {
    return apiError(
      "Data barang tidak valid.",
      422,
      parsed.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    );
  }

  const {
    jumlahKebutuhan,
    hargaSatuan,
    tkdnPersen,
    isPdn,
    lokasiPenerimaan,
    catatan,
    status,
    ...data
  } = parsed.data;

  try {
    const barang = await prisma.dataBarang.create({
      data: {
        ...data,
        jumlahKebutuhan,
        hargaSatuan: new Prisma.Decimal(hargaSatuan),
        estimasiTotal: new Prisma.Decimal(jumlahKebutuhan).mul(hargaSatuan),
        tkdnPersen:
          tkdnPersen === undefined ? undefined : new Prisma.Decimal(tkdnPersen),
        isPdn: isPdn ?? false,
        lokasiPenerimaan: lokasiPenerimaan || undefined,
        catatan: catatan || undefined,
        status: status ?? "AKTIF",
      },
    });

    return apiSuccess(barang, "Data barang berhasil disimpan.", {
      status: 201,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return apiError("Kode barang sudah digunakan.", 409, [
        { field: "kodeBarang", message: "Kode barang harus unik." },
      ]);
    }

    return apiError("Data barang gagal disimpan.", 500);
  }
}
