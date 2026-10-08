import { unstable_cache } from "next/cache";
import type { PaketMetodePengadaan, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type DashboardFilters = {
  tahunAnggaran?: number;
  unit?: string;
  sumberDana?: string;
  metodePengadaan?: string;
  statusPaket?: string;
};

export type DashboardStage = {
  key: string;
  label: string;
  count: number;
  percent: number;
  color: string;
  tone: "done" | "active" | "warning" | "danger" | "pending";
  dominant: boolean;
};

export type DashboardBreakdown = {
  label: string;
  count: number;
  amount: number;
  percent: number;
};

export type DashboardAttention = {
  label: string;
  count: number;
  href?: string;
  tone: "amber" | "green" | "red" | "blue";
};

export type DashboardMonthlyFinancial = {
  month: string;
  pagu: number;
  kontrak: number;
  realisasi: number;
};

export type DashboardMonthlyRealization = {
  month: string;
  pagu: number;
  realisasi: number;
};

export type DashboardRecentPackage = {
  code: string;
  name: string;
  unit: string;
  method: string;
  budget: number;
  absorptionPercent: number | null;
  status: string;
};

export type DashboardTimelineItem = {
  label: string;
  period: string;
  count: number;
  status: "done" | "active" | "warning" | "danger" | "pending";
};

export type DashboardAuditReadiness = {
  percent: number;
  items: {
    label: string;
    complete: number;
    total: number;
    tone: "green" | "amber" | "red";
  }[];
};

export type DashboardDeadline = {
  dateLabel: string;
  title: string;
  helper: string;
  daysLeft: number;
  href?: string;
};

export type DashboardActivity = {
  time: string;
  title: string;
  description: string;
  href?: string;
};

export type DashboardActivityActor = {
  label: string;
  count: number;
  percent: number;
};

export type DashboardFilterOption = {
  value: string;
  label: string;
};

export type DashboardData = {
  filters: Required<Pick<DashboardFilters, "tahunAnggaran">> & DashboardFilters;
  filterOptions: {
    years: number[];
    units: DashboardFilterOption[];
    sources: DashboardFilterOption[];
    methods: DashboardFilterOption[];
    statuses: DashboardFilterOption[];
  };
  summary: {
    totalPaket: number;
    totalPaketBarangKesehatan: number;
    totalPagu: number;
    totalHps: number;
    totalNilaiKontrak: number;
    totalRealisasi: number;
    totalBarang: number;
    totalPdn: number;
    paketTerlambat: number;
    deadlineDekat: number;
    paketBerjalan: number;
    paketSelesai: number;
    paketBermasalah: number;
    paketEKatalogV6: number;
    paketTenderNonTender: number;
    realisasiPercent: number;
    realisasiKontrakPercent: number;
    selesaiPercent: number;
    tahunAnggaran: number;
  };
  stages: DashboardStage[];
  attentionItems: DashboardAttention[];
  monthlyFinancials: DashboardMonthlyFinancial[];
  unitBreakdown: DashboardBreakdown[];
  sourceFunds: DashboardBreakdown[];
  methods: DashboardBreakdown[];
  statuses: DashboardBreakdown[];
  efficiency: {
    eligibleCount: number;
    totalPagu: number;
    totalFinal: number;
    totalSaving: number;
    savingRate: number;
  };
  deadlines: DashboardDeadline[];
  activities: DashboardActivity[];
  activityActors: DashboardActivityActor[];
  categories: DashboardBreakdown[];
  priorities: {
    title: string;
    unit: string;
    status: string;
    due: string;
    tone: "amber" | "green" | "red";
  }[];
  recentPackages: DashboardRecentPackage[];
  monthlyRealization: DashboardMonthlyRealization[];
  timeline: DashboardTimelineItem[];
  auditReadiness: DashboardAuditReadiness;
};

const monthLabels = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

const procurementStages = [
  { key: "planning", label: "Perencanaan", tone: "pending", color: "bg-slate-400" },
  { key: "verification", label: "Verifikasi", tone: "active", color: "bg-sky-500" },
  { key: "rup", label: "RUP", tone: "active", color: "bg-[#08783f]" },
  { key: "selection", label: "Pemilihan Penyedia", tone: "warning", color: "bg-amber-500" },
  { key: "contract", label: "Kontrak / SP", tone: "active", color: "bg-emerald-600" },
  { key: "delivery", label: "Pengiriman", tone: "warning", color: "bg-orange-500" },
  { key: "bast", label: "Pemeriksaan / BAST", tone: "active", color: "bg-teal-500" },
  { key: "payment", label: "Pembayaran", tone: "active", color: "bg-blue-500" },
  { key: "done", label: "Selesai", tone: "done", color: "bg-slate-700" },
] as const;

type RupRow = Prisma.RencanaUmumPengadaanGetPayload<Record<string, never>>;

function toNumber(value: unknown) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  if (
    value &&
    typeof value === "object" &&
    "toString" in value &&
    typeof value.toString === "function"
  ) {
    const parsed = Number(value.toString());
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function normalizeText(value?: string | null) {
  return value?.trim().toUpperCase() ?? "";
}

function humanize(value: string) {
  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function isFilled(value?: string | null) {
  const normalized = value?.trim();
  return Boolean(normalized && normalized !== "-");
}

function textIncludes(value: string | null | undefined, words: string[]) {
  const normalized = normalizeText(value);
  return words.some((word) => normalized.includes(word));
}

function validAmount(value: unknown) {
  const amount = toNumber(value);
  return amount > 0 ? amount : null;
}

function getFinalValue(row: RupRow) {
  return (
    validAmount(row.hargaNegosiasiKatalog) ??
    validAmount(row.hargaPenawaranKatalog) ??
    validAmount(row.nilaiPembayaran) ??
    null
  );
}

function parseLooseDate(value?: string | Date | null) {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;

  const normalized = value.trim();
  if (!normalized) return null;

  const iso = normalized.match(/\d{4}-\d{2}-\d{2}/)?.[0];
  if (iso) {
    const date = new Date(`${iso}T00:00:00`);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function daysBetween(start: Date, end: Date) {
  const startDate = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const endDate = new Date(end.getFullYear(), end.getMonth(), end.getDate());

  return Math.ceil((endDate.getTime() - startDate.getTime()) / 86_400_000);
}

function formatTime(value: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(value);
}

function formatDateLabel(value: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
  }).format(value);
}

function getProcurementStage(row: RupRow): (typeof procurementStages)[number]["key"] {
  if (
    textIncludes(row.statusTransaksiKatalog, ["SELESAI"]) ||
    textIncludes(row.statusPembayaranEp, ["LUNAS", "SELESAI"]) ||
    isFilled(row.tanggalPembayaranEp)
  ) {
    return "done";
  }

  if (
    validAmount(row.nilaiPembayaran) ||
    isFilled(row.nomorInvoice) ||
    isFilled(row.nomorFaktur) ||
    isFilled(row.statusDokumenPembayaran) ||
    isFilled(row.statusPembayaranEp)
  ) {
    return "payment";
  }

  if (
    isFilled(row.nomorBast) ||
    isFilled(row.tanggalBast) ||
    isFilled(row.statusPemeriksaanEp) ||
    isFilled(row.hasilPemeriksaan)
  ) {
    return "bast";
  }

  if (
    isFilled(row.statusPengirimanEp) ||
    isFilled(row.tanggalAktualKirim) ||
    isFilled(row.nomorSuratJalan)
  ) {
    return "delivery";
  }

  if (
    isFilled(row.nomorSpkKontrak) ||
    isFilled(row.tanggalKontrakEp) ||
    isFilled(row.nomorSuratPesanan) ||
    isFilled(row.statusSuratPesanan)
  ) {
    return "contract";
  }

  if (
    isFilled(row.statusNegosiasiKatalog) ||
    validAmount(row.hargaNegosiasiKatalog) ||
    isFilled(row.nomorSppbj) ||
    row.statusSirup === "SUDAH_TAYANG"
  ) {
    return "selection";
  }

  if (row.statusUsulan === "RUP_TAYANG" || row.statusSirup === "SIAP_RUP") {
    return "rup";
  }

  if (
    ["DIAJUKAN", "PERLU_REVISI", "SIAP_RUP"].includes(row.statusUsulan) ||
    ["PROSES_VERIFIKASI", "MENUNGGU_PPTK", "MENUNGGU_PPK", "MENUNGGU_KPA_PA"].includes(
      row.statusSirup,
    )
  ) {
    return "verification";
  }

  return "planning";
}

function buildRupWhere(filters: Required<Pick<DashboardFilters, "tahunAnggaran">> & DashboardFilters) {
  const where: Prisma.RencanaUmumPengadaanWhereInput = {
    tahunAnggaran: filters.tahunAnggaran,
  };

  if (filters.unit) {
    where.OR = [
      { unitPengusul: { contains: filters.unit, mode: "insensitive" } },
      { unitBidang: { contains: filters.unit, mode: "insensitive" } },
    ];
  }

  if (filters.sumberDana) where.sumberDana = filters.sumberDana;
  if (filters.metodePengadaan) {
    where.metodePengadaan = filters.metodePengadaan as PaketMetodePengadaan;
  }
  if (filters.statusPaket) {
    where.OR = [
      ...(Array.isArray(where.OR) ? where.OR : []),
      { statusUsulan: filters.statusPaket as Prisma.EnumStatusUsulanFilter },
      { statusSirup: filters.statusPaket as Prisma.EnumRupStatusFilter },
      { statusTransaksiKatalog: { contains: filters.statusPaket, mode: "insensitive" } },
    ];
  }

  return where;
}

function buildHistoryProposalWhere(
  filters: Required<Pick<DashboardFilters, "tahunAnggaran">> & DashboardFilters,
) {
  const where: Prisma.RencanaUmumPengadaanWhereInput = {
    tahunAnggaran: filters.tahunAnggaran,
  };

  if (filters.unit) {
    where.unitPengusul = { contains: filters.unit, mode: "insensitive" };
  }
  if (filters.sumberDana) where.sumberDana = filters.sumberDana;
  if (filters.metodePengadaan) {
    where.metodePengadaan = filters.metodePengadaan as PaketMetodePengadaan;
  }
  if (filters.statusPaket) {
    where.OR = [
      { statusUsulan: filters.statusPaket as Prisma.EnumStatusUsulanFilter },
      { statusSirup: filters.statusPaket as Prisma.EnumRupStatusFilter },
      { statusTransaksiKatalog: { contains: filters.statusPaket, mode: "insensitive" } },
    ];
  }

  return where;
}

async function resolveDefaultYear() {
  const latestRup = await prisma.rencanaUmumPengadaan.findFirst({
    orderBy: { tahunAnggaran: "desc" },
    select: { tahunAnggaran: true },
  });

  return latestRup?.tahunAnggaran ?? new Date().getFullYear();
}

async function getFilterOptions() {
  const [yearRows, unitRows, sourceRows, methodRows, statusUsulanRows, statusSirupRows] =
    await Promise.all([
      prisma.rencanaUmumPengadaan.groupBy({
        by: ["tahunAnggaran"],
        orderBy: { tahunAnggaran: "desc" },
      }),
      prisma.rencanaUmumPengadaan.findMany({
        distinct: ["unitPengusul"],
        orderBy: { unitPengusul: "asc" },
        select: { unitPengusul: true },
      }),
      prisma.rencanaUmumPengadaan.findMany({
        distinct: ["sumberDana"],
        orderBy: { sumberDana: "asc" },
        select: { sumberDana: true },
      }),
      prisma.rencanaUmumPengadaan.groupBy({
        by: ["metodePengadaan"],
        orderBy: { metodePengadaan: "asc" },
      }),
      prisma.rencanaUmumPengadaan.groupBy({
        by: ["statusUsulan"],
        orderBy: { statusUsulan: "asc" },
      }),
      prisma.rencanaUmumPengadaan.groupBy({
        by: ["statusSirup"],
        orderBy: { statusSirup: "asc" },
      }),
    ]);

  const statuses = Array.from(
    new Set([
      ...statusUsulanRows.map((row) => row.statusUsulan),
      ...statusSirupRows.map((row) => row.statusSirup),
    ]),
  ).sort();

  return {
    years: yearRows.map((row) => row.tahunAnggaran),
    units: unitRows
      .filter((row) => isFilled(row.unitPengusul))
      .map((row) => ({ value: row.unitPengusul, label: row.unitPengusul })),
    sources: sourceRows
      .filter((row) => isFilled(row.sumberDana))
      .map((row) => ({ value: row.sumberDana, label: row.sumberDana })),
    methods: methodRows.map((row) => ({
      value: row.metodePengadaan,
      label:
        row.metodePengadaan === "E_PURCHASING"
          ? "E-Purchasing"
          : humanize(row.metodePengadaan),
    })),
    statuses: statuses.map((status) => ({ value: status, label: humanize(status) })),
  };
}

function buildStages(rows: RupRow[]) {
  const counts = new Map(procurementStages.map((stage) => [stage.key, 0]));

  for (const row of rows) {
    const stage = getProcurementStage(row);
    counts.set(stage, (counts.get(stage) ?? 0) + 1);
  }

  const maxCount = Math.max(...Array.from(counts.values()), 0);

  return procurementStages.map((stage) => {
    const count = counts.get(stage.key) ?? 0;

    return {
      key: stage.key,
      label: stage.label,
      count,
      percent: rows.length > 0 ? Math.round((count / rows.length) * 100) : 0,
      color: stage.color,
      tone: stage.tone,
      dominant: count > 0 && count === maxCount,
    };
  });
}

function buildBreakdown(
  rows: RupRow[],
  getLabel: (row: RupRow) => string,
  totalAmount: number,
) {
  const breakdown = new Map<string, { count: number; amount: number }>();

  for (const row of rows) {
    const label = getLabel(row) || "-";
    const current = breakdown.get(label) ?? { count: 0, amount: 0 };
    current.count += 1;
    current.amount += toNumber(row.pagu);
    breakdown.set(label, current);
  }

  return Array.from(breakdown, ([label, item]) => ({
    label,
    count: item.count,
    amount: item.amount,
    percent: totalAmount > 0 ? Math.round((item.amount / totalAmount) * 100) : 0,
  })).sort((a, b) => b.amount - a.amount || b.count - a.count);
}

function buildStatusBreakdown(rows: RupRow[]) {
  const total = rows.length;
  const breakdown = new Map<string, { count: number; amount: number }>();

  for (const row of rows) {
    const stage = procurementStages.find((item) => item.key === getProcurementStage(row));
    const label = stage?.label ?? "Perencanaan";
    const current = breakdown.get(label) ?? { count: 0, amount: 0 };
    current.count += 1;
    current.amount += toNumber(row.pagu);
    breakdown.set(label, current);
  }

  return Array.from(breakdown, ([label, item]) => ({
    label,
    count: item.count,
    amount: item.amount,
    percent: total > 0 ? Math.round((item.count / total) * 100) : 0,
  })).sort((a, b) => b.count - a.count || b.amount - a.amount);
}

function buildUnitBreakdown(rows: RupRow[], totalAmount: number) {
  return buildBreakdown(
    rows,
    (row) => row.unitPengusul || row.unitBidang || "Unit belum diisi",
    totalAmount,
  ).slice(0, 6);
}

function countRows(rows: RupRow[], predicate: (row: RupRow) => boolean) {
  return rows.filter(predicate).length;
}

function buildAttentionItems(rows: RupRow[]) {
  const today = new Date();
  const items: DashboardAttention[] = [
    {
      label: "Usulan menunggu verifikasi",
      count: countRows(rows, (row) => row.statusUsulan === "DIAJUKAN"),
      href: "/verifikasi?status=DIAJUKAN",
      tone: "blue",
    },
    {
      label: "Usulan perlu revisi",
      count: countRows(rows, (row) => row.statusUsulan === "PERLU_REVISI"),
      href: "/verifikasi?status=PERLU_REVISI",
      tone: "amber",
    },
    {
      label: "Paket siap RUP",
      count: countRows(rows, (row) => row.statusUsulan === "SIAP_RUP"),
      href: "/sirup-rup?status=SIAP_RUP",
      tone: "green",
    },
    {
      label: "Negosiasi belum selesai",
      count: countRows(
        rows,
        (row) =>
          row.metodePengadaan === "E_PURCHASING" &&
          getProcurementStage(row) === "selection" &&
          !validAmount(row.hargaNegosiasiKatalog),
      ),
      href: "/e-purchasing?status=NEGOSIASI",
      tone: "amber",
    },
    {
      label: "Kontrak / SP belum lengkap",
      count: countRows(
        rows,
        (row) =>
          getProcurementStage(row) === "contract" &&
          (!isFilled(row.nomorSpkKontrak) || !isFilled(row.nomorSuratPesanan)),
      ),
      href: "/kontrak-sp",
      tone: "amber",
    },
    {
      label: "Pengiriman terlambat",
      count: countRows(rows, (row) => {
        const due = parseLooseDate(row.tanggalRencanaKirim);
        return Boolean(due && due < today && !isFilled(row.tanggalAktualKirim));
      }),
      href: "/e-purchasing?status=PENGIRIMAN",
      tone: "red",
    },
    {
      label: "BAST belum dibuat",
      count: countRows(
        rows,
        (row) =>
          getProcurementStage(row) === "delivery" &&
          isFilled(row.tanggalAktualKirim) &&
          !isFilled(row.nomorBast),
      ),
      href: "/serah-terima",
      tone: "amber",
    },
    {
      label: "Dokumen pembayaran belum lengkap",
      count: countRows(
        rows,
        (row) =>
          ["bast", "payment"].includes(getProcurementStage(row)) &&
          !textIncludes(row.statusDokumenPembayaran, ["LENGKAP", "SELESAI"]),
      ),
      href: "/realisasi-belanja",
      tone: "amber",
    },
  ];

  return items.filter((item) => item.count > 0).slice(0, 6);
}

function buildMonthlyFinancials(rows: RupRow[]) {
  const values = monthLabels.map((month) => ({
    month,
    pagu: 0,
    kontrak: 0,
    realisasi: 0,
  }));

  for (const row of rows) {
    const monthIndex = (row.createdAt ?? row.updatedAt).getMonth();
    values[monthIndex].pagu += toNumber(row.pagu);
    values[monthIndex].kontrak += getFinalValue(row) ?? 0;
    values[monthIndex].realisasi += toNumber(row.nilaiPembayaran);
  }

  return values;
}

function buildEfficiency(rows: RupRow[]) {
  const eligibleRows = rows
    .map((row) => ({
      pagu: toNumber(row.pagu),
      finalValue: getFinalValue(row),
    }))
    .filter((row): row is { pagu: number; finalValue: number } =>
      Boolean(row.pagu > 0 && row.finalValue && row.finalValue > 0),
    );

  const totalPagu = eligibleRows.reduce((sum, row) => sum + row.pagu, 0);
  const totalFinal = eligibleRows.reduce((sum, row) => sum + row.finalValue, 0);
  const totalSaving = Math.max(totalPagu - totalFinal, 0);

  return {
    eligibleCount: eligibleRows.length,
    totalPagu,
    totalFinal,
    totalSaving,
    savingRate:
      totalPagu > 0 ? Number(((totalSaving / totalPagu) * 100).toFixed(2)) : 0,
  };
}

function buildCategories(rows: RupRow[], totalAmount: number) {
  return buildBreakdown(
    rows,
    (row) => row.kategoriProdukKatalog || row.jenisBelanja || "Lainnya",
    totalAmount,
  ).slice(0, 5);
}

function buildRecentPackages(rows: RupRow[]): DashboardRecentPackage[] {
  return rows.slice(0, 5).map((row, index) => ({
    code: row.kodeRup || `RUP-${index + 1}`,
    name: row.namaPaket,
    unit: row.unitPengusul,
    method:
      row.metodePengadaan === "E_PURCHASING"
        ? "E-Purchasing"
        : humanize(row.metodePengadaan),
    budget: toNumber(row.pagu),
    absorptionPercent:
      toNumber(row.pagu) > 0
        ? Number(((toNumber(row.nilaiPembayaran) / toNumber(row.pagu)) * 100).toFixed(1))
        : null,
    status:
      procurementStages.find((item) => item.key === getProcurementStage(row))?.label ??
      humanize(row.statusUsulan),
  }));
}

function buildMonthlyRealization(
  monthlyFinancials: DashboardMonthlyFinancial[],
): DashboardMonthlyRealization[] {
  return monthlyFinancials.map((item) => ({
    month: item.month,
    pagu: item.pagu,
    realisasi: item.realisasi,
  }));
}

function buildTimeline(stages: DashboardStage[], totalPaket: number): DashboardTimelineItem[] {
  const countByStage = new Map(stages.map((stage) => [stage.key, stage.count]));

  return [
    {
      label: "Perencanaan & RUP",
      period: "Input kebutuhan, verifikasi, dan tayang RUP",
      count:
        (countByStage.get("planning") ?? 0) +
        (countByStage.get("verification") ?? 0) +
        (countByStage.get("rup") ?? 0),
      status: "active",
    },
    {
      label: "Pemilihan Penyedia",
      period: "Tender, non tender, dan E-Purchasing",
      count: countByStage.get("selection") ?? 0,
      status: (countByStage.get("selection") ?? 0) > 0 ? "warning" : "pending",
    },
    {
      label: "Kontrak & Pelaksanaan",
      period: "SP/SPK, pengiriman, dan pemeriksaan",
      count:
        (countByStage.get("contract") ?? 0) +
        (countByStage.get("delivery") ?? 0) +
        (countByStage.get("bast") ?? 0),
      status: "active",
    },
    {
      label: "Serah Terima & Realisasi",
      period: "Pembayaran dan penyelesaian paket",
      count: (countByStage.get("payment") ?? 0) + (countByStage.get("done") ?? 0),
      status:
        totalPaket > 0 && (countByStage.get("done") ?? 0) === totalPaket
          ? "done"
          : "pending",
    },
  ];
}

function buildAuditReadiness(
  totalPaket: number,
  stages: DashboardStage[],
  bermasalahCount: number,
): DashboardAuditReadiness {
  const stageCount = (key: string) => stages.find((stage) => stage.key === key)?.count ?? 0;
  const contractReady =
    stageCount("contract") +
    stageCount("delivery") +
    stageCount("bast") +
    stageCount("payment") +
    stageCount("done");
  const bastReady = stageCount("bast") + stageCount("payment") + stageCount("done");
  const paymentReady = stageCount("payment") + stageCount("done");
  const riskReady = Math.max(totalPaket - bermasalahCount, 0);
  const complete = totalPaket + contractReady + bastReady + paymentReady + riskReady;
  const total = totalPaket * 5;
  const percent = total > 0 ? Math.round((complete / total) * 100) : 0;

  const toneFor = (value: number, max: number) => {
    if (max === 0 || value / max >= 0.8) return "green" as const;
    if (value / max >= 0.5) return "amber" as const;
    return "red" as const;
  };

  return {
    percent,
    items: [
      {
        label: "KAK / HPS",
        complete: totalPaket,
        total: totalPaket,
        tone: toneFor(totalPaket, totalPaket),
      },
      {
        label: "Dokumen pemilihan",
        complete: contractReady,
        total: totalPaket,
        tone: toneFor(contractReady, totalPaket),
      },
      {
        label: "BAST / BAPB",
        complete: bastReady,
        total: totalPaket,
        tone: toneFor(bastReady, totalPaket),
      },
      {
        label: "Bukti pembayaran",
        complete: paymentReady,
        total: totalPaket,
        tone: toneFor(paymentReady, totalPaket),
      },
      {
        label: "Risiko tertangani",
        complete: riskReady,
        total: totalPaket,
        tone: toneFor(riskReady, totalPaket),
      },
    ],
  };
}

function buildPriorities(items: DashboardAttention[]) {
  return items.slice(0, 3).map((item) => ({
    title: item.label,
    unit: `${item.count.toLocaleString("id-ID")} paket`,
    status: item.tone === "red" ? "Bermasalah" : "Perlu Tindak Lanjut",
    due: item.href ? "Buka daftar terkait" : "Perlu dipantau",
    tone: item.tone === "red" ? ("red" as const) : ("amber" as const),
  }));
}

function buildDeadlines(rows: RupRow[]) {
  const today = new Date();
  const deadlines: DashboardDeadline[] = [];

  for (const row of rows) {
    const candidates = [
      {
        date: parseLooseDate(row.tanggalRencanaKirim),
        title: row.namaPaket,
        helper: "Target pengiriman",
        href: "/e-purchasing",
      },
      {
        date: parseLooseDate(row.jadwalSelesaiRencana),
        title: row.namaPaket,
        helper: "Jadwal selesai rencana",
        href: "/sirup-rup",
      },
      {
        date: parseLooseDate(row.tanggalKontrakEp),
        title: row.namaPaket,
        helper: "Tanggal kontrak / SP",
        href: "/kontrak-sp",
      },
      {
        date: parseLooseDate(row.tanggalBast),
        title: row.namaPaket,
        helper: "Target BAST",
        href: "/serah-terima",
      },
    ];

    for (const candidate of candidates) {
      if (!candidate.date) continue;
      const daysLeft = daysBetween(today, candidate.date);
      if (daysLeft < 0 || daysLeft > 14) continue;

      deadlines.push({
        dateLabel: formatDateLabel(candidate.date),
        title: candidate.title,
        helper:
          daysLeft === 0
            ? `${candidate.helper} hari ini`
            : `${candidate.helper}, ${daysLeft} hari lagi`,
        daysLeft,
        href: candidate.href,
      });
    }
  }

  return deadlines.sort((a, b) => a.daysLeft - b.daysLeft).slice(0, 5);
}

async function buildActivities(filters: Required<Pick<DashboardFilters, "tahunAnggaran">> & DashboardFilters) {
  const activities: DashboardActivity[] = [];
  const proposalWhere = buildHistoryProposalWhere(filters);

  const [verificationRows, timelineRows, auditRows] = await Promise.all([
    prisma.usulanVerificationHistory.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        action: true,
        newStatus: true,
        createdAt: true,
        proposal: { select: { namaPaket: true, tahunAnggaran: true, unitPengusul: true } },
      },
      where: {
        proposal: proposalWhere,
      },
    }),
    prisma.timelineEvent.findMany({
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: { judul: true, tahap: true, status: true, updatedAt: true },
    }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      where: { entity: { in: ["RUP", "PAKET", "KONTRAK", "REALISASI"] } },
      select: { entity: true, action: true, createdAt: true },
    }),
  ]);

  for (const row of verificationRows) {
    activities.push({
      time: formatTime(row.createdAt),
      title: row.proposal.namaPaket,
      description: row.newStatus
        ? `${humanize(row.action)} ke ${humanize(row.newStatus)}`
        : humanize(row.action),
      href: "/verifikasi",
    });
  }

  for (const row of timelineRows) {
    activities.push({
      time: formatTime(row.updatedAt),
      title: row.judul,
      description: `${humanize(row.tahap)} - ${humanize(row.status)}`,
      href: "/timeline",
    });
  }

  for (const row of auditRows) {
    activities.push({
      time: formatTime(row.createdAt),
      title: humanize(row.entity),
      description: humanize(row.action),
      href: "/admin/audit-log",
    });
  }

  return activities
    .sort((a, b) => b.time.localeCompare(a.time))
    .slice(0, 6);
}

