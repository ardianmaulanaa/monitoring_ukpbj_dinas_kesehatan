import type { PaketMetodePengadaan, RupStatus } from "@prisma/client";

type MaybeNumber = number | string | { toString(): string } | null | undefined;

export type CompletionSection = {
  complete: boolean;
  label: string;
  missingFields: string[];
};

export type CompletionResult<TSection extends string = string> = {
  complete: boolean;
  missingFields: string[];
  percentage: number;
  sections: Record<TSection, CompletionSection>;
};

export type WorkflowValidationError = {
  field?: string;
  message: string;
};

export const planningFieldLabels: Record<string, string> = {
  caraPengadaan: "Cara Pengadaan",
  jadwalPemilihan: "Jadwal Pemilihan",
  jumlahKebutuhan: "Jumlah Kebutuhan",
  justifikasi: "Justifikasi",
  kegiatan: "Kegiatan",
  kodeRup: "Kode Usulan",
  kodeRekening: "Kode Rekening",
  kontakPenanggungJawab: "Kontak Penanggung Jawab",
  metodePengadaan: "Metode Pengadaan",
  namaPaket: "Uraian / Nama Kebutuhan",
  pagu: "Pagu",
  ppkPptk: "PPK / PPTK",
  prioritas: "Prioritas",
  program: "Program",
  satuanKebutuhan: "Satuan",
  spesifikasiAwal: "Spesifikasi Awal",
  subKegiatan: "Sub Kegiatan",
  sumberDana: "Sumber Dana",
  tahunAnggaran: "Tahun Anggaran",
  totalEstimasi: "Total Estimasi",
  unitBidang: "Unit / Bidang",
  unitPengusul: "Unit Pengusul / OPD",
  uraianKebutuhan: "Uraian Kebutuhan",
};

export class WorkflowGuardError extends Error {
  errors: WorkflowValidationError[];
  missingFields: string[];
  status: number;

  constructor(message: string, missingFields: string[], status = 400) {
    super(message);
    this.name = "WorkflowGuardError";
    this.missingFields = missingFields;
    this.status = status;
    this.errors = missingFields.map((field) => ({
      field,
      message: `${field} belum lengkap.`,
    }));
  }
}

function filled(value: unknown) {
  return value !== undefined && value !== null && String(value).trim().length > 0;
}

function positive(value: MaybeNumber) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) && parsed > 0;
}

function normalized(value: unknown) {
  return String(value ?? "").trim().toUpperCase();
}

function statusComplete(value: unknown, completeValues: string[]) {
  return completeValues.includes(normalized(value));
}

function section(label: string, checks: Array<[boolean, string]>): CompletionSection {
  const missingFields = checks
    .filter(([complete]) => !complete)
    .map(([, field]) => field);

  return {
    complete: missingFields.length === 0,
    label,
    missingFields,
  };
}

function result<TSection extends string>(
  sections: Record<TSection, CompletionSection>,
): CompletionResult<TSection> {
  const values = Object.values(sections) as CompletionSection[];
  const completeCount = values.filter((item) => item.complete).length;
  const missingFields = values.flatMap((item) => item.missingFields);

  return {
    complete: missingFields.length === 0,
    missingFields,
    percentage:
      values.length === 0 ? 100 : Math.round((completeCount / values.length) * 100),
    sections,
  };
}

export type PlanningCompletenessInput = {
  caraPengadaan?: string | null;
  jadwalMulaiRencana?: string | null;
  jadwalPemilihan?: string | null;
  jadwalSelesaiRencana?: string | null;
  jumlahKebutuhan?: MaybeNumber;
  justifikasi?: string | null;
  kegiatan?: string | null;
  kodeRup?: string | null;
  kodeRekening?: string | null;
  kontakPenanggungJawab?: string | null;
  metodePengadaan?: PaketMetodePengadaan | string | null;
  namaPaket?: string | null;
  pagu?: MaybeNumber;
  ppkPptk?: string | null;
  prioritas?: string | null;
  program?: string | null;
  satuanKebutuhan?: string | null;
  spesifikasiAwal?: string | null;
  statusDokumenPendukung?: string | null;
  statusHps?: string | null;
  statusKak?: string | null;
  subKegiatan?: string | null;
  sumberDana?: string | null;
  tahunAnggaran?: number | null;
  unitBidang?: string | null;
  unitPengusul?: string | null;
  uraianKebutuhan?: string | null;
};

