"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { hasAnyRole } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export type KatalogWorkflowState = {
  message: string;
  ok: boolean;
};

const executableRoles = ["SUPER_ADMIN", "PPK", "PROCUREMENT_OFFICER"] as const;

const katalogWorkflowSchema = z.discriminatedUnion("step", [
  z.object({
    step: z.literal("product"),
    id: z.string().uuid(),
    namaProduk: z.string().trim().min(1, "Nama produk wajib diisi."),
    merk: z.string().trim().optional(),
    jumlah: z.coerce.number().positive("Jumlah produk harus lebih dari 0."),
    satuan: z.string().trim().min(1, "Satuan wajib diisi."),
  }),
  z.object({
    step: z.literal("provider"),
    id: z.string().uuid(),
    namaPenyedia: z.string().trim().min(1, "Nama penyedia wajib diisi."),
    hargaTayang: z.coerce
      .number()
      .positive("Harga tayang per unit harus lebih dari 0."),
    totalHarga: z.coerce.number().positive(),
    estimasiPengiriman: z.string().trim().optional(),
  }),
  z.object({
    step: z.literal("negotiation"),
    id: z.string().uuid(),
    hargaPenawaran: z.coerce
      .number()
      .positive("Harga penawaran wajib diisi."),
    hargaKesepakatan: z.coerce
      .number()
      .positive("Harga kesepakatan wajib diisi."),
    catatan: z.string().trim().optional(),
  }),
  z.object({
    step: z.literal("reset"),
    id: z.string().uuid(),
  }),
]);

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
      message: "Akses ditolak. Eksekusi e-Katalog hanya untuk PPK/Pejabat Pengadaan.",
    };
  }

  const parsed = katalogWorkflowSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Data e-Katalog tidak valid.",
    };
  }

  const existing = await prisma.rencanaUmumPengadaan.findUnique({
    where: { id: parsed.data.id },
    select: {
      id: true,
      pagu: true,
      metodePengadaan: true,
      statusSirup: true,
      jumlahProdukKatalog: true,
      hargaSatuanKatalog: true,
      totalHargaKatalog: true,
    },
  });

  if (!existing) {
    return { ok: false, message: "Data RUP tidak ditemukan." };
  }

  if (
    existing.metodePengadaan !== "E_PURCHASING" ||
    existing.statusSirup !== "SUDAH_TAYANG"
  ) {
    return {
      ok: false,
      message: "Paket belum siap dieksekusi melalui e-Katalog.",
    };
  }

  const pagu = Number(existing.pagu);

  if (parsed.data.step === "provider" && parsed.data.totalHarga > pagu) {
    return {
      ok: false,
      message: "Total harga tayang tidak boleh melebihi pagu RUP.",
    };
  }

  if (parsed.data.step === "negotiation") {
    const totalHargaTayang = Number(existing.totalHargaKatalog ?? 0);

    if (!existing.jumlahProdukKatalog || !existing.hargaSatuanKatalog) {
      return {
        ok: false,
        message: "Produk dan penyedia harus disimpan terlebih dahulu.",
      };
    }

    if (parsed.data.hargaKesepakatan > totalHargaTayang) {
      return {
        ok: false,
        message: "Harga kesepakatan tidak boleh melebihi total harga tayang.",
      };
    }

    if (parsed.data.hargaKesepakatan > pagu) {
      return {
        ok: false,
        message: "Harga kesepakatan tidak boleh melebihi pagu RUP.",
      };
    }
  }

  if (parsed.data.step === "product") {
    await prisma.rencanaUmumPengadaan.update({
      where: { id: parsed.data.id },
      data: {
        namaProdukKatalog: parsed.data.namaProduk,
        merekTipeKatalog: parsed.data.merk || null,
        jumlahProdukKatalog: String(parsed.data.jumlah),
        satuanProdukKatalog: parsed.data.satuan,
        namaPenyediaKatalog: null,
        hargaSatuanKatalog: null,
        totalHargaKatalog: null,
        statusNegosiasiKatalog: null,
        hargaNegosiasiKatalog: null,
        nomorSuratPesanan: null,
        tanggalSuratPesanan: null,
        statusTransaksiKatalog: "Produk dipilih",
        catatanKatalog: null,
      },
    });
  }

  if (parsed.data.step === "provider") {
    await prisma.rencanaUmumPengadaan.update({
      where: { id: parsed.data.id },
      data: {
        namaPenyediaKatalog: parsed.data.namaPenyedia,
        hargaSatuanKatalog: parsed.data.hargaTayang,
        totalHargaKatalog: parsed.data.totalHarga,
        statusNegosiasiKatalog: "Menunggu negosiasi",
        hargaNegosiasiKatalog: null,
        statusTransaksiKatalog: "Penyedia dipilih",
        catatanKatalog: parsed.data.estimasiPengiriman
          ? `Estimasi pengiriman: ${parsed.data.estimasiPengiriman}`
          : null,
      },
    });
  }

  if (parsed.data.step === "negotiation") {
    await prisma.rencanaUmumPengadaan.update({
      where: { id: parsed.data.id },
      data: {
        statusNegosiasiKatalog: "Selesai negosiasi",
        hargaNegosiasiKatalog: parsed.data.hargaKesepakatan,
        statusTransaksiKatalog: "Negosiasi selesai",
        catatanKatalog:
          parsed.data.catatan ||
          `Harga penawaran: ${parsed.data.hargaPenawaran}`,
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
        nomorSuratPesanan: null,
        tanggalSuratPesanan: null,
        statusTransaksiKatalog: null,
        catatanKatalog: null,
      },
    });
  }

  revalidatePath("/katalog-v6-v5");
  revalidatePath("/sirup-rup");
  revalidatePath(`/sirup-rup/${parsed.data.id}`);

  return { ok: true, message: "Proses e-Katalog berhasil disimpan." };
}