async function buildActivityActors(
  filters: Required<Pick<DashboardFilters, "tahunAnggaran">> & DashboardFilters,
) {
  const proposalWhere = buildHistoryProposalWhere(filters);
  const verificationRows = await prisma.usulanVerificationHistory.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      actorName: true,
      proposal: { select: { tahunAnggaran: true, unitPengusul: true } },
    },
    where: {
      proposal: proposalWhere,
    },
  });

  const counts = new Map<string, number>();
  for (const row of verificationRows) {
    const label = row.actorName?.trim() || "User tidak diketahui";
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }

  const maxCount = Math.max(...counts.values(), 0);

  return Array.from(counts, ([label, count]) => ({
    label,
    count,
    percent: maxCount > 0 ? Math.round((count / maxCount) * 100) : 0,
  }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, 5);
}

async function computeDashboardData(filters: DashboardFilters = {}): Promise<DashboardData> {
  const tahunAnggaran = filters.tahunAnggaran ?? (await resolveDefaultYear());
  const activeFilters = { ...filters, tahunAnggaran };
  const where = buildRupWhere(activeFilters);
  const [filterOptions, rows] = await Promise.all([
    getFilterOptions(),
    prisma.rencanaUmumPengadaan.findMany({
      where,
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const totalPagu = rows.reduce((sum, row) => sum + toNumber(row.pagu), 0);
  const totalHps = rows.reduce(
    (sum, row) => sum + (validAmount(row.totalEstimasi) ?? validAmount(row.totalHargaKatalog) ?? 0),
    0,
  );
  const totalNilaiKontrak = rows.reduce(
    (sum, row) => sum + (getFinalValue(row) ?? 0),
    0,
  );
  const totalRealisasi = rows.reduce(
    (sum, row) => sum + toNumber(row.nilaiPembayaran),
    0,
  );
  const stages = buildStages(rows);
  const paketSelesai = stages.find((stage) => stage.key === "done")?.count ?? 0;
  const paketBermasalah = countRows(
    rows,
    (row) =>
      row.statusUsulan === "PERLU_REVISI" ||
      textIncludes(row.kendala, ["TERLAMBAT", "GAGAL", "BATAL", "KENDALA"]) ||
      textIncludes(row.statusTransaksiKatalog, ["GAGAL", "BATAL"]),
  );
  const monthlyFinancials = buildMonthlyFinancials(rows);
  const attentionItems = buildAttentionItems(rows);
  const deadlines = buildDeadlines(rows);
  const categories = buildCategories(rows, totalPagu);
  const timeline = buildTimeline(stages, rows.length);
  const auditReadiness = buildAuditReadiness(rows.length, stages, paketBermasalah);
  const [activities, activityActors] = await Promise.all([
    buildActivities(activeFilters),
    buildActivityActors(activeFilters),
  ]);
  const paketEKatalogV6 = countRows(
    rows,
    (row) => row.metodePengadaan === "E_PURCHASING",
  );
  const paketTenderNonTender = countRows(rows, (row) =>
    ["TENDER", "NON_TENDER"].includes(row.metodePengadaan),
  );
  const paketTerlambat = countRows(rows, (row) => {
    const due = parseLooseDate(row.tanggalRencanaKirim);
    return Boolean(due && due < new Date() && !isFilled(row.tanggalAktualKirim));
  });

  return {
    filters: activeFilters,
    filterOptions,
    summary: {
      totalPaket: rows.length,
      totalPaketBarangKesehatan: countRows(rows, (row) =>
        textIncludes(row.kategoriProdukKatalog || row.jenisBelanja, [
          "KESEHATAN",
          "ALKES",
          "OBAT",
          "BMHP",
          "REAGEN",
          "LABORATORIUM",
        ]),
      ),
      totalPagu,
      totalHps,
      totalNilaiKontrak,
      totalRealisasi,
      totalBarang: rows.length,
      totalPdn: 0,
      paketTerlambat,
      deadlineDekat: deadlines.length,
      paketBerjalan: Math.max(rows.length - paketSelesai, 0),
      paketSelesai,
      paketBermasalah,
      paketEKatalogV6,
      paketTenderNonTender,
      realisasiPercent:
        totalPagu > 0 ? Number(((totalRealisasi / totalPagu) * 100).toFixed(1)) : 0,
      realisasiKontrakPercent:
        totalPagu > 0
          ? Number(((totalNilaiKontrak / totalPagu) * 100).toFixed(1))
          : 0,
      selesaiPercent:
        rows.length > 0 ? Number(((paketSelesai / rows.length) * 100).toFixed(1)) : 0,
      tahunAnggaran,
    },
    stages,
    attentionItems,
    monthlyFinancials,
    unitBreakdown: buildUnitBreakdown(rows, totalPagu),
    sourceFunds: buildBreakdown(rows, (row) => row.sumberDana, totalPagu),
    methods: buildBreakdown(
      rows,
      (row) =>
        row.metodePengadaan === "E_PURCHASING"
          ? "E-Purchasing"
          : humanize(row.metodePengadaan),
      totalPagu,
    ),
    statuses: buildStatusBreakdown(rows),
    efficiency: buildEfficiency(rows),
    deadlines,
    activities,
    activityActors,
    categories,
    priorities: buildPriorities(attentionItems),
    recentPackages: buildRecentPackages(rows),
    monthlyRealization: buildMonthlyRealization(monthlyFinancials),
    timeline,
    auditReadiness,
  };
}

export async function getDashboardData(filters: DashboardFilters = {}) {
  const tahunAnggaran = filters.tahunAnggaran ?? (await resolveDefaultYear());
  const cacheKey = JSON.stringify({
    tahunAnggaran,
    unit: filters.unit ?? "",
    sumberDana: filters.sumberDana ?? "",
    metodePengadaan: filters.metodePengadaan ?? "",
    statusPaket: filters.statusPaket ?? "",
  });

  return unstable_cache(
    () => computeDashboardData({ ...filters, tahunAnggaran }),
    ["dashboard-data", cacheKey],
    { revalidate: 300 },
  )();
}