export function getPlanningCompleteness(data: PlanningCompletenessInput) {
  return result({
    unit: section("Data Unit", [
      [filled(data.kodeRup), "kodeRup"],
      [filled(data.tahunAnggaran), "tahunAnggaran"],
      [filled(data.unitPengusul), "unitPengusul"],
      [filled(data.unitBidang), "unitBidang"],
      [filled(data.ppkPptk), "ppkPptk"],
      [filled(data.kontakPenanggungJawab), "kontakPenanggungJawab"],
    ]),
    budget: section("Data Anggaran", [
      [filled(data.program), "program"],
      [filled(data.kegiatan), "kegiatan"],
      [filled(data.subKegiatan), "subKegiatan"],
      [filled(data.kodeRekening), "kodeRekening"],
      [filled(data.sumberDana), "sumberDana"],
      [positive(data.pagu), "pagu"],
    ]),
    needs: section("Data Kebutuhan", [
      [filled(data.namaPaket), "namaPaket"],
      [filled(data.uraianKebutuhan), "uraianKebutuhan"],
      [positive(data.jumlahKebutuhan), "jumlahKebutuhan"],
      [filled(data.satuanKebutuhan), "satuanKebutuhan"],
      [filled(data.spesifikasiAwal), "spesifikasiAwal"],
      [filled(data.prioritas), "prioritas"],
      [filled(data.justifikasi), "justifikasi"],
    ]),
    schedule: section("Jadwal", [
      [filled(data.metodePengadaan), "metodePengadaan"],
      [filled(data.caraPengadaan), "caraPengadaan"],
      [
        filled(data.jadwalPemilihan) ||
          (filled(data.jadwalMulaiRencana) && filled(data.jadwalSelesaiRencana)),
        "jadwalPemilihan",
      ],
    ]),
    documents: section("Dokumen", []),
  });
}

export const validatePlanningSubmission = getPlanningCompleteness;

export type RupCompletenessInput = PlanningCompletenessInput & {
  idRupSirup?: string | null;
  linkSirup?: string | null;
  statusSirup?: RupStatus | string | null;
  tanggalTayangSirup?: string | null;
};

export function getRupCompleteness(data: RupCompletenessInput) {
  return result({
    identity: section("Identitas RUP", [
      [filled(data.idRupSirup), "idRupSirup"],
      [filled(data.namaPaket), "namaPaket"],
      [filled(data.unitPengusul), "unitPengusul"],
      [filled(data.tahunAnggaran), "tahunAnggaran"],
      [filled(data.sumberDana), "sumberDana"],
      [positive(data.pagu), "pagu"],
    ]),
    publication: section("Publikasi SIRUP", [
      [filled(data.metodePengadaan), "metodePengadaan"],
      [filled(data.tanggalTayangSirup), "tanggalTayangSirup"],
      [filled(data.linkSirup), "linkSirup"],
    ]),
  });
}

export type EPurchasingStage =
  | "rup"
  | "product"
  | "provider"
  | "negotiation"
  | "contract"
  | "delivery"
  | "inspection"
  | "payment"
  | "documents";

export type EPurchasingCompletenessInput = RupCompletenessInput & {
  catatanKatalog?: string | null;
  hargaNegosiasiKatalog?: MaybeNumber;
  hargaPenawaranKatalog?: MaybeNumber;
  hargaSatuanKatalog?: MaybeNumber;
  hasilPemeriksaan?: string | null;
  jenisKatalog?: string | null;
  jumlahProdukKatalog?: string | null;
  namaPenyediaKatalog?: string | null;
  namaProdukKatalog?: string | null;
  nilaiPembayaran?: MaybeNumber;
  nomorBaPemeriksaan?: string | null;
  nomorBast?: string | null;
  nomorInvoice?: string | null;
  nomorSpkKontrak?: string | null;
  nomorSuratJalan?: string | null;
  nomorSuratPesanan?: string | null;
  satuanProdukKatalog?: string | null;
  spesifikasiProdukKatalog?: string | null;
  statusDokumenPembayaran?: string | null;
  statusNegosiasiKatalog?: string | null;
  statusPembayaranEp?: string | null;
  statusPemeriksaanEp?: string | null;
  statusPengirimanEp?: string | null;
  statusSuratPesanan?: string | null;
  statusTransaksiKatalog?: string | null;
  tanggalAktualKirim?: string | null;
  tanggalBast?: string | null;
  tanggalKontrakEp?: string | null;
  tanggalPembayaranEp?: string | null;
  tanggalPemeriksaan?: string | null;
  tanggalSuratPesanan?: string | null;
  totalHargaKatalog?: MaybeNumber;
};

