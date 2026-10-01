import {
  AuditDokumenStatus,
  BarangPrioritas,
  PaketMetodePengadaan,
  PaketStatus,
  Prisma,
  type RoleCode,
  RupStatus,
} from "@prisma/client";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import {
  BarChart3,
  FileCheck2,
  ListChecks,
  LockKeyhole,
  ShieldCheck,
  UserRoundCheck,
} from "lucide-react";
import AppHeader from "@/components/appheader/AppHeader";
import { getCurrentUser } from "@/lib/auth";
import { formatCurrency } from "@/lib/currency";
import { hasAnyRole } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import DetailDocumentsModalButton from "./DetailDocumentsModalButton";
import PreparationDocumentsModalButton from "./PreparationDocumentsModalButton";
import StageDocumentsModalButton from "./StageDocumentsModalButton";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

type KpiTone = "blue" | "green" | "orange" | "red";
type PreparationDocument = {
  key: string;
  label: string;
};
type StageDocument = PreparationDocument;
type StageRequirement = {
  buttonLabel: string;
  documents: StageDocument[];
  eyebrow: string;
  submitLabel: string;
  targetStatus: PaketStatus;
  title: string;
};
type DocumentChecklistItem = {
  dokumen: string;
  status: AuditDokumenStatus;
  catatan: string | null;
  fileUrl: string | null;
};
type DisplayRow = {
  id: string;
  source: "rup" | "paket";
  sourceId: string;
  paketId?: string;
  kodePaket: string;
  namaPaket: string;
  unitPemohon: string;
  sumberDana: string;
  metodePengadaan: PaketMetodePengadaan;
  pagu: Prisma.Decimal | number | string | null | undefined;
  hps: Prisma.Decimal | number | string | null | undefined;
  statusPaket?: PaketStatus;
  statusLabel: string;
  statusClassName: string;
  nextLabel: string;
  actionLabel?: string;
  actionStatus?: PaketStatus;
  preparationDocuments: DocumentChecklistItem[];
};

const firstWorkflowStatus = "PERSIAPAN_DOKUMEN" as PaketStatus;
const tenderPreparationDocuments: PreparationDocument[] = [
  { key: "KAK", label: "KAK" },
  { key: "SPESIFIKASI", label: "Spesifikasi" },
  { key: "HPS_FINAL", label: "HPS Final" },
  { key: "DOKUMEN_PEMILIHAN", label: "Dokumen Pemilihan" },
];
const nonTenderPreparationDocuments: PreparationDocument[] = [
  { key: "DOKUMEN_PERSIAPAN_NON_TENDER", label: "Dokumen Persiapan" },
  { key: "KEBUTUHAN_PAKET_FINAL", label: "Kebutuhan Paket Final" },
  { key: "HPS_NON_TENDER", label: "HPS" },
  { key: "KUALIFIKASI_PENYEDIA_NON_TENDER", label: "Kualifikasi Penyedia Non Tender" },
];
const tenderWorkflowStageRequirements: Partial<
  Record<PaketStatus, StageRequirement>
> = {
  PENJADWALAN: {
    eyebrow: "Tahap 2",
    title: "Penjadwalan",
    buttonLabel: "Catat Jadwal",
    submitLabel: "Simpan & Lanjut Pengumuman",
    targetStatus: "PENGUMUMAN_UNDANGAN",
    documents: [
      { key: "JADWAL_TAYANG", label: "Jadwal Tayang / Undangan" },
      { key: "BATAS_PROSES", label: "Batas Waktu Proses" },
    ],
  },
  PENGUMUMAN_UNDANGAN: {
    eyebrow: "Tahap 3",
    title: "Pengumuman / Undangan dan Input Internal",
    buttonLabel: "Catat Input Internal",
    submitLabel: "Simpan & Lanjut Evaluasi",
    targetStatus: "EVALUASI_KLARIFIKASI",
    documents: [
      { key: "BUKTI_PENGUMUMAN_UNDANGAN", label: "Bukti Pengumuman / Undangan" },
      { key: "DATA_PENAWARAN_INTERNAL", label: "Data Penawaran / Kelengkapan" },
    ],
  },
  EVALUASI_KLARIFIKASI: {
    eyebrow: "Tahap 4",
    title: "Evaluasi / Klarifikasi",
    buttonLabel: "Catat Evaluasi",
    submitLabel: "Simpan & Lanjut Hasil",
    targetStatus: "PEMILIHAN",
    documents: [
      { key: "EVALUASI_KLARIFIKASI_DOKUMEN", label: "Evaluasi / Klarifikasi" },
    ],
  },
  PEMILIHAN: {
    eyebrow: "Tahap 5",
    title: "Hasil Pemilihan / Penetapan",
    buttonLabel: "Catat Penetapan",
    submitLabel: "Simpan Penetapan",
    targetStatus: "PEMENANG_DITETAPKAN",
    documents: [
      { key: "BA_HASIL_PEMILIHAN", label: "BA Hasil Pemilihan" },
      { key: "PENYEDIA_TERPILIH", label: "Penyedia Terpilih / Pemenang" },
    ],
  },
};
const nonTenderWorkflowStageRequirements: Partial<
  Record<PaketStatus, StageRequirement>
