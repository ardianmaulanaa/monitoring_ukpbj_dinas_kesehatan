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
import { calculatePercentage, clampPercentage } from "@/lib/percentage";
import type {
  DashboardBreakdown,
  DashboardFilters,
  DashboardNegotiationAnalysis,
} from "@/lib/dashboard-data";

export const dynamic = "force-dynamic";

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

function fullMoney(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
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
  progressDetail,
  color,
  icon: Icon,
}: {
  label: string;
  value: string;
  helper: string;
  progress: number;
  progressDetail: string;
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
      <PercentageProgressBar
        value={progress}
        color={color}
        label={label}
        detail={progressDetail}
      />
    </Card>
  );
}

function PercentageProgressBar({
  value,
  color,
  label,
  detail,
}: {
  value: number;
  color: string;
  label: string;
  detail?: string;
}) {
  const safeValue = Number.isFinite(value) ? value : 0;
  const valueLabel = percent(safeValue);

  return (
    <div className="mt-auto pt-3" title={detail}>
      <div className="mb-2 flex items-end justify-between gap-3">
        <span className="min-w-0 text-[11px] font-medium text-[#64796f]">
          {detail ?? label}
        </span>
        <strong
          className="shrink-0 text-xl font-bold leading-none sm:text-2xl"
          style={{ color }}
        >
          {valueLabel}
        </strong>
      </div>
      <div
        className="h-2.5 overflow-hidden rounded-full bg-[#e9efeb]"
        role="progressbar"
        aria-label={label}
        aria-valuenow={safeValue}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full transition-[width] duration-500 ease-out"
          style={{
            width: `${clampPercentage(safeValue)}%`,
            backgroundColor: color,
          }}
        />
      </div>
    </div>
  );
}

function FundingSourceCard({
  item,
  realization,
}: {
  item: DashboardBreakdown;
  realization: number;
}) {
  const realizationRate = calculatePercentage(realization, item.amount);

  return (
    <Card className="flex min-h-52 min-w-0 flex-col p-5">
      <p className="text-[11px] font-bold uppercase tracking-wider text-[#64796f]">
        {item.label}
      </p>
      <p
        className="mt-2 truncate text-2xl font-black text-[#087f4f]"
        title={money(item.amount)}
      >
        {money(item.amount)}
      </p>
      <p className="mt-1 text-xs text-[#64796f]">{count(item.count)} paket</p>
      <p className="mt-3 text-xs font-semibold text-[#3f5b50]">
        Kontribusi pagu: {percent(item.percent)}
      </p>
      <PercentageProgressBar
        value={realizationRate}
        color="#16834c"
        label={`Realisasi ${item.label}`}
        detail="Realisasi ÷ pagu sumber dana"
      />
    </Card>
  );
}

type MethodSummary = {
  total: number;
  amount: number;
  active: number;
  done: number;
  ready?: number;
};

