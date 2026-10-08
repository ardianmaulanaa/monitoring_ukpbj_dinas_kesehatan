"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { hasAnyRole } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { isEligibleForEPurchasing } from "@/lib/e-purchasing-eligibility";
import { getEPurchasingCompleteness } from "@/lib/workflow-completeness";

export type KatalogWorkflowState = {
  message: string;
  ok: boolean;
};

const executableRoles = ["SUPER_ADMIN", "PPK", "PROCUREMENT_OFFICER"] as const;

const text = z.string().trim().optional();
const positiveNumber = z.coerce
  .number()
  .positive("Nilai harus lebih dari 0.");

const katalogWorkflowSchema = z.discriminatedUnion("step", [
  z.object({
    step: z.literal("product"),
    id: z.string().uuid(),
    namaProduk: z.string().trim().min(1, "Nama produk wajib diisi."),
    merk: text,
    jumlah: positiveNumber,
    satuan: z.string().trim().min(1, "Satuan wajib diisi."),
    spesifikasi: text,
    etalase: text,
    platform: text,
    kategori: text,
    linkProduk: text,
    hargaTayang: positiveNumber,
  }),
  z.object({
    step: z.literal("provider"),
    id: z.string().uuid(),
    namaPenyedia: z.string().trim().min(1, "Nama penyedia wajib diisi."),
    kontakPenyedia: text,
    emailPenyedia: text,
    alamatPenyedia: text,
  }),
  z.object({
    step: z.literal("negotiation"),
    id: z.string().uuid(),
    hargaPenawaran: positiveNumber,
    hargaKesepakatan: positiveNumber,
    statusNegosiasi: z.string().trim().min(1, "Status negosiasi wajib diisi."),
    catatan: text,
  }),
  z.object({
    step: z.literal("contract"),
    id: z.string().uuid(),
    nomorSppbj: text,
    tanggalSppbj: text,
    statusSuratPesanan: text,
    nomorSuratPesanan: text,
    tanggalSuratPesanan: text,
    nomorSpkKontrak: text,
    tanggalKontrak: text,
    nomorSpmk: text,
    tanggalSpmk: text,
  }),
  z.object({
    step: z.literal("delivery"),
    id: z.string().uuid(),
    statusPengiriman: z.string().trim().min(1, "Status pengiriman wajib diisi."),
    tanggalRencanaKirim: text,
    tanggalAktualKirim: text,
    nomorSuratJalan: text,
    catatan: text,
  }),
  z.object({
    step: z.literal("inspection"),
    id: z.string().uuid(),
    statusUjiFungsi: text,
    nomorBaUjiFungsi: text,
    tanggalUjiFungsi: text,
    statusPemeriksaan: text,
    nomorBaPemeriksaan: text,
    tanggalPemeriksaan: text,
    hasilPemeriksaan: text,
    nomorBast: text,
    tanggalBast: text,
    catatan: text,
  }),
  z.object({
    step: z.literal("payment"),
    id: z.string().uuid(),
    statusDokumenPembayaran: z
      .string()
      .trim()
      .min(1, "Status dokumen pembayaran wajib diisi."),
    statusPembayaran: z.string().trim().min(1, "Status pembayaran wajib diisi."),
    nilaiPembayaran: z.coerce.number().nonnegative(),
    nomorInvoice: text,
    nomorFaktur: text,
    tanggalPembayaran: text,
    catatan: text,
  }),
  z.object({
    step: z.literal("reset"),
    id: z.string().uuid(),
  }),
]);