> = {
  PENJADWALAN: {
    eyebrow: "Tahap 2",
    title: "Penjadwalan Non Tender",
    buttonLabel: "Catat Jadwal",
    submitLabel: "Simpan & Lanjut Input Internal",
    targetStatus: "PENGUMUMAN_UNDANGAN",
    documents: [
      { key: "JADWAL_UNDANGAN_NON_TENDER", label: "Jadwal Undangan / Klarifikasi" },
      { key: "BATAS_PROSES_NON_TENDER", label: "Batas Waktu Proses Non Tender" },
    ],
  },
  PENGUMUMAN_UNDANGAN: {
    eyebrow: "Tahap 3",
    title: "Input Internal Non Tender",
    buttonLabel: "Catat Input Internal",
    submitLabel: "Simpan & Lanjut Klarifikasi",
    targetStatus: "EVALUASI_KLARIFIKASI",
    documents: [
      { key: "UNDANGAN_PENYEDIA_NON_TENDER", label: "Undangan Penyedia" },
      { key: "DATA_PENAWARAN_NON_TENDER", label: "Data Penawaran" },
      { key: "KELENGKAPAN_KUALIFIKASI_NON_TENDER", label: "Kelengkapan Kualifikasi" },
    ],
  },
  EVALUASI_KLARIFIKASI: {
    eyebrow: "Tahap 4",
    title: "Klarifikasi / Negosiasi",
    buttonLabel: "Catat Klarifikasi",
    submitLabel: "Simpan & Lanjut Hasil",
    targetStatus: "PEMILIHAN",
    documents: [
      { key: "KLARIFIKASI_NEGOSIASI_NON_TENDER", label: "Klarifikasi / Negosiasi" },
    ],
  },
  PEMILIHAN: {
    eyebrow: "Tahap 5",
    title: "Hasil Non Tender / Penetapan",
    buttonLabel: "Catat Penetapan",
    submitLabel: "Simpan Penetapan",
    targetStatus: "PEMENANG_DITETAPKAN",
    documents: [
      { key: "BA_HASIL_NON_TENDER", label: "BA Hasil Non Tender" },
      { key: "PENYEDIA_TERPILIH_NON_TENDER", label: "Penyedia Terpilih" },
    ],
  },
};
const allWorkflowStageDocuments = [
  ...Object.values(tenderWorkflowStageRequirements).flatMap(
    (stage) => stage?.documents ?? [],
  ),
  ...Object.values(nonTenderWorkflowStageRequirements).flatMap(
    (stage) => stage?.documents ?? [],
  ),
];
const tenderNonTenderDocumentKeys = [
  ...tenderPreparationDocuments.map((item) => item.key),
  ...nonTenderPreparationDocuments.map((item) => item.key),
  ...allWorkflowStageDocuments.map((item) => item.key),
];
const allowedPreparationFileTypes = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
]);
const preparationUploadDir = path.join(
  process.cwd(),
  "public",
  "uploads",
  "tender-non-tender",
);

const executableRoles: RoleCode[] = [
  "SUPER_ADMIN",
  "PPK",
  "PROCUREMENT_OFFICER",
  "SELECTION_WORKGROUP",
  "UKPBJ",
];

const nextPackageStatus: Partial<Record<PaketStatus, PaketStatus>> = {
  PERENCANAAN: "PERSIAPAN_DOKUMEN",
  SIAP_DIPROSES: "PERSIAPAN_DOKUMEN",
  PERSIAPAN_DOKUMEN: "PENJADWALAN",
  PENJADWALAN: "PENGUMUMAN_UNDANGAN",
  PENGUMUMAN_UNDANGAN: "EVALUASI_KLARIFIKASI",
  EVALUASI_KLARIFIKASI: "PEMILIHAN",
  PEMILIHAN: "PEMENANG_DITETAPKAN",
  PEMENANG_DITETAPKAN: "KONTRAK",
  KONTRAK: "SELESAI",
};

const nextStatusLabels: Partial<Record<PaketStatus, string>> = {
  PERENCANAAN: "Mulai Persiapan Dokumen",
  SIAP_DIPROSES: "Mulai Persiapan Dokumen",
  PERSIAPAN_DOKUMEN: "Lengkapi Dokumen Tahap 1",
  PENJADWALAN: "Catat Pengumuman/Undangan",
  PENGUMUMAN_UNDANGAN: "Masuk Evaluasi/Klarifikasi",
  EVALUASI_KLARIFIKASI: "Hasil Pemilihan Selesai",
  PEMILIHAN: "Catat Penetapan",
  PEMENANG_DITETAPKAN: "Terbitkan SPPBJ/SP",
  KONTRAK: "Selesaikan Paket",
};

const progressPercent: Partial<Record<PaketStatus, number>> = {
  PERENCANAAN: 5,
  SIAP_DIPROSES: 10,
  PERSIAPAN_DOKUMEN: 25,
  PENJADWALAN: 40,
  PENGUMUMAN_UNDANGAN: 55,
  EVALUASI_KLARIFIKASI: 70,
  PEMILIHAN: 78,
  PEMENANG_DITETAPKAN: 85,
  KONTRAK: 90,
  SELESAI: 100,
};

const progressStage: Partial<Record<PaketStatus, string>> = {
  PERENCANAAN: "Perencanaan",
  SIAP_DIPROSES: "Siap Diproses",
  PERSIAPAN_DOKUMEN: "Persiapan Dokumen",
  PENJADWALAN: "Penjadwalan",
  PENGUMUMAN_UNDANGAN: "Pengumuman/Undangan",
  EVALUASI_KLARIFIKASI: "Evaluasi/Klarifikasi",
  PEMILIHAN: "Hasil Pemilihan",
  PEMENANG_DITETAPKAN: "Catat Penetapan",
  KONTRAK: "Kontrak/SP",
  SELESAI: "Selesai",
};

const statusLabels: Partial<Record<PaketStatus, string>> = {
  PERSIAPAN_DOKUMEN: "Persiapan Dokumen",
  PENJADWALAN: "Penjadwalan",
  PENGUMUMAN_UNDANGAN: "Pengumuman/Undangan",
  EVALUASI_KLARIFIKASI: "Evaluasi/Klarifikasi",
  PEMILIHAN: "Hasil Pemilihan",
  PEMENANG_DITETAPKAN: "Catat Penetapan",
};

function getParam(
  searchParams: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] : value;
}

function decimalNumber(
  value: Prisma.Decimal | number | string | null | undefined,
) {
  if (value instanceof Prisma.Decimal) return value.toNumber();
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value) || 0;
  return 0;
}

function formatCompactCurrency(value: number) {
  if (value >= 1_000_000_000) {
    return `Rp ${(value / 1_000_000_000).toLocaleString("id-ID", {
      maximumFractionDigits: 1,
    })} M`;
  }

  if (value >= 1_000_000) {
    return `Rp ${(value / 1_000_000).toLocaleString("id-ID", {
      maximumFractionDigits: 1,
    })} jt`;
  }

  return formatCurrency(value);
}

