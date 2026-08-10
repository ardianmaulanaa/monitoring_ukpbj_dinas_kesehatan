import { NextRequest } from "next/server";
import { z } from "zod";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/response";

const addSchema = z.object({
  name: z.string().trim().min(1, "Nama unit wajib diisi.").max(160),
  userIds: z
    .array(z.string().trim().min(1))
    .min(1, "Pilih minimal satu user agar unit tersimpan di database."),
});

const editSchema = z.object({
  currentName: z.string().trim().min(1, "Unit asal wajib diisi.").max(160),
  name: z.string().trim().min(1, "Nama unit wajib diisi.").max(160),
});

function formatZodError(error: z.ZodError) {
  return error.issues.map((issue) => ({
    field: issue.path.join("."),
    message: issue.message,
  }));
}

export async function POST(request: NextRequest) {
  await requireCurrentUser();

  const parsed = addSchema.safeParse(await request.json());
  if (!parsed.success) {
    return apiError("Data unit belum lengkap.", 422, formatZodError(parsed.error));
  }

  const existing = await prisma.user.findFirst({
    where: { unitKerja: parsed.data.name },
    select: { id: true },
  });

  if (existing) {
    return apiError("Nama unit sudah ada di database.", 409);
  }

  const result = await prisma.user.updateMany({
    where: { id: { in: parsed.data.userIds } },
    data: { unitKerja: parsed.data.name },
  });

  return apiSuccess(
    result,
    `${result.count.toLocaleString("id-ID")} user berhasil dipindahkan ke unit baru.`,
  );
}

export async function PATCH(request: NextRequest) {
  await requireCurrentUser();

  const parsed = editSchema.safeParse(await request.json());
  if (!parsed.success) {
    return apiError("Data unit belum lengkap.", 422, formatZodError(parsed.error));
  }

  const { currentName, name } = parsed.data;

  if (currentName === name) {
    return apiSuccess({ updated: 0 }, "Tidak ada perubahan nama unit.");
  }

  const duplicate = await prisma.user.findFirst({
    where: { unitKerja: name },
    select: { id: true },
  });

  if (duplicate) {
    return apiError("Nama unit tujuan sudah dipakai.", 409);
  }

  const [users, paketUnit, paketSatuanKerja, rup, timeline, klinik] =
    await prisma.$transaction([
    prisma.user.updateMany({
      where: { unitKerja: currentName },
      data: { unitKerja: name },
    }),
    prisma.paketPengadaan.updateMany({
      where: { unitPemohon: currentName },
      data: { unitPemohon: name },
    }),
    prisma.paketPengadaan.updateMany({
      where: { satuanKerja: currentName },
      data: { satuanKerja: name },
    }),
    prisma.rencanaUmumPengadaan.updateMany({
      where: { unitPengusul: currentName },
      data: { unitPengusul: name },
    }),
    prisma.timelineEvent.updateMany({
      where: { unitKerja: currentName },
      data: { unitKerja: name },
    }),
    prisma.klinikKonsultasi.updateMany({
      where: { unitKerja: currentName },
      data: { unitKerja: name },
    }),
  ]);

  return apiSuccess(
    {
      users: users.count,
      paketUnit: paketUnit.count,
      paketSatuanKerja: paketSatuanKerja.count,
      rup: rup.count,
      timeline: timeline.count,
      klinik: klinik.count,
    },
    "Unit berhasil diperbarui.",
  );
}
