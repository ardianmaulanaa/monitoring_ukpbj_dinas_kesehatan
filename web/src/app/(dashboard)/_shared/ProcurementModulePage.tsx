import Link from "next/link";
import { revalidatePath } from "next/cache";
import { PaketMetodePengadaan, PaketStatus, Prisma, RupStatus } from "@prisma/client";
import type { RoleCode } from "@prisma/client";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  Boxes,
  Building2,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  ClipboardList,
  FileSearch,
  FileBarChart2,
  FileCheck2,
  FolderOpen,
  Handshake,
  Landmark,
  MessageSquareText,
  PackageSearch,
  Search,
  ShieldCheck,
  ShoppingCart,
  Truck,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { getDashboardData, type DashboardData } from "@/lib/dashboard-data";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActiveSumberDanaOptions } from "@/lib/sumber-dana";
import AddKontrakModalButton from "../kontrak/AddKontrakModalButton";
import AddDataBarangModalButton from "../data-barang/AddDataBarangModalButton";
import AddPaketModalButton from "../paket/AddPaketModalButton";
import AddRupModalButton from "../rup/AddRupModalButton";
import RoleCreateModalButton from "../admin/roles/RoleCreateModalButton";
import AppHeader from "./AppHeader";
import GenericInputModalButton from "./GenericInputModalButton";

type PageConfig = {
  title: string;
  subtitle: string;
  rightLabel: string;
  icon: LucideIcon;
  primaryAction?: {
    label: string;
    href: string;
  };
};

type ProcurementModulePageProps = {
  pageKey: string;
  tahap?: string;
  searchParams?: Record<string, string | string[] | undefined>;
};

type ModuleKpi = {
  label: string;
  value: string;
  helper?: string;
  tone?: "blue" | "green" | "orange" | "red";
};

type ModuleTable = {
  columns: string[];
  rows: string[][];
};

type ModuleData = {
  kpis: ModuleKpi[];
  table: ModuleTable;
};

const pageConfigs = {
  dashboard: {
    title: "Dashboard",
    subtitle: "Ringkasan monitoring paket, kontrak, progres, realisasi, dan warning.",
    rightLabel: "Monitoring",
    icon: BarChart3,
  },
  "data-barang": {
    title: "Data Barang",
    subtitle: "Kelola referensi barang, stok, lokasi, dan status aktif.",
    rightLabel: "Inventaris",
    icon: Boxes,
    primaryAction: { label: "Tambah barang", href: "/data-barang/tambah" },
  },
  paket: {
    title: "Paket Pengadaan",
    subtitle: "Kelola paket pengadaan dari perencanaan sampai selesai.",
    rightLabel: "Paket",
    icon: ClipboardList,
    primaryAction: { label: "Tambah paket", href: "/paket/tambah" },
  },
  rup: {
    title: "SIRUP / RUP",
    subtitle:
      "Pantau rencana umum pengadaan, status tayang SIRUP, sumber dana, pagu, dan jadwal pemilihan.",
    rightLabel: "Perencanaan",
    icon: ClipboardList,
  },
  katalog: {
    title: "e-Katalog V6 & V5",
    subtitle:
      "Kelola paket e-Katalog, produk, penyedia, harga tayang, harga nego, surat pesanan, BAST, dan pembayaran.",
    rightLabel: "e-Katalog",
    icon: ShoppingCart,
  },
  pengadaan: {
    title: "Tahapan Pengadaan",
    subtitle: "Pantau alur perencanaan, persiapan, pemilihan, dan hasil pemilihan.",
    rightLabel: "Tahapan",
    icon: PackageSearch,
  },
  kontrak: {
    title: "Kontrak & Surat Pesanan",
    subtitle: "Kelola kontrak, nilai, penyedia, masa berlaku, dan adendum.",
    rightLabel: "Kontrak",
    icon: FileCheck2,
    primaryAction: { label: "Tambah kontrak", href: "/kontrak/tambah" },
  },
  progres: {
    title: "Progres Fisik",
    subtitle: "Pantau target, realisasi, deviasi, kendala, dan dokumentasi pekerjaan.",
    rightLabel: "Progres",
    icon: BarChart3,
    primaryAction: { label: "Tambah progres", href: "/progres/tambah" },
  },
  realisasi: {
    title: "Realisasi Keuangan",
    subtitle: "Kelola termin pembayaran dan penyerapan nilai kontrak.",
    rightLabel: "Keuangan",
    icon: Building2,
    primaryAction: { label: "Tambah realisasi", href: "/realisasi/tambah" },
  },
  "serah-terima": {
    title: "Serah Terima",
    subtitle: "Kelola BAST, hasil pemeriksaan, dan dokumen serah terima.",
    rightLabel: "BAST",
    icon: Handshake,
    primaryAction: { label: "Tambah serah terima", href: "/serah-terima/tambah" },
  },
  penyedia: {
    title: "Penyedia",
    subtitle: "Kelola penyedia, legalitas, kontak, dan status aktif.",
    rightLabel: "Vendor",
    icon: Truck,
    primaryAction: { label: "Tambah penyedia", href: "/penyedia/tambah" },
  },
  warning: {
    title: "Warning",
    subtitle: "Pantau risiko otomatis dan tindak lanjut paket bermasalah.",
    rightLabel: "Risiko",
    icon: AlertTriangle,
  },
  audit: {
    title: "Audit Readiness",
    subtitle:
      "Pantau kelengkapan dokumen pengadaan, kesiapan BAST, bukti pembayaran, dan catatan pemeriksaan.",
    rightLabel: "Audit",
    icon: ShieldCheck,
  },
  timeline: {
    title: "Timeline",
    subtitle:
      "Lihat jadwal perencanaan, pemilihan penyedia, kontrak, pengiriman, serah terima, dan pembayaran.",
    rightLabel: "Jadwal",
    icon: CalendarDays,
  },
  klinik: {
    title: "Klinik UKPBJ",
    subtitle:
      "Ruang konsultasi pengadaan untuk metode pemilihan, penyusunan HPS, KAK, kontrak, dan kelengkapan dokumen.",
    rightLabel: "Konsultasi",
    icon: MessageSquareText,
  },
  dokumen: {
    title: "Dokumen & Template",
    subtitle:
      "Kelola template KAK, HPS, rancangan kontrak, SPPBJ, BAST, BAPB, dan dokumen pendukung pengadaan.",
    rightLabel: "Dokumen",
    icon: FolderOpen,
  },
  laporan: {
    title: "Laporan",
    subtitle: "Rekap paket, kontrak, progres, dan realisasi keuangan.",
    rightLabel: "Laporan",
    icon: FileBarChart2,
  },
  master: {
    title: "Master Data",
    subtitle: "Kelola instansi, satuan kerja, tahun anggaran, dan sumber dana.",
    rightLabel: "Referensi",
    icon: Building2,
  },
  admin: {
    title: "Administrasi",
    subtitle: "Kelola pengguna, role, sinkronisasi, dan audit log.",
    rightLabel: "Admin",
    icon: UsersRound,
  },
  pengaturan: {
    title: "Pengaturan",
    subtitle:
      "Atur preferensi sistem, akses modul, pengguna, role, master data, dan sinkronisasi pendukung.",
    rightLabel: "Sistem",
    icon: UsersRound,
  },
  profile: {
    title: "Profile",
    subtitle: "Lihat informasi akun dan hak akses pengguna.",
    rightLabel: "Akun",
    icon: ShieldCheck,
  },
} satisfies Record<string, PageConfig>;

const aliases: Record<string, keyof typeof pageConfigs> = {
  "data-barang-tambah": "data-barang",
  "data-barang-detail": "data-barang",
  "data-barang-edit": "data-barang",
  "paket-tambah": "paket",
  "paket-detail": "paket",
  "paket-edit": "paket",
  "paket-riwayat": "paket",
  "pengadaan-tahap": "pengadaan",
  perencanaan: "pengadaan",
  pemilihan: "pengadaan",
  "kontrak-tambah": "kontrak",
  "kontrak-detail": "kontrak",
  "kontrak-edit": "kontrak",
  "kontrak-adendum": "kontrak",
  "progres-tambah": "progres",
  "progres-detail": "progres",
  "realisasi-tambah": "realisasi",
  "realisasi-detail": "realisasi",
  "serah-terima-tambah": "serah-terima",
  "serah-terima-detail": "serah-terima",
  "penyedia-tambah": "penyedia",
  "penyedia-detail": "penyedia",
  "penyedia-edit": "penyedia",
  "warning-detail": "warning",
  "laporan-paket": "laporan",
  "laporan-kontrak": "laporan",
  "laporan-progres": "laporan",
  "laporan-realisasi": "laporan",
  "master-instansi": "master",
  "master-satuan-kerja": "master",
  "master-sumber-dana": "master",
  "master-tahun-anggaran": "master",
  "admin-users": "admin",
  "admin-users-tambah": "admin",
  "admin-users-detail": "admin",
  "admin-roles": "admin",
  "admin-sinkronisasi": "admin",
  "admin-audit-log": "admin",
};

