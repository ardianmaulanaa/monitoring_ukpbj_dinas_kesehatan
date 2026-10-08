import Link from "next/link";

import {
  CircleDollarSign,
  ClipboardList,
  Landmark,
  PackageCheck,
  RotateCcw,
  Send,
  ShieldCheck,
  WalletCards,
} from "lucide-react";

import AppHeader from "@/components/appheader/AppHeader";

import { formatCurrency } from "@/lib/currency";

import { getDashboardData } from "@/lib/dashboard-data";

import type {
  DashboardBreakdown,
  DashboardFilters,
} from "@/lib/dashboard-data";

const chartPalette = [
  "#08783f",
  "#0ea5e9",
  "#f59e0b",
  "#64748b",
  "#10b981",
  "#94a3b8",
];

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

function numberLabel(value: number) {
  return value.toLocaleString("id-ID");
}

function selectValue(value?: string | number) {
  return value === undefined || value === null ? "" : String(value);
}

function parseFilters(
  searchParams: Record<string, string | string[] | undefined>,
) {
  const pick = (key: string) => {
    const value = searchParams[key];

    return Array.isArray(value) ? value[0] : value;
  };

  const tahun = Number(pick("tahunAnggaran"));

  return {
    ...(Number.isFinite(tahun) && tahun > 0 ? { tahunAnggaran: tahun } : {}),

    ...(pick("unit") ? { unit: pick("unit") } : {}),

    ...(pick("sumberDana") ? { sumberDana: pick("sumberDana") } : {}),

    ...(pick("metodePengadaan")
      ? { metodePengadaan: pick("metodePengadaan") }
      : {}),

    ...(pick("statusPaket") ? { statusPaket: pick("statusPaket") } : {}),
  } satisfies DashboardFilters;
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm font-semibold text-slate-500">
      {message}
    </div>
  );
}

function Panel({
  children,

  className = "",
}: {
  children: React.ReactNode;

  className?: string;
}) {
  return (
    <section
      className={`rounded-lg border border-slate-200 bg-white shadow-sm ${className}`}
    >
      {children}
    </section>
  );
}

function PanelHeader({
  eyebrow,

  title,

  value,
}: {
  eyebrow: string;

  title: string;

  value?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
      <div>
        <p className="text-[11px] font-black uppercase text-[#08783f]">
          {eyebrow}
        </p>

        <h2 className="mt-1 text-lg font-black text-slate-950">{title}</h2>
      </div>

      {value ? (
        <p className="text-sm font-black text-slate-500">{value}</p>
      ) : null}
    </div>
  );
}

function VerticalBar({
  value,
  max,
  color = "#08783f",
  title,
}: {
  value: number;
  max: number;
  color?: string;
  title: string;
}) {
  const height = max > 0 ? Math.max((value / max) * 100, value > 0 ? 8 : 0) : 0;

  return (
    <div
      className="mx-auto w-full min-w-[12px] max-w-[28px] rounded-t-lg transition-[height] duration-500"
      style={{ height: `${height}%`, backgroundColor: color }}
      title={title}
    />
  );
}

