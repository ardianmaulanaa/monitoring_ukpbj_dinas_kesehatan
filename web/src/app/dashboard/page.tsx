import type { ReactNode } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  BadgeCheck,
  CircleDollarSign,
  ClipboardCheck,
  FileSignature,
  Landmark,
} from "lucide-react";
import AppHeader from "@/components/appheader/AppHeader";
import {
  DashboardDonutChart,
  DashboardMonthlyPackageChart,
  DashboardTrendChart,
} from "@/components/dashboard/DashboardCharts";
import { getDashboardData } from "@/lib/dashboard-data";
import type {
  DashboardBreakdown,
  DashboardFilters,
} from "@/lib/dashboard-data";

function parseFilters(params: Record<string, string | string[] | undefined>) {
  const value = (key: string) =>
    Array.isArray(params[key]) ? params[key]?.[0] : params[key];
  const year = Number(value("tahunAnggaran"));
  return {
    ...(Number.isFinite(year) && year > 0 ? { tahunAnggaran: year } : {}),
    ...(value("unit") ? { unit: value("unit") } : {}),
    ...(value("sumberDana") ? { sumberDana: value("sumberDana") } : {}),
  } satisfies DashboardFilters;
}

function money(value: number) {
  if (value >= 1_000_000_000)
    return `Rp ${(value / 1_000_000_000).toLocaleString("id-ID", { maximumFractionDigits: 2 })} M`;
  if (value >= 1_000_000)
    return `Rp ${(value / 1_000_000).toLocaleString("id-ID", { maximumFractionDigits: 1 })} Jt`;
  if (value >= 1_000)
    return `Rp ${(value / 1_000).toLocaleString("id-ID", { maximumFractionDigits: 1 })} Rb`;
  return `Rp ${value.toLocaleString("id-ID")}`;
}

function percent(value: number) {
  return `${value.toLocaleString("id-ID", { maximumFractionDigits: 1 })}%`;
}
function count(value: number) {
  return value.toLocaleString("id-ID");
}

function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-[#dee9e2] bg-white shadow-[0_1px_2px_rgba(20,45,37,0.04)] ${className}`}
    >
      {children}
    </section>
  );
}

function KpiCard({
  label,
  value,
  helper,
  progress,
  color,
  icon: Icon,
}: {
  label: string;
  value: string;
  helper: string;
  progress: number | null;
  color: string;
  icon: typeof Landmark;
}) {
  return (
    <Card className="group flex min-h-40 min-w-0 flex-col p-5 transition duration-200 hover:-translate-y-0.5 hover:border-[#bfe5cf] hover:shadow-[0_8px_24px_rgba(20,45,37,0.07)]">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#64796f]">
          {label}
        </p>
        <Icon className="h-4 w-4 shrink-0 opacity-80" style={{ color }} />
      </div>
      <p
        className="mt-3 truncate text-[clamp(1.35rem,1.8vw,1.75rem)] font-black tracking-tight text-[#142d25]"
        title={value}
      >
        {value}
      </p>
      <p className="mt-1 min-h-8 text-xs leading-4 text-[#64796f]">{helper}</p>
      <div
        className="mt-auto h-1.5 overflow-hidden rounded-full bg-[#e9efeb]"
        aria-label={
          progress === null
            ? "Data progres belum tersedia"
            : `Progres ${progress}%`
        }
      >
        {progress !== null ? (
          <div
            className="h-full rounded-full transition-[width] duration-500"
            style={{
              width: `${Math.min(Math.max(progress, 0), 100)}%`,
              backgroundColor: color,
            }}
          />
        ) : null}
      </div>
    </Card>
  );
}

