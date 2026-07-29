import {
  AlertTriangle,
  ArrowUpRight,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  FileCheck2,
  Landmark,
  LineChart,
  PackageCheck,
  PieChart,
  ShieldCheck,
  ShoppingCart,
} from "lucide-react";
import Link from "next/link";
import AppHeader from "@/app/(dashboard)/_shared/AppHeader";
import { formatCurrency } from "@/lib/currency";
import { getDashboardData } from "@/lib/dashboard-data";

const priorityToneStyles = {
  amber: "bg-amber-100 text-amber-700",
  green: "bg-emerald-100 text-emerald-700",
  red: "bg-red-100 text-red-700",
};

const timelineToneStyles = {
  done: "bg-emerald-500 ring-emerald-100",
  active: "bg-emerald-500 ring-emerald-100",
  warning: "bg-amber-500 ring-amber-100",
  danger: "bg-red-500 ring-red-100",
  pending: "bg-slate-300 ring-slate-100",
};

const auditToneStyles = {
  green: "bg-emerald-100 text-emerald-700",
  amber: "bg-amber-100 text-amber-700",
  red: "bg-red-100 text-red-700",
};

const dashboardCardToneStyles = {
  blue: "border-l-sky-600",
  green: "border-l-emerald-600",
  orange: "border-l-orange-500",
  red: "border-l-red-500",
  teal: "border-l-teal-600",
  violet: "border-l-violet-700",
  slate: "border-l-slate-400",
};

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

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm font-semibold text-slate-500">
      {message}
    </div>
  );
}