function humanize(value: string | null | undefined) {
  if (!value) return "-";

  const customLabel = statusLabels[value as PaketStatus];
  if (customLabel) return customLabel;

  return value
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function normalizeKey(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

function methodLabel(value: PaketMetodePengadaan) {
  const labels: Record<PaketMetodePengadaan, string> = {
    TENDER: "Tender",
    NON_TENDER: "Non Tender",
    E_PURCHASING: "e-Katalog",
    PENGADAAN_LANGSUNG: "Pengadaan Langsung",
    SWAKELOLA: "Swakelola",
  };

  return labels[value];
}

function kpiBorderClass(tone: KpiTone) {
  if (tone === "green") return "border-l-[#43a047]";
  if (tone === "orange") return "border-l-[#f57c00]";
  if (tone === "red") return "border-l-[#e53935]";
  return "border-l-[#1976d2]";
}

function statusClass(status: PaketStatus) {
  if (status === "SELESAI") return "bg-emerald-100 text-emerald-700";
  if (status === "KONTRAK") return "bg-emerald-100 text-[#08783f]";
  if (status === "PEMENANG_DITETAPKAN") {
    return "bg-emerald-50 text-[#08783f]";
  }
  if (
    status === "PERSIAPAN_DOKUMEN" ||
    status === "PENJADWALAN" ||
    status === "PENGUMUMAN_UNDANGAN" ||
    status === "EVALUASI_KLARIFIKASI" ||
    status === "PEMILIHAN"
  ) {
    return "bg-amber-100 text-amber-700";
  }
  if (status === "TERLAMBAT" || status === "GAGAL" || status === "BATAL") {
    return "bg-red-100 text-red-700";
  }
  return "bg-slate-100 text-slate-700";
}

function priorityFromRup(value: string | null | undefined) {
  const normalized = (value ?? "").toUpperCase();

  if (normalized.includes("MENDESAK")) return BarangPrioritas.MENDESAK;
  if (normalized.includes("TINGGI")) return BarangPrioritas.TINGGI;
  if (normalized.includes("RENDAH")) return BarangPrioritas.RENDAH;

  return BarangPrioritas.NORMAL;
}

function dateFromText(value: string | null | undefined) {
  if (!value) return undefined;

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function canExecuteWorkflow(userRoles: RoleCode[]) {
  return hasAnyRole(userRoles, executableRoles);
}

function isTenderNonTender(method: PaketMetodePengadaan) {
  return (
    method === PaketMetodePengadaan.TENDER ||
    method === PaketMetodePengadaan.NON_TENDER
  );
}

function getPreparationDocuments(method: PaketMetodePengadaan) {
  return method === PaketMetodePengadaan.NON_TENDER
    ? nonTenderPreparationDocuments
    : tenderPreparationDocuments;
}

function getWorkflowStageRequirement(
  status: PaketStatus,
  method: PaketMetodePengadaan,
) {
  return method === PaketMetodePengadaan.NON_TENDER
    ? nonTenderWorkflowStageRequirements[status]
    : tenderWorkflowStageRequirements[status];
}

function getDetailDocumentGroups(method: PaketMetodePengadaan) {
  const stageRequirements =
    method === PaketMetodePengadaan.NON_TENDER
      ? nonTenderWorkflowStageRequirements
      : tenderWorkflowStageRequirements;

  return [
    {
      title:
        method === PaketMetodePengadaan.NON_TENDER
          ? "Tahap 1 - Dokumen Non Tender"
          : "Tahap 1 - Persiapan Dokumen",
      documents: getPreparationDocuments(method),
    },
    {
      title: "Tahap 2 - Penjadwalan",
      documents: stageRequirements.PENJADWALAN!.documents,
    },
    {
      title:
        method === PaketMetodePengadaan.NON_TENDER
          ? "Tahap 3 - Input Internal Non Tender"
          : "Tahap 3 - Pengumuman / Undangan dan Input Internal",
      documents: stageRequirements.PENGUMUMAN_UNDANGAN!.documents,
    },
    {
      title:
        method === PaketMetodePengadaan.NON_TENDER
          ? "Tahap 4 - Klarifikasi / Negosiasi"
          : "Tahap 4 - Evaluasi / Klarifikasi",
      documents: stageRequirements.EVALUASI_KLARIFIKASI!.documents,
    },
    {
      title:
        method === PaketMetodePengadaan.NON_TENDER
          ? "Tahap 5 - Hasil Non Tender / Penetapan"
          : "Tahap 5 - Hasil Pemilihan / Penetapan",
      documents: stageRequirements.PEMILIHAN!.documents,
    },
  ];
}

function getPreparationDocumentStatus(
  documents: Pick<DocumentChecklistItem, "dokumen" | "status">[],
  key: string,
) {
  return documents.find((item) => item.dokumen === key)?.status ?? "BELUM_ADA";
}

function countCompletePreparationDocuments(
  documents: Pick<DocumentChecklistItem, "dokumen" | "status">[],
  method: PaketMetodePengadaan,
) {
  return getPreparationDocuments(method).filter(
    (item) => getPreparationDocumentStatus(documents, item.key) === "LENGKAP",
  ).length;
}

async function savePreparationDocumentFile(
  paketId: string,
  documentKey: string,
  file: File,
) {
  if (file.size === 0) return undefined;
  if (!allowedPreparationFileTypes.has(file.type)) return undefined;

  const extensionByType: Record<string, string> = {
    "application/pdf": ".pdf",
    "image/jpeg": ".jpg",
    "image/png": ".png",
  };
  const extension = extensionByType[file.type];
  const fileName = `${paketId}-${documentKey}-${randomUUID()}${extension}`;

  await mkdir(preparationUploadDir, { recursive: true });
  await writeFile(
    path.join(preparationUploadDir, fileName),
    Buffer.from(await file.arrayBuffer()),
  );

  return `/uploads/tender-non-tender/${fileName}`;
}

async function ensurePreparationChecklist(
  paketId: string,
  method: PaketMetodePengadaan,
) {
  await Promise.all(
    getPreparationDocuments(method).map((document) =>
      prisma.auditChecklist.upsert({
        where: {
          paketId_dokumen: {
            paketId,
            dokumen: document.key,
          },
        },
        update: {},
        create: {
          paketId,
          dokumen: document.key,
          status: "BELUM_ADA",
        },
      }),
    ),
  );
}

async function ensureStageChecklist(
  paketId: string,
  documents: StageDocument[],
) {
  await Promise.all(
    documents.map((document) =>
      prisma.auditChecklist.upsert({
        where: {
          paketId_dokumen: {
            paketId,
            dokumen: document.key,
          },
        },
        update: {},
        create: {
          paketId,
          dokumen: document.key,
          status: "BELUM_ADA",
        },
      }),
    ),
  );
}

async function isPreparationComplete(
  paketId: string,
  method: PaketMetodePengadaan,
) {
  const documentsToCheck = getPreparationDocuments(method);
  const documents = await prisma.auditChecklist.findMany({
    where: {
      paketId,
      dokumen: { in: documentsToCheck.map((item) => item.key) },
    },
    select: { dokumen: true, status: true },
  });

  return countCompletePreparationDocuments(documents, method) === documentsToCheck.length;
}

async function createProgressSnapshot(paketId: string, status: PaketStatus) {
  const tahap = progressStage[status] ?? humanize(status);

  await Promise.all([
    prisma.progresPaket.create({
      data: {
        paketId,
        tahap,
        persentase: progressPercent[status] ?? 0,
        status: status === "SELESAI" ? "SELESAI" : "BERJALAN",
        tanggal: new Date(),
        catatan:
          "Perubahan status dicatat oleh user internal melalui halaman Tender/Non Tender.",
      },
    }),
    prisma.timelineEvent.create({
      data: {
        paketId,
        judul: tahap,
        tahap,
        tanggalMulai: new Date(),
        status: status === "SELESAI" ? "SELESAI" : "BERJALAN",
        catatan:
          "Monitoring internal. Penyedia tidak memiliki akses untuk mengubah tahapan ini.",
      },
    }),
  ]);
}

async function startTenderNonTenderAction(formData: FormData) {
  "use server";

  const user = await getCurrentUser();
  if (!user || !canExecuteWorkflow(user.roles)) return;

  const rupId = String(formData.get("rupId") ?? "");
  if (!rupId) return;

  const rup = await prisma.rencanaUmumPengadaan.findUnique({
    where: { id: rupId },
  });

  if (
    !rup ||
    rup.statusSirup !== RupStatus.SUDAH_TAYANG ||
    !isTenderNonTender(rup.metodePengadaan)
  ) {
    return;
  }

  const existing = await prisma.paketPengadaan.findFirst({
    where: {
      OR: [
        { kodePaket: rup.kodeRup },
        {
          namaPaket: rup.namaPaket,
          unitPemohon: rup.unitPengusul,
          tahunAnggaran: rup.tahunAnggaran,
        },
      ],
    },
    select: { id: true },
  });

  const paket = existing
    ? await prisma.paketPengadaan.update({
        where: { id: existing.id },
        data: { statusPaket: firstWorkflowStatus },
      })
    : await prisma.paketPengadaan.create({
        data: {
          kodePaket: rup.kodeRup,
          namaPaket: rup.namaPaket,
          unitPemohon: rup.unitPengusul,
          satuanKerja: rup.unitBidang || rup.unitPengusul,
          tahunAnggaran: rup.tahunAnggaran,
          sumberDana: rup.sumberDana,
          jenisPengadaan: "BARANG",
          kategori: rup.jenisBelanja || "Pengadaan",
          metodePengadaan: rup.metodePengadaan,
          pagu: rup.pagu,
          hps: rup.pagu,
          statusPaket: firstWorkflowStatus,
          prioritas: priorityFromRup(rup.prioritas),
          ppkPenanggungJawab: rup.ppkPptk || undefined,
          rencanaMulai: dateFromText(rup.jadwalMulaiRencana),
          rencanaSelesai: dateFromText(rup.jadwalSelesaiRencana),
          lokasiPelaksanaan: rup.lokasiPaket || undefined,
          catatan:
            "Dibuat otomatis dari RUP/SIRUP tayang untuk monitoring internal Tender/Non Tender. Penyedia tidak memiliki akun atau akses input.",
        },
      });

  await Promise.all([
    ensurePreparationChecklist(paket.id, paket.metodePengadaan),
    createProgressSnapshot(paket.id, firstWorkflowStatus),
  ]);

  revalidatePath("/perencanaan");
  revalidatePath("/sirup-rup");
  revalidatePath("/tender-non-tender");
}

async function updateTenderNonTenderStatusAction(formData: FormData) {
  "use server";

  const user = await getCurrentUser();
  if (!user || !canExecuteWorkflow(user.roles)) return;

  const paketId = String(formData.get("paketId") ?? "");
  const targetStatus = String(formData.get("targetStatus") ?? "") as PaketStatus;
  if (!paketId || !Object.values(PaketStatus).includes(targetStatus)) return;

  const paket = await prisma.paketPengadaan.findUnique({
    where: { id: paketId },
    select: {
      id: true,
      statusPaket: true,
      metodePengadaan: true,
    },
  });

  if (
    !paket ||
    !isTenderNonTender(paket.metodePengadaan) ||
    nextPackageStatus[paket.statusPaket] !== targetStatus
  ) {
    return;
  }

  if (targetStatus === "PERSIAPAN_DOKUMEN") {
    await ensurePreparationChecklist(paket.id, paket.metodePengadaan);
  }

  if (
    paket.statusPaket === "PERSIAPAN_DOKUMEN" &&
    targetStatus === "PENJADWALAN" &&
    !(await isPreparationComplete(paket.id, paket.metodePengadaan))
  ) {
    return;
  }

  await prisma.paketPengadaan.update({
    where: { id: paket.id },
    data: { statusPaket: targetStatus },
  });
  await createProgressSnapshot(paket.id, targetStatus);

  revalidatePath("/tender-non-tender");
  revalidatePath("/kontrak-sp");
  revalidatePath("/paket-pengadaan");
  revalidatePath(`/paket-pengadaan/${paket.id}`);
}

async function completePreparationDocumentsAction(formData: FormData) {
  "use server";

  const user = await getCurrentUser();
  if (!user || !canExecuteWorkflow(user.roles)) return;

  const paketId = String(formData.get("paketId") ?? "");
  if (!paketId) return;

  const paket = await prisma.paketPengadaan.findUnique({
    where: { id: paketId },
    select: {
      id: true,
      statusPaket: true,
      metodePengadaan: true,
    },
  });

  if (
    !paket ||
    paket.statusPaket !== "PERSIAPAN_DOKUMEN" ||
    !isTenderNonTender(paket.metodePengadaan)
  ) {
    return;
  }

  const documentsToComplete = getPreparationDocuments(paket.metodePengadaan);
  const documentPayloads = await Promise.all(
    documentsToComplete.map(async (document) => {
      const existingDocument = await prisma.auditChecklist.findUnique({
        where: {
          paketId_dokumen: {
            paketId: paket.id,
            dokumen: document.key,
          },
        },
        select: { fileUrl: true },
      });
      const catatan = String(formData.get(`catatan_${document.key}`) ?? "")
        .trim()
        .slice(0, 4000);
      const fileValue = formData.get(`file_${document.key}`);
      const file = fileValue instanceof File ? fileValue : undefined;
      const fileUrl = file
        ? await savePreparationDocumentFile(paket.id, document.key, file)
        : undefined;

      return {
        ...document,
        catatan,
        fileUrl: fileUrl ?? existingDocument?.fileUrl,
        isComplete: Boolean(catatan || fileUrl || existingDocument?.fileUrl),
      };
    }),
  );

  const hasAnyCompleteDocument = documentPayloads.some(
    (document) => document.isComplete,
  );

  await Promise.all(
    documentPayloads.map((document) =>
      prisma.auditChecklist.upsert({
        where: {
          paketId_dokumen: {
            paketId: paket.id,
            dokumen: document.key,
          },
        },
        update: {
          status: document.isComplete ? "LENGKAP" : "BELUM_ADA",
          catatan: document.isComplete
            ? document.catatan || "Dokumen diunggah sebagai bukti."
            : null,
          fileUrl: document.fileUrl,
        },
        create: {
          paketId: paket.id,
          dokumen: document.key,
          status: document.isComplete ? "LENGKAP" : "BELUM_ADA",
          catatan: document.isComplete
            ? document.catatan || "Dokumen diunggah sebagai bukti."
            : null,
          fileUrl: document.fileUrl,
        },
      }),
    ),
  );

  if (!hasAnyCompleteDocument) {
    revalidatePath("/tender-non-tender");
    return;
  }

  await prisma.paketPengadaan.update({
    where: { id: paket.id },
    data: { statusPaket: "PENJADWALAN" },
  });
  await createProgressSnapshot(paket.id, "PENJADWALAN");

  revalidatePath("/tender-non-tender");
  revalidatePath("/kontrak-sp");
  revalidatePath("/paket-pengadaan");
  revalidatePath(`/paket-pengadaan/${paket.id}`);
}

async function completeWorkflowStageAction(formData: FormData) {
  "use server";

  const user = await getCurrentUser();
  if (!user || !canExecuteWorkflow(user.roles)) return;

  const paketId = String(formData.get("paketId") ?? "");
  const currentStatus = String(
    formData.get("currentStatus") ?? "",
  ) as PaketStatus;
  const targetStatus = String(formData.get("targetStatus") ?? "") as PaketStatus;
  if (!paketId || !Object.values(PaketStatus).includes(currentStatus)) return;
  if (!Object.values(PaketStatus).includes(targetStatus)) return;

  const paket = await prisma.paketPengadaan.findUnique({
    where: { id: paketId },
    select: {
      id: true,
      statusPaket: true,
      metodePengadaan: true,
    },
  });

  if (
    !paket ||
    paket.statusPaket !== currentStatus ||
    !isTenderNonTender(paket.metodePengadaan)
  ) {
    return;
  }

  const stage = getWorkflowStageRequirement(
    currentStatus,
    paket.metodePengadaan,
  );
  if (!stage || stage.targetStatus !== targetStatus) return;

  await ensureStageChecklist(paket.id, stage.documents);

  const documentPayloads = await Promise.all(
    stage.documents.map(async (document) => {
      const existingDocument = await prisma.auditChecklist.findUnique({
        where: {
          paketId_dokumen: {
            paketId: paket.id,
            dokumen: document.key,
          },
        },
        select: { fileUrl: true },
      });
      const catatan = String(formData.get(`catatan_${document.key}`) ?? "")
        .trim()
        .slice(0, 4000);
      const fileValue = formData.get(`file_${document.key}`);
      const file = fileValue instanceof File ? fileValue : undefined;
      const fileUrl = file
        ? await savePreparationDocumentFile(paket.id, document.key, file)
        : undefined;

      return {
        ...document,
        catatan,
        fileUrl: fileUrl ?? existingDocument?.fileUrl,
        isComplete: Boolean(catatan || fileUrl || existingDocument?.fileUrl),
      };
    }),
  );

  await Promise.all(
    documentPayloads.map((document) =>
      prisma.auditChecklist.upsert({
        where: {
          paketId_dokumen: {
            paketId: paket.id,
            dokumen: document.key,
          },
        },
        update: {
          status: document.isComplete ? "LENGKAP" : "BELUM_ADA",
          catatan: document.isComplete
            ? document.catatan || "Dokumen diunggah sebagai bukti."
            : null,
          fileUrl: document.fileUrl,
        },
        create: {
          paketId: paket.id,
          dokumen: document.key,
          status: document.isComplete ? "LENGKAP" : "BELUM_ADA",
          catatan: document.isComplete
            ? document.catatan || "Dokumen diunggah sebagai bukti."
            : null,
          fileUrl: document.fileUrl,
        },
      }),
    ),
  );

  const hasAnyCompleteDocument = documentPayloads.some(
    (document) => document.isComplete,
  );

  if (!hasAnyCompleteDocument) {
    revalidatePath("/tender-non-tender");
    return;
  }

  await prisma.paketPengadaan.update({
    where: { id: paket.id },
    data: { statusPaket: targetStatus },
  });
  await createProgressSnapshot(paket.id, targetStatus);

  revalidatePath("/tender-non-tender");
  revalidatePath("/kontrak-sp");
  revalidatePath("/paket-pengadaan");
  revalidatePath(`/paket-pengadaan/${paket.id}`);
}

export default async function Page({ searchParams }: PageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const q = getParam(resolvedSearchParams, "q")?.trim();
  const tahunAnggaran = getParam(resolvedSearchParams, "tahunAnggaran") ?? "";
  const sumberDana = getParam(resolvedSearchParams, "sumberDana") ?? "";
  const unitPemohon = getParam(resolvedSearchParams, "unitPemohon") ?? "";
  const statusPaket = getParam(resolvedSearchParams, "statusPaket") ?? "";
  const metode = getParam(resolvedSearchParams, "metode") ?? "";

  const methodFilter =
    metode === "TENDER" || metode === "NON_TENDER"
      ? [metode as PaketMetodePengadaan]
      : [PaketMetodePengadaan.TENDER, PaketMetodePengadaan.NON_TENDER];

  const where: Prisma.PaketPengadaanWhereInput = {
    metodePengadaan: { in: methodFilter },
    ...(tahunAnggaran ? { tahunAnggaran: Number(tahunAnggaran) } : {}),
    ...(sumberDana ? { sumberDana } : {}),
    ...(unitPemohon ? { unitPemohon } : {}),
    ...(statusPaket ? { statusPaket: statusPaket as PaketStatus } : {}),
    ...(q
      ? {
          OR: [
            { kodePaket: { contains: q } },
            { namaPaket: { contains: q } },
            { unitPemohon: { contains: q } },
          ],
        }
      : {}),
  };

  const rupWhere: Prisma.RencanaUmumPengadaanWhereInput = {
    statusSirup: RupStatus.SUDAH_TAYANG,
    metodePengadaan: { in: methodFilter },
    ...(tahunAnggaran ? { tahunAnggaran: Number(tahunAnggaran) } : {}),
    ...(sumberDana ? { sumberDana } : {}),
    ...(unitPemohon ? { unitPengusul: unitPemohon } : {}),
    ...(q
      ? {
          OR: [
            { kodeRup: { contains: q } },
            { namaPaket: { contains: q } },
            { unitPengusul: { contains: q } },
          ],
        }
      : {}),
  };

  const [paketData, rupData, currentUser] = await Promise.all([
    prisma.paketPengadaan.findMany({
      where,
      include: {
        auditDokumen: {
          where: { dokumen: { in: tenderNonTenderDocumentKeys } },
          select: { dokumen: true, status: true, catatan: true, fileUrl: true },
        },
      },
      orderBy: [{ tahunAnggaran: "desc" }, { createdAt: "desc" }],
      take: 100,
    }),
    prisma.rencanaUmumPengadaan.findMany({
      where: rupWhere,
      orderBy: [{ tahunAnggaran: "desc" }, { createdAt: "desc" }],
      take: 200,
    }),
    getCurrentUser(),
  ]);
  const canExecute = currentUser ? canExecuteWorkflow(currentUser.roles) : false;

  const packageByRupKey = new Map(
    paketData.map((item) => [
      `${normalizeKey(item.namaPaket)}::${normalizeKey(item.unitPemohon)}`,
      item,
    ]),
  );
  const linkedRupRows = rupData.map((rup) => ({
    rup,
    paket: packageByRupKey.get(
      `${normalizeKey(rup.namaPaket)}::${normalizeKey(rup.unitPengusul)}`,
    ),
  }));
  const linkedPackageIds = new Set(
    linkedRupRows
      .map(({ paket }) => paket?.id)
      .filter((id): id is string => Boolean(id)),
  );
  const rupDisplayRows: DisplayRow[] = linkedRupRows.map(({ rup, paket }) => ({
    id: `rup-${rup.id}`,
    source: paket ? "paket" : "rup",
    sourceId: rup.id,
    paketId: paket?.id,
    kodePaket: paket?.kodePaket ?? rup.kodeRup,
    namaPaket: rup.namaPaket,
    unitPemohon: rup.unitPengusul,
    sumberDana: rup.sumberDana,
    metodePengadaan: rup.metodePengadaan,
    pagu: paket?.pagu ?? rup.pagu,
    hps: paket?.hps ?? rup.pagu,
    statusPaket: paket?.statusPaket,
    statusLabel: paket ? humanize(paket.statusPaket) : "Siap Diproses",
    statusClassName: paket
      ? statusClass(paket.statusPaket)
      : "bg-blue-100 text-blue-700",
    nextLabel: paket
      ? (nextStatusLabels[paket.statusPaket] ?? "Tahapan selesai")
      : "Mulai Persiapan Dokumen",
    actionLabel: paket
      ? nextPackageStatus[paket.statusPaket]
        ? nextStatusLabels[paket.statusPaket]
        : undefined
      : "Mulai Proses",
    actionStatus: paket ? nextPackageStatus[paket.statusPaket] : undefined,
    preparationDocuments: paket?.auditDokumen ?? [],
  }));
  const orphanPackageRows: DisplayRow[] = paketData
    .filter((item) => !linkedPackageIds.has(item.id))
    .map((item) => ({
      id: `paket-${item.id}`,
      source: "paket",
      sourceId: item.id,
      paketId: item.id,
      kodePaket: item.kodePaket,
      namaPaket: item.namaPaket,
      unitPemohon: item.unitPemohon,
      sumberDana: item.sumberDana,
      metodePengadaan: item.metodePengadaan,
      pagu: item.pagu,
      hps: item.hps,
      statusPaket: item.statusPaket,
      statusLabel: humanize(item.statusPaket),
      statusClassName: statusClass(item.statusPaket),
      nextLabel: nextStatusLabels[item.statusPaket] ?? "Tahapan selesai",
      actionLabel: nextPackageStatus[item.statusPaket]
        ? nextStatusLabels[item.statusPaket]
        : undefined,
      actionStatus: nextPackageStatus[item.statusPaket],
      preparationDocuments: item.auditDokumen,
    }));
  const displayRows = [...rupDisplayRows, ...orphanPackageRows];
  const tenderRows = displayRows.filter(
    (item) => item.metodePengadaan === "TENDER",
  );
  const nonTenderRows = displayRows.filter(
    (item) => item.metodePengadaan === "NON_TENDER",
  );
  const tenderValue = tenderRows.reduce(
    (sum, item) => sum + decimalNumber(item.pagu),
    0,
  );
  const nonTenderValue = nonTenderRows.reduce(
    (sum, item) => sum + decimalNumber(item.pagu),
    0,
  );
  const activeCount = displayRows.filter(
    (item) => !["Selesai", "Gagal", "Batal"].includes(item.statusLabel),
  ).length;
  const problemCount = displayRows.filter((item) =>
    ["Terlambat", "Gagal", "Batal"].includes(item.statusLabel),
  ).length;
  const finalStatuses = ["SELESAI", "GAGAL", "BATAL"];
  const buildStatusChart = (method: PaketMetodePengadaan) => {
    const rows = linkedRupRows.filter(
      ({ rup }) => rup.metodePengadaan === method,
    );
    const ready = rows.filter(({ paket }) => !paket).length;
    const done = rows.filter(({ paket }) =>
      paket ? finalStatuses.includes(paket.statusPaket) : false,
    ).length;
    const process = Math.max(rows.length - ready - done, 0);

    return {
      method,
      title: methodLabel(method),
      total: rows.length,
      statuses: [
        {
          label: "Siap Diproses",
          value: ready,
          className: "bg-blue-500",
          badgeClassName: "bg-blue-50 text-blue-700",
        },
        {
          label: "Sedang Diproses",
          value: process,
          className: "bg-amber-500",
          badgeClassName: "bg-amber-50 text-amber-700",
        },
        {
          label: "Selesai / Final",
          value: done,
          className: "bg-emerald-500",
          badgeClassName: "bg-emerald-50 text-emerald-700",
        },
      ],
    };
  };
  const tenderStatusCharts = [
    buildStatusChart(PaketMetodePengadaan.TENDER),
    buildStatusChart(PaketMetodePengadaan.NON_TENDER),
  ].filter((item) => methodFilter.includes(item.method));

  const kpis = [
    {
      label: "Total Paket",
      value: displayRows.length.toLocaleString("id-ID"),
      helper: "RUP tayang dan paket berjalan",
      tone: "blue" as KpiTone,
    },
    {
      label: "Tender",
      value: tenderRows.length.toLocaleString("id-ID"),
      helper: formatCompactCurrency(tenderValue),
      tone: "green" as KpiTone,
    },
    {
      label: "Non Tender",
      value: nonTenderRows.length.toLocaleString("id-ID"),
      helper: formatCompactCurrency(nonTenderValue),
      tone: "orange" as KpiTone,
    },
    {
      label: "Bermasalah",
      value: problemCount.toLocaleString("id-ID"),
      helper: `${activeCount.toLocaleString("id-ID")} paket aktif`,
      tone: "red" as KpiTone,
    },
  ];

  const tableColumns = [
    "Kode Paket",
    "Nama Paket",
    "Unit",
    "Sumber Dana",
    "Metode",
    "Akses Penyedia",
    "Pagu",
    "HPS",
    "Dokumen Tahap 1",
    "Status",
    "Tahapan Berikutnya",
    "Detail Pengisian",
    "Aksi",
  ];
  const internalControlCards = [
    {
      icon: ShieldCheck,
      title: "Monitoring Internal",
      helper:
        "Tender dan non tender hanya dipakai untuk memantau status paket, nilai, jadwal, dan progres pemilihan.",
    },
    {
      icon: LockKeyhole,
      title: "Penyedia Tidak Login",
      helper:
        "Penyedia dicatat sebagai data referensi paket, bukan sebagai user yang dapat input, edit, atau menyanggah di sistem.",
    },
    {
      icon: UserRoundCheck,
      title: "Akses 6 User Internal",
      helper:
        "Akses operasional mengikuti akun internal yang sudah ditentukan dan seluruh aktivitas melewati kontrol role.",
    },
  ];
  const workflowGroups = [
    {
      title: "Mekanisme Tender",
      helper:
        "Alur monitoring tender oleh user internal; data penyedia hanya dicatat sebagai objek paket.",
      badge: `${tenderRows.length.toLocaleString("id-ID")} paket`,
      steps: [
        ["1", "Dokumen", "Dokumen pemilihan, KAK, spesifikasi, dan HPS final"],
        ["2", "Jadwal", "User internal mencatat jadwal tayang dan batas proses"],
        ["3", "Input Internal", "Data penawaran dari kanal resmi dicatat oleh petugas"],
        ["4", "Evaluasi", "Hasil evaluasi administrasi, teknis, harga, dan kualifikasi dipantau"],
        ["5", "Penetapan", "BA hasil pemilihan dan pemenang dicatat"],
        ["6", "SPPBJ", "Paket siap masuk kontrak"],
      ],
    },
    {
      title: "Mekanisme Non Tender",
      helper:
        "Alur monitoring non tender oleh user internal; penyedia tidak memiliki akses ke halaman ini.",
      badge: `${nonTenderRows.length.toLocaleString("id-ID")} paket`,
      steps: [
        ["1", "Dokumen", "Dokumen persiapan, HPS, dan kebutuhan paket final"],
        ["2", "Jadwal", "User internal mencatat undangan atau proses non tender"],
        ["3", "Input Internal", "Data penawaran/kelengkapan dicatat oleh petugas"],
        ["4", "Klarifikasi", "Hasil klarifikasi dan negosiasi dicatat sebagai progres"],
        ["5", "Penetapan", "BA hasil dan penyedia terpilih dicatat"],
        ["6", "SPPBJ/SP", "Siap masuk kontrak atau surat pesanan"],
      ],
    },
  ];

  return (
    <>
      <AppHeader
        title="Tender & Non Tender"
        subtitle="UKPBJ › Pemilihan Penyedia"
        rightLabel="Tahapan"
      />
      <main className="min-h-screen bg-[#f4f7f5]">
        <div className="space-y-4 px-4 py-4 sm:px-6 lg:px-8">
          <section className="grid gap-3 lg:grid-cols-3">
            {internalControlCards.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.title}
                  className="rounded-lg border border-emerald-100 bg-white px-5 py-4 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-[#08783f]">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <h2 className="text-sm font-black text-[#16227c]">
                        {item.title}
                      </h2>
                      <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
                        {item.helper}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </section>

          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {kpis.map((item) => (
              <div
                key={item.label}
                className={`rounded-lg border border-l-4 border-slate-200 bg-white px-5 py-4 shadow-sm ${kpiBorderClass(item.tone)}`}
              >
                <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                  {item.label}
                </p>
                <p className="mt-2 text-2xl font-black text-[#16227c]">
                  {item.value}
                </p>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  {item.helper}
                </p>
              </div>
            ))}
          </section>

          <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-2 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-2">
                <BarChart3 className="h-5 w-5 shrink-0 text-[#08783f]" />
                <div className="min-w-0">
                  <h2 className="text-lg font-black text-[#16227c]">
                    Grafik Kondisi Paket Tender & Non Tender
                  </h2>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    Hanya menampilkan paket dengan RUP sudah tayang dan siap diproses.
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-[#08783f]">
                {rupData.length.toLocaleString("id-ID")} RUP siap
              </span>
            </div>
            <div className="grid gap-4 p-4 xl:grid-cols-2">
              {tenderStatusCharts.map((chart) => {
                const total = Math.max(chart.total, 1);

                return (
                  <div
                    key={chart.title}
                    className="rounded-md border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-black text-[#16227c]">
                          {chart.title}
                        </h3>
                        <p className="mt-1 text-xs font-semibold text-slate-500">
                          RUP siap: {chart.total.toLocaleString("id-ID")} paket
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 space-y-3">
                      {chart.statuses.map((status) => {
                        const percent = Math.round((status.value / total) * 100);

                        return (
                          <div key={`${chart.title}-${status.label}`}>
                            <div className="mb-1 flex items-center justify-between gap-3">
                              <span className="text-xs font-black text-slate-700">
                                {status.label}
                              </span>
                              <span
                                className={`rounded-full px-2.5 py-1 text-[11px] font-black ${status.badgeClassName}`}
                              >
                                {status.value.toLocaleString("id-ID")}
                              </span>
                            </div>
                            <div className="h-3 overflow-hidden rounded-full bg-white ring-1 ring-slate-200">
                              <div
                                className={`h-full rounded-full ${status.className}`}
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-3">
              <div className="flex items-center gap-2">
                <ListChecks className="h-5 w-5 text-[#08783f]" />
                <h2 className="text-sm font-black text-[#16227c]">
                  Mekanisme Pemilihan
                </h2>
              </div>
            </div>
            <div className="grid gap-4 p-4 xl:grid-cols-2">
              {workflowGroups.map((group) => (
                <div
                  key={group.title}
                  className="overflow-hidden rounded-md border border-slate-200 bg-white"
                >
                  <div className="flex flex-col gap-2 border-b border-slate-100 bg-slate-50 px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <h3 className="text-sm font-black text-[#16227c]">
                        {group.title}
                      </h3>
                      <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
                        {group.helper}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-[#08783f]">
                      {group.badge}
                    </span>
                  </div>
                  <div className="grid gap-2 p-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 2xl:grid-cols-3">
                    {group.steps.map(([number, title, helper]) => (
                      <div
                        key={`${group.title}-${number}`}
                        className="min-h-[92px] rounded-md border border-slate-200 bg-[#f4f7f5] p-3"
                      >
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#08783f] text-[11px] font-black text-white">
                          {number}
                        </span>
                        <p className="mt-2 text-xs font-black text-slate-900">
                          {title}
                        </p>
                        <p className="mt-1 text-[11px] font-semibold leading-4 text-slate-500">
                          {helper}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-2">
                <FileCheck2 className="h-5 w-5 shrink-0 text-[#08783f]" />
                <h2 className="truncate text-lg font-black text-[#16227c]">
                  Daftar Paket Tender & Non Tender
                </h2>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1450px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-black uppercase text-slate-400">
                    {tableColumns.map((column) => (
                      <th key={column} className="px-4 py-3">
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {displayRows.length > 0 ? (
                    displayRows.map((item) => {
                      const stageRequirement = item.statusPaket
                        ? getWorkflowStageRequirement(
                            item.statusPaket,
                            item.metodePengadaan,
                          )
                        : undefined;
                      const preparationDocuments =
                        getPreparationDocuments(item.metodePengadaan);
                      const detailDocumentGroups = getDetailDocumentGroups(
                        item.metodePengadaan,
                      );

                      return (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="whitespace-nowrap px-4 py-3 font-black text-slate-800">
                          {item.kodePaket}
                        </td>
                        <td className="min-w-[260px] px-4 py-3 font-semibold text-slate-700">
                          {item.namaPaket}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 font-semibold text-slate-600">
                          {item.unitPemohon}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 font-semibold text-slate-600">
                          {item.sumberDana}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-[#16227c]">
                            {methodLabel(item.metodePengadaan)}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
                            Tidak ada akses
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 font-semibold text-slate-600">
                          {formatCompactCurrency(decimalNumber(item.pagu))}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 font-semibold text-slate-600">
                          {formatCompactCurrency(decimalNumber(item.hps))}
                        </td>
                        <td className="min-w-[190px] px-4 py-3">
                          {item.paketId ? (
                            <div className="space-y-1">
                              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-black text-slate-700">
                                {countCompletePreparationDocuments(
                                  item.preparationDocuments,
                                  item.metodePengadaan,
                                )}
                                /{preparationDocuments.length} lengkap
                              </span>
                              <div className="flex flex-wrap gap-1">
                                {preparationDocuments.map((document) => {
                                  const isComplete =
                                    getPreparationDocumentStatus(
                                      item.preparationDocuments,
                                      document.key,
                                    ) === "LENGKAP";

                                  return (
                                    <span
                                      key={`${item.id}-${document.key}`}
                                      className={`rounded px-1.5 py-0.5 text-[10px] font-black ${
                                        isComplete
                                          ? "bg-emerald-50 text-[#08783f]"
                                          : "bg-amber-50 text-amber-700"
                                      }`}
                                    >
                                      {document.label}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs font-bold text-slate-400">
                              Belum mulai
                            </span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-black ${item.statusClassName}`}
                          >
                            {item.statusLabel}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 font-semibold text-slate-600">
                          {item.nextLabel}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          {item.paketId ? (
                            <DetailDocumentsModalButton
                              documents={item.preparationDocuments}
                              groups={detailDocumentGroups}
                              kodePaket={item.kodePaket}
                              namaPaket={item.namaPaket}
                              statusLabel={item.statusLabel}
                            />
                          ) : (
                            <span className="text-xs font-bold text-slate-400">
                              Belum mulai
                            </span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          {canExecute && item.source === "rup" ? (
                            <form action={startTenderNonTenderAction}>
                              <input
                                type="hidden"
                                name="rupId"
                                value={item.sourceId}
                              />
                              <button
                                type="submit"
                                className="rounded-md bg-[#08783f] px-3 py-2 text-xs font-black text-white shadow-sm transition hover:bg-[#066b38]"
                              >
                                Mulai Proses
                              </button>
                            </form>
                          ) : canExecute &&
                            item.paketId &&
                            item.statusPaket === "PERSIAPAN_DOKUMEN" ? (
                            <PreparationDocumentsModalButton
                              action={completePreparationDocumentsAction}
                              buttonLabel={
                                item.metodePengadaan === "NON_TENDER"
                                  ? "Lengkapi Dokumen Non Tender"
                                  : "Lengkapi Dokumen"
                              }
                              documents={preparationDocuments}
                              existingDocuments={item.preparationDocuments}
                              namaPaket={item.namaPaket}
                              paketId={item.paketId}
                              submitLabel={
                                item.metodePengadaan === "NON_TENDER"
                                  ? "Simpan & Lanjut Jadwal Non Tender"
                                  : "Simpan & Lanjut Jadwal"
                              }
                              title={
                                item.metodePengadaan === "NON_TENDER"
                                  ? "Dokumen Non Tender"
                                  : "Persiapan Dokumen"
                              }
                            />
                          ) : canExecute &&
                            item.paketId &&
                            item.statusPaket &&
                            stageRequirement ? (
                            <StageDocumentsModalButton
                              action={completeWorkflowStageAction}
                              buttonLabel={stageRequirement.buttonLabel}
                              currentStatus={item.statusPaket}
                              documents={stageRequirement.documents}
                              existingDocuments={item.preparationDocuments}
                              eyebrow={stageRequirement.eyebrow}
                              namaPaket={item.namaPaket}
                              paketId={item.paketId}
                              submitLabel={stageRequirement.submitLabel}
                              targetStatus={stageRequirement.targetStatus}
                              title={stageRequirement.title}
                            />
                          ) : canExecute &&
                            item.paketId &&
                            item.actionStatus &&
                            item.actionLabel ? (
                            <form action={updateTenderNonTenderStatusAction}>
                              <input
                                type="hidden"
                                name="paketId"
                                value={item.paketId}
                              />
                              <input
                                type="hidden"
                                name="targetStatus"
                                value={item.actionStatus}
                              />
                              <button
                                type="submit"
                                className="rounded-md border border-[#08783f] px-3 py-2 text-xs font-black text-[#08783f] transition hover:bg-emerald-50"
                              >
                                {item.actionLabel}
                              </button>
                            </form>
                          ) : (
                            <span className="text-xs font-bold text-slate-400">
                              {canExecute ? "Tidak ada aksi" : "Internal"}
                            </span>
                          )}
                        </td>
                      </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={tableColumns.length}
                        className="px-4 py-16 text-center text-sm font-semibold text-slate-500"
                      >
                        Data tender dan non tender belum tersedia di database.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
