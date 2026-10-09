import type { PaketMetodePengadaan, RupStatus } from "@prisma/client";
import { isEligibleForEPurchasing } from "@/lib/e-purchasing-eligibility";

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

export const ePurchasingFieldLabels: Record<string, string> = {
  catatanKatalog: "Catatan",
  dokumenKontrak: "Dokumen kontrak",
  hargaNegosiasiKatalog: "Harga nego final",
  hargaPenawaranKatalog: "Harga penawaran",
  hargaSatuanKatalog: "Harga tayang satuan",
  hasilPemeriksaan: "Hasil pemeriksaan",
  idRupSirup: "ID RUP SIRUP",
  jenisKatalog: "Platform katalog",
  jumlahProdukKatalog: "Jumlah produk",
  linkSirup: "Link SIRUP",
  metodePengadaan: "Metode final",
  namaPenyediaKatalog: "Nama penyedia",
  namaProdukKatalog: "Nama produk",
  nilaiPembayaran: "Nilai pembayaran",
  nomorBaPemeriksaan: "Nomor BA pemeriksaan",
  nomorBast: "Nomor BAST",
  nomorInvoice: "Nomor invoice",
  nomorSpkKontrak: "Nomor SPK / kontrak",
  nomorSuratJalan: "Nomor surat jalan",
  nomorSuratPesanan: "Nomor surat pesanan",
  pagu: "Pagu",
  satuanProdukKatalog: "Satuan produk",
  statusDokumenPembayaran: "Status dokumen pembayaran",
  statusNegosiasiKatalog: "Status negosiasi",
  statusPembayaranEp: "Status pembayaran",
  statusPemeriksaanEp: "Status pemeriksaan",
  statusPengirimanEp: "Status pengiriman",
  statusSirup: "Status SIRUP",
  statusSuratPesanan: "Status surat pesanan",
  tanggalAktualKirim: "Tanggal aktual pengiriman",
  tanggalBast: "Tanggal BAST",
  tanggalPembayaranEp: "Tanggal pembayaran",
  tanggalPemeriksaan: "Tanggal pemeriksaan",
  tanggalSuratPesanan: "Tanggal surat pesanan",
  tanggalTayangSirup: "Tanggal tayang SIRUP",
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
  return result({
    rup: validateRupStage(data),
    product: validateProductStage(data),
    provider: validateProviderStage(data),
    negotiation: validateNegotiationStage(data),
    contract: validateContractStage(data),
    delivery: validateDeliveryStage(data),
    inspection: validateInspectionStage(data),
    payment: validatePaymentStage(data),
    documents: validateDocumentStage(data),
  });
}

export function validateRupStage(data: EPurchasingCompletenessInput) {
  return section("RUP", [
    [isEligibleForEPurchasing(data), "statusSirup"],
    [filled(data.idRupSirup), "idRupSirup"],
  ]);
}

export function validateProductStage(data: EPurchasingCompletenessInput) {
  return section("Produk", [
    [filled(data.namaProdukKatalog), "namaProdukKatalog"],
    [positive(data.jumlahProdukKatalog), "jumlahProdukKatalog"],
    [filled(data.satuanProdukKatalog), "satuanProdukKatalog"],
    [positive(data.hargaSatuanKatalog), "hargaSatuanKatalog"],
    [filled(data.jenisKatalog), "jenisKatalog"],
  ]);
}

export function validateProviderStage(data: EPurchasingCompletenessInput) {
  return section("Penyedia", [[filled(data.namaPenyediaKatalog), "namaPenyediaKatalog"]]);
}

