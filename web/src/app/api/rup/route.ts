import { Prisma } from "@prisma/client";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { canDeletePlanningProposal } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/response";

const rupQuerySchema = z.object({
  q: z.string().trim().optional(),
  tahunAnggaran: z.coerce.number().int().optional(),
  sumberDana: z.string().trim().optional(),
  unitPengusul: z.string().trim().optional(),
  statusSirup: z
    .enum([
      "BELUM_INPUT",
      "PROSES_VERIFIKASI",
      "MENUNGGU_PPTK",
      "MENUNGGU_PPK",
      "MENUNGGU_KPA_PA",
      "SUDAH_TAYANG",
      "REVISI_PAGU",
      "DITARIK",
    ])
    .optional(),
});

const deleteRupSchema = z.object({
  id: z.string().uuid("ID usulan perencanaan tidak valid."),
});

const createRupSchema = z.object({
  kodeRup: z.string().trim().min(1, "Kode RUP wajib diisi."),
  namaPaket: z.string().trim().min(1, "Nama paket wajib diisi."),
  jenisBelanja: z.string().trim().optional(),
  unitPengusul: z.string().trim().min(1, "Unit pengusul wajib diisi."),
  unitBidang: z.string().trim().optional(),
  ppkPptk: z.string().trim().optional(),
  kontakPenanggungJawab: z.string().trim().optional(),
  program: z.string().trim().optional(),
  kegiatan: z.string().trim().optional(),
  subKegiatan: z.string().trim().optional(),
  kodeRekening: z.string().trim().optional(),
  uraianBelanja: z.string().trim().optional(),
  lokasiPaket: z.string().trim().optional(),
  sumberDana: z.string().trim().min(1, "Sumber dana wajib diisi."),
  pagu: z.coerce.number().min(0, "Pagu tidak boleh negatif."),
  uraianKebutuhan: z.string().trim().optional(),
  volumeKebutuhan: z.string().trim().optional(),
  satuanKebutuhan: z.string().trim().optional(),
  spesifikasiAwal: z.string().trim().optional(),
  outputDiharapkan: z.string().trim().optional(),
  prioritas: z.string().trim().optional(),
  waktuKebutuhan: z.string().trim().optional(),
  caraPengadaan: z.string().trim().optional(),
  metodePengadaan: z.enum([
    "TENDER",
    "NON_TENDER",
    "E_PURCHASING",
    "PENGADAAN_LANGSUNG",
    "SWAKELOLA",
  ]),
  jadwalPemilihan: z.string().trim().optional(),
  idRupSirup: z.string().trim().optional(),
  tanggalInputSirup: z.string().trim().optional(),
  tanggalTayangSirup: z.string().trim().optional(),
  linkSirup: z.string().trim().optional(),
  jenisKatalog: z.string().trim().optional(),
  etalaseKatalog: z.string().trim().optional(),
  namaProdukKatalog: z.string().trim().optional(),
  spesifikasiProdukKatalog: z.string().trim().optional(),
  merekTipeKatalog: z.string().trim().optional(),
  jumlahProdukKatalog: z.string().trim().optional(),
  satuanProdukKatalog: z.string().trim().optional(),
  hargaSatuanKatalog: z.coerce.number().min(0).optional(),
  totalHargaKatalog: z.coerce.number().min(0).optional(),
  namaPenyediaKatalog: z.string().trim().optional(),
  statusNegosiasiKatalog: z.string().trim().optional(),
  hargaNegosiasiKatalog: z.coerce.number().min(0).optional(),
  nomorSuratPesanan: z.string().trim().optional(),
  tanggalSuratPesanan: z.string().trim().optional(),
  statusTransaksiKatalog: z.string().trim().optional(),
  catatanKatalog: z.string().trim().optional(),
  jadwalMulaiRencana: z.string().trim().optional(),
  jadwalSelesaiRencana: z.string().trim().optional(),
  tahunAnggaran: z.coerce
    .number()
    .int()
    .min(2000, "Tahun anggaran tidak valid."),
  statusSirup: z
    .enum([
      "BELUM_INPUT",
      "PROSES_VERIFIKASI",
      "MENUNGGU_PPTK",
      "MENUNGGU_PPK",
      "MENUNGGU_KPA_PA",
      "SUDAH_TAYANG",
      "REVISI_PAGU",
      "DITARIK",
    ])
    .default("BELUM_INPUT"),
  statusKak: z.string().trim().optional(),
  statusHps: z.string().trim().optional(),
  statusRancanganKontrak: z.string().trim().optional(),
  statusDokumenPendukung: z.string().trim().optional(),
  kekuranganDokumen: z.string().trim().optional(),
  kendala: z.string().trim().optional(),
  tindakLanjut: z.string().trim().optional(),
  picTindakLanjut: z.string().trim().optional(),
  catatan: z.string().trim().optional(),
});