export function getEPurchasingCompleteness(data: EPurchasingCompletenessInput) {
  const rupComplete = getRupCompleteness(data).complete &&
    data.metodePengadaan === "E_PURCHASING" &&
    data.statusSirup === "SUDAH_TAYANG";
  const product = section("Produk", [
    [rupComplete, "rup"],
    [filled(data.namaProdukKatalog), "namaProdukKatalog"],
    [positive(data.jumlahProdukKatalog), "jumlahProdukKatalog"],
    [filled(data.satuanProdukKatalog), "satuanProdukKatalog"],
    [positive(data.hargaSatuanKatalog), "hargaSatuanKatalog"],
    [positive(data.totalHargaKatalog), "totalHargaKatalog"],
    [filled(data.jenisKatalog), "jenisKatalog"],
  ]);
  const provider = section("Penyedia", [
    [product.complete, "product"],
    [filled(data.namaPenyediaKatalog), "namaPenyediaKatalog"],
  ]);
  const negotiation = section("Negosiasi", [
    [provider.complete, "provider"],
    [positive(data.hargaPenawaranKatalog), "hargaPenawaranKatalog"],
    [positive(data.hargaNegosiasiKatalog), "hargaNegosiasiKatalog"],
    [statusComplete(data.statusNegosiasiKatalog, ["SELESAI"]), "statusNegosiasiKatalog"],
    [
      !positive(data.hargaNegosiasiKatalog) ||
        !positive(data.pagu) ||
        Number(data.hargaNegosiasiKatalog) <= Number(data.pagu),
      "hargaNegosiasiKatalog",
    ],
  ]);
  const contract = section("Kontrak / Surat Pesanan", [
    [negotiation.complete, "negotiation"],
    [statusComplete(data.statusSuratPesanan, ["TERBIT", "DITANDATANGANI"]), "statusSuratPesanan"],
    [
      (filled(data.nomorSuratPesanan) && filled(data.tanggalSuratPesanan)) ||
        (filled(data.nomorSpkKontrak) && filled(data.tanggalKontrakEp)),
      "nomorSuratPesanan",
    ],
  ]);
  const delivery = section("Pengiriman", [
    [contract.complete, "contract"],
    [statusComplete(data.statusPengirimanEp, ["DITERIMA"]), "statusPengirimanEp"],
    [filled(data.tanggalAktualKirim), "tanggalAktualKirim"],
    [filled(data.nomorSuratJalan), "nomorSuratJalan"],
  ]);
  const inspection = section("Pemeriksaan / BAST", [
    [delivery.complete, "delivery"],
    [statusComplete(data.statusPemeriksaanEp, ["SELESAI"]), "statusPemeriksaanEp"],
    [
      statusComplete(data.hasilPemeriksaan, ["DITERIMA"]) ||
        (statusComplete(data.hasilPemeriksaan, ["DITERIMA_DENGAN_CATATAN"]) &&
          filled(data.catatanKatalog)),
      "hasilPemeriksaan",
    ],
    [filled(data.nomorBaPemeriksaan), "nomorBaPemeriksaan"],
    [filled(data.tanggalPemeriksaan), "tanggalPemeriksaan"],
    [filled(data.nomorBast), "nomorBast"],
    [filled(data.tanggalBast), "tanggalBast"],
  ]);
  const payment = section("Pembayaran", [
    [inspection.complete, "inspection"],
    [statusComplete(data.statusDokumenPembayaran, ["LENGKAP"]), "statusDokumenPembayaran"],
    [statusComplete(data.statusPembayaranEp, ["DIBAYAR"]), "statusPembayaranEp"],
    [positive(data.nilaiPembayaran), "nilaiPembayaran"],
    [filled(data.tanggalPembayaranEp), "tanggalPembayaranEp"],
    [filled(data.nomorInvoice), "nomorInvoice"],
  ]);
  const documents = section("Dokumen", [
    [filled(data.nomorSuratPesanan) || filled(data.nomorSpkKontrak), "dokumenKontrak"],
    [filled(data.nomorSuratJalan), "nomorSuratJalan"],
    [filled(data.nomorBaPemeriksaan), "nomorBaPemeriksaan"],
    [filled(data.nomorBast), "nomorBast"],
    [filled(data.nomorInvoice), "nomorInvoice"],
  ]);

  return result({
    rup: section("RUP", [[rupComplete, "rup"]]),
    product,
    provider,
    negotiation,
    contract,
    delivery,
    inspection,
    payment,
    documents,
  });
}

export function assertComplete(
  completion: CompletionResult,
  message: string,
  status = 400,
) {
  if (!completion.complete) {
    throw new WorkflowGuardError(message, completion.missingFields, status);
  }
}

export function assertSectionComplete(
  completion: CompletionResult,
  sectionKey: string,
  message: string,
  status = 400,
) {
  const target = completion.sections[sectionKey];
  if (!target?.complete) {
    throw new WorkflowGuardError(message, target?.missingFields ?? completion.missingFields, status);
  }
}
