import { prisma } from "@/lib/prisma";

export type DashboardStage = {
  label: string;
  count: number;
  percent: number;
  color: string;
};

export type DashboardCategory = {
  label: string;
  value: number;
  amount: number;
};

export type DashboardBreakdown = {
  label: string;
  count: number;
  amount: number;
  percent: number;
};

export type DashboardPriority = {
  title: string;
  unit: string;
  status: string;
  due: string;
  tone: "amber" | "green" | "red";
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

export type DashboardMonthlyRealization = {
  month: string;
  pagu: number;
  realisasi: number;
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

export type DashboardData = {
  summary: {
    totalPaket: number;
    totalPaketBarangKesehatan: number;
    totalPagu: number;
    totalHps: number;
    totalNilaiKontrak: number;
    totalBarang: number;
    totalPdn: number;
    paketTerlambat: number;
    deadlineDekat: number;
    paketBermasalah: number;
    paketEKatalogV6: number;
    paketTenderNonTender: number;
    realisasiKontrakPercent: number;
    tahunAnggaran: number;
  };
  stages: DashboardStage[];
  categories: DashboardCategory[];
  sourceFunds: DashboardBreakdown[];
  methods: DashboardBreakdown[];
  priorities: DashboardPriority[];
  recentPackages: DashboardRecentPackage[];
  monthlyRealization: DashboardMonthlyRealization[];
  timeline: DashboardTimelineItem[];
  auditReadiness: DashboardAuditReadiness;
};

const packageTables = ["paket_pengadaan", "paket", "packages"] as const;
const goodsTables = ["data_barang", "barang_kesehatan", "barang"] as const;
const contractTables = ["kontrak", "contracts"] as const;

const codeColumns = ["kode_paket", "kode", "code"] as const;
const nameColumns = ["nama_paket", "nama", "name", "title"] as const;
const unitColumns = [
  "satuan_kerja",
  "unit",
  "opd",
  "instansi",
  "satker",
] as const;
const methodColumns = [
  "metode_pemilihan",
  "metode",
  "method",
  "jenis_pengadaan",
] as const;
const statusColumns = ["status_paket", "status", "tahap"] as const;
const categoryColumns = ["kategori", "kategori_barang", "jenis_barang"] as const;
const budgetColumns = ["pagu", "nilai_pagu", "hps", "nilai_hps", "budget"] as const;
const contractValueColumns = [
  "nilai_kontrak",
  "total_nilai_kontrak",
  "contract_value",
  "amount",
] as const;
const hpsColumns = ["hps", "nilai_hps"] as const;
const amountColumns = [
  "total_harga",
  "estimasi_total",
  "nilai_total",
  "total",
  "subtotal",
  "pagu",
] as const;
const createdColumns = [
  "created_at",
  "updated_at",
  "tanggal_dibuat",
  "tanggal_paket",
] as const;
const delayedWords = ["terlambat", "lewat", "overdue", "delay", "delayed"];
const problemWords = [
  "terlambat",
  "gagal",
  "batal",
  "bermasalah",
  "revisi",
  "ditolak",
];
const eCatalogWords = [
  "E_PURCHASING",
  "E-PURCHASING",
  "E PURCHASING",
  "EKATALOG",
  "E-KATALOG",
  "KATALOG",
  "V6",
];
const tenderNonTenderWords = ["TENDER", "NON_TENDER", "NON-TENDER", "NON TENDER"];
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

type CountRow = { count: bigint | number | string | null };
type SumRow = { total: bigint | number | string | null };
type ValueRow = { value: unknown };
type CategoryRow = {
  label: string | null;
  value: bigint | number | string | null;
  amount: bigint | number | string | null;
};
type BreakdownRow = {
  label: string | null;
  count: bigint | number | string | null;
  amount: bigint | number | string | null;
};
type SourceFundMasterRow = {
  kode: string | null;
  nama: string | null;
};
type SchemaColumnRow = {
  tableName: string;
  columnName: string;
};
type RecentPackageRow = {
  code: string | null;
  name: string | null;
  unit: string | null;
  method: string | null;
  budget: bigint | number | string | null;
  status: string | null;
};

type SchemaCatalog = Map<string, Set<string>>;

const schemaCatalogTtlMs = 5 * 60 * 1000;
let schemaCatalogPromise: Promise<SchemaCatalog> | null = null;
let schemaCatalogExpiresAt = 0;

function quoteIdentifier(identifier: string) {
  return `\`${identifier.replaceAll("`", "``")}\``;
}

function toNumber(value: unknown) {
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function buildLikeWhere(column: string, words: readonly string[]) {
  const quotedColumn = quoteIdentifier(column);
  const conditions = words.map(() => `LOWER(${quotedColumn}) LIKE ?`);

  return {
    sql: conditions.join(" OR "),
    params: words.map((word) => `%${word.toLowerCase()}%`),
  };
}

function buildExactOrLikeWhere(column: string, values: readonly string[]) {
  const quotedColumn = quoteIdentifier(column);
  const conditions = values.map(() => `LOWER(${quotedColumn}) = LOWER(?)`);

  return {
    sql: conditions.join(" OR "),
    params: [...values],
  };
}

function getSchemaCatalog() {
  const now = Date.now();

  if (!schemaCatalogPromise || now >= schemaCatalogExpiresAt) {
    schemaCatalogExpiresAt = now + schemaCatalogTtlMs;
    schemaCatalogPromise = prisma
      .$queryRawUnsafe<SchemaColumnRow[]>(
        `SELECT table_name AS tableName, column_name AS columnName
         FROM information_schema.columns
         WHERE table_schema = DATABASE()`,
      )
      .then((rows) => {
        const catalog: SchemaCatalog = new Map();

        for (const row of rows) {
          const columns = catalog.get(row.tableName) ?? new Set<string>();
          columns.add(row.columnName);
          catalog.set(row.tableName, columns);
        }

        return catalog;
      })
      .catch((error) => {
        schemaCatalogPromise = null;
        schemaCatalogExpiresAt = 0;
        throw error;
      });
  }

  return schemaCatalogPromise;
}

async function tableExists(tableName: string) {
  const catalog = await getSchemaCatalog();
  return catalog.has(tableName);
}

async function findTable(candidates: readonly string[]) {
  const catalog = await getSchemaCatalog();
  return candidates.find((table) => catalog.has(table)) ?? null;
}

async function findColumn(tableName: string | null, candidates: readonly string[]) {
  if (!tableName) return null;

  const catalog = await getSchemaCatalog();
  const columns = catalog.get(tableName);

  return candidates.find((column) => columns?.has(column)) ?? null;
}

async function countRows(tableName: string | null) {
  if (!tableName) return 0;

  const rows = await prisma.$queryRawUnsafe<CountRow[]>(
    `SELECT COUNT(*) AS count FROM ${quoteIdentifier(tableName)}`,
  );

  return toNumber(rows[0]?.count);
}

async function countMatching(
  tableName: string | null,
  columnName: string | null,
  words: readonly string[],
) {
  if (!tableName || !columnName) return 0;

  const where = buildLikeWhere(columnName, words);
  const rows = await prisma.$queryRawUnsafe<CountRow[]>(
    `SELECT COUNT(*) AS count FROM ${quoteIdentifier(tableName)} WHERE ${where.sql}`,
    ...where.params,
  );

  return toNumber(rows[0]?.count);
}

async function countExactOrLike(
  tableName: string | null,
  columnName: string | null,
  values: readonly string[],
) {
  if (!tableName || !columnName) return 0;

  const where = buildExactOrLikeWhere(columnName, values);
  const rows = await prisma.$queryRawUnsafe<CountRow[]>(
    `SELECT COUNT(*) AS count FROM ${quoteIdentifier(tableName)} WHERE ${where.sql}`,
    ...where.params,
  );

  return toNumber(rows[0]?.count);
}

async function sumColumn(tableName: string | null, columnName: string | null) {
  if (!tableName || !columnName) return 0;

  const rows = await prisma.$queryRawUnsafe<SumRow[]>(
    `SELECT COALESCE(SUM(${quoteIdentifier(columnName)}), 0) AS total FROM ${quoteIdentifier(tableName)}`,
  );

  return toNumber(rows[0]?.total);
}

async function countBooleanTrue(
  tableName: string | null,
  columnName: string | null,
) {
  if (!tableName || !columnName) return 0;

  const rows = await prisma.$queryRawUnsafe<CountRow[]>(
    `SELECT COUNT(*) AS count FROM ${quoteIdentifier(tableName)} WHERE ${quoteIdentifier(columnName)} = true`,
  );

  return toNumber(rows[0]?.count);
}

async function countNearDeadline(tableName: string | null) {
  if (!tableName) return 0;

  const [dueColumn, statusColumn] = await Promise.all([
    findColumn(tableName, ["rencana_selesai", "tanggal_selesai", "due_date"]),
    findColumn(tableName, statusColumns),
  ]);

  if (!dueColumn) return 0;

  const statusFilter = statusColumn
    ? ` AND UPPER(${quoteIdentifier(statusColumn)}) NOT IN ('SELESAI', 'GAGAL', 'BATAL')`
    : "";

  const rows = await prisma.$queryRawUnsafe<CountRow[]>(
    `SELECT COUNT(*) AS count
     FROM ${quoteIdentifier(tableName)}
     WHERE ${quoteIdentifier(dueColumn)} BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
     ${statusFilter}`,
  );

  return toNumber(rows[0]?.count);
}

async function latestYear(tableName: string | null) {
  const yearColumn = await findColumn(tableName, [
    "tahun_anggaran",
    "tahun",
    "year",
  ]);

  if (!tableName || !yearColumn) return new Date().getFullYear();

  const rows = await prisma.$queryRawUnsafe<ValueRow[]>(
    `SELECT MAX(${quoteIdentifier(yearColumn)}) AS value FROM ${quoteIdentifier(tableName)}`,
  );

  return toNumber(rows[0]?.value) || new Date().getFullYear();
}

async function getStages(tableName: string | null, totalPaket: number) {
  const statusColumn = await findColumn(tableName, statusColumns);

  if (!tableName || !statusColumn || totalPaket === 0) return [];

  const stageConfig = [
    {
      label: "Perencanaan",
      color: "bg-sky-500",
      words: ["perencanaan", "rencana", "draft"],
    },
    {
      label: "Pemilihan",
      color: "bg-amber-500",
      words: ["pemilihan", "tender", "evaluasi", "pengumuman"],
    },
    {
      label: "Kontrak",
      color: "bg-emerald-600",
      words: ["kontrak", "berjalan"],
    },
    {
      label: "Selesai",
      color: "bg-slate-700",
      words: ["selesai", "serah terima", "dibayar", "complete"],
    },
  ];

  const stages = await Promise.all(
    stageConfig.map(async (stage) => {
      const count = await countMatching(tableName, statusColumn, stage.words);

      return {
        label: stage.label,
        count,
        percent: Math.round((count / totalPaket) * 100),
        color: stage.color,
      };
    }),
  );

  return stages.filter((stage) => stage.count > 0);
}

async function getCategories(packageTable: string | null, goodsTable: string | null) {
  const tableName = goodsTable ?? packageTable;
  const [categoryColumn, amountColumn] = await Promise.all([
    findColumn(tableName, categoryColumns),
    findColumn(tableName, amountColumns),
  ]);

  if (!tableName || !categoryColumn) return [];

  const amountSql = amountColumn
    ? `COALESCE(SUM(${quoteIdentifier(amountColumn)}), 0)`
    : "0";

  const rows = await prisma.$queryRawUnsafe<CategoryRow[]>(
    `SELECT ${quoteIdentifier(categoryColumn)} AS label, COUNT(*) AS value, ${amountSql} AS amount
     FROM ${quoteIdentifier(tableName)}
     WHERE ${quoteIdentifier(categoryColumn)} IS NOT NULL AND ${quoteIdentifier(categoryColumn)} <> ''
     GROUP BY ${quoteIdentifier(categoryColumn)}
     ORDER BY value DESC
     LIMIT 5`,
  );

  return rows.map((row) => ({
    label: row.label ?? "-",
    value: toNumber(row.value),
    amount: toNumber(row.amount),
  }));
}

async function getBreakdown(
  tableName: string | null,
  labelColumnName: string | null,
  amountColumnName: string | null,
  totalCount: number,
) {
  if (!tableName || !labelColumnName) return [];

  const amountSql = amountColumnName
    ? `COALESCE(SUM(${quoteIdentifier(amountColumnName)}), 0)`
    : "0";

  const rows = await prisma.$queryRawUnsafe<BreakdownRow[]>(
    `SELECT ${quoteIdentifier(labelColumnName)} AS label, COUNT(*) AS count, ${amountSql} AS amount
     FROM ${quoteIdentifier(tableName)}
     WHERE ${quoteIdentifier(labelColumnName)} IS NOT NULL AND ${quoteIdentifier(labelColumnName)} <> ''
     GROUP BY ${quoteIdentifier(labelColumnName)}
     ORDER BY count DESC`,
  );

  return rows.map((row) => {
    const count = toNumber(row.count);

    return {
      label: row.label ?? "-",
      count,
      amount: toNumber(row.amount),
      percent: totalCount > 0 ? Math.round((count / totalCount) * 100) : 0,
    };
  });
}

async function getSourceFundBreakdown(
  tableName: string | null,
  labelColumnName: string | null,
  amountColumnName: string | null,
  totalCount: number,
) {
  const breakdown = await getBreakdown(
    tableName,
    labelColumnName,
    amountColumnName,
    totalCount,
  );

  if (!(await tableExists("sumber_dana"))) return breakdown;

  const masterRows = await prisma.$queryRaw<SourceFundMasterRow[]>`
    SELECT kode, nama
    FROM sumber_dana
    WHERE aktif = true
    ORDER BY created_at ASC, nama ASC
  `;

  if (masterRows.length === 0) return breakdown;

  const normalizedBreakdown = new Map(
    breakdown.map((item) => [item.label.toUpperCase(), item]),
  );
  const usedLabels = new Set<string>();

  const masterBreakdown = masterRows.map((row) => {
    const code = row.kode ?? row.nama ?? "-";
    const name = row.nama ?? code;
    const matched =
      normalizedBreakdown.get(code.toUpperCase()) ??
      normalizedBreakdown.get(name.toUpperCase());

    usedLabels.add(code.toUpperCase());
    usedLabels.add(name.toUpperCase());

    return {
      label: code,
      count: matched?.count ?? 0,
      amount: matched?.amount ?? 0,
      percent:
        totalCount > 0
          ? Math.round(((matched?.count ?? 0) / totalCount) * 100)
          : 0,
    };
  });

  const extraBreakdown = breakdown.filter(
    (item) => !usedLabels.has(item.label.toUpperCase()),
  );

  return [...masterBreakdown, ...extraBreakdown];
}

async function getRecentPackages(tableName: string | null) {
  if (!tableName) return [];

  const [
    codeColumn,
    nameColumn,
    unitColumn,
    methodColumn,
    budgetColumn,
    statusColumn,
    createdColumn,
  ] = await Promise.all([
    findColumn(tableName, codeColumns),
    findColumn(tableName, nameColumns),
    findColumn(tableName, unitColumns),
    findColumn(tableName, methodColumns),
    findColumn(tableName, budgetColumns),
    findColumn(tableName, statusColumns),
    findColumn(tableName, createdColumns),
  ]);

  if (!nameColumn) return [];

  const orderSql = createdColumn
    ? `ORDER BY ${quoteIdentifier(createdColumn)} DESC`
    : "";

  const rows = await prisma.$queryRawUnsafe<RecentPackageRow[]>(
    `SELECT
       ${codeColumn ? quoteIdentifier(codeColumn) : "NULL"} AS code,
       ${quoteIdentifier(nameColumn)} AS name,
       ${unitColumn ? quoteIdentifier(unitColumn) : "NULL"} AS unit,
       ${methodColumn ? quoteIdentifier(methodColumn) : "NULL"} AS method,
       ${budgetColumn ? quoteIdentifier(budgetColumn) : "0"} AS budget,
       ${statusColumn ? quoteIdentifier(statusColumn) : "NULL"} AS status
     FROM ${quoteIdentifier(tableName)}
     ${orderSql}
     LIMIT 5`,
  );

  return rows.map((row, index) => ({
    code: row.code ?? `PKT-${index + 1}`,
    name: row.name ?? "-",
    unit: row.unit ?? "-",
    method: row.method ?? "-",
    budget: toNumber(row.budget),
    absorptionPercent: null,
    status: row.status ?? "-",
  }));
}

async function getPriorities(tableName: string | null) {
  if (!tableName) return [];

  const [codeColumn, nameColumn, unitColumn, statusColumn, dueColumn] =
    await Promise.all([
      findColumn(tableName, codeColumns),
      findColumn(tableName, nameColumns),
      findColumn(tableName, unitColumns),
      findColumn(tableName, statusColumns),
      findColumn(tableName, ["rencana_selesai", "tanggal_selesai", "due_date"]),
    ]);

  if (!nameColumn || !statusColumn) return [];

  const where = buildLikeWhere(statusColumn, problemWords);
  const problemRows = await prisma.$queryRawUnsafe<RecentPackageRow[]>(
    `SELECT
       ${codeColumn ? quoteIdentifier(codeColumn) : "NULL"} AS code,
       ${quoteIdentifier(nameColumn)} AS name,
       ${unitColumn ? quoteIdentifier(unitColumn) : "NULL"} AS unit,
       NULL AS method,
       0 AS budget,
       ${quoteIdentifier(statusColumn)} AS status
     FROM ${quoteIdentifier(tableName)}
     WHERE ${where.sql}
     LIMIT 3`,
    ...where.params,
  );

  const priorities: DashboardPriority[] = problemRows.map((row) => ({
    title: row.name ?? "-",
    unit: row.unit ?? "-",
    status: row.status ?? "Perlu dipantau",
    due: "Perlu tindak lanjut",
    tone: "red" as const,
  }));

  if (priorities.length >= 3 || !dueColumn) return priorities;

  const dueRows = await prisma.$queryRawUnsafe<RecentPackageRow[]>(
    `SELECT
       ${codeColumn ? quoteIdentifier(codeColumn) : "NULL"} AS code,
       ${quoteIdentifier(nameColumn)} AS name,
       ${unitColumn ? quoteIdentifier(unitColumn) : "NULL"} AS unit,
       NULL AS method,
       0 AS budget,
       ${quoteIdentifier(statusColumn)} AS status
     FROM ${quoteIdentifier(tableName)}
     WHERE ${quoteIdentifier(dueColumn)} BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
       AND UPPER(${quoteIdentifier(statusColumn)}) NOT IN ('SELESAI', 'GAGAL', 'BATAL')
     LIMIT ?`,
    3 - priorities.length,
  );

  return priorities.concat(
    dueRows.map((row) => ({
      title: row.name ?? "-",
      unit: row.unit ?? "-",
      status: row.status ?? "Deadline dekat",
      due: "Deadline kurang dari 7 hari",
      tone: "amber" as const,
    })),
  );
}

async function getMonthlyRealization(
  tableName: string | null,
  budgetColumnName: string | null,
  hpsColumnName: string | null,
  year: number,
) {
  if (!tableName || !budgetColumnName) {
    return monthLabels.map((month) => ({ month, pagu: 0, realisasi: 0 }));
  }

  const dateColumn = await findColumn(tableName, [
    "rencana_mulai",
    "created_at",
    "updated_at",
    "tanggal_paket",
  ]);
  const amountSql = hpsColumnName
    ? `COALESCE(SUM(${quoteIdentifier(hpsColumnName)}), 0)`
    : "0";

  if (!dateColumn) {
    const [totalPagu, totalRealisasi] = await Promise.all([
      sumColumn(tableName, budgetColumnName),
      hpsColumnName ? sumColumn(tableName, hpsColumnName) : Promise.resolve(0),
    ]);

    return monthLabels.map((month, index) => ({
      month,
      pagu: index === 0 ? totalPagu : 0,
      realisasi: index === 0 ? totalRealisasi : 0,
    }));
  }

  const rows = await prisma.$queryRawUnsafe<
    { monthIndex: bigint | number | string | null; pagu: unknown; realisasi: unknown }[]
  >(
    `SELECT
       MONTH(${quoteIdentifier(dateColumn)}) AS monthIndex,
       COALESCE(SUM(${quoteIdentifier(budgetColumnName)}), 0) AS pagu,
       ${amountSql} AS realisasi
     FROM ${quoteIdentifier(tableName)}
     WHERE YEAR(${quoteIdentifier(dateColumn)}) = ?
     GROUP BY MONTH(${quoteIdentifier(dateColumn)})`,
    year,
  );

  const byMonth = new Map(
    rows.map((row) => [
      toNumber(row.monthIndex),
      { pagu: toNumber(row.pagu), realisasi: toNumber(row.realisasi) },
    ]),
  );

  return monthLabels.map((month, index) => {
    const values = byMonth.get(index + 1);

    return {
      month,
      pagu: values?.pagu ?? 0,
      realisasi: values?.realisasi ?? 0,
    };
  });
}

function buildTimeline(stages: DashboardStage[], totalPaket: number): DashboardTimelineItem[] {
  const countByStage = new Map(stages.map((stage) => [stage.label, stage.count]));

  return [
    {
      label: "Perencanaan & RUP",
      period: "Input kebutuhan, pagu, HPS",
      count: countByStage.get("Perencanaan") ?? 0,
      status: (countByStage.get("Perencanaan") ?? 0) > 0 ? "active" : "pending",
    },
    {
      label: "Pemilihan Penyedia",
      period: "Tender, non tender, e-katalog",
      count: countByStage.get("Pemilihan") ?? 0,
      status: (countByStage.get("Pemilihan") ?? 0) > 0 ? "warning" : "pending",
    },
    {
      label: "Kontrak & Pelaksanaan",
      period: "SP/SPK, pengiriman, progres",
      count: countByStage.get("Kontrak") ?? 0,
      status: (countByStage.get("Kontrak") ?? 0) > 0 ? "active" : "pending",
    },
    {
      label: "Serah Terima & Realisasi",
      period: "BAST, pembayaran, penutupan",
      count: countByStage.get("Selesai") ?? 0,
      status:
        totalPaket > 0 && (countByStage.get("Selesai") ?? 0) === totalPaket
          ? "done"
          : "pending",
    },
  ];
}

function buildAuditReadiness(
  totalPaket: number,
  selesaiCount: number,
  kontrakCount: number,
  bermasalahCount: number,
): DashboardAuditReadiness {
  const hpsReady = totalPaket;
  const pemilihanReady = Math.min(totalPaket, selesaiCount + kontrakCount);
  const bastReady = selesaiCount;
  const paymentReady = selesaiCount;
  const riskReady = Math.max(totalPaket - bermasalahCount, 0);
  const complete = hpsReady + pemilihanReady + bastReady + paymentReady + riskReady;
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
        complete: hpsReady,
        total: totalPaket,
        tone: toneFor(hpsReady, totalPaket),
      },
      {
        label: "Dokumen pemilihan",
        complete: pemilihanReady,
        total: totalPaket,
        tone: toneFor(pemilihanReady, totalPaket),
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

export async function getDashboardData(): Promise<DashboardData> {
  const [packageTable, goodsTable, contractTable] = await Promise.all([
    findTable(packageTables),
    findTable(goodsTables),
    findTable(contractTables),
  ]);

  const [
    budgetColumn,
    hpsColumn,
    contractValueColumn,
    packageCategoryColumn,
    sourceFundColumn,
    methodColumn,
    pdnColumn,
    statusColumn,
  ] = await Promise.all([
    findColumn(packageTable, budgetColumns),
    findColumn(packageTable, hpsColumns),
    findColumn(contractTable, contractValueColumns),
    findColumn(packageTable, categoryColumns),
    findColumn(packageTable, ["sumber_dana", "source_fund", "funding_source"]),
    findColumn(packageTable, methodColumns),
    findColumn(goodsTable, ["is_pdn", "pdn"]),
    findColumn(packageTable, statusColumns),
  ]);

  const [
    totalPaket,
    totalPagu,
    totalHps,
    totalNilaiKontrak,
    totalBarangKesehatan,
    totalPdn,
    deadlineDekat,
    tahunAnggaran,
  ] = await Promise.all([
    countRows(packageTable),
    sumColumn(packageTable, budgetColumn),
    sumColumn(packageTable, hpsColumn),
    sumColumn(contractTable, contractValueColumn),
    countRows(goodsTable),
    countBooleanTrue(goodsTable, pdnColumn),
    countNearDeadline(packageTable),
    latestYear(packageTable),
  ]);

  const [
    totalPaketBarangKesehatan,
    selesaiCount,
    kontrakCount,
    paketTerlambat,
    paketBermasalah,
    paketEKatalogV6,
    paketTenderNonTender,
    stages,
    categories,
    sourceFunds,
    methods,
    priorities,
    recentPackages,
    monthlyRealization,
  ] = await Promise.all([
    packageCategoryColumn
      ? countMatching(packageTable, packageCategoryColumn, [
          "kesehatan",
          "alkes",
          "obat",
          "bmhp",
          "reagen",
          "laboratorium",
        ])
      : Promise.resolve(totalBarangKesehatan),
    countExactOrLike(packageTable, statusColumn, ["SELESAI"]),
    countExactOrLike(packageTable, statusColumn, ["KONTRAK"]),
    countMatching(packageTable, statusColumn, delayedWords),
    countMatching(packageTable, statusColumn, problemWords),
    countExactOrLike(packageTable, methodColumn, eCatalogWords),
    countExactOrLike(packageTable, methodColumn, tenderNonTenderWords),
    getStages(packageTable, totalPaket),
    getCategories(packageTable, goodsTable),
    getSourceFundBreakdown(
      packageTable,
      sourceFundColumn,
      budgetColumn,
      totalPaket,
    ),
    getBreakdown(packageTable, methodColumn, budgetColumn, totalPaket),
    getPriorities(packageTable),
    getRecentPackages(packageTable),
    getMonthlyRealization(packageTable, budgetColumn, hpsColumn, tahunAnggaran),
  ]);
  const realisasiKontrakPercent =
    totalPagu > 0 ? Number(((totalNilaiKontrak / totalPagu) * 100).toFixed(1)) : 0;
  const timeline = buildTimeline(stages, totalPaket);
  const auditReadiness = buildAuditReadiness(
    totalPaket,
    selesaiCount,
    kontrakCount,
    paketBermasalah,
  );

  return {
    summary: {
      totalPaket,
      totalPaketBarangKesehatan,
      totalPagu,
      totalHps,
      totalNilaiKontrak,
      totalBarang: totalBarangKesehatan,
      totalPdn,
      paketTerlambat,
      deadlineDekat,
      paketBermasalah,
      paketEKatalogV6,
      paketTenderNonTender,
      realisasiKontrakPercent,
      tahunAnggaran,
    },
    stages,
    categories,
    sourceFunds,
    methods,
    priorities,
    recentPackages,
    monthlyRealization,
    timeline,
    auditReadiness,
  };
}