function optionalText(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function decimal(value: number) {
  return new Prisma.Decimal(value);
}

function statusAfterStep(step: z.output<typeof katalogWorkflowSchema>["step"]) {
  const labels = {
    product: "PRODUK",
    provider: "PENYEDIA",
    negotiation: "NEGOSIASI",
    contract: "KONTRAK",
    delivery: "PENGIRIMAN",
    inspection: "PEMERIKSAAN",
    payment: "PEMBAYARAN",
    reset: null,
  };

  return labels[step];
}

function incompleteMessage(stage: string, fields: string[]) {
  return `${stage} belum lengkap: ${fields.join(", ")}.`;
}

export async function updateKatalogWorkflowAction(
  input: z.input<typeof katalogWorkflowSchema>,
): Promise<KatalogWorkflowState> {
  const user = await getCurrentUser();

  if (!user) {
    return { ok: false, message: "Sesi login tidak ditemukan." };
  }

  if (!hasAnyRole(user.roles, [...executableRoles])) {
    return {
      ok: false,
      message:
        "Akses ditolak. Eksekusi E-Purchasing hanya untuk PPK/Pejabat Pengadaan.",
    };
  }

  const parsed = katalogWorkflowSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      message:
        parsed.error.issues[0]?.message ?? "Data E-Purchasing tidak valid.",
    };
  }

  const existing = await prisma.rencanaUmumPengadaan.findUnique({
    where: { id: parsed.data.id },
    select: {
      id: true,
      catatanKatalog: true,
      hargaNegosiasiKatalog: true,
      hargaPenawaranKatalog: true,
      hargaSatuanKatalog: true,
      hasilPemeriksaan: true,
      idRupSirup: true,
      jenisKatalog: true,
      jumlahProdukKatalog: true,
      linkSirup: true,
      metodePengadaan: true,
      namaPaket: true,
      namaPenyediaKatalog: true,
      namaProdukKatalog: true,
      nilaiPembayaran: true,
      nomorBaPemeriksaan: true,
      nomorBast: true,
      nomorInvoice: true,
      nomorSpkKontrak: true,
      nomorSuratJalan: true,
      nomorSuratPesanan: true,
      pagu: true,
      satuanProdukKatalog: true,
      spesifikasiProdukKatalog: true,
      statusDokumenPembayaran: true,
      statusNegosiasiKatalog: true,
      statusPembayaranEp: true,
      statusPemeriksaanEp: true,
      statusPengirimanEp: true,
      statusSirup: true,
      statusSuratPesanan: true,
      statusTransaksiKatalog: true,
      statusUsulan: true,
      sumberDana: true,
      tanggalAktualKirim: true,
      tanggalBast: true,
      tanggalKontrakEp: true,
      tanggalPembayaranEp: true,
      tanggalPemeriksaan: true,
      tanggalSuratPesanan: true,
      tanggalTayangSirup: true,
      tahunAnggaran: true,
      totalHargaKatalog: true,
      unitPengusul: true,
    },
  });

  if (!existing) {
    return { ok: false, message: "Data RUP tidak ditemukan." };
  }

  if (!isEligibleForEPurchasing(existing)) {
    return {
      ok: false,
      message:
        "E-Purchasing hanya dapat diproses untuk paket eligible dengan metode E-Purchasing.",
    };
  }

  const pagu = Number(existing.pagu);

  if (parsed.data.step === "product") {
    const totalHarga = parsed.data.jumlah * parsed.data.hargaTayang;
    const candidate = {
      ...existing,
      jenisKatalog: optionalText(parsed.data.platform),
      jumlahProdukKatalog: String(parsed.data.jumlah),
      namaProdukKatalog: parsed.data.namaProduk,
      satuanProdukKatalog: parsed.data.satuan,
      hargaSatuanKatalog: decimal(parsed.data.hargaTayang),
      totalHargaKatalog: decimal(totalHarga),
    };
    const completion = getEPurchasingCompleteness(candidate);

    if (totalHarga > pagu) {
      return {
        ok: false,
        message: "Total harga tayang tidak boleh melebihi pagu RUP.",
      };
    }

    if (!completion.sections.product.complete) {
      return {
        ok: false,
        message: incompleteMessage("Produk", completion.sections.product.missingFields),
      };
    }

    await prisma.rencanaUmumPengadaan.update({
      where: { id: parsed.data.id },
      data: {
        namaProdukKatalog: parsed.data.namaProduk,
        merekTipeKatalog: optionalText(parsed.data.merk),
        jumlahProdukKatalog: String(parsed.data.jumlah),
        satuanProdukKatalog: parsed.data.satuan,
        spesifikasiProdukKatalog: optionalText(parsed.data.spesifikasi),
        etalaseKatalog: optionalText(parsed.data.etalase),
        jenisKatalog: optionalText(parsed.data.platform),
        kategoriProdukKatalog: optionalText(parsed.data.kategori),
        linkProdukKatalog: optionalText(parsed.data.linkProduk),
        hargaSatuanKatalog: decimal(parsed.data.hargaTayang),
        totalHargaKatalog: decimal(totalHarga),
        statusTransaksiKatalog: statusAfterStep(parsed.data.step),
      },
    });
  }

  if (parsed.data.step === "provider") {
    const candidate = {
      ...existing,
      namaPenyediaKatalog: parsed.data.namaPenyedia,
    };
    const completion = getEPurchasingCompleteness(candidate);

    if (!completion.sections.provider.complete) {
      return {
        ok: false,
        message: incompleteMessage("Penyedia", completion.sections.provider.missingFields),
      };
    }

    await prisma.rencanaUmumPengadaan.update({
      where: { id: parsed.data.id },
      data: {
        namaPenyediaKatalog: parsed.data.namaPenyedia,
        kontakPenyediaKatalog: optionalText(parsed.data.kontakPenyedia),
        emailPenyediaKatalog: optionalText(parsed.data.emailPenyedia),
        alamatPenyediaKatalog: optionalText(parsed.data.alamatPenyedia),
        statusTransaksiKatalog: statusAfterStep(parsed.data.step),
      },
    });
  }

  if (parsed.data.step === "negotiation") {
    const totalHargaTayang = Number(existing.totalHargaKatalog ?? 0);
    const candidate = {
      ...existing,
      hargaNegosiasiKatalog: decimal(parsed.data.hargaKesepakatan),
      hargaPenawaranKatalog: decimal(parsed.data.hargaPenawaran),
      statusNegosiasiKatalog: parsed.data.statusNegosiasi,
    };
    const completion = getEPurchasingCompleteness(candidate);

    if (!existing.jumlahProdukKatalog || !existing.hargaSatuanKatalog) {
      return {
        ok: false,
        message: "Produk katalog harus disimpan terlebih dahulu.",
      };
    }

    if (parsed.data.hargaKesepakatan > totalHargaTayang) {
      return {
        ok: false,
        message: "Harga nego final tidak boleh melebihi total harga tayang.",
      };
    }

    if (parsed.data.hargaKesepakatan > pagu) {
      return {
        ok: false,
        message: "Harga nego final tidak boleh melebihi pagu RUP.",
      };
    }

    if (!completion.sections.negotiation.complete) {
      return {
        ok: false,
        message: incompleteMessage(
          "Negosiasi",
          completion.sections.negotiation.missingFields,
        ),
      };
    }

    await prisma.rencanaUmumPengadaan.update({
      where: { id: parsed.data.id },
      data: {
        statusNegosiasiKatalog: parsed.data.statusNegosiasi,
        hargaPenawaranKatalog: decimal(parsed.data.hargaPenawaran),
        hargaNegosiasiKatalog: decimal(parsed.data.hargaKesepakatan),
        statusTransaksiKatalog: statusAfterStep(parsed.data.step),
        catatanKatalog: optionalText(parsed.data.catatan),
      },
    });
  }

  if (parsed.data.step === "contract") {
    const candidate = {
      ...existing,
      nomorSpkKontrak: optionalText(parsed.data.nomorSpkKontrak),
      nomorSuratPesanan: optionalText(parsed.data.nomorSuratPesanan),
      statusSuratPesanan: optionalText(parsed.data.statusSuratPesanan),
      tanggalKontrakEp: optionalText(parsed.data.tanggalKontrak),
      tanggalSuratPesanan: optionalText(parsed.data.tanggalSuratPesanan),
    };
    const completion = getEPurchasingCompleteness(candidate);

    if (!completion.sections.contract.complete) {
      return {
        ok: false,
        message: incompleteMessage("Kontrak", completion.sections.contract.missingFields),
      };
    }

    await prisma.rencanaUmumPengadaan.update({
      where: { id: parsed.data.id },
      data: {
        nomorSppbj: optionalText(parsed.data.nomorSppbj),
        tanggalSppbj: optionalText(parsed.data.tanggalSppbj),
        statusSuratPesanan: optionalText(parsed.data.statusSuratPesanan),
        nomorSuratPesanan: optionalText(parsed.data.nomorSuratPesanan),
        tanggalSuratPesanan: optionalText(parsed.data.tanggalSuratPesanan),
        nomorSpkKontrak: optionalText(parsed.data.nomorSpkKontrak),
        tanggalKontrakEp: optionalText(parsed.data.tanggalKontrak),
        nomorSpmk: optionalText(parsed.data.nomorSpmk),
        tanggalSpmk: optionalText(parsed.data.tanggalSpmk),
        statusTransaksiKatalog: statusAfterStep(parsed.data.step),
      },
    });
  }

  if (parsed.data.step === "delivery") {
    const candidate = {
      ...existing,
      nomorSuratJalan: optionalText(parsed.data.nomorSuratJalan),
      statusPengirimanEp: parsed.data.statusPengiriman,
      tanggalAktualKirim: optionalText(parsed.data.tanggalAktualKirim),
    };
    const completion = getEPurchasingCompleteness(candidate);

    if (!completion.sections.delivery.complete) {
      return {
        ok: false,
        message: incompleteMessage(
          "Pengiriman",
          completion.sections.delivery.missingFields,
        ),
      };
    }

    await prisma.rencanaUmumPengadaan.update({
      where: { id: parsed.data.id },
      data: {
        statusPengirimanEp: parsed.data.statusPengiriman,
        tanggalRencanaKirim: optionalText(parsed.data.tanggalRencanaKirim),
        tanggalAktualKirim: optionalText(parsed.data.tanggalAktualKirim),
        nomorSuratJalan: optionalText(parsed.data.nomorSuratJalan),
        statusTransaksiKatalog: statusAfterStep(parsed.data.step),
        catatanKatalog: optionalText(parsed.data.catatan),
      },
    });
  }

  if (parsed.data.step === "inspection") {
    const candidate = {
      ...existing,
      catatanKatalog: optionalText(parsed.data.catatan),
      hasilPemeriksaan: optionalText(parsed.data.hasilPemeriksaan),
      nomorBaPemeriksaan: optionalText(parsed.data.nomorBaPemeriksaan),
      nomorBast: optionalText(parsed.data.nomorBast),
      statusPemeriksaanEp: optionalText(parsed.data.statusPemeriksaan),
      tanggalBast: optionalText(parsed.data.tanggalBast),
      tanggalPemeriksaan: optionalText(parsed.data.tanggalPemeriksaan),
    };
    const completion = getEPurchasingCompleteness(candidate);

    if (!completion.sections.inspection.complete) {
      return {
        ok: false,
        message: incompleteMessage(
          "Pemeriksaan/BAST",
          completion.sections.inspection.missingFields,
        ),
      };
    }

    await prisma.rencanaUmumPengadaan.update({
      where: { id: parsed.data.id },
      data: {
        statusUjiFungsi: optionalText(parsed.data.statusUjiFungsi),
        nomorBaUjiFungsi: optionalText(parsed.data.nomorBaUjiFungsi),
        tanggalUjiFungsi: optionalText(parsed.data.tanggalUjiFungsi),
        statusPemeriksaanEp: optionalText(parsed.data.statusPemeriksaan),
        nomorBaPemeriksaan: optionalText(parsed.data.nomorBaPemeriksaan),
        tanggalPemeriksaan: optionalText(parsed.data.tanggalPemeriksaan),
        hasilPemeriksaan: optionalText(parsed.data.hasilPemeriksaan),
        nomorBast: optionalText(parsed.data.nomorBast),
        tanggalBast: optionalText(parsed.data.tanggalBast),
        statusTransaksiKatalog: statusAfterStep(parsed.data.step),
        catatanKatalog: optionalText(parsed.data.catatan),
      },
    });
  }

  if (parsed.data.step === "payment") {
    const candidate = {
      ...existing,
      nilaiPembayaran: decimal(parsed.data.nilaiPembayaran),
      nomorInvoice: optionalText(parsed.data.nomorInvoice),
      statusDokumenPembayaran: parsed.data.statusDokumenPembayaran,
      statusPembayaranEp: parsed.data.statusPembayaran,
      tanggalPembayaranEp: optionalText(parsed.data.tanggalPembayaran),
    };
    const completion = getEPurchasingCompleteness(candidate);

    if (!completion.sections.payment.complete || !completion.sections.documents.complete) {
      return {
        ok: false,
        message: incompleteMessage("Pembayaran", [
          ...completion.sections.payment.missingFields,
          ...completion.sections.documents.missingFields,
        ]),
      };
    }

    await prisma.rencanaUmumPengadaan.update({
      where: { id: parsed.data.id },
      data: {
        statusDokumenPembayaran: parsed.data.statusDokumenPembayaran,
        statusPembayaranEp: parsed.data.statusPembayaran,
        nilaiPembayaran: decimal(parsed.data.nilaiPembayaran),
        nomorInvoice: optionalText(parsed.data.nomorInvoice),
        nomorFaktur: optionalText(parsed.data.nomorFaktur),
        tanggalPembayaranEp: optionalText(parsed.data.tanggalPembayaran),
        statusTransaksiKatalog:
          parsed.data.statusPembayaran === "DIBAYAR"
            ? "SELESAI"
            : statusAfterStep(parsed.data.step),
        catatanKatalog: optionalText(parsed.data.catatan),
      },
    });
  }

  if (parsed.data.step === "reset") {
    await prisma.rencanaUmumPengadaan.update({
      where: { id: parsed.data.id },
      data: {
        namaProdukKatalog: null,
        spesifikasiProdukKatalog: null,
        merekTipeKatalog: null,
        jumlahProdukKatalog: null,
        satuanProdukKatalog: null,
        hargaSatuanKatalog: null,
        totalHargaKatalog: null,
        namaPenyediaKatalog: null,
        statusNegosiasiKatalog: null,
        hargaNegosiasiKatalog: null,
        hargaPenawaranKatalog: null,
        nomorSuratPesanan: null,
        tanggalSuratPesanan: null,
        statusTransaksiKatalog: null,
        catatanKatalog: null,
      },
    });
  }

  revalidatePath("/e-purchasing");
  revalidatePath("/katalog-v6-v5");
  revalidatePath("/sirup-rup");
  revalidatePath(`/sirup-rup/${parsed.data.id}`);

  return { ok: true, message: "Data E-Purchasing berhasil disimpan." };
}
