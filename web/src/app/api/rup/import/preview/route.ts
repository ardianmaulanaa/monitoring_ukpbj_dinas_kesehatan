import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/response";
import { buildRupPreview, parseRupImportFile } from "@/lib/rup-import";

const previewSchema = z.object({
  tahunAnggaran: z.coerce.number().int().min(2000),
  unitPengusul: z.string().trim().min(1),
});

export async function POST(request: Request) {
  const formData = await request.formData().catch(() => null);

  if (!formData) {
    return apiError("File import tidak valid.", 422);
  }

  const file = formData.get("file");
  const parsedMeta = previewSchema.safeParse({
    tahunAnggaran: formData.get("tahunAnggaran"),
    unitPengusul: formData.get("unitPengusul"),
  });

  if (!parsedMeta.success) {
    return apiError("Tahun anggaran dan unit pengusul wajib diisi.", 422);
  }

  if (!(file instanceof File)) {
    return apiError("Upload file PDF SiRUP LKPP atau Excel RUP.", 422);
  }

  try {
    const rows = await parseRupImportFile(file);
    const kodeRupList = rows.map((row) => row.kodeRup).filter(Boolean);
    const existingRows =
      kodeRupList.length > 0
        ? await prisma.rencanaUmumPengadaan.findMany({
            where: { kodeRup: { in: kodeRupList } },
            select: { kodeRup: true },
          })
        : [];
    const existingKodeRup = new Set(existingRows.map((row) => row.kodeRup));
    const previewRows = buildRupPreview(rows, existingKodeRup);

    return apiSuccess(
      {
        rows: previewRows,
        summary: {
          total: previewRows.length,
          valid: previewRows.filter((row) => row.status === "valid").length,
          duplicate: previewRows.filter((row) => row.status === "duplicate")
            .length,
          invalid: previewRows.filter((row) => row.status === "invalid").length,
        },
        tahunAnggaran: parsedMeta.data.tahunAnggaran,
        unitPengusul: parsedMeta.data.unitPengusul,
      },
      "Preview import RUP berhasil dibuat.",
    );
  } catch (error) {
    return apiError(
      error instanceof Error ? error.message : "File import gagal diproses.",
      422,
    );
  }
}
