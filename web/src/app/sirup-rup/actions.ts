"use server";

import { revalidatePath, updateTag } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { canProcessRup } from "@/lib/planning-workflow";
import { prisma } from "@/lib/prisma";
import { getRupCompleteness } from "@/lib/workflow-completeness";

export type RupRevisionState = {
  message: string;
  ok: boolean;
};

export type SirupPublicationState = {
  data?: {
    catatan: string | null;
    id: string;
    idRupSirup: string | null;
    linkSirup: string | null;
    metodePengadaan: string;
    pagu: string;
    statusSirup: string;
    tanggalInputSirup: string | null;
    tanggalTayangSirup: string | null;
  };
  message: string;
  ok: boolean;
};

function normalizeUnit(value?: string | null) {
  return value?.trim().toLowerCase() ?? "";
}

function optionalText(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text.length > 0 ? text : null;
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
  const lokasiPaket = String(formData.get("lokasiPaket") ?? "").trim();
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
      lokasiPaket: lokasiPaket || null,
      jadwalPemilihan: jadwalPemilihan || null,
      catatan: catatan || null,
      statusSirup:
        submitMode === "resubmit" ? "PROSES_VERIFIKASI" : "REVISI_PAGU",
    },
  });

  revalidatePath("/perencanaan");
  revalidatePath("/sirup-rup");
  revalidatePath(`/rup/${id}`);

  return {
    ok: true,
    message:
      submitMode === "resubmit"
        ? "Revisi disimpan dan diajukan ulang."
        : "Revisi berhasil disimpan.",
  };
}

export async function updateSirupPublicationAction(
  _previousState: SirupPublicationState,
  formData: FormData,
): Promise<SirupPublicationState> {
  const user = await getCurrentUser();

  if (!user) {
    return { ok: false, message: "Sesi login tidak ditemukan." };
  }

  if (!canProcessRup(user.roles)) {
    return {
      ok: false,
      message: "Hanya superadmin yang boleh mengubah data SIRUP/RUP.",
    };
  }

  const id = String(formData.get("id") ?? "");
  const pagu = String(formData.get("pagu") ?? "").replace(/\D/g, "");
  const metodePengadaan = String(formData.get("metodePengadaan") ?? "");
  const statusSirup = String(formData.get("statusSirup") ?? "");

  if (!id) {
    return { ok: false, message: "Data perencanaan tidak ditemukan." };
  }

  if (!pagu) {
    return { ok: false, message: "Pagu final wajib diisi." };
  }

  if (
    ![
      "TENDER",
      "NON_TENDER",
      "E_PURCHASING",
      "PENGADAAN_LANGSUNG",
      "SWAKELOLA",
    ].includes(metodePengadaan)
  ) {
    return { ok: false, message: "Metode pengadaan tidak valid." };
  }

  if (
    ![
      "SIAP_RUP",
      "BELUM_INPUT",
      "PROSES_VERIFIKASI",
      "SUDAH_TAYANG",
      "REVISI_PAGU",
      "DITARIK",
    ].includes(statusSirup)
  ) {
    return { ok: false, message: "Status SIRUP tidak valid." };
  }

  const existing = await prisma.rencanaUmumPengadaan.findUnique({
    where: { id },
    select: {
      id: true,
      namaPaket: true,
      sumberDana: true,
      tahunAnggaran: true,
      unitPengusul: true,
    },
  });

  if (!existing) {
    return { ok: false, message: "Data perencanaan tidak ditemukan." };
  }

  if (statusSirup === "SUDAH_TAYANG") {
    const completeness = getRupCompleteness({
      ...existing,
      idRupSirup: optionalText(formData.get("idRupSirup")),
      linkSirup: optionalText(formData.get("linkSirup")),
      metodePengadaan,
      pagu,
      statusSirup,
      tanggalTayangSirup: optionalText(formData.get("tanggalTayangSirup")),
    });

    if (!completeness.complete) {
      return {
        ok: false,
        message: `RUP belum lengkap dan belum dapat ditayangkan: ${completeness.missingFields.join(", ")}.`,
      };
    }
  }

  const updated = await prisma.rencanaUmumPengadaan.update({
    where: { id },
    data: {
      idRupSirup: optionalText(formData.get("idRupSirup")),
      tanggalInputSirup: optionalText(formData.get("tanggalInputSirup")),
      tanggalTayangSirup: optionalText(formData.get("tanggalTayangSirup")),
      linkSirup: optionalText(formData.get("linkSirup")),
      metodePengadaan: metodePengadaan as
        | "TENDER"
        | "NON_TENDER"
        | "E_PURCHASING"
        | "PENGADAAN_LANGSUNG"
        | "SWAKELOLA",
      pagu,
      statusSirup: statusSirup as
        | "SIAP_RUP"
        | "BELUM_INPUT"
        | "PROSES_VERIFIKASI"
        | "SUDAH_TAYANG"
        | "REVISI_PAGU"
        | "DITARIK",
      ...(statusSirup === "SUDAH_TAYANG"
        ? {
            statusUsulan: "RUP_TAYANG" as const,
          }
        : {}),
      catatan: optionalText(formData.get("catatan")),
    },
    select: {
      catatan: true,
      id: true,
      idRupSirup: true,
      linkSirup: true,
      metodePengadaan: true,
      pagu: true,
      statusSirup: true,
      tanggalInputSirup: true,
      tanggalTayangSirup: true,
    },
  });

  revalidatePath("/perencanaan");
  revalidatePath("/dashboard");
  revalidatePath("/e-purchasing");
  revalidatePath("/katalog-v6-v5");
  revalidatePath("/sirup-rup");
  revalidatePath("/tender-non-tender");
  revalidatePath(`/sirup-rup/${id}`);
  updateTag("dashboard-data");

  return {
    data: {
      ...updated,
      pagu: updated.pagu.toString(),
    },
    ok: true,
    message: "Data SIRUP berhasil disimpan.",
  };
}