function resolveConfig(pageKey: string) {
  return (
    pageConfigs[pageKey as keyof typeof pageConfigs] ??
    pageConfigs[aliases[pageKey]] ??
    pageConfigs.dashboard
  ) as PageConfig;
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

function humanize(value: string) {
  return value
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function statusClass(status: string) {
  const normalized = status.toUpperCase();

  if (normalized.includes("SELESAI")) return "bg-emerald-100 text-emerald-700";
  if (normalized.includes("KONTRAK")) return "bg-emerald-100 text-[#08783f]";
  if (normalized.includes("PEMILIHAN") || normalized.includes("PEMENANG")) {
    return "bg-amber-100 text-amber-700";
  }
  if (normalized.includes("TERLAMBAT") || normalized.includes("GAGAL")) {
    return "bg-red-100 text-red-700";
  }

  return "bg-slate-100 text-slate-600";
}

function getParam(
  searchParams: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] : value;
}

function methodLabel(value: string) {
  const labels: Record<string, string> = {
    TENDER: "Tender",
    NON_TENDER: "Non Tender",
    E_PURCHASING: "e-Katalog",
    PENGADAAN_LANGSUNG: "Pengadaan Langsung",
    SWAKELOLA: "Swakelola",
  };

  return labels[value] ?? humanize(value);
}

function sourceFundClass(value: string) {
  const normalized = value.toUpperCase();

  if (normalized.includes("BLUD")) return "bg-emerald-100 text-[#08783f]";
  if (normalized.includes("APBD")) return "bg-amber-100 text-amber-700";
  if (normalized.includes("DBHCHT")) return "bg-red-100 text-red-700";

  return "bg-emerald-100 text-emerald-700";
}

function getTahapContent(tahap?: string) {
  if (tahap === "perencanaan") {
    return {
      eyebrow: "Perencanaan",
      title: "Perencanaan Pengadaan",
      subtitle:
        "Kelola usulan kebutuhan, KAK, HPS, spesifikasi teknis, telaahan TKDN/impor, dan risk register awal.",
      actionLabel: "Tambah paket",
      actionHref: "/paket/tambah",
    };
  }

  if (tahap === "pemilihan") {
    return {
      eyebrow: "Pemilihan Penyedia",
      title: "Tender & Non Tender",
      subtitle:
        "Pantau e-katalog, tender, non tender, evaluasi, negosiasi, penetapan pemenang, dan SPPBJ.",
    };
  }

  return {
    eyebrow: "Tahapan Pengadaan",
    title: "Tahapan Pengadaan",
    subtitle: "Pantau alur perencanaan, persiapan, pemilihan, dan hasil pemilihan.",
    actionLabel: "Tambah paket",
    actionHref: "/paket/tambah",
  };
}

const planningStatusLabels: Record<string, string> = {
  BELUM_INPUT: "Draft Usulan",
  PROSES_VERIFIKASI: "Menunggu Kepala Unit",
  MENUNGGU_PPTK: "Menunggu PPTK",
  MENUNGGU_PPK: "Menunggu PPK",
  MENUNGGU_KPA_PA: "Menunggu KPA/PA",
  REVISI_PAGU: "Perlu Revisi",
  SUDAH_TAYANG: "Siap RUP/SIRUP",
  DITARIK: "Ditolak",
};

const planningStatusStyles: Record<string, string> = {
  BELUM_INPUT: "bg-slate-100 text-slate-600",
  PROSES_VERIFIKASI: "bg-amber-100 text-amber-700",
  MENUNGGU_PPTK: "bg-blue-100 text-blue-700",
  MENUNGGU_PPK: "bg-violet-100 text-violet-700",
  MENUNGGU_KPA_PA: "bg-indigo-100 text-indigo-700",
  REVISI_PAGU: "bg-orange-100 text-orange-700",
  SUDAH_TAYANG: "bg-emerald-100 text-emerald-700",
  DITARIK: "bg-red-100 text-red-700",
};

const planningStatusRole: Partial<Record<RupStatus, RoleCode[]>> = {
  BELUM_INPUT: ["OPERATOR"],
  PROSES_VERIFIKASI: ["LEADER"],
  MENUNGGU_PPTK: ["PPTK"],
  MENUNGGU_PPK: ["PPK"],
  MENUNGGU_KPA_PA: ["KPA", "PA"],
};

const planningNextStatus: Partial<Record<RupStatus, RupStatus>> = {
  BELUM_INPUT: "PROSES_VERIFIKASI",
  PROSES_VERIFIKASI: "MENUNGGU_PPTK",
  MENUNGGU_PPTK: "MENUNGGU_PPK",
  MENUNGGU_PPK: "MENUNGGU_KPA_PA",
  MENUNGGU_KPA_PA: "SUDAH_TAYANG",
};

function canActOnPlanningStatus(userRoles: RoleCode[], status: RupStatus) {
  if (userRoles.includes("SUPER_ADMIN")) {
    return Boolean(planningNextStatus[status]);
  }

  const allowedRoles = planningStatusRole[status] ?? [];
  return userRoles.some((role) => allowedRoles.includes(role));
}

async function updatePlanningApprovalAction(formData: FormData) {
  "use server";

  const user = await getCurrentUser();
  if (!user) {
    return;
  }

  const id = String(formData.get("id") ?? "");
  const action = String(formData.get("action") ?? "");
  const proposal = await prisma.rencanaUmumPengadaan.findUnique({
    where: { id },
    select: { statusSirup: true },
  });

  if (!proposal || !canActOnPlanningStatus(user.roles, proposal.statusSirup)) {
    return;
  }

  const nextStatus =
    action === "revise"
      ? "REVISI_PAGU"
      : action === "reject"
        ? "DITARIK"
        : planningNextStatus[proposal.statusSirup];

  if (!nextStatus) {
    return;
  }

  await prisma.rencanaUmumPengadaan.update({
    where: { id },
    data: { statusSirup: nextStatus },
  });

  revalidatePath("/pengadaan/perencanaan");
  revalidatePath("/rup");
}

const planningApprovalFlow = [
  {
    label: "Draft Usulan",
    helper: "Unit input kebutuhan, volume, pagu, jadwal, dan dokumen awal.",
  },
  {
    label: "Kepala Unit",
    helper: "Validasi bahwa kebutuhan benar diperlukan oleh unit pengusul.",
  },
  {
    label: "PPTK",
    helper: "Cek kesesuaian kegiatan, output, jadwal, dan anggaran.",
  },
  {
    label: "PPK",
    helper: "Review KAK, spesifikasi teknis, HPS, metode, dan rancangan kontrak.",
  },
  {
    label: "KPA/PA",
    helper: "Approval akhir sebelum paket siap masuk RUP/SIRUP.",
  },
  {
    label: "Siap RUP/SIRUP",
    helper: "Admin dapat input atau sinkronkan ke SIRUP.",
  },
];

const roleWorkflowMatrix: {
  code: RoleCode;
  name: string;
  actor: string;
  approvalStep: string;
  accessScope: string;
  modules: string;
  grants: string[];
  tone: string;
}[] = [
  {
    code: "SUPER_ADMIN",
    name: "Super Admin",
    actor: "Administrator sistem",
    approvalStep: "Semua tahap",
    accessScope: "Akses penuh seluruh modul, user, role, master data, dan audit log.",
    modules: "Semua modul",
    grants: [
      "Create",
      "Read",
      "Update",
      "Delete",
      "Approve",
      "Reject",
      "Export",
      "Manage User",
      "Manage Role",
    ],
    tone: "bg-slate-900 text-white",
  },
  {
    code: "LPSE_ADMIN",
    name: "Admin LPSE",
    actor: "Admin SIRUP/SPSE",
    approvalStep: "Input/Tayang RUP",
    accessScope: "Kelola sinkronisasi RUP/SIRUP, referensi LPSE, dan status tayang.",
    modules: "RUP, SIRUP, Sinkronisasi",
    grants: ["Read", "Update RUP", "Sinkron SIRUP", "Tandai Tayang", "Export"],
    tone: "bg-blue-100 text-blue-700",
  },
  {
    code: "OPERATOR",
    name: "Operator",
    actor: "Admin input data",
    approvalStep: "Draft/Input data",
    accessScope: "Input kebutuhan, paket, dokumen, progres, dan realisasi sesuai penugasan.",
    modules: "Perencanaan, Paket, Dokumen",
    grants: ["Create Draft", "Update Draft", "Upload Dokumen", "Ajukan Usulan", "Read"],
    tone: "bg-cyan-100 text-cyan-700",
  },
  {
    code: "LEADER",
    name: "Kepala Unit",
    actor: "Pimpinan unit pengusul",
    approvalStep: "Approve Kepala Unit",
    accessScope: "Validasi bahwa kebutuhan benar diperlukan oleh unit sebelum masuk verifikasi PPTK.",
    modules: "Perencanaan, Dashboard, Laporan",
    grants: ["Read", "Approve Kebutuhan", "Minta Revisi", "Reject", "Disposisi"],
    tone: "bg-indigo-100 text-indigo-700",
  },
  {
    code: "PPTK",
    name: "PPTK",
    actor: "Pejabat Pelaksana Teknis Kegiatan",
    approvalStep: "Verifikasi PPTK",
    accessScope: "Verifikasi kesesuaian kegiatan, output, volume, jadwal, dan dukungan anggaran.",
    modules: "Perencanaan, RUP, Laporan",
    grants: ["Read", "Verifikasi Kegiatan", "Minta Revisi", "Reject", "Export"],
    tone: "bg-blue-100 text-blue-700",
  },
  {
    code: "PA",
    name: "PA",
    actor: "Pengguna Anggaran",
    approvalStep: "Approval akhir",
    accessScope: "Persetujuan final paket strategis dari sisi kewenangan dan anggaran.",
    modules: "Perencanaan, RUP, Laporan",
    grants: ["Read", "Approve Final", "Minta Revisi", "Reject", "Export"],
    tone: "bg-emerald-100 text-emerald-700",
  },
  {
    code: "KPA",
    name: "KPA",
    actor: "Kuasa Pengguna Anggaran",
    approvalStep: "Approval akhir",
    accessScope: "Menyetujui paket sebelum siap RUP/SIRUP dan memantau realisasi.",
    modules: "Perencanaan, RUP, Realisasi",
    grants: ["Read", "Approve Final", "Minta Revisi", "Reject", "Export"],
    tone: "bg-emerald-100 text-emerald-700",
  },
  {
    code: "PPK",
    name: "PPK",
    actor: "Pejabat Pembuat Komitmen",
    approvalStep: "Review PPK",
    accessScope: "Review KAK, spesifikasi, HPS, metode, rancangan kontrak, dan paket.",
    modules: "Perencanaan, Paket, Kontrak",
    grants: [
      "Read",
      "Review Teknis",
      "Update KAK/HPS",
      "Tentukan Metode",
      "Minta Revisi",
      "Approve PPK",
    ],
    tone: "bg-amber-100 text-amber-700",
  },
  {
    code: "PROCUREMENT_OFFICER",
    name: "Pejabat Pengadaan",
    actor: "PP/Pejabat Pengadaan",
    approvalStep: "Proses pengadaan",
    accessScope: "Menjalankan pengadaan langsung, e-katalog, negosiasi, dan dokumen pemilihan.",
    modules: "Katalog, Pemilihan, Paket",
    grants: ["Read", "Update Pemilihan", "Negosiasi", "Tetapkan Penyedia", "Upload Dokumen"],
    tone: "bg-orange-100 text-orange-700",
  },
  {
    code: "SELECTION_WORKGROUP",
    name: "Pokja Pemilihan",
    actor: "Pokja",
    approvalStep: "Tender/Non Tender",
    accessScope: "Evaluasi administrasi, teknis, harga, dan penetapan hasil pemilihan.",
    modules: "Tender, Non Tender, Evaluasi",
    grants: ["Read", "Evaluasi", "Klarifikasi", "Penetapan Hasil", "Upload BA"],
    tone: "bg-violet-100 text-violet-700",
  },
  {
    code: "UKPBJ",
    name: "UKPBJ",
    actor: "Tim UKPBJ",
    approvalStep: "Pembinaan & review",
    accessScope: "Pendampingan, klinik pengadaan, review risiko, dan monitoring lintas paket.",
    modules: "Klinik, Risiko, Monitoring",
    grants: ["Read", "Review Risiko", "Klinik Pengadaan", "Monitoring", "Export"],
    tone: "bg-teal-100 text-teal-700",
  },
  {
    code: "AUDITOR",
    name: "Auditor",
    actor: "Inspektorat/Auditor",
    approvalStep: "Audit readiness",
    accessScope: "Read only dokumen, BAST, pembayaran, audit trail, dan catatan pemeriksaan.",
    modules: "Audit, Dokumen, Laporan",
    grants: ["Read Only", "Lihat Dokumen", "Lihat Audit Trail", "Catatan Temuan", "Export"],
    tone: "bg-red-100 text-red-700",
  },
  {
    code: "VIEWER",
    name: "Viewer",
    actor: "Pembaca terbatas",
    approvalStep: "Read only",
    accessScope: "Melihat dashboard dan laporan terbatas tanpa aksi perubahan data.",
    modules: "Dashboard, Laporan",
    grants: ["Read Only", "Lihat Dashboard", "Lihat Laporan"],
    tone: "bg-slate-100 text-slate-600",
  },
];

const defaultKpis: ModuleKpi[] = [
  { label: "Total data", value: "0", helper: "Data aktif", tone: "blue" },
  { label: "Nilai total", value: "Rp 0", helper: "Total pagu/nilai", tone: "green" },
  { label: "Dalam proses", value: "0", helper: "Belum selesai", tone: "orange" },
  { label: "Bermasalah", value: "0", helper: "Perlu tindak lanjut", tone: "red" },
];

function getModuleKey(pageKey: string, tahap?: string) {
  if (tahap === "pemilihan") return "pemilihan";
  return aliases[pageKey] ?? pageKey;
}

function kpiBorderClass(tone: ModuleKpi["tone"]) {
  if (tone === "green") return "border-l-[#43a047]";
  if (tone === "orange") return "border-l-[#f57c00]";
  if (tone === "red") return "border-l-[#e53935]";
  return "border-l-[#1976d2]";
}

function decimalNumber(value: { toString(): string } | number | string | null | undefined) {
  if (value === null || value === undefined) return 0;
  return Number(value.toString()) || 0;
}

function formatShortDate(value: Date | string | null | undefined) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function emptyModuleTable(): ModuleTable {
  return {
    columns: ["Nama / Uraian", "Kategori", "Nilai", "Status", "Aksi"],
    rows: [],
  };
}

async function getPackageModuleData(
  moduleKey: string,
  config: PageConfig,
  searchParams: Record<string, string | string[] | undefined> = {},
): Promise<ModuleData> {
  const q = getParam(searchParams, "q")?.trim();
  const tahunAnggaran = getParam(searchParams, "tahunAnggaran");
  const sumberDana = getParam(searchParams, "sumberDana");
  const unitPemohon = getParam(searchParams, "unitPemohon");
  const statusPaket = getParam(searchParams, "statusPaket");

  const moduleWhere: Prisma.PaketPengadaanWhereInput =
    moduleKey === "katalog"
      ? { metodePengadaan: PaketMetodePengadaan.E_PURCHASING }
      : moduleKey === "pemilihan"
        ? {
            metodePengadaan: {
              in: [
                PaketMetodePengadaan.TENDER,
                PaketMetodePengadaan.NON_TENDER,
              ],
            },
          }
        : {};
  const where: Prisma.PaketPengadaanWhereInput = {
    ...moduleWhere,
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

  const rows = await prisma.paketPengadaan.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const totalPagu = rows.reduce((total, item) => total + decimalNumber(item.pagu), 0);
  const totalHps = rows.reduce((total, item) => total + decimalNumber(item.hps), 0);
  const activeCount = rows.filter(
    (item) => !["SELESAI", "GAGAL", "BATAL"].includes(item.statusPaket),
  ).length;
  const problemCount = rows.filter((item) =>
    ["TERLAMBAT", "GAGAL", "BATAL"].includes(item.statusPaket),
  ).length;

  return {
    kpis: [
      {
        label: moduleKey === "katalog" ? "Total Katalog" : "Total Paket",
        value: rows.length.toLocaleString("id-ID"),
        helper: config.rightLabel,
        tone: "blue",
      },
      {
        label: "Total Pagu",
        value: formatCompactCurrency(totalPagu),
        helper: "Dari database paket",
        tone: "green",
      },
      {
        label: "Total HPS",
        value: formatCompactCurrency(totalHps),
        helper: "Dari database paket",
        tone: "orange",
      },
      {
        label: "Bermasalah",
        value: problemCount.toLocaleString("id-ID"),
        helper: `${activeCount.toLocaleString("id-ID")} paket aktif`,
        tone: "red",
      },
    ],
    table:
      moduleKey === "pemilihan"
        ? {
            columns: [
              "Kode Paket",
              "Nama Paket",
              "Unit",
              "Sumber Dana",
              "Metode",
              "Pagu",
              "HPS",
              "Status",
            ],
            rows: rows.map((item) => [
              item.kodePaket,
              item.namaPaket,
              item.unitPemohon,
              item.sumberDana,
              methodLabel(item.metodePengadaan),
              formatCompactCurrency(decimalNumber(item.pagu)),
              formatCompactCurrency(decimalNumber(item.hps)),
              humanize(item.statusPaket),
            ]),
          }
        : {
            columns: [
              "Kode Paket",
              "Nama Paket",
              "Unit",
              "Sumber Dana",
              "Metode",
              "Pagu",
              "HPS",
              "Status",
              "Aksi",
            ],
            rows: rows.map((item) => [
              item.kodePaket,
              item.namaPaket,
              item.unitPemohon,
              item.sumberDana,
              methodLabel(item.metodePengadaan),
              formatCompactCurrency(decimalNumber(item.pagu)),
              formatCompactCurrency(decimalNumber(item.hps)),
              humanize(item.statusPaket),
              "Detail",
            ]),
          },
  };
}

async function getDataBarangModuleData(config: PageConfig): Promise<ModuleData> {
  const rows = await prisma.dataBarang.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  const totalNilai = rows.reduce(
    (total, item) => total + decimalNumber(item.estimasiTotal),
    0,
  );
  const activeCount = rows.filter((item) => item.status === "AKTIF").length;
  const urgentCount = rows.filter((item) => item.prioritas === "MENDESAK").length;

  return {
    kpis: [
      {
        label: "Total Barang",
        value: rows.length.toLocaleString("id-ID"),
        helper: config.rightLabel,
        tone: "blue",
      },
      {
        label: "Estimasi Total",
        value: formatCompactCurrency(totalNilai),
        helper: "Dari database barang",
        tone: "green",
      },
      {
        label: "Aktif",
        value: activeCount.toLocaleString("id-ID"),
        helper: "Status aktif",
        tone: "orange",
      },
      {
        label: "Mendesak",
        value: urgentCount.toLocaleString("id-ID"),
        helper: "Prioritas mendesak",
        tone: "red",
      },
    ],
    table: {
      columns: [
        "Kode Barang",
        "Nama Barang",
        "Kategori",
        "Satuan",
        "Jumlah",
        "Estimasi",
        "Prioritas",
        "Status",
        "Aksi",
      ],
      rows: rows.map((item) => [
        item.kodeBarang,
        item.namaBarang,
        item.kategori,
        item.satuan,
        item.jumlahKebutuhan.toLocaleString("id-ID"),
        formatCompactCurrency(decimalNumber(item.estimasiTotal)),
        humanize(item.prioritas),
        humanize(item.status),
        "Detail",
      ]),
    },
  };
}

async function getKontrakModuleData(config: PageConfig): Promise<ModuleData> {
  const rows = await prisma.kontrak.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  const totalNilai = rows.reduce(
    (total, item) => total + decimalNumber(item.nilaiKontrak),
    0,
  );
  const activeCount = rows.filter((item) => item.status === "AKTIF").length;
  const problemCount = rows.filter((item) =>
    ["TERLAMBAT", "BATAL"].includes(item.status),
  ).length;

  return {
    kpis: [
      {
        label: "Total Kontrak",
        value: rows.length.toLocaleString("id-ID"),
        helper: config.rightLabel,
        tone: "blue",
      },
      {
        label: "Nilai Kontrak",
        value: formatCompactCurrency(totalNilai),
        helper: "Dari database kontrak",
        tone: "green",
      },
      {
        label: "Aktif",
        value: activeCount.toLocaleString("id-ID"),
        helper: "Kontrak berjalan",
        tone: "orange",
      },
      {
        label: "Perlu Tindak Lanjut",
        value: problemCount.toLocaleString("id-ID"),
        helper: "Terlambat/batal",
        tone: "red",
      },
    ],
    table: {
      columns: [
        "Nomor Kontrak",
        "Nama Paket",
        "Penyedia",
        "Nilai Kontrak",
        "Tanggal Kontrak",
        "Masa Berlaku",
        "Status",
        "Aksi",
      ],
      rows: rows.map((item) => [
        item.nomorKontrak,
        item.namaPaket,
        item.penyedia,
        formatCompactCurrency(decimalNumber(item.nilaiKontrak)),
        formatShortDate(item.tanggalKontrak),
        `${formatShortDate(item.tanggalMulai)} - ${formatShortDate(item.tanggalSelesai)}`,
        humanize(item.status),
        "Detail",
      ]),
    },
  };
}

async function getModuleData(
  moduleKey: string,
  config: PageConfig,
  searchParams: Record<string, string | string[] | undefined> = {},
): Promise<ModuleData> {
  if (moduleKey === "paket" || moduleKey === "katalog" || moduleKey === "pemilihan") {
    return getPackageModuleData(moduleKey, config, searchParams);
  }

  if (moduleKey === "data-barang") {
    return getDataBarangModuleData(config);
  }

  if (moduleKey === "kontrak") {
    return getKontrakModuleData(config);
  }

  const dashboard = await getDashboardData();

  if (moduleKey === "realisasi") {
    return {
      kpis: [
        {
          label: "Total Pagu",
          value: formatCompactCurrency(dashboard.summary.totalPagu),
          helper: "Dari database paket",
          tone: "blue",
        },
        {
          label: "Total HPS",
          value: formatCompactCurrency(dashboard.summary.totalHps),
          helper: "Dari database paket",
          tone: "green",
        },
        {
          label: "Nilai Kontrak",
          value: formatCompactCurrency(dashboard.summary.totalNilaiKontrak),
          helper: "Dari database kontrak bila tersedia",
          tone: "orange",
        },
        {
          label: "Serapan",
          value: `${dashboard.summary.realisasiKontrakPercent}%`,
          helper: "Terhadap pagu",
          tone: "red",
        },
      ],
      table: {
        columns: ["Sumber Dana", "Jumlah Paket", "Pagu", "Persentase", "Aksi"],
        rows: dashboard.sourceFunds.map((item) => [
          item.label,
          item.count.toLocaleString("id-ID"),
          formatCompactCurrency(item.amount),
          `${item.percent}%`,
          "Detail",
        ]),
      },
    };
  }

  if (moduleKey === "warning") {
    return {
      kpis: [
        {
          label: "Bermasalah",
          value: dashboard.summary.paketBermasalah.toLocaleString("id-ID"),
          helper: "Status paket risiko",
          tone: "red",
        },
        {
          label: "Deadline <7 Hari",
          value: dashboard.summary.deadlineDekat.toLocaleString("id-ID"),
          helper: "Dari rencana selesai",
          tone: "orange",
        },
        {
          label: "Terlambat",
          value: dashboard.summary.paketTerlambat.toLocaleString("id-ID"),
          helper: "Status terlambat",
          tone: "blue",
        },
        {
          label: "Total Paket",
          value: dashboard.summary.totalPaket.toLocaleString("id-ID"),
          helper: "Dari database paket",
          tone: "green",
        },
      ],
      table: {
        columns: ["Paket", "Unit", "Metode", "Pagu", "Status", "Aksi"],
        rows: dashboard.recentPackages
          .filter((item) => ["TERLAMBAT", "GAGAL", "BATAL"].includes(item.status))
          .map((item) => [
            item.name,
            item.unit,
            methodLabel(item.method),
            formatCompactCurrency(item.budget),
            humanize(item.status),
            "Detail",
          ]),
      },
    };
  }

  return {
    kpis: defaultKpis,
    table: emptyModuleTable(),
  };
}

async function PlanningModuleView({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const q = getParam(searchParams, "q")?.trim();
  const tahunAnggaran = getParam(searchParams, "tahunAnggaran");
  const sumberDana = getParam(searchParams, "sumberDana");
  const unitPengusul = getParam(searchParams, "unitPengusul");
  const statusSirup = getParam(searchParams, "statusSirup");

  const where = {
    ...(q
      ? {
          OR: [
            { kodeRup: { contains: q } },
            { namaPaket: { contains: q } },
            { unitPengusul: { contains: q } },
          ],
        }
      : {}),
    ...(tahunAnggaran ? { tahunAnggaran: Number(tahunAnggaran) } : {}),
    ...(sumberDana ? { sumberDana } : {}),
    ...(unitPengusul ? { unitPengusul } : {}),
    ...(statusSirup
      ? {
          statusSirup: statusSirup as
            | "BELUM_INPUT"
            | "PROSES_VERIFIKASI"
            | "MENUNGGU_PPTK"
            | "MENUNGGU_PPK"
            | "MENUNGGU_KPA_PA"
            | "SUDAH_TAYANG"
            | "REVISI_PAGU"
            | "DITARIK",
        }
      : {}),
  };

  const rupData = await prisma.rencanaUmumPengadaan.findMany({
    where,
    orderBy: [{ tahunAnggaran: "desc" }, { createdAt: "desc" }],
    take: 100,
  });
  const years = await prisma.rencanaUmumPengadaan.findMany({
    distinct: ["tahunAnggaran"],
    orderBy: { tahunAnggaran: "desc" },
    select: { tahunAnggaran: true },
  });
  const sourceFunds = await getActiveSumberDanaOptions();
  const units = await prisma.rencanaUmumPengadaan.findMany({
    distinct: ["unitPengusul"],
    orderBy: { unitPengusul: "asc" },
    select: { unitPengusul: true },
  });
  const totalPagu = rupData.reduce(
    (sum, item) => sum + decimalNumber(item.pagu),
    0,
  );
  const currentUser = await getCurrentUser();
  const currentUserRoles = currentUser?.roles ?? [];
  const draftCount = rupData.filter((item) => item.statusSirup === "BELUM_INPUT").length;
  const reviewCount = rupData.filter(
    (item) =>
      item.statusSirup === "PROSES_VERIFIKASI" ||
      item.statusSirup === "MENUNGGU_PPTK" ||
      item.statusSirup === "MENUNGGU_PPK" ||
      item.statusSirup === "MENUNGGU_KPA_PA",
  ).length;
  const revisionCount = rupData.filter((item) => item.statusSirup === "REVISI_PAGU").length;
  const readyCount = rupData.filter((item) => item.statusSirup === "SUDAH_TAYANG").length;
  const selectedProposal =
    rupData.find((item) => canActOnPlanningStatus(currentUserRoles, item.statusSirup)) ??
    rupData[0];
  const canActOnSelectedProposal = selectedProposal
    ? canActOnPlanningStatus(currentUserRoles, selectedProposal.statusSirup)
    : false;
  const selectedNextStatus = selectedProposal
    ? planningNextStatus[selectedProposal.statusSirup]
    : undefined;

  return (
    <main className="bg-[#f4f7f5]">
      <form className="border-b border-slate-200 bg-white px-4 py-3 sm:px-6 lg:px-8">
        <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[auto_minmax(132px,150px)_minmax(190px,220px)_minmax(132px,170px)] xl:grid-cols-[auto_minmax(132px,150px)_minmax(190px,220px)_minmax(132px,170px)_minmax(150px,180px)_minmax(240px,1fr)] xl:items-center">
            <span className="self-center text-sm font-black text-slate-400 sm:col-span-2 lg:col-span-1">
              Filter:
            </span>

            <select
              name="tahunAnggaran"
              defaultValue={tahunAnggaran ?? ""}
              className="h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-600 outline-none transition focus:border-[#08783f] focus:ring-2 focus:ring-emerald-100"
            >
              <option value="">Semua Tahun</option>
              {years.map((year) => (
                <option key={year.tahunAnggaran} value={year.tahunAnggaran}>
                  TA {year.tahunAnggaran}
                </option>
              ))}
            </select>

            <select
              name="sumberDana"
              defaultValue={sumberDana ?? ""}
              className="h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-600 outline-none transition focus:border-[#08783f] focus:ring-2 focus:ring-emerald-100"
            >
              <option value="">Semua Sumber Dana</option>
              {sourceFunds.map((item) => (
                <option key={item.kode} value={item.kode}>
                  {item.nama}
                </option>
              ))}
            </select>

            <select
              name="unitPengusul"
              defaultValue={unitPengusul ?? ""}
              className="h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-600 outline-none transition focus:border-[#08783f] focus:ring-2 focus:ring-emerald-100"
            >
              <option value="">Semua Unit</option>
              {units.map((item) => (
                <option key={item.unitPengusul} value={item.unitPengusul}>
                  {item.unitPengusul}
                </option>
              ))}
            </select>

            <select
              name="statusSirup"
              defaultValue={statusSirup ?? ""}
              className="h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-600 outline-none transition focus:border-[#08783f] focus:ring-2 focus:ring-emerald-100"
            >
              <option value="">Semua Status</option>
              <option value="BELUM_INPUT">Draft Usulan</option>
              <option value="PROSES_VERIFIKASI">Menunggu Kepala Unit</option>
              <option value="MENUNGGU_PPTK">Menunggu PPTK</option>
              <option value="MENUNGGU_PPK">Menunggu PPK</option>
              <option value="MENUNGGU_KPA_PA">Menunggu KPA/PA</option>
              <option value="REVISI_PAGU">Perlu Revisi</option>
              <option value="SUDAH_TAYANG">Siap RUP/SIRUP</option>
              <option value="DITARIK">Ditolak</option>
            </select>

            <label className="flex h-9 w-full items-center gap-2 rounded-full border border-slate-300 bg-slate-50 px-4 text-sm text-slate-500 focus-within:border-[#08783f] focus-within:ring-2 focus-within:ring-emerald-100 sm:col-span-2 lg:col-span-4 xl:col-span-1">
              <Search className="h-4 w-4" />
              <input
                name="q"
                defaultValue={q ?? ""}
                placeholder="Cari usulan pengadaan..."
                className="min-w-0 flex-1 bg-transparent font-semibold outline-none"
              />
            </label>
        </div>
      </form>

      <section className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Total Usulan",
              value: rupData.length.toLocaleString("id-ID"),
              helper: formatCurrency(totalPagu),
              tone: "border-l-[#1976d2]",
            },
            {
              label: "Draft Usulan",
              value: draftCount.toLocaleString("id-ID"),
              helper: "Belum diajukan unit",
              tone: "border-l-slate-400",
            },
            {
              label: "Menunggu Review",
              value: reviewCount.toLocaleString("id-ID"),
              helper: "Kepala Unit/PPTK/PPK/KPA",
              tone: "border-l-[#f57c00]",
            },
            {
              label: "Siap RUP/SIRUP",
              value: readyCount.toLocaleString("id-ID"),
              helper: revisionCount > 0 ? `${revisionCount} perlu revisi` : "Bisa dilanjutkan",
              tone: "border-l-[#43a047]",
            },
          ].map((item) => (
            <div
              key={item.label}
              className={`rounded-lg border border-slate-200 border-l-4 bg-white px-4 py-3 shadow-sm ${item.tone}`}
            >
              <p className="text-xs font-black uppercase text-slate-400">
                {item.label}
              </p>
              <p className="mt-2 text-2xl font-black text-[#16227c]">
                {item.value}
              </p>
              <p className="mt-1 text-xs font-bold text-slate-500">
                {item.helper}
              </p>
            </div>
          ))}
        </div>

        <div className="mb-5 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-[#08783f]" />
              <h2 className="text-lg font-black text-[#16227c]">
                Mekanisme Approval Perencanaan
              </h2>
            </div>
          </div>
          <div className="grid gap-3 p-5 lg:grid-cols-6">
            {planningApprovalFlow.map((step, index) => (
              <div
                key={step.label}
                className="relative rounded-lg border border-slate-200 bg-slate-50 p-4"
              >
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#08783f] text-xs font-black text-white">
                  {index + 1}
                </span>
                <p className="mt-3 text-sm font-black text-slate-900">
                  {step.label}
                </p>
                <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
                  {step.helper}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-2">
              <FileSearch className="h-5 w-5 shrink-0 text-[#08783f]" />
              <h1 className="truncate text-lg font-black text-[#16227c]">
                Perencanaan Pengadaan
              </h1>
            </div>

            <AddRupModalButton
              sumberDanaOptions={sourceFunds}
              label="Tambah Usulan"
              mode="planning"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[1080px] w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-black uppercase text-slate-400">
                  <th className="px-4 py-3">Kode RUP</th>
                  <th className="px-4 py-3">Nama Usulan</th>
                  <th className="px-4 py-3">Unit</th>
                  <th className="px-4 py-3">Sumber Dana</th>
                  <th className="px-4 py-3">Pagu</th>
                  <th className="px-4 py-3">Metode</th>
                  <th className="px-4 py-3">Jadwal</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rupData.length > 0 ? (
                  rupData.map((item) => (
                    <tr key={item.id} className="transition hover:bg-slate-50">
                      <td className="whitespace-nowrap px-4 py-4 font-mono text-xs font-bold text-slate-500">
                        {item.kodeRup}
                      </td>
                      <td className="max-w-[280px] px-4 py-4 font-black text-[#16227c]">
                        {item.namaPaket}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 font-semibold text-slate-600">
                        {item.unitPengusul}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${sourceFundClass(item.sumberDana)}`}
                        >
                          {item.sumberDana}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 font-semibold text-slate-600">
                        {formatCurrency(item.pagu.toString())}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 font-semibold text-slate-600">
                        {methodLabel(item.metodePengadaan)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 font-semibold text-slate-600">
                        {item.jadwalPemilihan || "-"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${planningStatusStyles[item.statusSirup] ?? "bg-slate-100 text-slate-600"}`}
                        >
                          {planningStatusLabels[item.statusSirup] ?? humanize(item.statusSirup)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-right">
                        <Link
                          href={`/rup/${item.id}`}
                          className="inline-flex h-9 items-center justify-center rounded-lg border border-emerald-200 bg-white px-4 text-sm font-black text-[#08783f] transition hover:bg-emerald-50"
                        >
                          Detail
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="px-4 py-16 text-center">
                      <FileSearch className="mx-auto h-14 w-14 text-slate-300" />
                      <p className="mt-4 text-base font-black text-slate-700">
                        Belum ada usulan perencanaan
                      </p>
                      <p className="mt-2 text-sm font-semibold text-slate-500">
                        Tambahkan usulan kebutuhan, KAK, HPS, sumber dana, dan jadwal pemilihan.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <FileCheck2 className="h-5 w-5 text-[#08783f]" />
              <h2 className="text-lg font-black text-[#16227c]">
                Dokumen Awal yang Dicek
              </h2>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {[
                "KAK / kerangka acuan kerja",
                "Spesifikasi teknis dan volume",
                "HPS dan referensi harga",
                "Sumber dana dan pagu",
                "Telaah TKDN/impor bila perlu",
                "Rancangan kontrak/SPK",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3"
                >
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-[#08783f]" />
                  <span className="text-sm font-bold text-slate-600">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <UsersRound className="h-5 w-5 text-[#08783f]" />
              <h2 className="text-lg font-black text-[#16227c]">
                Aksi Sesuai Role
              </h2>
            </div>
            <div className="mt-4 rounded-lg bg-slate-50 p-4">
              <p className="text-xs font-black uppercase text-slate-400">
                Usulan aktif
              </p>
              <p className="mt-2 text-sm font-black text-[#16227c]">
                {selectedProposal?.namaPaket ?? "Belum ada usulan"}
              </p>
              <p className="mt-1 text-xs font-bold text-slate-500">
                Status:{" "}
                {selectedProposal
                  ? planningStatusLabels[selectedProposal.statusSirup] ??
                    humanize(selectedProposal.statusSirup)
                  : "-"}
              </p>
              <p className="mt-1 text-xs font-bold text-slate-500">
                Role login:{" "}
                {currentUserRoles.length > 0
                  ? currentUserRoles.map((role) => roleWorkflowMatrix.find((item) => item.code === role)?.name ?? role).join(", ")
                  : "-"}
              </p>
              {selectedProposal && !canActOnSelectedProposal ? (
                <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs font-bold leading-5 text-amber-700">
                  Akun ini belum bisa approve status ini. Pilih usulan yang sedang menunggu role login.
                </p>
              ) : null}
            </div>
            <form action={updatePlanningApprovalAction} className="mt-4 grid gap-2">
              <input type="hidden" name="id" value={selectedProposal?.id ?? ""} />
              <button
                name="action"
                value="approve"
                disabled={!canActOnSelectedProposal}
                className="h-10 rounded-lg bg-[#08783f] px-4 text-sm font-black text-white transition hover:bg-[#066532] disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {selectedNextStatus
                  ? `Approve ke ${planningStatusLabels[selectedNextStatus]}`
                  : "Ajukan / Approve Tahap Ini"}
              </button>
              <button
                name="action"
                value="revise"
                disabled={!canActOnSelectedProposal}
                className="h-10 rounded-lg border border-amber-200 bg-amber-50 px-4 text-sm font-black text-amber-700 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
              >
                Minta Revisi
              </button>
              <button
                name="action"
                value="reject"
                disabled={!canActOnSelectedProposal}
                className="h-10 rounded-lg border border-red-200 bg-red-50 px-4 text-sm font-black text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
              >
                Tolak Usulan
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}

function tableCellContent(column: string, value: string, rowIndex: number): ReactNode {
  const normalizedColumn = column.toLowerCase();
  const normalizedValue = value.toLowerCase();

  if (normalizedColumn === "aksi") {
    return (
      <button
        type="button"
        className="inline-flex h-8 items-center justify-center rounded-md border border-emerald-200 bg-white px-3 text-xs font-black text-[#08783f] transition hover:bg-emerald-50"
      >
        {value}
      </button>
    );
  }

  if (
    normalizedColumn.includes("status") ||
    normalizedColumn.includes("bayar") ||
    normalizedColumn.includes("level") ||
    normalizedColumn.includes("penetapan") ||
    normalizedColumn.includes("evaluasi")
  ) {
    const className =
      normalizedValue.includes("selesai") ||
      normalizedValue.includes("terbit") ||
      normalizedValue.includes("lunas") ||
      normalizedValue.includes("lengkap") ||
      normalizedValue.includes("siap") ||
      normalizedValue.includes("sudah")
        ? "bg-emerald-100 text-emerald-700"
        : normalizedValue.includes("belum") ||
            normalizedValue.includes("proses") ||
            normalizedValue.includes("sedang") ||
            normalizedValue.includes("kurang") ||
            normalizedValue.includes("perlu")
          ? "bg-amber-100 text-amber-700"
          : normalizedValue.includes("tinggi") ||
              normalizedValue.includes("tidak") ||
              normalizedValue.includes("masalah")
            ? "bg-red-100 text-red-700"
            : "bg-slate-100 text-slate-600";

    return (
      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${className}`}>
        {value}
      </span>
    );
  }

  if (normalizedColumn.includes("nama") || normalizedColumn.includes("paket")) {
    return (
      <span className="font-black text-[#16227c]">
        {value || `Data ${rowIndex + 1}`}
      </span>
    );
  }

  return value;
}

function ModuleAction({
  config,
  moduleKey,
  pageKey,
}: {
  config: PageConfig;
  moduleKey: string;
  pageKey: string;
}) {
  if (pageKey === "data-barang") return <AddDataBarangModalButton />;
  if (pageKey === "kontrak") return <AddKontrakModalButton />;
  if (moduleKey === "pemilihan") return null;
  if (pageKey === "paket" || moduleKey === "katalog") {
    return <AddPaketModalButton />;
  }
  if (config.primaryAction) {
    return (
      <GenericInputModalButton
        label={config.primaryAction.label}
        moduleName={config.title}
      />
    );
  }

  return null;
}

function roleTone(code: string) {
  return (
    roleWorkflowMatrix.find((item) => item.code === code)?.tone ??
    "bg-slate-100 text-slate-600"
  );
}

async function AdminUsersView() {
  const [users, roles] = await Promise.all([
    prisma.user.findMany({
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
      orderBy: [{ status: "asc" }, { name: "asc" }],
      take: 100,
    }),
    prisma.role.findMany({
      include: {
        _count: {
          select: {
            users: true,
          },
        },
      },
      orderBy: { name: "asc" },
    }),
  ]);
  const activeCount = users.filter((user) => user.status === "ACTIVE").length;
  const inactiveCount = users.length - activeCount;
  const multiRoleCount = users.filter((user) => user.roles.length > 1).length;
  const approvalRoleCount = roles.filter((role) =>
    ["PA", "KPA", "PPK", "PROCUREMENT_OFFICER", "SELECTION_WORKGROUP", "UKPBJ"].includes(
      role.code,
    ),
  ).length;

  return (
    <main className="bg-[#f4f7f5] px-4 py-6 sm:px-6 lg:px-8">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Total User",
            value: users.length.toLocaleString("id-ID"),
            helper: `${activeCount} aktif`,
            tone: "border-l-[#1976d2]",
          },
          {
            label: "Role Terdaftar",
            value: roles.length.toLocaleString("id-ID"),
            helper: `${approvalRoleCount} role workflow`,
            tone: "border-l-[#43a047]",
          },
          {
            label: "Multi Role",
            value: multiRoleCount.toLocaleString("id-ID"),
            helper: "User punya lebih dari 1 role",
            tone: "border-l-[#f57c00]",
          },
          {
            label: "Nonaktif",
            value: inactiveCount.toLocaleString("id-ID"),
            helper: "Akses dinonaktifkan",
            tone: "border-l-[#e53935]",
          },
        ].map((item) => (
          <div
            key={item.label}
            className={`rounded-lg border border-slate-200 border-l-4 bg-white px-5 py-4 shadow-sm ${item.tone}`}
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

      <section className="mt-5 grid gap-5 xl:grid-cols-[1.35fr_.65fr]">
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <UsersRound className="h-5 w-5 text-[#08783f]" />
              <h2 className="text-lg font-black text-[#16227c]">
                Manajemen User & Role
              </h2>
            </div>
            <GenericInputModalButton label="Tambah User" moduleName="Manajemen User" />
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[980px] w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-black uppercase text-slate-400">
                  <th className="px-4 py-3">Nama</th>
                  <th className="px-4 py-3">Jabatan</th>
                  <th className="px-4 py-3">Unit Kerja</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Login Terakhir</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.length > 0 ? (
                  users.map((user) => (
                    <tr key={user.id} className="transition hover:bg-slate-50">
                      <td className="px-4 py-4">
                        <p className="font-black text-[#16227c]">{user.name}</p>
                        <p className="mt-1 text-xs font-semibold text-slate-400">
                          {user.email}
                        </p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 font-semibold text-slate-600">
                        {user.jabatan || "-"}
                      </td>
                      <td className="max-w-[220px] px-4 py-4 font-semibold text-slate-600">
                        {user.unitKerja || "-"}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex max-w-[280px] flex-wrap gap-2">
                          {user.roles.length > 0 ? (
                            user.roles.map((userRole) => (
                              <span
                                key={userRole.role.id}
                                className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${roleTone(userRole.role.code)}`}
                              >
                                {userRole.role.name}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs font-bold text-slate-400">
                              Belum ada role
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${
                            user.status === "ACTIVE"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {user.status === "ACTIVE" ? "Aktif" : "Nonaktif"}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 font-semibold text-slate-600">
                        {formatShortDate(user.lastLoginAt)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-right">
                        <Link
                          href={`/admin/users/${user.id}`}
                          className="inline-flex h-9 items-center justify-center rounded-lg border border-emerald-200 bg-white px-4 text-sm font-black text-[#08783f] transition hover:bg-emerald-50"
                        >
                          Detail
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-4 py-16 text-center">
                      <UsersRound className="mx-auto h-14 w-14 text-slate-300" />
                      <p className="mt-4 text-base font-black text-slate-700">
                        Belum ada user
                      </p>
                      <p className="mt-2 text-sm font-semibold text-slate-500">
                        Tambahkan user untuk menentukan role dan akses modul.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-[#08783f]" />
            <h2 className="text-lg font-black text-[#16227c]">
              Role Approval Perencanaan
            </h2>
          </div>
          <div className="mt-4 space-y-3">
            {[
              ["1", "Unit/Operator", "Input kebutuhan sebagai Draft Usulan"],
              ["2", "Kepala Unit", "Validasi kebutuhan unit"],
              ["3", "PPTK", "Verifikasi kegiatan dan anggaran"],
              ["4", "PPK", "Review teknis pengadaan"],
              ["5", "KPA/PA", "Approval akhir sebelum RUP/SIRUP"],
              ["6", "Admin LPSE", "Input atau sinkron ke SIRUP"],
            ].map(([number, label, helper]) => (
              <div
                key={number}
                className="flex gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#08783f] text-xs font-black text-white">
                  {number}
                </span>
                <div>
                  <p className="text-sm font-black text-slate-900">{label}</p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
                    {helper}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <Link
            href="/admin/roles"
            className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 px-4 text-sm font-black text-[#08783f] transition hover:bg-emerald-100"
          >
            Lihat Detail Role
          </Link>
        </div>
      </section>
    </main>
  );
}

async function AdminRolesView() {
  const [roles, users] = await Promise.all([
    prisma.role.findMany({
      include: {
        _count: {
          select: {
            users: true,
          },
        },
      },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
      orderBy: [{ status: "asc" }, { name: "asc" }],
      take: 100,
    }),
  ]);
  const roleByCode = new Map(roles.map((role) => [role.code, role]));
  const roleUsers = users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    jabatan: user.jabatan,
    unitKerja: user.unitKerja,
    status: user.status,
    roles: user.roles.map((userRole) => ({
      id: userRole.role.id,
      code: userRole.role.code,
      name: userRole.role.name,
    })),
  }));

  return (
    <main className="bg-[#f4f7f5] px-4 py-6 sm:px-6 lg:px-8">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-[#08783f]" />
              <h2 className="text-lg font-black text-[#16227c]">
                Struktur User Role Sistem
              </h2>
            </div>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-500">
              Role dipakai untuk menentukan siapa yang boleh input, review,
              approve, menjalankan pengadaan, melihat audit, dan mengelola
              administrasi sistem.
            </p>
          </div>
          <RoleCreateModalButton users={roleUsers} />
        </div>
      </section>

      <section className="mt-5 grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
        {roleWorkflowMatrix.map((role) => (
          <div
            key={role.code}
            className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${role.tone}`}
              >
                {role.name}
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
                {roleByCode.get(role.code)?._count.users ?? 0} user
              </span>
            </div>
            <h3 className="mt-4 text-base font-black text-slate-950">
              {role.actor}
            </h3>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
              {role.accessScope}
            </p>
            <div className="mt-4 grid gap-2 border-t border-slate-100 pt-4 text-xs font-bold text-slate-500">
              <div className="flex justify-between gap-3">
                <span>Tahap</span>
                <span className="text-right text-slate-800">{role.approvalStep}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span>Modul</span>
                <span className="text-right text-slate-800">{role.modules}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span>Kode</span>
                <span className="text-right font-mono text-slate-800">{role.code}</span>
              </div>
            </div>
            <div className="mt-4 border-t border-slate-100 pt-4">
              <p className="text-xs font-black uppercase text-slate-400">
                Grant Access
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {role.grants.map((grant) => (
                  <span
                    key={`${role.code}-${grant}`}
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-black text-slate-600"
                  >
                    {grant}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </section>

      <section className="mt-5 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-lg font-black text-[#16227c]">
            Matriks Role & Akses Modul
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[980px] w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-black uppercase text-slate-400">
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Aktor</th>
                <th className="px-4 py-3">Tahap Workflow</th>
                <th className="px-4 py-3">Akses Utama</th>
                <th className="px-4 py-3">Grant Access</th>
                <th className="px-4 py-3">User</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {roleWorkflowMatrix.map((role) => (
                <tr key={role.code} className="transition hover:bg-slate-50">
                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${role.tone}`}
                    >
                      {role.name}
                    </span>
                    <p className="mt-1 font-mono text-xs font-bold text-slate-400">
                      {role.code}
                    </p>
                  </td>
                  <td className="px-4 py-4 font-semibold text-slate-700">
                    {role.actor}
                  </td>
                  <td className="px-4 py-4 font-semibold text-slate-600">
                    {role.approvalStep}
                  </td>
                  <td className="max-w-[360px] px-4 py-4 font-semibold leading-6 text-slate-600">
                    {role.accessScope}
                  </td>
                  <td className="min-w-[260px] px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      {role.grants.map((grant) => (
                        <span
                          key={`${role.code}-matrix-${grant}`}
                          className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-600"
                        >
                          {grant}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 font-black text-[#16227c]">
                    {roleByCode.get(role.code)?._count.users ?? 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

async function ModuleListView({
  config,
  moduleKey,
  pageKey,
  searchParams = {},
}: {
  config: PageConfig;
  moduleKey: string;
  pageKey: string;
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const { kpis, table } = await getModuleData(moduleKey, config, searchParams);
  const q = getParam(searchParams, "q") ?? "";
  const tahunAnggaran = getParam(searchParams, "tahunAnggaran") ?? "";
  const sumberDana = getParam(searchParams, "sumberDana") ?? "";
  const unitPemohon = getParam(searchParams, "unitPemohon") ?? "";
  const statusPaket = getParam(searchParams, "statusPaket") ?? "";
  const years =
    moduleKey === "paket" || moduleKey === "katalog" || moduleKey === "pemilihan"
      ? await prisma.paketPengadaan.findMany({
          distinct: ["tahunAnggaran"],
          orderBy: { tahunAnggaran: "desc" },
          select: { tahunAnggaran: true },
        })
      : [];
  const sourceFunds =
    moduleKey === "paket" || moduleKey === "katalog" || moduleKey === "pemilihan"
      ? await getActiveSumberDanaOptions()
      : [];
  const units =
    moduleKey === "paket" || moduleKey === "katalog" || moduleKey === "pemilihan"
      ? await prisma.paketPengadaan.findMany({
          distinct: ["unitPemohon"],
          orderBy: { unitPemohon: "asc" },
          select: { unitPemohon: true },
        })
      : [];
  const statuses =
    moduleKey === "paket" || moduleKey === "katalog" || moduleKey === "pemilihan"
      ? await prisma.paketPengadaan.findMany({
          distinct: ["statusPaket"],
          orderBy: { statusPaket: "asc" },
          select: { statusPaket: true },
        })
      : moduleKey === "kontrak"
        ? await prisma.kontrak.findMany({
            distinct: ["status"],
            orderBy: { status: "asc" },
            select: { status: true },
          })
      : [];
  const showKpis = moduleKey !== "pemilihan";

  return (
    <main className="bg-[#f4f7f5]">
      <form className="border-b border-slate-200 bg-white px-4 py-2 sm:px-6 lg:px-8">
        <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[auto_minmax(120px,140px)_minmax(190px,220px)_minmax(140px,180px)] xl:grid-cols-[auto_minmax(120px,140px)_minmax(190px,220px)_minmax(140px,180px)_minmax(150px,180px)_minmax(240px,1fr)] xl:items-center">
            <span className="self-center text-sm font-black text-slate-400 sm:col-span-2 lg:col-span-1">
              Filter:
            </span>
            <select
              name="tahunAnggaran"
              defaultValue={tahunAnggaran}
              className="h-8 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-600"
            >
              <option value="">Semua Tahun</option>
              {years.map((year) => (
                <option key={year.tahunAnggaran} value={year.tahunAnggaran}>
                  TA {year.tahunAnggaran}
                </option>
              ))}
            </select>
            <select
              name="sumberDana"
              defaultValue={sumberDana}
              className="h-8 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-600"
            >
              <option value="">Semua Sumber Dana</option>
              {sourceFunds.map((item) => (
                <option key={item.kode} value={item.kode}>
                  {item.nama}
                </option>
              ))}
            </select>
            <select
              name="unitPemohon"
              defaultValue={unitPemohon}
              className="h-8 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-600"
            >
              <option value="">Semua Unit</option>
              {units.map((item) => (
                <option key={item.unitPemohon} value={item.unitPemohon}>
                  {item.unitPemohon}
                </option>
              ))}
            </select>
            <select
              name="statusPaket"
              defaultValue={statusPaket}
              className="h-8 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-600"
            >
              <option value="">Semua Status</option>
              {statuses.map((item) => (
                <option
                  key={"statusPaket" in item ? item.statusPaket : item.status}
                  value={"statusPaket" in item ? item.statusPaket : item.status}
                >
                  {humanize("statusPaket" in item ? item.statusPaket : item.status)}
                </option>
              ))}
            </select>
            <label className="flex h-8 min-w-0 items-center gap-2 rounded-full border border-slate-300 bg-slate-50 px-4 text-sm text-slate-500 sm:col-span-2 lg:col-span-4 xl:col-span-1">
              <Search className="h-4 w-4" />
              <input
                name="q"
                defaultValue={q}
                placeholder="Cari paket pengadaan..."
                className="min-w-0 flex-1 bg-transparent font-semibold outline-none"
              />
            </label>
        </div>
      </form>

      <div className="space-y-4 px-4 py-5 sm:px-6 lg:px-8">
        {showKpis ? (
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
                {item.helper ? (
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    {item.helper}
                  </p>
                ) : null}
              </div>
            ))}
          </section>
        ) : null}

        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-2">
              <config.icon className="h-5 w-5 shrink-0 text-[#16227c]" />
              <h2 className="truncate text-lg font-black text-[#16227c]">
                {moduleKey === "katalog"
                  ? "Daftar Paket e-Katalog V6 & V5"
                  : config.title}
              </h2>
            </div>
            <ModuleAction config={config} moduleKey={moduleKey} pageKey={pageKey} />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-black uppercase text-slate-400">
                  {table.columns.map((column) => (
                    <th
                      key={column}
                      className={`px-4 py-3 ${column === "Aksi" ? "text-right" : ""}`}
                    >
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {table.rows.length > 0 ? (
                  table.rows.map((row, rowIndex) => (
                    <tr key={`${row[0]}-${rowIndex}`} className="hover:bg-slate-50">
                      {table.columns.map((column, columnIndex) => (
                        <td
                          key={`${column}-${columnIndex}`}
                          className={`whitespace-nowrap px-4 py-3 font-semibold text-slate-600 ${
                            column === "Aksi" ? "text-right" : ""
                          }`}
                        >
                          {tableCellContent(column, row[columnIndex] ?? "-", rowIndex)}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={table.columns.length}
                      className="px-4 py-16 text-center text-sm font-semibold text-slate-500"
                    >
                      Data {config.title.toLowerCase()} belum tersedia di database.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

function ProcurementStages({
  dashboard,
  tahap,
}: {
  dashboard: DashboardData;
  tahap?: string;
}) {
  const content = getTahapContent(tahap);
  const { summary } = dashboard;
  const selesaiCount =
    dashboard.stages.find((item) => item.label === "Selesai")?.count ?? 0;
  const pemilihanCount =
    dashboard.stages.find((item) => item.label === "Pemilihan")?.count ?? 0;
  const kontrakCount =
    dashboard.stages.find((item) => item.label === "Kontrak")?.count ?? 0;
  const perencanaanCount =
    dashboard.stages.find((item) => item.label === "Perencanaan")?.count ?? 0;
  const aktifCount = Math.max(summary.totalPaket - selesaiCount, 0);
  const kpiCards = [
    {
      label: "Total data",
      value: summary.totalPaket.toLocaleString("id-ID"),
      helper: `TA ${summary.tahunAnggaran}`,
      icon: ClipboardList,
    },
    {
      label: "Nilai total",
      value: formatCompactCurrency(summary.totalPagu),
      helper: "Total pagu paket",
      icon: CircleDollarSign,
    },
    {
      label: "Aktif",
      value: aktifCount.toLocaleString("id-ID"),
      helper: "Belum selesai",
      icon: CheckCircle2,
    },
    {
      label: "Perlu tindak lanjut",
      value: (summary.paketBermasalah + summary.deadlineDekat).toLocaleString("id-ID"),
      helper: "Risiko/deadline dekat",
      icon: AlertTriangle,
    },
  ];

  const stages = [
    {
      title: "Perencanaan & RUP",
      description: "Input kebutuhan, kode RUP, sumber dana, pagu, HPS, dan jadwal pemilihan.",
      count: perencanaanCount,
      icon: Landmark,
      href: "/rup",
      tone: "bg-emerald-50 text-[#08783f] border-emerald-200",
    },
    {
      title: "Persiapan Pengadaan",
      description: "Lengkapi KAK, spesifikasi teknis, HPS, TKDN, dan dokumen persiapan.",
      count: perencanaanCount,
      icon: FileSearch,
      href: "/pengadaan/perencanaan",
      tone: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    {
      title: "Pemilihan Penyedia",
      description: "Proses e-katalog, tender, non tender, evaluasi, dan negosiasi.",
      count: pemilihanCount + summary.paketEKatalogV6 + summary.paketTenderNonTender,
      icon: ShoppingCart,
      href: "/pengadaan/pemilihan",
      tone: "bg-amber-50 text-amber-700 border-amber-200",
    },
    {
      title: "Hasil Pemilihan",
      description: "Penetapan pemenang, SPPBJ, harga nego, dan kesiapan surat pesanan.",
      count: kontrakCount,
      icon: ShieldCheck,
      href: "/kontrak",
      tone: "bg-violet-50 text-violet-700 border-violet-200",
    },
    {
      title: "Kontrak & Pelaksanaan",
      description: "SP/SPK, masa kontrak, pengiriman, progres fisik, dan kendala pelaksanaan.",
      count: kontrakCount,
      icon: FileCheck2,
      href: "/progres",
      tone: "bg-teal-50 text-teal-700 border-teal-200",
    },
    {
      title: "Serah Terima & Realisasi",
      description: "BAST/BAPB, pemeriksaan barang, pembayaran, dan penutupan paket.",
      count: selesaiCount,
      icon: Handshake,
      href: "/serah-terima",
      tone: "bg-slate-50 text-slate-700 border-slate-200",
    },
  ];

  return (
    <main className="bg-[#f4f7f5] px-4 py-6 sm:px-6 lg:px-8">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-[#08783f] text-white shadow-sm">
              <PackageSearch className="h-7 w-7" strokeWidth={2.2} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#08783f]">
                {content.eyebrow}
              </p>
              <h2 className="mt-1 text-2xl font-black text-slate-950">
                {content.title}
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                {content.subtitle}
              </p>
            </div>
          </div>

          <AddPaketModalButton />
        </div>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.label}
              className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-slate-500">{card.label}</p>
                  <p className="mt-3 text-3xl font-black text-slate-950">
                    {card.value}
                  </p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-[#08783f]">
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-3 text-xs font-semibold text-slate-500">
                {card.helper}
              </p>
            </div>
          );
        })}
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
        {stages.map((stage, index) => {
          const Icon = stage.icon;

          return (
            <Link
              key={stage.title}
              href={stage.href}
              className="group rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-lg border ${stage.tone}`}>
                  <Icon className="h-6 w-6" strokeWidth={2.3} />
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
                  Tahap {index + 1}
                </span>
              </div>
              <h3 className="mt-4 text-lg font-black text-slate-950">
                {stage.title}
              </h3>
              <p className="mt-2 min-h-12 text-sm font-semibold leading-6 text-slate-500">
                {stage.description}
              </p>
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                <span className="text-sm font-black text-slate-900">
                  {stage.count.toLocaleString("id-ID")} paket
                </span>
                <ArrowUpRight className="h-4 w-4 text-slate-400 transition group-hover:text-[#08783f]" />
              </div>
            </Link>
          );
        })}
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-5">
            <p className="text-[11px] font-black uppercase text-[#08783f]">
              Paket Pengadaan Terkini
            </p>
            <h2 className="mt-1 text-xl font-black text-slate-950">
              Posisi paket di tahapan
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-[760px] w-full border-collapse text-left text-sm">
              <thead className="bg-slate-50 text-xs font-black uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3">Kode</th>
                  <th className="px-5 py-3">Nama Paket</th>
                  <th className="px-5 py-3">Metode</th>
                  <th className="px-5 py-3">Pagu</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dashboard.recentPackages.length > 0 ? (
                  dashboard.recentPackages.map((item) => (
                    <tr key={item.code} className="hover:bg-slate-50">
                      <td className="px-5 py-4 font-black text-slate-800">
                        {item.code}
                      </td>
                      <td className="px-5 py-4 font-bold text-slate-900">
                        {item.name}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {humanize(item.method)}
                      </td>
                      <td className="px-5 py-4 font-bold text-slate-800">
                        {formatCompactCurrency(item.budget)}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-black ${statusClass(item.status)}`}
                        >
                          {humanize(item.status)}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-8 text-center text-sm font-semibold text-slate-500"
                    >
                      Belum ada paket pengadaan dari database.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-[11px] font-black uppercase text-[#08783f]">
            Timeline Pengadaan
          </p>
          <h2 className="mt-1 text-xl font-black text-slate-950">
            Alur dari RUP sampai realisasi
          </h2>
          <div className="mt-5 space-y-4">
            {dashboard.timeline.map((item) => (
              <div key={item.label} className="relative pl-8">
                <div className="absolute left-0 top-1.5 h-3 w-3 rounded-full bg-[#08783f] ring-4 ring-emerald-100" />
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-slate-900">
                      {item.label}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      {item.period}
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-700">
                    {item.count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

export default async function ProcurementModulePage({
  pageKey,
  tahap,
  searchParams = {},
}: ProcurementModulePageProps) {
  const config = resolveConfig(pageKey);
  const isProcurementStage = config.title === "Tahapan Pengadaan";

  if (pageKey === "admin-users" || pageKey === "admin-users-tambah" || pageKey === "admin-users-detail") {
    return (
      <>
        <AppHeader
          title="User Role"
          subtitle="Administrasi › User & Role"
          rightLabel="Admin"
        />
        <AdminUsersView />
      </>
    );
  }

  if (pageKey === "admin-roles") {
    return (
      <>
        <AppHeader
          title="Role & Hak Akses"
          subtitle="Administrasi › Role"
          rightLabel="Admin"
        />
        <AdminRolesView />
      </>
    );
  }

  if (isProcurementStage) {
    const content = getTahapContent(tahap);

    if (tahap === "perencanaan") {
      return (
        <>
          <AppHeader
            title={content.title}
            subtitle="UKPBJ › Perencanaan"
            rightLabel={config.rightLabel}
          />
          <PlanningModuleView searchParams={searchParams} />
        </>
      );
    }

    if (tahap === "pemilihan") {
      return (
        <>
          <AppHeader
            title={content.title}
            subtitle="UKPBJ › Tender"
            rightLabel={config.rightLabel}
          />
          <ModuleListView
            config={{ ...config, title: content.title, subtitle: content.subtitle }}
            moduleKey="pemilihan"
            pageKey={pageKey}
            searchParams={searchParams}
          />
        </>
      );
    }

    const dashboard = await getDashboardData();

    return (
      <>
        <AppHeader
          title={content.title}
          subtitle={content.subtitle}
          rightLabel={config.rightLabel}
        />
        <ProcurementStages dashboard={dashboard} tahap={tahap} />
      </>
    );
  }

  return (
    <>
      <AppHeader
        title={config.title}
        subtitle={`UKPBJ › ${config.title.replace("e-", "").replace(" & ", " / ")}`}
        rightLabel={config.rightLabel}
      />

      <ModuleListView
        config={config}
        moduleKey={getModuleKey(pageKey)}
        pageKey={pageKey}
      />
    </>
  );
}