export default async function Page() {
  const dashboard = await getDashboardData();
  const { summary } = dashboard;

  const selesaiCount =
    dashboard.stages.find((item) => item.label === "Selesai")?.count ?? 0;
  const tahapAktif = Math.max(summary.totalPaket - selesaiCount, 0);
  const maxMonthlyAmount = Math.max(
    ...dashboard.monthlyRealization.map((item) =>
      Math.max(item.pagu, item.realisasi),
    ),
    1,
  );

  const summaryCards = [
    {
      label: "Total Paket",
      value: summary.totalPaket.toLocaleString("id-ID"),
      helper: `TA ${summary.tahunAnggaran}`,
      icon: ClipboardList,
      tone: "blue",
    },
    {
      label: "Total Pagu",
      value: formatCompactCurrency(summary.totalPagu),
      helper: "Anggaran berjalan",
      icon: Landmark,
      tone: "blue",
    },
    {
      label: "Realisasi",
      value: formatCompactCurrency(summary.totalNilaiKontrak),
      helper: `Serapan ${summary.realisasiKontrakPercent.toLocaleString("id-ID")}%`,
      icon: CheckCircle2,
      tone: "green",
    },
    ...dashboard.sourceFunds.slice(0, 3).map((item, index) => ({
      label: `Paket ${item.label}`,
      value: item.count.toLocaleString("id-ID"),
      helper: "Sumber dana",
      icon: index === 0 ? Landmark : index === 1 ? PackageCheck : PieChart,
      tone: index === 0 ? "orange" : index === 1 ? "teal" : "violet",
    })),
  ];

  const methodCards = [
    {
      label: "Paket Selesai",
      value: selesaiCount.toLocaleString("id-ID"),
      helper: "Selesai diproses",
      icon: CheckCircle2,
      tone: "green",
    },
    {
      label: "Paket Berjalan",
      value: tahapAktif.toLocaleString("id-ID"),
      helper: "Dalam proses",
      icon: PackageCheck,
      tone: "orange",
    },
    {
      label: "Bermasalah",
      value: summary.paketBermasalah.toLocaleString("id-ID"),
      helper: "Perlu perhatian",
      icon: AlertTriangle,
      tone: "red",
    },
    {
      label: "Deadline <7 Hari",
      value: summary.deadlineDekat.toLocaleString("id-ID"),
      helper: "Segera tindak lanjut",
      icon: CalendarClock,
      tone: "orange",
    },
    {
      label: "e-Katalog V6/V5",
      value: summary.paketEKatalogV6.toLocaleString("id-ID"),
      helper: "Paket",
      icon: ShoppingCart,
      tone: "blue",
    },
    {
      label: "Tender / Non Tender",
      value: summary.paketTenderNonTender.toLocaleString("id-ID"),
      helper: "Paket",
      icon: ShieldCheck,
      tone: "slate",
    },
  ];

  const dashboardKpiCards = [...summaryCards, ...methodCards];

  return (
    <>
      <AppHeader
        title="Dashboard Utama"
        subtitle="UKPBJ Labkes Jabar › Dashboard"
      />

      <main className="bg-[#f4f7f5]">
        <section className="border-b border-slate-200 bg-white px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex flex-1 flex-wrap items-center gap-3">
            <span className="text-sm font-black text-slate-400">Filter:</span>
            <select className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-600 outline-none transition focus:border-[#08783f] focus:ring-2 focus:ring-emerald-100">
              <option>TA {summary.tahunAnggaran}</option>
            </select>
            <select className="h-9 min-w-44 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-600 outline-none transition focus:border-[#08783f] focus:ring-2 focus:ring-emerald-100">
              <option>Semua Sumber Dana</option>
              {dashboard.sourceFunds.map((item) => (
                <option key={item.label}>{item.label}</option>
              ))}
            </select>
            <select className="h-9 min-w-40 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-600 outline-none transition focus:border-[#08783f] focus:ring-2 focus:ring-emerald-100">
              <option>Semua Unit</option>
            </select>
            <select className="h-9 min-w-40 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-600 outline-none transition focus:border-[#08783f] focus:ring-2 focus:ring-emerald-100">
              <option>Semua Status</option>
            </select>
          </div>
        </section>

        <div className="px-4 py-5 sm:px-6 lg:px-8">

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {dashboardKpiCards.map((card) => {
            const Icon = card.icon;

            return (
              <div
                key={card.label}
                className={`relative overflow-hidden rounded-lg border border-slate-100 border-l-4 bg-white px-4 py-4 shadow-sm ${dashboardCardToneStyles[card.tone as keyof typeof dashboardCardToneStyles]}`}
              >
                <div className="grid grid-cols-[minmax(0,1fr)_34px] items-start gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-black uppercase text-slate-400">
                      {card.label}
                    </p>
                    <p className="mt-1 truncate text-2xl font-black leading-tight text-slate-950">
                      {card.value}
                    </p>
                    <p className="mt-2 truncate text-xs font-semibold text-slate-400">
                      {card.helper}
                    </p>
                  </div>
                  <div className="mt-10 flex h-8 w-8 shrink-0 items-center justify-center text-slate-300">
                    <Icon className="h-6 w-6" strokeWidth={2} />
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-[11px] font-black uppercase text-[#08783f]">
                  Tahapan Pengadaan
                </p>
                <h2 className="mt-1 text-xl font-black text-slate-950">
                  Posisi paket tahun berjalan
                </h2>
              </div>
              <div className="inline-flex w-fit items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700">
                <ShieldCheck className="h-4 w-4" />
                {`${summary.realisasiKontrakPercent.toLocaleString("id-ID")}% sudah berkontrak`}
              </div>
            </div>

            <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_0.9fr]">
              <div className="space-y-5">
                {dashboard.stages.length > 0 ? (
                  dashboard.stages.map((item) => (
                    <div key={item.label}>
                      <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                        <span className="font-bold text-slate-700">
                          {item.label}
                        </span>
                        <span className="font-black text-slate-950">
                          {item.count.toLocaleString("id-ID")} paket
                        </span>
                      </div>
                      <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full ${item.color}`}
                          style={{ width: `${item.percent}%` }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <EmptyState message="Belum ada data tahapan paket di database." />
                )}
              </div>

              <div className="border-t border-slate-100 pt-5 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
                <p className="text-sm font-black text-slate-900">
                  Timeline pengadaan
                </p>
                <div className="mt-4 space-y-4">
                  {dashboard.timeline.map((item) => (
                    <div key={item.label} className="relative pl-7">
                      <div
                        className={`absolute left-0 top-1.5 h-3 w-3 rounded-full ring-4 ${
                          timelineToneStyles[item.status]
                        }`}
                      />
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
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-black uppercase text-[#08783f]">
                  Notifikasi & Risiko
                </p>
                <h2 className="mt-1 text-xl font-black text-slate-950">
                  Perlu perhatian
                </h2>
              </div>
              <AlertTriangle className="h-6 w-6 shrink-0 text-red-600" />
            </div>

            <div className="mt-5 space-y-3">
              {dashboard.priorities.length > 0 ? (
                dashboard.priorities.map((item) => (
                  <article
                    key={item.title}
                    className="rounded-lg border border-slate-200 p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <h3 className="font-black text-slate-900">
                          {item.title}
                        </h3>
                        <p className="mt-1 text-sm font-semibold text-slate-500">
                          {item.unit}
                        </p>
                      </div>
                      <span
                        className={`w-fit rounded-full px-3 py-1 text-xs font-black ${priorityToneStyles[item.tone as keyof typeof priorityToneStyles]}`}
                      >
                        {humanize(item.status)}
                      </span>
                    </div>
                    <p className="mt-4 text-sm font-bold text-slate-600">
                      {item.due}
                    </p>
                  </article>
                ))
              ) : (
                <EmptyState message="Belum ada paket terlambat atau bermasalah dari database." />
              )}
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-black uppercase text-[#08783f]">
                  Grafik Realisasi
                </p>
                <h2 className="mt-1 text-xl font-black text-slate-950">
                  Pagu vs HPS per bulan
                </h2>
              </div>
              <LineChart className="h-6 w-6 text-[#08783f]" />
            </div>

            <div className="mt-6 grid h-64 grid-cols-12 items-end gap-2 rounded-lg bg-slate-50 px-3 pb-4 pt-6">
              {dashboard.monthlyRealization.map((item) => (
                <div key={item.month} className="flex h-full flex-col justify-end gap-1">
                  <div className="flex min-h-0 flex-1 items-end gap-1">
                    <div
                      className="w-full rounded-t bg-emerald-500"
                      style={{
                        height: `${Math.max((item.pagu / maxMonthlyAmount) * 100, item.pagu > 0 ? 8 : 0)}%`,
                      }}
                      title={`Pagu ${item.month}: ${formatCurrency(item.pagu)}`}
                    />
                    <div
                      className="w-full rounded-t bg-emerald-500"
                      style={{
                        height: `${Math.max((item.realisasi / maxMonthlyAmount) * 100, item.realisasi > 0 ? 8 : 0)}%`,
                      }}
                      title={`HPS ${item.month}: ${formatCurrency(item.realisasi)}`}
                    />
                  </div>
                  <span className="text-center text-[10px] font-bold text-slate-500">
                    {item.month}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap gap-4 text-xs font-bold text-slate-600">
              <span>
                <span className="text-[#08783f]">■</span> Pagu
              </span>
              <span>
                <span className="text-emerald-500">■</span> HPS / estimasi realisasi
              </span>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-black uppercase text-[#08783f]">
                  Audit Readiness
                </p>
                <h2 className="mt-1 text-xl font-black text-slate-950">
                  Snapshot kelengkapan
                </h2>
              </div>
              <FileCheck2 className="h-6 w-6 text-[#08783f]" />
            </div>

            <div className="mt-5 rounded-lg bg-emerald-50 p-5 text-center">
              <p className="text-4xl font-black text-emerald-700">
                {dashboard.auditReadiness.percent}%
              </p>
              <p className="mt-1 text-xs font-bold text-emerald-700">
                kesiapan audit berdasarkan status paket
              </p>
              <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white">
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{ width: `${dashboard.auditReadiness.percent}%` }}
                />
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {dashboard.auditReadiness.items.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3 last:border-0 last:pb-0"
                >
                  <span className="text-sm font-bold text-slate-700">
                    {item.label}
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-black ${
                      auditToneStyles[item.tone]
                    }`}
                  >
                    {item.complete}/{item.total}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-black uppercase text-[#08783f]">
                  Sumber Dana
                </p>
                <h2 className="mt-1 text-xl font-black text-slate-950">
                  Distribusi sumber dana dari database
                </h2>
              </div>
              <PieChart className="h-6 w-6 text-[#08783f]" />
            </div>

            <div className="mt-5 space-y-4">
              {dashboard.sourceFunds.length > 0 ? (
                dashboard.sourceFunds.map((item) => (
                  <div key={item.label} className="rounded-lg bg-slate-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-black text-slate-900">
                          {humanize(item.label)}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-slate-500">
                          {item.count.toLocaleString("id-ID")} paket
                        </p>
                      </div>
                      <p className="text-sm font-black text-slate-900">
                        {formatCompactCurrency(item.amount)}
                      </p>
                    </div>
                    <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white">
                      <div
                        className="h-full rounded-full bg-[#08783f]"
                        style={{ width: `${item.percent}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState message="Belum ada data sumber dana dari paket pengadaan." />
              )}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-black uppercase text-[#08783f]">
                  Metode Pengadaan
                </p>
                <h2 className="mt-1 text-xl font-black text-slate-950">
                  Katalog, tender, dan pengadaan langsung
                </h2>
              </div>
              <ShoppingCart className="h-6 w-6 text-[#08783f]" />
            </div>

            <div className="mt-5 space-y-4">
              {dashboard.methods.length > 0 ? (
                dashboard.methods.map((item) => (
                  <div key={item.label}>
                    <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                      <span className="font-bold text-slate-700">
                        {humanize(item.label)}
                      </span>
                      <span className="font-black text-slate-950">
                        {item.count.toLocaleString("id-ID")} paket
                      </span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-emerald-500"
                        style={{ width: `${item.percent}%` }}
                      />
                    </div>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      {formatCompactCurrency(item.amount)}
                    </p>
                  </div>
                ))
              ) : (
                <EmptyState message="Belum ada data metode pengadaan dari paket." />
              )}
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-[11px] font-black uppercase text-[#08783f]">
              Kategori Barang
            </p>
            <h2 className="mt-1 text-xl font-black text-slate-950">
              Distribusi barang kesehatan
            </h2>

            <div className="mt-5 space-y-4">
              {dashboard.categories.length > 0 ? (
                dashboard.categories.map((item) => (
                  <div key={item.label} className="grid gap-2">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="font-bold text-slate-700">
                        {humanize(item.label)}
                      </span>
                      <span className="font-black text-slate-950">
                        {item.value.toLocaleString("id-ID")} item
                      </span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-[#08783f]"
                        style={{
                          width: `${Math.min(item.value * 8, 100)}%`,
                        }}
                      />
                    </div>
                    <p className="text-xs font-semibold text-slate-500">
                      {formatCompactCurrency(item.amount)}
                    </p>
                  </div>
                ))
              ) : (
                <EmptyState message="Belum ada kategori barang dari database." />
              )}
            </div>
          </div>

          <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[11px] font-black uppercase text-[#08783f]">
                  Paket Terkini
                </p>
                <h2 className="mt-1 text-xl font-black text-slate-950">
                  Monitoring paket pengadaan barang
                </h2>
              </div>
              <Link
                href="/paket"
                className="inline-flex min-h-10 w-fit items-center justify-center gap-2 rounded-lg bg-[#08783f] px-4 text-sm font-black text-white transition hover:bg-[#066532]"
              >
                Lihat semua
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-[760px] w-full border-collapse text-left text-sm">
                <thead className="bg-slate-50 text-xs font-black uppercase text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Kode</th>
                    <th className="px-5 py-3">Nama Paket</th>
                    <th className="px-5 py-3">Unit</th>
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
                          {item.unit}
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
                        colSpan={6}
                        className="px-5 py-8 text-center text-sm font-semibold text-slate-500"
                      >
                        Belum ada paket pengadaan dari database.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </section>
        </div>
      </main>
    </>
  );
}
