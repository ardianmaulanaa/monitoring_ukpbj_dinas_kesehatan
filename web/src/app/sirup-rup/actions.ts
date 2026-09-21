"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type RupRevisionState = {
  message: string;
  ok: boolean;
};

export type SirupPublicationState = {
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

function optionalDecimal(value: FormDataEntryValue | null) {
  const text = String(value ?? "").replace(/\D/g, "");
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
    select: { id: true },
  });

  if (!existing) {
    return { ok: false, message: "Data perencanaan tidak ditemukan." };
  }

  await prisma.rencanaUmumPengadaan.update({
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
        | "BELUM_INPUT"
        | "PROSES_VERIFIKASI"
        | "SUDAH_TAYANG"
        | "REVISI_PAGU"
        | "DITARIK",
      jenisKatalog:
        metodePengadaan === "E_PURCHASING"
          ? optionalText(formData.get("jenisKatalog"))
          : null,
      etalaseKatalog:
        metodePengadaan === "E_PURCHASING"
          ? optionalText(formData.get("etalaseKatalog"))
          : null,
      namaProdukKatalog:
        metodePengadaan === "E_PURCHASING"
          ? optionalText(formData.get("namaProdukKatalog"))
          : null,
      spesifikasiProdukKatalog:
        metodePengadaan === "E_PURCHASING"
          ? optionalText(formData.get("spesifikasiProdukKatalog"))
          : null,
      merekTipeKatalog:
        metodePengadaan === "E_PURCHASING"
          ? optionalText(formData.get("merekTipeKatalog"))
          : null,
      jumlahProdukKatalog:
        metodePengadaan === "E_PURCHASING"
          ? optionalText(formData.get("jumlahProdukKatalog"))
          : null,
      satuanProdukKatalog:
        metodePengadaan === "E_PURCHASING"
          ? optionalText(formData.get("satuanProdukKatalog"))
          : null,
      hargaSatuanKatalog:
        metodePengadaan === "E_PURCHASING"
          ? optionalDecimal(formData.get("hargaSatuanKatalog"))
          : null,
      totalHargaKatalog:
        metodePengadaan === "E_PURCHASING"
          ? optionalDecimal(formData.get("totalHargaKatalog"))
          : null,
      namaPenyediaKatalog:
        metodePengadaan === "E_PURCHASING"
          ? optionalText(formData.get("namaPenyediaKatalog"))
          : null,
      statusNegosiasiKatalog:
        metodePengadaan === "E_PURCHASING"
          ? optionalText(formData.get("statusNegosiasiKatalog"))
          : null,
      hargaNegosiasiKatalog:
        metodePengadaan === "E_PURCHASING"
          ? optionalDecimal(formData.get("hargaNegosiasiKatalog"))
          : null,
      nomorSuratPesanan:
        metodePengadaan === "E_PURCHASING"
          ? optionalText(formData.get("nomorSuratPesanan"))
          : null,
      tanggalSuratPesanan:
        metodePengadaan === "E_PURCHASING"
          ? optionalText(formData.get("tanggalSuratPesanan"))
          : null,
      statusTransaksiKatalog:
        metodePengadaan === "E_PURCHASING"
          ? optionalText(formData.get("statusTransaksiKatalog"))
          : null,
      catatanKatalog:
        metodePengadaan === "E_PURCHASING"
          ? optionalText(formData.get("catatanKatalog"))
          : null,
      catatan: optionalText(formData.get("catatan")),
    },
  });

  revalidatePath("/perencanaan");
  revalidatePath("/katalog-v6-v5");
  revalidatePath("/sirup-rup");
  revalidatePath(`/sirup-rup/${id}`);

  return {
    ok: true,
    message: "Data SIRUP berhasil disimpan.",
  };
}