function VerticalBreakdownBars({
  items,
  valueLabel,
}: {
  items: DashboardBreakdown[];
  valueLabel: (item: DashboardBreakdown) => string;
}) {
  const max = Math.max(...items.map((item) => item.amount), 1);
  const minWidth = Math.max(items.length * 112, 420);

  return (
    <div className="overflow-x-auto pb-1">
      <div
        className="grid h-72 items-end gap-4"
        style={{
          minWidth,
          gridTemplateColumns: `repeat(${Math.max(items.length, 1)}, minmax(72px, 1fr))`,
        }}
      >
        {items.map((item, index) => {
          const height =
            max > 0
              ? Math.max((item.amount / max) * 100, item.amount > 0 ? 8 : 0)
              : 0;

          return (
            <div
              key={item.label}
              className="flex h-full min-w-0 flex-col justify-end"
            >
              <div className="flex min-h-0 flex-1 items-end justify-center">
                <div
                  className="w-full max-w-[76px] rounded-t-xl transition-[height] duration-500"
                  style={{
                    height: `${height}%`,
                    backgroundColor: chartPalette[index % chartPalette.length],
                  }}
                  title={`${item.label}: ${formatCurrency(item.amount)} · ${numberLabel(item.count)} paket`}
                />
              </div>
              <div className="pt-3 text-center">
                <p
                  className="truncate text-xs font-black text-slate-700"
                  title={item.label}
                >
                  {item.label}
                </p>
                <p className="mt-1 whitespace-nowrap text-[11px] font-bold text-slate-500">
                  {valueLabel(item)}
                </p>
                <p className="mt-0.5 text-[10px] font-semibold text-slate-400">
                  {numberLabel(item.count)} paket
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function donutGradient(items: DashboardBreakdown[]) {
  let cursor = 0;

  const totalPercent = items.reduce((sum, item) => sum + item.percent, 0);

  if (items.length === 0 || totalPercent === 0) return "#e2e8f0 0 100%";

  return items

    .map((item, index) => {
      const start = cursor;

      const size = item.percent || 0;

      cursor += size;

      return `${chartPalette[index % chartPalette.length]} ${start}% ${cursor}%`;
    })

    .join(", ");
}

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) ?? {};

  const dashboard = await getDashboardData(parseFilters(params));

  const { summary } = dashboard;

  const maxFinancial = Math.max(
    ...dashboard.monthlyFinancials.map((item) =>
      Math.max(item.pagu, item.kontrak, item.realisasi),
    ),

    1,
  );

  const totalMethods = dashboard.methods.reduce(
    (sum, item) => sum + item.count,
    0,
  );

  const stageCount = (key: string) =>
    dashboard.stages.find((item) => item.key === key)?.count ?? 0;

  const statusCards = [
    {
      label: "Verifikasi",

      value: stageCount("verification"),

      helper: "Menunggu telaah",

      href: "/verifikasi",

      icon: ShieldCheck,

      color: "text-[#08783f]",
    },

    {
      label: "Siap RUP",

      value: stageCount("rup"),

      helper: "Siap tayang",

      href: "/sirup-rup",

      icon: ClipboardList,

      color: "text-sky-600",
    },

    {
      label: "Negosiasi",

      value: stageCount("selection"),

      helper: "Pemilihan penyedia",

      href: "/e-purchasing",

      icon: Send,

      color: "text-amber-600",
    },

    {
      label: "Pembayaran",

      value: stageCount("payment"),

      helper: "Dokumen realisasi",

      href: "/realisasi-belanja",

      icon: WalletCards,

      color: "text-emerald-600",
    },
  ];

  const headlineMetrics = [
    {
      label: "Total Pagu",

      value: formatCompactCurrency(summary.totalPagu),

      helper: `${numberLabel(summary.totalPaket)} paket TA ${summary.tahunAnggaran}`,

      icon: Landmark,
    },

    {
      label: "Nilai Kontrak",

      value: formatCompactCurrency(summary.totalNilaiKontrak),

      helper: `${summary.realisasiKontrakPercent.toLocaleString("id-ID")}% dari pagu`,

      icon: PackageCheck,
    },

    {
      label: "Realisasi",

      value: formatCompactCurrency(summary.totalRealisasi),

      helper: `Serapan ${summary.realisasiPercent.toLocaleString("id-ID")}%`,

      icon: CircleDollarSign,
    },
    {
      label: "Efisiensi",
      value: formatCompactCurrency(dashboard.efficiency.totalSaving),
      helper:
        dashboard.efficiency.eligibleCount > 0
          ? `${dashboard.efficiency.savingRate.toLocaleString("id-ID")}% · ${numberLabel(dashboard.efficiency.eligibleCount)} paket`
          : "Belum ada harga final valid",
      icon: WalletCards,
    },
  ];

  return (
    <>
      <AppHeader title="Dashboard Utama" />

      <main className="bg-[#f4f7f5]">
        <div className="px-4 py-5 sm:px-6 lg:px-8">
          <form className="mb-5 flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm xl:flex-row xl:items-center">
            <div className="flex min-w-0 flex-1 flex-col gap-3 md:grid md:grid-cols-5">
              <select
                name="tahunAnggaran"
                defaultValue={selectValue(dashboard.filters.tahunAnggaran)}
                className="h-10 min-w-0 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none focus:border-[#08783f]"
              >
                {dashboard.filterOptions.years.map((year) => (
                  <option key={year} value={year}>
                    Tahun {year}
                  </option>
                ))}
              </select>

              <select
                name="unit"
                defaultValue={selectValue(dashboard.filters.unit)}
                className="h-10 min-w-0 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none focus:border-[#08783f]"
              >
                <option value="">Semua Unit</option>

                {dashboard.filterOptions.units.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>

              <select
                name="sumberDana"
                defaultValue={selectValue(dashboard.filters.sumberDana)}
                className="h-10 min-w-0 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none focus:border-[#08783f]"
              >
                <option value="">Semua Sumber Dana</option>

                {dashboard.filterOptions.sources.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>

              <select
                name="metodePengadaan"
                defaultValue={selectValue(dashboard.filters.metodePengadaan)}
                className="h-10 min-w-0 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none focus:border-[#08783f]"
              >
                <option value="">Semua Metode</option>

                {dashboard.filterOptions.methods.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>

              <select
                name="statusPaket"
                defaultValue={selectValue(dashboard.filters.statusPaket)}
                className="h-10 min-w-0 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none focus:border-[#08783f]"
              >
                <option value="">Semua Status</option>

                {dashboard.filterOptions.statuses.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2 xl:ml-auto">
              <button
                type="submit"
                className="inline-flex h-10 flex-1 items-center justify-center rounded-lg bg-[#08783f] px-4 text-sm font-black text-white shadow-sm xl:flex-none"
              >
                Filter
              </button>

              <Link
                href="/dashboard"
                className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-slate-500 shadow-sm"
                aria-label="Reset filter"
              >
                <RotateCcw className="h-4 w-4" />
              </Link>
            </div>
          </form>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {statusCards.map((card) => {
              const Icon = card.icon;

              return (
                <Link
                  key={card.label}
                  href={card.href}
                  className="rounded-lg border border-slate-200 bg-white px-5 py-4 shadow-sm transition hover:border-[#08783f]/40 hover:shadow-md"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-slate-100 bg-slate-50">
                      <span className={`text-2xl font-black ${card.color}`}>
                        {numberLabel(card.value)}
                      </span>
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-base font-black text-slate-900">
                        {card.label}
                      </p>

                      <p className="mt-1 truncate text-xs font-semibold text-slate-500">
                        {card.helper}
                      </p>
                    </div>

                    <Icon className="ml-auto h-5 w-5 shrink-0 text-slate-300" />
                  </div>
                </Link>
              );
            })}
          </section>

          <section className="mt-5 grid gap-5 xl:grid-cols-[2fr_1fr]">
            <Panel>
              <PanelHeader
                eyebrow="Ringkasan Nilai"
                title="Pagu, Kontrak, dan Realisasi"
                value={`TA ${summary.tahunAnggaran}`}
              />

              <div className="p-5">
                <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
                  {headlineMetrics.map((item) => {
                    const Icon = item.icon;

                    return (
                      <div
                        key={item.label}
                        className="rounded-lg bg-slate-50 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-xs font-black uppercase text-slate-400">
                            {item.label}
                          </p>

                          <Icon className="h-5 w-5 text-[#08783f]" />
                        </div>

                        <p className="mt-2 text-2xl font-black text-slate-950">
                          {item.value}
                        </p>

                        <p className="mt-1 text-xs font-semibold text-slate-500">
                          {item.helper}
                        </p>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-5 overflow-x-auto rounded-xl border border-slate-100 bg-slate-50">
                  <div
                    className="grid h-96 min-w-[960px] grid-cols-12 items-end gap-3 px-5 pb-5 pt-7"
                    style={{
                      backgroundImage:
                        "linear-gradient(to top, rgba(148,163,184,0.16) 1px, transparent 1px)",
                      backgroundSize: "100% 25%",
                    }}
                  >
                    {dashboard.monthlyFinancials.map((item) => (
                      <div
                        key={item.month}
                        className="flex h-full min-w-0 flex-col justify-end gap-2"
                      >
                        <div className="flex min-h-0 flex-1 items-end justify-center gap-1.5">
                          <VerticalBar
                            value={item.pagu}
                            max={maxFinancial}
                            color="#08783f"
                            title={`Pagu ${item.month}: ${formatCurrency(item.pagu)}`}
                          />
                          <VerticalBar
                            value={item.kontrak}
                            max={maxFinancial}
                            color="#0ea5e9"
                            title={`Nilai kontrak ${item.month}: ${formatCurrency(item.kontrak)}`}
                          />
                          <VerticalBar
                            value={item.realisasi}
                            max={maxFinancial}
                            color="#10b981"
                            title={`Realisasi ${item.month}: ${formatCurrency(item.realisasi)}`}
                          />
                        </div>
                        <span className="text-center text-[11px] font-black text-slate-500">
                          {item.month}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-4 text-xs font-bold text-slate-600">
                  <span>
                    <span className="text-[#08783f]">■</span> Pagu
                  </span>

                  <span>
                    <span className="text-sky-500">■</span> Nilai Kontrak
                  </span>

                  <span>
                    <span className="text-emerald-500">■</span> Realisasi
                  </span>
                </div>
              </div>
            </Panel>

            <Panel>
              <PanelHeader
                eyebrow="Sumber Dana"
                title="Distribusi Pagu"
                value={formatCompactCurrency(summary.totalPagu)}
              />

              <div className="p-5">
                {dashboard.sourceFunds.length > 0 ? (
                  <VerticalBreakdownBars
                    items={dashboard.sourceFunds}
                    valueLabel={(item) => formatCompactCurrency(item.amount)}
                  />
                ) : (
                  <EmptyState message="Belum ada data sumber dana." />
                )}
              </div>
            </Panel>
          </section>

          <section className="mt-5 grid gap-5 xl:grid-cols-3">
            <Panel>
              <PanelHeader eyebrow="Per Unit" title="Sebaran Nilai Pagu" />

              <div className="p-5">
                {dashboard.unitBreakdown.length > 0 ? (
                  <VerticalBreakdownBars
                    items={dashboard.unitBreakdown}
                    valueLabel={(item) => `${item.percent}%`}
                  />
                ) : (
                  <EmptyState message="Belum ada data unit." />
                )}
              </div>
            </Panel>

            <Panel>
              <PanelHeader
                eyebrow="Metode Pengadaan"
                title="Komposisi Metode"
                value={`${numberLabel(totalMethods)} paket`}
              />

              <div className="p-5">
                {dashboard.methods.length > 0 ? (
                  <>
                    <div
                      className="mx-auto flex h-52 w-52 items-center justify-center rounded-full"
                      style={{
                        background: `conic-gradient(${donutGradient(dashboard.methods)})`,
                      }}
                    >
                      <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full bg-white text-center shadow-inner">
                        <p className="text-2xl font-black text-slate-950">
                          {numberLabel(totalMethods)}
                        </p>

                        <p className="mt-1 text-xs font-black uppercase text-slate-400">
                          Paket
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                      {dashboard.methods.slice(0, 6).map((item, index) => (
                        <div
                          key={item.label}
                          className="flex items-start gap-3"
                        >
                          <span
                            className="mt-1 h-3 w-3 shrink-0 rounded-full"
                            style={{
                              backgroundColor:
                                chartPalette[index % chartPalette.length],
                            }}
                          />

                          <div className="min-w-0">
                            <p className="truncate text-sm font-black text-slate-800">
                              {item.percent}% - {item.label}
                            </p>

                            <p className="mt-1 text-xs font-semibold text-slate-500">
                              {numberLabel(item.count)} paket ·{" "}
                              {formatCompactCurrency(item.amount)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <EmptyState message="Belum ada data metode pengadaan." />
                )}
              </div>
            </Panel>

            <Panel>
              <PanelHeader
                eyebrow="Aktivitas / User"
                title="Transaksi Pengguna"
              />

              <div className="p-5">
                {dashboard.activityActors.length > 0 ? (
                  <div className="space-y-5">
                    {dashboard.activityActors.map((item, index) => (
                      <div
                        key={item.label}
                        className="grid grid-cols-[minmax(0,96px)_1fr_42px] items-center gap-3"
                      >
                        <p className="truncate text-sm font-black text-slate-700">
                          {item.label}
                        </p>

                        <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${item.percent}%`,

                              backgroundColor:
                                chartPalette[index % chartPalette.length],
                            }}
                            title={`${item.label}: ${numberLabel(item.count)} aktivitas`}
                          />
                        </div>

                        <p className="text-right text-sm font-black text-slate-900">
                          {numberLabel(item.count)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState message="Belum ada aktivitas pengguna yang dapat ditampilkan." />
                )}
              </div>
            </Panel>
          </section>

          <section className="mt-5 grid gap-5 xl:grid-cols-[1fr_1fr_1fr]">
            <Panel>
              <PanelHeader
                eyebrow="Perlu Tindakan"
                title="Tindak Lanjut Prioritas"
              />

              <div className="space-y-3 p-5">
                {dashboard.attentionItems.length > 0 ? (
                  dashboard.attentionItems.slice(0, 4).map((item) => {
                    const content = (
                      <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black text-slate-800">
                            {item.label}
                          </p>

                          <p className="mt-1 text-xs font-semibold text-slate-500">
                            Perlu diproses
                          </p>
                        </div>

                        <p className="text-xl font-black text-[#08783f]">
                          {numberLabel(item.count)}
                        </p>
                      </div>
                    );

                    return item.href ? (
                      <Link key={item.label} href={item.href}>
                        {content}
                      </Link>
                    ) : (
                      <div key={item.label}>{content}</div>
                    );
                  })
                ) : (
                  <EmptyState message="Tidak ada paket yang memerlukan perhatian saat ini." />
                )}
              </div>
            </Panel>

            <Panel>
              <PanelHeader eyebrow="Efisiensi" title="Pagu vs Nilai Final" />

              <div className="p-5">
                {dashboard.efficiency.eligibleCount > 0 ? (
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                    <div className="rounded-lg bg-slate-50 p-4">
                      <p className="text-xs font-black uppercase text-slate-400">
                        Pagu
                      </p>

                      <p className="mt-2 text-xl font-black text-slate-950">
                        {formatCompactCurrency(dashboard.efficiency.totalPagu)}
                      </p>
                    </div>

                    <div className="rounded-lg bg-slate-50 p-4">
                      <p className="text-xs font-black uppercase text-slate-400">
                        Nilai Final
                      </p>

                      <p className="mt-2 text-xl font-black text-slate-950">
                        {formatCompactCurrency(dashboard.efficiency.totalFinal)}
                      </p>
                    </div>

                    <div className="rounded-lg bg-emerald-50 p-4">
                      <p className="text-xs font-black uppercase text-emerald-700">
                        Efisiensi
                      </p>

                      <p className="mt-2 text-xl font-black text-emerald-700">
                        {formatCompactCurrency(
                          dashboard.efficiency.totalSaving,
                        )}
                      </p>
                    </div>

                    <div className="rounded-lg bg-emerald-50 p-4">
                      <p className="text-xs font-black uppercase text-emerald-700">
                        Saving Rate
                      </p>

                      <p className="mt-2 text-xl font-black text-emerald-700">
                        {dashboard.efficiency.savingRate.toLocaleString(
                          "id-ID",
                        )}
                        %
                      </p>
                    </div>
                  </div>
                ) : (
                  <EmptyState message="Belum ada harga final valid untuk menghitung efisiensi." />
                )}
              </div>
            </Panel>

            <Panel>
              <PanelHeader
                eyebrow="Aktivitas Terbaru"
                title="Pergerakan Terakhir"
              />

              <div className="divide-y divide-slate-100 px-5 py-2">
                {dashboard.activities.length > 0 ? (
                  dashboard.activities.slice(0, 5).map((item, index) => {
                    const content = (
                      <div className="grid grid-cols-[48px_minmax(0,1fr)] gap-3 py-3">
                        <p className="text-sm font-black text-slate-500">
                          {item.time}
                        </p>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-black text-slate-900">
                            {item.title}
                          </p>

                          <p className="mt-1 truncate text-xs font-semibold text-slate-500">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    );

                    return item.href ? (
                      <Link
                        key={`${item.time}-${item.title}-${index}`}
                        href={item.href}
                      >
                        {content}
                      </Link>
                    ) : (
                      <div key={`${item.time}-${item.title}-${index}`}>
                        {content}
                      </div>
                    );
                  })
                ) : (
                  <div className="py-5">
                    <EmptyState message="Belum ada aktivitas terbaru yang dapat ditampilkan." />
                  </div>
                )}
              </div>
            </Panel>
          </section>
        </div>
      </main>
    </>
  );
}
