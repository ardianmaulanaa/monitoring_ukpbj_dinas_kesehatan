import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/response";
import { toRupCreateManyData } from "@/lib/rup-import";

const rupImportRowSchema = z.object({
  kodeRup: z.string().trim().min(1),
  namaPaket: z.string().trim().min(1),
  kegiatan: z.string().trim().nullable(),
  sumberDana: z.string().trim().min(1),
  lokasiPaket: z.string().trim().nullable(),
  metodePengadaan: z.enum([
    "TENDER",
    "NON_TENDER",
    "E_PURCHASING",
    "PENGADAAN_LANGSUNG",
    "SWAKELOLA",
  ]),
  pagu: z.coerce.number().min(0),
});

const commitSchema = z.object({
  tahunAnggaran: z.coerce.number().int().min(2000),
  unitPengusul: z.string().trim().min(1),
  rows: z.array(rupImportRowSchema).min(1),
});

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = commitSchema.safeParse(json);

  if (!parsed.success) {
    return apiError(
      "Data preview import tidak valid.",
      422,
      parsed.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    );
  }

  const { rows, tahunAnggaran, unitPengusul } = parsed.data;
  const kodeRupList = rows.map((row) => row.kodeRup);
  const existingRows = await prisma.rencanaUmumPengadaan.findMany({
    where: { kodeRup: { in: kodeRupList } },
    select: { kodeRup: true },
  });
  const existingKodeRup = new Set(existingRows.map((row) => row.kodeRup));
  const rowsToCreate = rows.filter((row) => !existingKodeRup.has(row.kodeRup));

  if (rowsToCreate.length === 0) {
    return apiSuccess(
      {
        created: 0,
        skipped: rows.length,
      },
      "Semua Kode RUP sudah ada. Tidak ada data baru yang diimport.",
    );
  }

  try {
    const result = await prisma.rencanaUmumPengadaan.createMany({
      data: toRupCreateManyData(rowsToCreate, tahunAnggaran, unitPengusul),
      skipDuplicates: true,
    });

    return apiSuccess(
      {
        created: result.count,
        skipped: rows.length - result.count,
      },
      "Data RUP berhasil diimport.",
      { status: 201 },
    );
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return apiError("Sebagian Kode RUP sudah digunakan.", 409);
    }

    return apiError("Data RUP gagal diimport.", 500);
  }
}
