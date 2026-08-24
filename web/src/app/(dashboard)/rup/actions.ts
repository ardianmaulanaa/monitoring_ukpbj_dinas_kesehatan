"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type RupRevisionState = {
  message: string;
  ok: boolean;
};

function normalizeUnit(value?: string | null) {
  return value?.trim().toLowerCase() ?? "";
}

export async function updateRupRevisionAction(
  _previousState: RupRevisionState,
  formData: FormData,
): Promise<RupRevisionState> {
  const user = await getCurrentUser();

  if (!user) {
    return { ok: false, message: "Sesi login tidak ditemukan." };
  }

  const id = String(formData.get("id") ?? "");
  const pagu = String(formData.get("pagu") ?? "").replace(/\D/g, "");
  const jadwalPemilihan = String(formData.get("jadwalPemilihan") ?? "");
  const catatan = String(formData.get("catatan") ?? "").trim();
  const submitMode = String(formData.get("submitMode") ?? "save");

  if (!id || !pagu) {
    return { ok: false, message: "Pagu revisi wajib diisi." };
  }

  const [proposal, profile] = await Promise.all([
    prisma.rencanaUmumPengadaan.findUnique({
      where: { id },
      select: {
        statusSirup: true,
        unitPengusul: true,
      },
    }),
    prisma.user.findUnique({
      where: { id: user.id },
      select: { unitKerja: true },
    }),
  ]);

  if (!proposal) {
    return { ok: false, message: "Data usulan tidak ditemukan." };
  }

  const canEdit =
    user.roles.includes("SUPER_ADMIN") ||
    normalizeUnit(profile?.unitKerja) === normalizeUnit(proposal.unitPengusul) ||
    normalizeUnit(user.name) === normalizeUnit(proposal.unitPengusul);

  if (!canEdit || proposal.statusSirup !== "REVISI_PAGU") {
    return {
      ok: false,
      message: "Revisi hanya dapat diubah oleh unit pengusul saat status Perlu Revisi.",
    };
  }

  await prisma.rencanaUmumPengadaan.update({
    where: { id },
    data: {
      pagu,
      jadwalPemilihan: jadwalPemilihan || null,
      catatan: catatan || null,
      statusSirup:
        submitMode === "resubmit" ? "PROSES_VERIFIKASI" : "REVISI_PAGU",
    },
  });

  revalidatePath("/pengadaan/perencanaan");
  revalidatePath("/rup");
  revalidatePath(`/rup/${id}`);

  return {
    ok: true,
    message:
      submitMode === "resubmit"
        ? "Revisi disimpan dan diajukan ulang."
        : "Revisi berhasil disimpan.",
  };
}