function optionalText(value?: string) {
  return value && value.length > 0 ? value : undefined;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = rupQuerySchema.safeParse({
    q: searchParams.get("q") ?? undefined,
    tahunAnggaran: searchParams.get("tahunAnggaran") ?? undefined,
    sumberDana: searchParams.get("sumberDana") ?? undefined,
    unitPengusul: searchParams.get("unitPengusul") ?? undefined,
    statusSirup: searchParams.get("statusSirup") ?? undefined,
  });

  if (!parsed.success) {
    return apiError("Filter RUP tidak valid.", 422);
  }

  const { q, tahunAnggaran, sumberDana, unitPengusul, statusSirup } =
    parsed.data;
  const where: Prisma.RencanaUmumPengadaanWhereInput = {
    ...(tahunAnggaran ? { tahunAnggaran } : {}),
    ...(sumberDana ? { sumberDana } : {}),
    ...(unitPengusul ? { unitPengusul } : {}),
    ...(statusSirup ? { statusSirup } : {}),
    ...(q
      ? {
          OR: [
            { kodeRup: { contains: q } },
            { idRupSirup: { contains: q } },
            { namaPaket: { contains: q } },
            { unitPengusul: { contains: q } },
            { lokasiPaket: { contains: q } },
          ],
        }
      : {}),
  };

  const data = await prisma.rencanaUmumPengadaan.findMany({
    where,
    orderBy: [{ tahunAnggaran: "desc" }, { createdAt: "desc" }],
    take: 100,
  });

  return apiSuccess(data, "Data RUP berhasil diambil.");
}

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = createRupSchema.safeParse(json);

  if (!parsed.success) {
    return apiError(
      "Data RUP tidak valid.",
      422,
      parsed.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    );
  }

  const {
    pagu,
    unitBidang,
    ppkPptk,
    kontakPenanggungJawab,
    program,
    kegiatan,
    subKegiatan,
    kodeRekening,
    uraianBelanja,
    lokasiPaket,
    uraianKebutuhan,
    volumeKebutuhan,
    satuanKebutuhan,
    spesifikasiAwal,
    outputDiharapkan,
    prioritas,
    waktuKebutuhan,
    caraPengadaan,
    jadwalPemilihan,
    idRupSirup,
    tanggalInputSirup,
    tanggalTayangSirup,
    linkSirup,
    jenisKatalog,
    etalaseKatalog,
    namaProdukKatalog,
    spesifikasiProdukKatalog,
    merekTipeKatalog,
    jumlahProdukKatalog,
    satuanProdukKatalog,
    hargaSatuanKatalog,
    totalHargaKatalog,
    namaPenyediaKatalog,
    statusNegosiasiKatalog,
    hargaNegosiasiKatalog,
    nomorSuratPesanan,
    tanggalSuratPesanan,
    statusTransaksiKatalog,
    catatanKatalog,
    jadwalMulaiRencana,
    jadwalSelesaiRencana,
    statusKak,
    statusHps,
    statusRancanganKontrak,
    statusDokumenPendukung,
    kekuranganDokumen,
    kendala,
    tindakLanjut,
    picTindakLanjut,
    catatan,
    ...data
  } = parsed.data;

  try {
    const rup = await prisma.rencanaUmumPengadaan.create({
      data: {
        ...data,
        pagu: new Prisma.Decimal(pagu),
        unitBidang: optionalText(unitBidang),
        ppkPptk: optionalText(ppkPptk),
        kontakPenanggungJawab: optionalText(kontakPenanggungJawab),
        program: optionalText(program),
        kegiatan: optionalText(kegiatan),
        subKegiatan: optionalText(subKegiatan),
        kodeRekening: optionalText(kodeRekening),
        uraianBelanja: optionalText(uraianBelanja),
        lokasiPaket: optionalText(lokasiPaket),
        uraianKebutuhan: optionalText(uraianKebutuhan),
        volumeKebutuhan: optionalText(volumeKebutuhan),
        satuanKebutuhan: optionalText(satuanKebutuhan),
        spesifikasiAwal: optionalText(spesifikasiAwal),
        outputDiharapkan: optionalText(outputDiharapkan),
        prioritas: optionalText(prioritas),
        waktuKebutuhan: optionalText(waktuKebutuhan),
        caraPengadaan: optionalText(caraPengadaan),
        jadwalPemilihan: optionalText(jadwalPemilihan),
        idRupSirup: optionalText(idRupSirup),
        tanggalInputSirup: optionalText(tanggalInputSirup),
        tanggalTayangSirup: optionalText(tanggalTayangSirup),
        linkSirup: optionalText(linkSirup),
        jenisKatalog: optionalText(jenisKatalog),
        etalaseKatalog: optionalText(etalaseKatalog),
        namaProdukKatalog: optionalText(namaProdukKatalog),
        spesifikasiProdukKatalog: optionalText(spesifikasiProdukKatalog),
        merekTipeKatalog: optionalText(merekTipeKatalog),
        jumlahProdukKatalog: optionalText(jumlahProdukKatalog),
        satuanProdukKatalog: optionalText(satuanProdukKatalog),
        hargaSatuanKatalog:
          hargaSatuanKatalog === undefined
            ? undefined
            : new Prisma.Decimal(hargaSatuanKatalog),
        totalHargaKatalog:
          totalHargaKatalog === undefined
            ? undefined
            : new Prisma.Decimal(totalHargaKatalog),
        namaPenyediaKatalog: optionalText(namaPenyediaKatalog),
        statusNegosiasiKatalog: optionalText(statusNegosiasiKatalog),
        hargaNegosiasiKatalog:
          hargaNegosiasiKatalog === undefined
            ? undefined
            : new Prisma.Decimal(hargaNegosiasiKatalog),
        nomorSuratPesanan: optionalText(nomorSuratPesanan),
        tanggalSuratPesanan: optionalText(tanggalSuratPesanan),
        statusTransaksiKatalog: optionalText(statusTransaksiKatalog),
        catatanKatalog: optionalText(catatanKatalog),
        jadwalMulaiRencana: optionalText(jadwalMulaiRencana),
        jadwalSelesaiRencana: optionalText(jadwalSelesaiRencana),
        statusKak: optionalText(statusKak),
        statusHps: optionalText(statusHps),
        statusRancanganKontrak: optionalText(statusRancanganKontrak),
        statusDokumenPendukung: optionalText(statusDokumenPendukung),
        kekuranganDokumen: optionalText(kekuranganDokumen),
        kendala: optionalText(kendala),
        tindakLanjut: optionalText(tindakLanjut),
        picTindakLanjut: optionalText(picTindakLanjut),
        catatan: optionalText(catatan),
      },
    });

    return apiSuccess(rup, "Data RUP berhasil disimpan.", { status: 201 });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return apiError("Kode RUP sudah digunakan.", 409, [
        { field: "kodeRup", message: "Kode RUP harus unik." },
      ]);
    }

    return apiError("Data RUP gagal disimpan.", 500);
  }
}

export async function DELETE(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return apiError("Sesi login tidak ditemukan.", 401);
  }

  if (!canDeletePlanningProposal(user.roles)) {
    return apiError("Hanya superadmin yang boleh menghapus usulan perencanaan.", 403);
  }

  const { searchParams } = new URL(request.url);
  const parsed = deleteRupSchema.safeParse({
    id: searchParams.get("id") ?? undefined,
  });

  if (!parsed.success) {
    return apiError("ID usulan perencanaan tidak valid.", 422);
  }

  try {
    const deleted = await prisma.rencanaUmumPengadaan.delete({
      where: { id: parsed.data.id },
      select: { id: true, kodeRup: true, namaPaket: true },
    });

    return apiSuccess(deleted, "Usulan perencanaan berhasil dihapus.");
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return apiError("Usulan perencanaan tidak ditemukan.", 404);
    }

    return apiError("Usulan perencanaan gagal dihapus.", 500);
  }
}
