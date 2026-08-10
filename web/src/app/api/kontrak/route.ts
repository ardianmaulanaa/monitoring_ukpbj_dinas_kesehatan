import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/response";

const createKontrakSchema = z.object({
  nomorKontrak: z.string().trim().min(1, "Nomor kontrak wajib diisi."),
  paketId: z.string().trim().optional(),
  namaPaket: z.string().trim().min(1, "Nama paket wajib diisi."),
  penyedia: z.string().trim().min(1, "Penyedia wajib diisi."),
  nilaiKontrak: z.coerce.number().min(0, "Nilai kontrak tidak boleh negatif."),
  tanggalKontrak: z.string().trim().optional(),
  tanggalMulai: z.string().trim().optional(),
  tanggalSelesai: z.string().trim().optional(),
  status: z
    .enum(["DRAFT", "AKTIF", "SELESAI", "TERLAMBAT", "BATAL"])
    .default("DRAFT"),
  catatan: z.string().trim().optional(),
});

function toDate(value?: string) {
  if (!value) return undefined;
  return new Date(`${value}T00:00:00`);
}

export async function GET() {
  const data = await prisma.kontrak.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return apiSuccess(data, "Data kontrak berhasil diambil.");
}

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = createKontrakSchema.safeParse(json);

  if (!parsed.success) {
    return apiError(
      "Data kontrak tidak valid.",
      422,
      parsed.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    );
  }

  const {
    nilaiKontrak,
    paketId,
    tanggalKontrak,
    tanggalMulai,
    tanggalSelesai,
    catatan,
    ...data
  } = parsed.data;

  try {
    const kontrak = await prisma.$transaction(async (tx) => {
      await tx.penyedia.upsert({
        where: { nama: data.penyedia },
        update: {},
        create: { nama: data.penyedia },
      });

      return tx.kontrak.create({
        data: {
          ...data,
          paketId: paketId || undefined,
          nilaiKontrak: new Prisma.Decimal(nilaiKontrak),
          tanggalKontrak: toDate(tanggalKontrak),
          tanggalMulai: toDate(tanggalMulai),
          tanggalSelesai: toDate(tanggalSelesai),
          catatan: catatan || undefined,
        },
      });
    });

    return apiSuccess(kontrak, "Data kontrak berhasil disimpan.", {
      status: 201,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return apiError("Nomor kontrak sudah digunakan.", 409, [
        { field: "nomorKontrak", message: "Nomor kontrak harus unik." },
      ]);
    }

    return apiError("Data kontrak gagal disimpan.", 500);
  }
}