function ProcurementMethodCard({
  label,
  href,
  data,
  totalPackages,
  color = "#087f4f",
}: {
  label: string;
  href?: string;
  data: MethodSummary;
  totalPackages: number;
  color?: string;
}) {
  const completionRate = calculatePercentage(data.done, data.total);
  const contributionRate = calculatePercentage(data.total, totalPackages);
  const card = (
    <Card className="flex min-h-52 min-w-0 flex-col p-5 transition hover:border-[#bfe5cf] hover:bg-[#f8fbf9]">
      <p className="text-[11px] font-bold uppercase tracking-wider text-[#64796f]">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black" style={{ color }}>
        {count(data.total)} paket
      </p>
      <p className="mt-1 text-xs leading-5 text-[#64796f]">
        {money(data.amount)}
        <br />
        {data.ready !== undefined ? `Siap ${data.ready} · ` : ""}Proses{" "}
        {data.active} · Selesai {data.done}
      </p>
      <p className="mt-3 text-xs font-semibold text-[#3f5b50]">
        Kontribusi paket: {percent(contributionRate)}
      </p>
      <PercentageProgressBar
        value={completionRate}
        color={color}
        label={`Penyelesaian ${label}`}
        detail="Paket selesai ÷ total paket metode"
      />
    </Card>
  );

  return href ? <Link href={href}>{card}</Link> : card;
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

function NegotiationAnalysis({
  data,
}: {
  data: DashboardNegotiationAnalysis;
}) {
  if (data.validPackageCount === 0) {
    return (
      <Card className="mt-8 min-w-0 p-5 sm:p-6">
        <Heading badge="Data aktual">Analisis Negosiasi Pengadaan</Heading>
        <p className="text-sm text-[#64796f]">
          Perbandingan nilai penawaran awal dan hasil kesepakatan negosiasi
          seluruh paket pengadaan.
        </p>
        <div className="mt-5 rounded-2xl border border-dashed border-[#cbdad1] bg-[#f8fbf9] p-6 text-center">
          <p className="font-bold text-[#253d34]">
            Belum ada pasangan data negosiasi yang valid.
          </p>
          <p className="mt-1 text-xs leading-5 text-[#64796f]">
            Paket baru dihitung ketika nilai awal dan final positif serta tahap
            negosiasinya telah selesai.
          </p>
        </div>
        {data.excludedPackageCount > 0 ? (
          <details className="mt-4 text-xs text-[#64796f]">
            <summary className="cursor-pointer font-semibold text-[#3f5b50]">
              {count(data.excludedPackageCount)} paket dikecualikan
            </summary>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {data.excludedReasons.map((reason) => (
                <li key={reason.label}>
                  {reason.label}: {count(reason.count)} paket
                </li>
              ))}
            </ul>
          </details>
        ) : null}
      </Card>
    );
  }

  const isIncrease = data.savingTotal < 0;
  const metricCards = [
    {
      label: "Total Penawaran Awal",
      value: data.initialTotal,
      color: "#142d25",
    },
    {
      label: "Total Hasil Negosiasi",
      value: data.finalTotal,
      color: "#087f4f",
    },
    {
      label: isIncrease
        ? "Kenaikan Hasil Negosiasi"
        : "Total Penghematan Negosiasi",
      value: Math.abs(data.savingTotal),
      color: isIncrease ? "#c24141" : "#16834c",
    },
  ];

  return (
    <Card className="mt-8 min-w-0 p-5 sm:p-6">
      <Heading badge="Data aktual">Analisis Negosiasi Pengadaan</Heading>
      <p className="text-sm text-[#64796f]">
        Perbandingan nilai penawaran awal dan hasil kesepakatan negosiasi
        seluruh paket pengadaan.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((metric) => (
          <div
            key={metric.label}
            className="min-w-0 rounded-2xl border border-[#e1ebe5] bg-[#f8fbf9] p-4"
            title={fullMoney(metric.value)}
          >
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#64796f]">
              {metric.label}
            </p>
            <p
              className="mt-2 truncate text-xl font-black sm:text-2xl"
              style={{ color: metric.color }}
            >
              {money(metric.value)}
            </p>
          </div>
        ))}
        <div className="min-w-0 rounded-2xl border border-[#e1ebe5] bg-[#f8fbf9] p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#64796f]">
            Efisiensi Hasil Negosiasi
          </p>
          <p
            className="mt-2 text-2xl font-black sm:text-[1.75rem]"
            style={{ color: isIncrease ? "#c24141" : "#16834c" }}
          >
            {percent(Math.abs(data.efficiencyRate))}
          </p>
          <p className="mt-1 text-xs text-[#64796f]">
            {isIncrease ? "kenaikan" : "penurunan"} dari penawaran awal
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-[#e1ebe5] p-4 sm:p-5">
        <div className="space-y-5">
          <div>
            <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
              <span className="text-xs font-bold text-[#3f5b50]">
                Total Penawaran Awal
              </span>
              <span className="text-lg font-black text-[#475569]">100%</span>
            </div>
            <div className="h-3.5 overflow-hidden rounded-full bg-[#e9efeb]">
              <div className="h-full w-full rounded-full bg-[#64796f]" />
            </div>
          </div>
          <div>
            <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
              <span className="text-xs font-bold text-[#3f5b50]">
                Total Negosiasi Final
              </span>
              <span
                className="text-lg font-black"
                style={{ color: isIncrease ? "#c24141" : "#087f4f" }}
              >
                {percent(data.finalToInitialRate)}
              </span>
            </div>
            <div
              className="h-3.5 overflow-hidden rounded-full bg-[#e9efeb]"
              role="progressbar"
              aria-label="Nilai negosiasi final dibanding penawaran awal"
              aria-valuenow={data.finalToInitialRate}
              aria-valuemin={0}
              aria-valuemax={Math.max(100, data.finalToInitialRate)}
            >
              <div
                className="h-full rounded-full transition-[width] duration-500 ease-out"
                style={{
                  width: `${clampPercentage(data.finalToInitialRate)}%`,
                  backgroundColor: isIncrease ? "#c24141" : "#087f4f",
                }}
              />
            </div>
          </div>
        </div>
        <div
          className={`mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl px-3 py-2 text-xs font-bold ${
            isIncrease
              ? "bg-[#fff1f1] text-[#a73535]"
              : "bg-[#e8f7ee] text-[#087f4f]"
          }`}
        >
          <span>
            {isIncrease ? "Naik" : "Turun"}{" "}
            {percent(Math.abs(data.efficiencyRate))} dari penawaran awal
          </span>
          <span title={fullMoney(Math.abs(data.savingTotal))}>
            {isIncrease ? "Total kenaikan" : "Total penghematan"}{" "}
            {money(Math.abs(data.savingTotal))}
          </span>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {data.breakdown.map((item) => {
          const itemIncrease = item.savingTotal < 0;
          return (
            <div
              key={item.key}
              className="min-w-0 rounded-2xl border border-[#e1ebe5] p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-black text-[#142d25]">
                  {item.label}
                </p>
                <span className="rounded-full bg-[#eef5f1] px-2.5 py-1 text-[10px] font-bold text-[#3f5b50]">
                  {count(item.packageCount)} paket
                </span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-[#64796f]">Awal</p>
                  <p className="mt-1 truncate font-bold text-[#253d34]" title={fullMoney(item.initialTotal)}>
                    {money(item.initialTotal)}
                  </p>
                </div>
                <div>
                  <p className="text-[#64796f]">Final</p>
                  <p className="mt-1 truncate font-bold text-[#087f4f]" title={fullMoney(item.finalTotal)}>
                    {money(item.finalTotal)}
                  </p>
                </div>
              </div>
              <p
                className={`mt-3 text-xs font-bold ${
                  itemIncrease ? "text-[#c24141]" : "text-[#16834c]"
                }`}
              >
                {itemIncrease ? "Kenaikan" : "Penghematan"}: {money(Math.abs(item.savingTotal))}
                {item.increaseCount > 0
                  ? ` · ${count(item.increaseCount)} paket mengalami kenaikan`
                  : ""}
              </p>
            </div>
          );
        })}
      </div>

      <div className="mt-4 border-t border-[#e9efeb] pt-4 text-xs text-[#64796f]">
        <p>
          Perhitungan berdasarkan {count(data.validPackageCount)} paket dengan
          data negosiasi valid.
        </p>
        {data.excludedPackageCount > 0 ? (
          <details className="mt-2">
            <summary className="cursor-pointer font-semibold text-[#3f5b50]">
              {count(data.excludedPackageCount)} paket dikecualikan — lihat alasan
            </summary>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {data.excludedReasons.map((reason) => (
                <li key={reason.label}>
                  {reason.label}: {count(reason.count)} paket
                </li>
              ))}
            </ul>
          </details>
        ) : null}
      </div>
    </Card>
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
    {
      label: "Perencanaan",
      keys: ["planning", "verification", "rup", "selection"],
    },
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
      progress: summary.totalPagu > 0 ? 100 : 0,
      progressDetail: "Cakupan pagu pada filter aktif",
      color: "#087f4f",
      icon: Landmark,
    },
    {
      label: "Total Realisasi",
      value: money(summary.totalRealisasi),
      helper: `${percent(summary.realisasiPercent)} dari pagu`,
      progress: summary.realisasiPercent,
      progressDetail: "Total realisasi ÷ total pagu",
      color: "#16834c",
      icon: CircleDollarSign,
    },
    {
      label: "Nilai Kontrak",
      value: money(summary.totalNilaiKontrak),
      helper: `${count(procurementSummary.contractedPackages)} paket bernilai final`,
      progress: summary.realisasiKontrakPercent,
      progressDetail: "Total nilai kontrak ÷ total pagu",
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
      progress: efficiency.savingRate,
      progressDetail:
        "Penghematan ÷ pagu paket yang memiliki nilai final valid",
      color: "#2f8069",
      icon: BadgeCheck,
    },
    {
      label: "Paket Selesai",
      value: count(summary.paketSelesai),
      helper: `${percent(summary.selesaiPercent)} dari seluruh paket`,
      progress: summary.selesaiPercent,
      progressDetail: "Paket selesai ÷ total seluruh paket",
      color: "#16834c",
      icon: ClipboardCheck,
    },
    {
      label: "Paket Berisiko",
      value: count(summary.paketBermasalah),
      helper: "Revisi, kendala, gagal, atau batal tercatat",
      progress: calculatePercentage(
        summary.paketBermasalah,
        summary.totalPaket,
      ),
      progressDetail: "Paket berisiko unik ÷ total seluruh paket",
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

          <section className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {kpis.map((item) => (
              <KpiCard key={item.label} {...item} />
            ))}
          </section>

          <NegotiationAnalysis data={dashboard.negotiationAnalysis} />

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

          <section className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {fundingCards.map((item) => {
              const realization =
                dashboard.sourceRealizations.find(
                  (source) =>
                    source.label.trim().toUpperCase() ===
                    item.label.trim().toUpperCase(),
                )?.amount ?? 0;
              return (
                <FundingSourceCard
                  key={item.label}
                  item={item}
                  realization={realization}
                />
              );
            })}
            <ProcurementMethodCard
              label="E-Purchasing"
              href="/e-purchasing"
              data={procurementSummary.ePurchasing}
              totalPackages={summary.totalPaket}
            />
            <ProcurementMethodCard
              label="Tender"
              href="/tender-non-tender"
              data={procurementSummary.tender}
              totalPackages={summary.totalPaket}
              color="#28674e"
            />
            <ProcurementMethodCard
              label="Pengadaan Langsung"
              href="/pengadaan-langsung"
              data={procurementSummary.pengadaanLangsung}
              totalPackages={summary.totalPaket}
            />
            {procurementSummary.legacyNonTender.total > 0 ? (
              <ProcurementMethodCard
                label="Arsip Non Tender"
                data={procurementSummary.legacyNonTender}
                totalPackages={summary.totalPaket}
                color="#475569"
              />
            ) : null}
            <Card className="flex min-h-52 min-w-0 flex-col p-5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#64796f]">
                Paket Gagal / Batal
              </p>
              <p className="mt-2 text-2xl font-black text-[#c24141]">
                {count(procurementSummary.failedOrCancelled)}
              </p>
              <p className="mt-1 text-xs text-[#64796f]">
                Berdasarkan kendala dan status workflow aktual
              </p>
              <PercentageProgressBar
                value={calculatePercentage(
                  procurementSummary.failedOrCancelled,
                  summary.totalPaket,
                )}
                color="#c24141"
                label="Paket gagal atau batal"
                detail="Paket gagal/batal ÷ total seluruh paket"
              />
            </Card>
          </section>
        </div>
      </main>
    </>
  );
}