export function validateNegotiationStage(data: EPurchasingCompletenessInput) {
  return section("Negosiasi", [
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
}

export function validateContractStage(data: EPurchasingCompletenessInput) {
  return section("Kontrak / Surat Pesanan", [
    [statusComplete(data.statusSuratPesanan, ["TERBIT", "DITANDATANGANI"]), "statusSuratPesanan"],
    [
      (filled(data.nomorSuratPesanan) && filled(data.tanggalSuratPesanan)) ||
        (filled(data.nomorSpkKontrak) && filled(data.tanggalKontrakEp)),
      "nomorSuratPesanan",
    ],
  ]);
}

export function validateDeliveryStage(data: EPurchasingCompletenessInput) {
  return section("Pengiriman", [
    [statusComplete(data.statusPengirimanEp, ["DITERIMA"]), "statusPengirimanEp"],
    [filled(data.tanggalAktualKirim), "tanggalAktualKirim"],
    [filled(data.nomorSuratJalan), "nomorSuratJalan"],
  ]);
}

export function validateInspectionStage(data: EPurchasingCompletenessInput) {
  return section("Pemeriksaan / BAST", [
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
}

export function validatePaymentStage(data: EPurchasingCompletenessInput) {
  return section("Pembayaran", [
    [statusComplete(data.statusDokumenPembayaran, ["LENGKAP"]), "statusDokumenPembayaran"],
    [statusComplete(data.statusPembayaranEp, ["DIBAYAR"]), "statusPembayaranEp"],
    [positive(data.nilaiPembayaran), "nilaiPembayaran"],
    [filled(data.tanggalPembayaranEp), "tanggalPembayaranEp"],
    [filled(data.nomorInvoice), "nomorInvoice"],
  ]);
}

export function validateDocumentStage(data: EPurchasingCompletenessInput) {
  return section("Dokumen", [
    [filled(data.nomorSuratPesanan) || filled(data.nomorSpkKontrak), "dokumenKontrak"],
    [filled(data.nomorSuratJalan), "nomorSuratJalan"],
    [filled(data.nomorBaPemeriksaan), "nomorBaPemeriksaan"],
    [filled(data.nomorBast), "nomorBast"],
    [filled(data.nomorInvoice), "nomorInvoice"],
  ]);
}

export function getFirstIncompleteEPurchasingStage(
  completion: CompletionResult<EPurchasingStage>,
) {
  const orderedStages: EPurchasingStage[] = [
    "rup",
    "product",
    "provider",
    "negotiation",
    "contract",
    "delivery",
    "inspection",
    "payment",
    "documents",
  ];

  return orderedStages.find((key) => !completion.sections[key].complete) ?? "payment";
}

export function canEnterEPurchasingStage(
  completion: CompletionResult<EPurchasingStage>,
  stage: EPurchasingStage,
) {
  const orderedStages: EPurchasingStage[] = [
    "rup",
    "product",
    "provider",
    "negotiation",
    "contract",
    "delivery",
    "inspection",
    "payment",
  ];
  const stageIndex = orderedStages.indexOf(stage);

  if (stageIndex < 0) {
    return true;
  }

  return orderedStages
    .slice(0, stageIndex)
    .every((key) => completion.sections[key].complete);
}

export function formatWorkflowMissingFields(fields: string[]) {
  return fields.map((field) => ePurchasingFieldLabels[field] ?? field);
}

export function friendlyIncompleteMessage(stage: string, fields: string[]) {
  const labels = formatWorkflowMissingFields(fields);

  if (labels.length === 0) {
    return `${stage} belum lengkap.`;
  }

  return `${stage} belum lengkap: ${labels.join(", ")}.`;
}

export function prerequisiteMessage(stage: EPurchasingStage) {
  const messages: Partial<Record<EPurchasingStage, string>> = {
    product: "Data RUP belum memenuhi syarat untuk E-Purchasing.",
    provider: "Lengkapi data produk sebelum melanjutkan ke Penyedia.",
    negotiation: "Lengkapi data penyedia sebelum melanjutkan ke Negosiasi.",
    contract: "Selesaikan negosiasi sebelum melanjutkan ke Kontrak / Surat Pesanan.",
    delivery: "Lengkapi kontrak atau surat pesanan sebelum melanjutkan ke Pengiriman.",
    inspection: "Lengkapi pengiriman sebelum melanjutkan ke Pemeriksaan / BAST.",
    payment: "Lengkapi pemeriksaan dan BAST sebelum melanjutkan ke Pembayaran.",
  };

  return messages[stage] ?? "Tahap sebelumnya belum lengkap.";
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