function Heading({ children, badge }: { children: ReactNode; badge?: string }) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-lg font-black text-[#142d25]">{children}</h2>
      {badge ? (
        <span className="rounded-full bg-[#e8f7ee] px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-[#087f4f]">
          {badge}
        </span>
      ) : null}
    </div>
  );
}

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const dashboard = await getDashboardData(
    parseFilters((await searchParams) ?? {}),
  );
  const { summary, efficiency, procurementSummary } = dashboard;
  const stageGroups = [
    { label: "Perencanaan", keys: ["planning", "rup"] },
    { label: "Verifikasi / Persiapan", keys: ["verification"] },
    { label: "Pemilihan", keys: ["selection"] },
    { label: "Kontrak", keys: ["contract"] },
    { label: "Pelaksanaan", keys: ["delivery", "bast", "payment"] },
    { label: "Selesai", keys: ["done"] },
  ];
  const stageItems: DashboardBreakdown[] = stageGroups.map((group) => {
    const stageCount = dashboard.stages
      .filter((stage) => group.keys.includes(stage.key))
      .reduce((sum, stage) => sum + stage.count, 0);
    return {
      label: group.label,
      count: stageCount,
      amount: stageCount,
      percent:
        summary.totalPaket > 0
          ? Number(((stageCount / summary.totalPaket) * 100).toFixed(1))
          : 0,
    };
  });
  const fundingNames = ["APBD", "BLUD", "DBHCHT"];
  const fundingCards = fundingNames.map(
    (name) =>
      dashboard.sourceFunds.find(
        (item) => item.label.trim().toUpperCase() === name,
      ) ?? { label: name, count: 0, amount: 0, percent: 0 },
  );
  const kpis = [
    {
      label: "Total Pagu RUP",
      value: money(summary.totalPagu),
      helper: `${count(summary.totalPaket)} paket direncanakan`,
      progress: null,
      color: "#087f4f",
      icon: Landmark,
    },
    {
      label: "Total Realisasi",
      value: money(summary.totalRealisasi),
      helper: `${percent(summary.realisasiPercent)} dari pagu`,
      progress: summary.realisasiPercent,
      color: "#16834c",
      icon: CircleDollarSign,
    },
    {
      label: "Nilai Kontrak",
      value: money(summary.totalNilaiKontrak),
      helper: `${count(procurementSummary.contractedPackages)} paket bernilai final`,
      progress: summary.realisasiKontrakPercent,
      color: "#28674e",
      icon: FileSignature,
    },
    {
      label: "Efisiensi Pengadaan",
      value: efficiency.eligibleCount
        ? money(efficiency.totalSaving)
        : "Belum tersedia",
      helper: efficiency.eligibleCount
        ? `${percent(efficiency.savingRate)} dari ${count(efficiency.eligibleCount)} paket valid`
        : "Belum ada pagu dan nilai final pembanding",
      progress: efficiency.eligibleCount ? efficiency.savingRate : null,
      color: "#2f8069",
      icon: BadgeCheck,
    },
    {
      label: "Paket Selesai",
      value: count(summary.paketSelesai),
      helper: `${percent(summary.selesaiPercent)} dari seluruh paket`,
      progress: summary.selesaiPercent,
      color: "#16834c",
      icon: ClipboardCheck,
    },
    {
      label: "Paket Berisiko",
      value: count(summary.paketBermasalah),
      helper: "Revisi, kendala, gagal, atau batal tercatat",
      progress: summary.totalPaket
        ? (summary.paketBermasalah / summary.totalPaket) * 100
        : 0,
      color: "#c24141",
      icon: AlertTriangle,
    },
  ];

  return (
    <>
      <AppHeader title="Dashboard Pengadaan" />
      <main className="dashboard-command min-h-dvh bg-[#f6f9f7] text-[#253d34]">
        <div className="mx-auto max-w-[1800px] px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
          <Card className="min-w-0 overflow-visible p-5 sm:p-6">
            <h1 className="text-base font-black text-[#142d25] sm:text-lg">
              Jumlah Paket per Bulan
            </h1>
            <p className="mb-4 mt-1 text-xs text-[#64796f] sm:text-sm">
              Berdasarkan tanggal paket dimasukkan ke sistem.
            </p>
            <DashboardMonthlyPackageChart data={dashboard.monthlyPackages} />
          </Card>

          <section className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
            {kpis.map((item) => (
              <KpiCard key={item.label} {...item} />
            ))}
          </section>

          <section className="mt-8">
            <Heading>Ringkasan Pengadaan</Heading>
            <div className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-3">
              <Card className="min-w-0 p-5">
                <h3 className="mb-1 text-sm font-black text-[#142d25]">
                  Distribusi Pagu Berdasarkan Sumber Dana
                </h3>
                <p className="mb-4 text-xs text-[#64796f]">
                  Proporsi pagu paket dalam cakupan filter aktif.
                </p>
                <DashboardDonutChart
                  items={dashboard.sourceFunds}
                  valueKind="amount"
                />
              </Card>
              <Card className="min-w-0 p-5">
                <h3 className="mb-1 text-sm font-black text-[#142d25]">
                  Tren Pagu dan Realisasi Bulanan
                </h3>
                <p className="mb-4 text-xs text-[#64796f]">
                  Kumulatif berdasarkan tanggal pencatatan dan pembayaran yang
                  valid.
                </p>
                <DashboardTrendChart data={dashboard.monthlyRealization} />
              </Card>
              <Card className="min-w-0 p-5 xl:col-span-2 2xl:col-span-1">
                <h3 className="mb-1 text-sm font-black text-[#142d25]">
                  Distribusi Paket Berdasarkan Tahap Pengadaan
                </h3>
                <p className="mb-4 text-xs text-[#64796f]">
                  Satu paket hanya muncul pada tahap terkini.
                </p>
                <DashboardDonutChart items={stageItems} valueKind="count" />
              </Card>
            </div>
          </section>

          <section className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
            {fundingCards.map((item) => {
              const realization =
                dashboard.sourceRealizations.find(
                  (source) => source.label === item.label,
                )?.amount ?? 0;
              const rate =
                item.amount > 0 ? (realization / item.amount) * 100 : 0;
              return (
                <Card key={item.label} className="p-5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#64796f]">
                    {item.label}
                  </p>
                  <p className="mt-2 text-xl font-black text-[#087f4f]">
                    {money(item.amount)}
                  </p>
                  <p className="mt-1 text-xs text-[#64796f]">
                    {count(item.count)} paket · realisasi {percent(rate)}
                  </p>
                </Card>
              );
            })}
            <Link href="/e-purchasing">
              <Card className="h-full p-5 transition hover:border-[#bfe5cf] hover:bg-[#f8fbf9]">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#64796f]">
                  E-Purchasing
                </p>
                <p className="mt-2 text-xl font-black text-[#087f4f]">
                  {count(procurementSummary.ePurchasing.total)} paket
                </p>
                <p className="mt-1 text-xs leading-5 text-[#64796f]">
                  {money(procurementSummary.ePurchasing.amount)}
                  <br />
                  Siap {procurementSummary.ePurchasing.ready} · Proses{" "}
                  {procurementSummary.ePurchasing.active} · Selesai{" "}
                  {procurementSummary.ePurchasing.done}
                </p>
              </Card>
            </Link>
            <Link href="/tender-non-tender">
              <Card className="h-full p-5 transition hover:border-[#bfe5cf] hover:bg-[#f8fbf9]">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#64796f]">
                  Tender
                </p>
                <p className="mt-2 text-xl font-black text-[#28674e]">
                  {count(procurementSummary.tender.total)} paket
                </p>
                <p className="mt-1 text-xs leading-5 text-[#64796f]">
                  {money(procurementSummary.tender.amount)}
                  <br />
                  Proses {procurementSummary.tender.active} · Selesai{" "}
                  {procurementSummary.tender.done}
                </p>
              </Card>
            </Link>
            <Link href="/pengadaan-langsung">
              <Card className="h-full p-5 transition hover:border-[#bfe5cf] hover:bg-[#f8fbf9]">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#64796f]">Pengadaan Langsung</p>
                <p className="mt-2 text-xl font-black text-[#087f4f]">{count(procurementSummary.pengadaanLangsung.total)} paket</p>
                <p className="mt-1 text-xs leading-5 text-[#64796f]">{money(procurementSummary.pengadaanLangsung.amount)}<br />Proses {procurementSummary.pengadaanLangsung.active} · Selesai {procurementSummary.pengadaanLangsung.done}</p>
              </Card>
            </Link>
            {procurementSummary.legacyNonTender.total > 0 ? <Card className="p-5"><p className="text-[11px] font-bold uppercase tracking-wider text-[#64796f]">Arsip Non Tender</p><p className="mt-2 text-xl font-black text-slate-700">{count(procurementSummary.legacyNonTender.total)} paket</p><p className="mt-1 text-xs text-[#64796f]">Dipertahankan tanpa reklasifikasi otomatis</p></Card> : null}
            <Card className="p-5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#64796f]">
                Paket Gagal / Batal
              </p>
              <p className="mt-2 text-xl font-black text-[#c24141]">
                {count(procurementSummary.failedOrCancelled)}
              </p>
              <p className="mt-1 text-xs text-[#64796f]">
                Berdasarkan kendala dan status workflow aktual
              </p>
            </Card>
          </section>
        </div>
      </main>
    </>
  );
}
