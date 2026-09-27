import {
  PaketMetodePengadaan,
  PaketStatus,
  Prisma,
  RupStatus,
} from "@prisma/client";
import {
  BarChart3,
  FileCheck2,
  ListChecks,
} from "lucide-react";
import AppHeader from "@/components/appheader/AppHeader";
import ExportExcelButton from "@/components/button/shared/ExportExcelButton";
import { formatCurrency } from "@/lib/currency";
import { prisma } from "@/lib/prisma";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

type KpiTone = "blue" | "green" | "orange" | "red";

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

function humanize(value: string) {
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
  if (status === "PEMILIHAN" || status === "PEMENANG_DITETAPKAN") {
    return "bg-amber-100 text-amber-700";
  }
  if (status === "TERLAMBAT" || status === "GAGAL" || status === "BATAL") {
    return "bg-red-100 text-red-700";
  }
  return "bg-slate-100 text-slate-700";
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

  const [paketData, rupData] = await Promise.all([
    prisma.paketPengadaan.findMany({
      where,
      orderBy: [{ tahunAnggaran: "desc" }, { createdAt: "desc" }],
      take: 100,
    }),
    prisma.rencanaUmumPengadaan.findMany({
      where: rupWhere,
      orderBy: [{ tahunAnggaran: "desc" }, { createdAt: "desc" }],
      take: 200,
    }),
  ]);

  const tenderRows = paketData.filter(
    (item) => item.metodePengadaan === "TENDER",
  );
  const nonTenderRows = paketData.filter(
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
  const activeCount = paketData.filter(
    (item) => !["SELESAI", "GAGAL", "BATAL"].includes(item.statusPaket),
  ).length;
  const problemCount = paketData.filter((item) =>
    ["TERLAMBAT", "GAGAL", "BATAL"].includes(item.statusPaket),
  ).length;
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
      value: paketData.length.toLocaleString("id-ID"),
      helper: "Tender dan non tender",
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
    "Pagu",
    "HPS",
    "Status",
  ];
  const tableRows = paketData.map((item) => [
    item.kodePaket,
    item.namaPaket,
    item.unitPemohon,
    item.sumberDana,
    methodLabel(item.metodePengadaan),
    formatCompactCurrency(decimalNumber(item.pagu)),
    formatCompactCurrency(decimalNumber(item.hps)),
    humanize(item.statusPaket),
  ]);
  const workflowGroups = [
    {
      title: "Mekanisme Tender",
      helper: "Untuk paket tender dengan proses kompetitif penuh.",
      badge: `${tenderRows.length.toLocaleString("id-ID")} paket`,
      steps: [
        ["1", "Dokumen", "Dokumen pemilihan, KAK, spesifikasi, dan HPS final"],
        ["2", "Pengumuman", "Tender tayang dan jadwal pemilihan dibuka"],
        ["3", "Penawaran", "Penyedia submit dokumen administrasi, teknis, harga"],
        ["4", "Evaluasi", "Evaluasi administrasi, teknis, harga, dan kualifikasi"],
        ["5", "Penetapan", "BA hasil pemilihan dan pemenang ditetapkan"],
        ["6", "SPPBJ", "Paket siap masuk kontrak"],
      ],
    },
    {
      title: "Mekanisme Non Tender",
      helper: "Untuk paket non tender, seleksi sederhana, atau penunjukan sesuai kebutuhan.",
      badge: `${nonTenderRows.length.toLocaleString("id-ID")} paket`,
      steps: [
        ["1", "Dokumen", "Dokumen persiapan, HPS, dan kebutuhan paket final"],
        ["2", "Undangan", "Penyedia diundang atau proses non tender dibuka"],
        ["3", "Penawaran", "Penyedia menyampaikan penawaran dan kelengkapan"],
        ["4", "Klarifikasi", "Klarifikasi, negosiasi teknis, dan negosiasi harga"],
        ["5", "Penetapan", "BA hasil dan penyedia terpilih ditetapkan"],
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
          <section className="-mx-4 flex flex-col gap-3 border-b border-slate-200 bg-white px-5 py-4 sm:-mx-6 sm:flex-row sm:items-center sm:justify-between lg:-mx-8">
            <div className="min-w-0">
              <h1 className="mt-1 text-lg font-black text-[#16227c]">
                Tender & Non Tender
              </h1>
            </div>
            <ExportExcelButton
              columns={tableColumns}
              rows={tableRows}
              fileName="tender-non-tender"
            />
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
              <table className="w-full min-w-[900px] border-collapse text-left text-sm">
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
                  {paketData.length > 0 ? (
                    paketData.map((item) => (
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
                        <td className="whitespace-nowrap px-4 py-3 font-semibold text-slate-600">
                          {formatCompactCurrency(decimalNumber(item.pagu))}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 font-semibold text-slate-600">
                          {formatCompactCurrency(decimalNumber(item.hps))}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-black ${statusClass(item.statusPaket)}`}
                          >
                            {humanize(item.statusPaket)}
                          </span>
                        </td>
                      </tr>
                    ))
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
