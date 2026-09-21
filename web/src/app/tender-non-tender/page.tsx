import { PaketMetodePengadaan, PaketStatus, Prisma } from "@prisma/client";
import {
  ClipboardCheck,
  FileCheck2,
  ListChecks,
  Search,
  Scale,
} from "lucide-react";
import AppHeader from "@/components/dashboard/AppHeader";
import ExportExcelButton from "@/components/dashboard/ExportExcelButton";
import { formatCurrency } from "@/lib/currency";
import { prisma } from "@/lib/prisma";
import { getActiveSumberDanaOptions } from "@/lib/sumber-dana";

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

  const [paketData, years, sourceFunds, units, statuses] = await Promise.all([
    prisma.paketPengadaan.findMany({
      where,
      orderBy: [{ tahunAnggaran: "desc" }, { createdAt: "desc" }],
      take: 100,
    }),
    prisma.paketPengadaan.findMany({
      where: {
        metodePengadaan: {
          in: [PaketMetodePengadaan.TENDER, PaketMetodePengadaan.NON_TENDER],
        },
      },
      distinct: ["tahunAnggaran"],
      orderBy: { tahunAnggaran: "desc" },
      select: { tahunAnggaran: true },
    }),
    getActiveSumberDanaOptions(),
    prisma.paketPengadaan.findMany({
      where: {
        metodePengadaan: {
          in: [PaketMetodePengadaan.TENDER, PaketMetodePengadaan.NON_TENDER],
        },
      },
      distinct: ["unitPemohon"],
      orderBy: { unitPemohon: "asc" },
      select: { unitPemohon: true },
    }),
    prisma.paketPengadaan.findMany({
      where: {
        metodePengadaan: {
          in: [PaketMetodePengadaan.TENDER, PaketMetodePengadaan.NON_TENDER],
        },
      },
      distinct: ["statusPaket"],
      orderBy: { statusPaket: "asc" },
      select: { statusPaket: true },
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

  return (
    <>
      <AppHeader
        title="Tender & Non Tender"
        subtitle="UKPBJ › Pemilihan Penyedia"
        rightLabel="Tahapan"
      />
      <main className="min-h-screen bg-[#f4f7f5]">
        <div className="space-y-4 px-4 pb-4 sm:px-6 lg:px-8">
          <form className="-mx-4 border-b border-slate-200 bg-white sm:-mx-6 lg:-mx-8">
            <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
                  UKPBJ / Pemilihan Penyedia
                </p>
                <h1 className="mt-1 text-lg font-black text-[#16227c]">
                  Tender & Non Tender
                </h1>
              </div>
              <ExportExcelButton
                columns={tableColumns}
                rows={tableRows}
                fileName="tender-non-tender"
              />
            </div>

            <div className="px-5 py-3">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <span className="shrink-0 text-sm font-black text-slate-400">
                  Filter:
                </span>
                <select
                  name="tahunAnggaran"
                  defaultValue={tahunAnggaran}
                  className="h-9 min-w-[150px] rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-600"
                >
                  <option value="">Semua Tahun</option>
                  {years.map((year) => (
                    <option
                      key={year.tahunAnggaran}
                      value={year.tahunAnggaran}
                    >
                      TA {year.tahunAnggaran}
                    </option>
                  ))}
                </select>
                <select
                  name="metode"
                  defaultValue={metode}
                  className="h-9 min-w-[170px] rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-600"
                >
                  <option value="">Semua Metode</option>
                  <option value="TENDER">Tender</option>
                  <option value="NON_TENDER">Non Tender</option>
                </select>
                <select
                  name="sumberDana"
                  defaultValue={sumberDana}
                  className="h-9 min-w-[220px] rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-600"
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
                  className="h-9 min-w-[180px] rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-600"
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
                  className="h-9 min-w-[180px] rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-600"
                >
                  <option value="">Semua Status</option>
                  {statuses.map((item) => (
                    <option key={item.statusPaket} value={item.statusPaket}>
                      {humanize(item.statusPaket)}
                    </option>
                  ))}
                </select>
                <label className="flex h-9 min-w-[260px] flex-1 items-center gap-2 rounded-full border border-slate-300 bg-slate-50 px-4 text-sm text-slate-500">
                  <Search className="h-4 w-4" />
                  <input
                    name="q"
                    defaultValue={q}
                    placeholder="Cari paket tender/non tender..."
                    className="min-w-0 flex-1 bg-transparent font-semibold outline-none"
                  />
                </label>
              </div>
            </div>
          </form>

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

          <section className="grid gap-4 lg:grid-cols-2">
            {[
              {
                title: "Tender",
                icon: Scale,
                count: tenderRows.length,
                value: formatCompactCurrency(tenderValue),
                steps: [
                  "Pengumuman",
                  "Aanwijzing",
                  "Evaluasi",
                  "Klarifikasi",
                  "Sanggah",
                  "SPPBJ",
                ],
              },
              {
                title: "Non Tender",
                icon: ClipboardCheck,
                count: nonTenderRows.length,
                value: formatCompactCurrency(nonTenderValue),
                steps: [
                  "Undangan",
                  "Penawaran",
                  "Negosiasi",
                  "BA Hasil",
                  "Penetapan",
                  "SPPBJ",
                ],
              },
            ].map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.title}
                  className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
                >
                  <div className="flex min-h-[56px] items-center justify-between gap-3 border-b border-slate-100 px-5 py-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <Icon className="h-5 w-5 shrink-0 text-[#08783f]" />
                      <h2 className="truncate text-sm font-black text-[#16227c]">
                        {item.title}
                      </h2>
                    </div>
                    <span className="shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-[#08783f]">
                      {item.count} paket
                    </span>
                  </div>

                  <div className="grid gap-2 px-5 py-4 sm:grid-cols-3">
                    {item.steps.map((step, index) => (
                      <div
                        key={`${item.title}-${step}`}
                        className="min-h-[58px] rounded-md border border-slate-200 bg-[#f4f7f5] px-3 py-2"
                      >
                        <span className="text-[10px] font-black uppercase text-slate-400">
                          Tahap {index + 1}
                        </span>
                        <p className="mt-1 text-xs font-black text-slate-700">
                          {step}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-5 py-3">
                    <span className="text-xs font-black uppercase text-slate-400">
                      Total Pagu
                    </span>
                    <span className="text-sm font-black text-slate-900">
                      {item.value}
                    </span>
                  </div>
                </div>
              );
            })}
          </section>

          <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-3">
              <div className="flex items-center gap-2">
                <ListChecks className="h-5 w-5 text-[#08783f]" />
                <h2 className="text-sm font-black text-[#16227c]">
                  Workflow Pemilihan
                </h2>
              </div>
            </div>
            <div className="grid gap-2 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              {[
                ["1", "Dokumen", "Dokumen pemilihan dan HPS final"],
                ["2", "Publikasi", "Tender tayang atau undangan dikirim"],
                ["3", "Penawaran", "Penyedia submit dokumen penawaran"],
                ["4", "Evaluasi", "Administrasi, teknis, harga"],
                ["5", "Penetapan", "BA hasil dan pemenang/penyedia"],
                ["6", "SPPBJ", "Siap masuk kontrak atau surat pesanan"],
              ].map(([number, title, helper]) => (
                <div
                  key={number}
                  className="min-h-[86px] rounded-md border border-slate-200 bg-[#f4f7f5] p-3"
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
