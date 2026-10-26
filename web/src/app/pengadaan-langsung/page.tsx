import Link from "next/link";
import { CircleDollarSign, Landmark } from "lucide-react";
import AppHeader from "@/components/appheader/AppHeader";
import ExportExcelButton from "@/components/button/shared/ExportExcelButton";
import { formatCurrency } from "@/lib/currency";
import {
  getPengadaanLangsungProgress,
  getPengadaanLangsungStatus,
} from "@/lib/pengadaan-langsung-status";
import { prisma } from "@/lib/prisma";
import PengadaanLangsungClient from "./PengadaanLangsungClient";

type Props = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};
type Workflow = {
  rincian: unknown;
  penyedia: unknown;
  negosiasi: unknown;
  kontrak: unknown;
  pengiriman: unknown;
  pemeriksaan: unknown;
  pembayaran: unknown;
  tahapAktif: string;
};
type ProcurementStatus =
  | "SIAP"
  | "PROSES"
  | "SELESAI"
  | "REVISI"
  | "DIBATALKAN";

const statusLabels: Record<ProcurementStatus, string> = {
  SIAP: "Siap Diproses",
  PROSES: "Dalam Proses",
  SELESAI: "Selesai",
  REVISI: "Perlu Revisi",
  DIBATALKAN: "Dibatalkan",
};
const statusStyles: Record<ProcurementStatus, string> = {
  SIAP: "bg-amber-50 text-amber-700 ring-amber-200",
  PROSES: "bg-blue-50 text-blue-700 ring-blue-200",
  SELESAI: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  REVISI: "bg-rose-50 text-rose-700 ring-rose-200",
  DIBATALKAN: "bg-slate-100 text-slate-600 ring-slate-200",
};

function param(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
function compactCurrency(value: number) {
  if (value >= 1_000_000_000)
    return `Rp ${(value / 1_000_000_000).toLocaleString("id-ID", { maximumFractionDigits: 1 })} M`;
  if (value >= 1_000_000)
    return `Rp ${(value / 1_000_000).toLocaleString("id-ID", { maximumFractionDigits: 1 })} Jt`;
  return formatCurrency(value);
}
function workflowStatus(workflow: Workflow | null): ProcurementStatus {
  return getPengadaanLangsungStatus(workflow);
}
function progress(workflow: Workflow | null) {
  return getPengadaanLangsungProgress(workflow);
}
export default async function Page({ searchParams }: Props) {
  const query = await searchParams;
  const selectedId = param(query?.id);
  const baseWhere = { metodePengadaan: "PENGADAAN_LANGSUNG" as const };
  const [allRows, selected] = await Promise.all([
    prisma.rencanaUmumPengadaan.findMany({
      where: baseWhere,
      include: {
        pengadaanLangsung: {
          include: {
            paket: {
              include: { auditDokumen: { orderBy: { updatedAt: "desc" } } },
            },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    }),
    selectedId
      ? prisma.rencanaUmumPengadaan.findFirst({
          where: { id: selectedId, ...baseWhere },
          include: {
            pengadaanLangsung: {
              include: {
                paket: {
                  include: { auditDokumen: { orderBy: { updatedAt: "desc" } } },
                },
              },
            },
          },
        })
      : null,
  ]);
  const decorated = allRows.map((row) => ({
    row,
    status: workflowStatus(row.pengadaanLangsung),
    progress: progress(row.pengadaanLangsung),
  }));
  const totalPagu = allRows.reduce((sum, row) => sum + Number(row.pagu), 0);
  const ready = decorated.filter((item) => item.status === "SIAP").length;
  const inProcess = decorated.filter((item) =>
    ["PROSES", "REVISI"].includes(item.status),
  ).length;
  const done = decorated.filter((item) => item.status === "SELESAI").length;
  const fundStats = Array.from(
    allRows
      .reduce((map, row) => {
        const label = row.sumberDana || "Tanpa Sumber Dana";
        const current = map.get(label) ?? { label, count: 0, amount: 0 };
        current.count++;
        current.amount += Number(row.pagu);
        map.set(label, current);
        return map;
      }, new Map<string, { label: string; count: number; amount: number }>())
      .values(),
  ).sort((a, b) => b.amount - a.amount);
  const dominant = fundStats[0] ?? null;
  const maxFund = Math.max(1, ...fundStats.map((item) => item.amount));

  return (
    <>
      <AppHeader
        title="Pengadaan Langsung"
        subtitle="Monitoring paket Pengadaan Langsung secara independen dari arsip Non Tender."
      />
      <main className="min-h-screen min-w-0 bg-[#f4f7f5] px-3 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1600px] space-y-5">
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              [
                "Paket Pengadaan Langsung",
                allRows.length.toLocaleString("id-ID"),
                "RUP eligible metode Pengadaan Langsung",
                "border-l-[#1976d2]",
              ],
              [
                "Total Pagu",
                compactCurrency(totalPagu),
                "Dari RUP/SiRUP",
                "border-l-[#43a047]",
              ],
              [
                "Siap Diproses",
                ready.toLocaleString("id-ID"),
                "Belum masuk proses pemilihan",
                "border-l-[#f57c00]",
              ],
              [
                "Dalam Proses / Selesai",
                `${inProcess} / ${done}`,
                "Tracking pelaksanaan Pengadaan Langsung",
                "border-l-[#7c3aed]",
              ],
            ].map(([label, value, helper, tone]) => (
              <div
                key={label}
                className={`min-w-0 rounded-lg border border-l-4 border-slate-200 bg-white px-5 py-4 shadow-sm ${tone}`}
              >
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  {label}
                </p>
                <p className="mt-2 break-words text-2xl font-bold text-[#16227c]">
                  {value}
                </p>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  {helper}
                </p>
              </div>
            ))}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-[#08783f]">
                  Grafik Sumber Dana
                </p>
                <h2 className="mt-2 text-xl font-bold leading-tight text-[#16227c] sm:text-2xl">
                  Distribusi pagu berdasarkan sumber dana
                </h2>
              </div>
              <CircleDollarSign className="h-8 w-8 shrink-0 text-[#08783f]" />
            </div>
            {dominant ? (
              <>
                <div className="mt-7 flex min-w-0 flex-col gap-4 rounded-2xl bg-emerald-50 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-[#08783f]">
                      <Landmark className="h-7 w-7" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold uppercase text-[#08783f]">
                        Sumber Dana Terbesar
                      </p>
                      <p className="mt-1 break-words text-2xl font-bold text-slate-950 sm:text-3xl">
                        {dominant.label}
                      </p>
                      <p className="mt-1 text-sm font-bold text-slate-500">
                        {dominant.count.toLocaleString("id-ID")} paket Pengadaan
                        Langsung
                      </p>
                    </div>
                  </div>
                  <p className="break-words text-lg font-bold text-slate-950 sm:shrink-0 sm:text-right sm:text-xl">
                    {compactCurrency(dominant.amount)}
                  </p>
                </div>
                <div className="mt-7 space-y-5">
                  {fundStats.map((item, index) => (
                    <div key={item.label}>
                      <div className="flex min-w-0 items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="break-words font-bold text-slate-900">
                            {item.label}
                          </p>
                          <p className="mt-1 text-sm font-semibold text-slate-500">
                            {item.count} paket
                          </p>
                        </div>
                        <p className="shrink-0 text-right font-bold text-slate-900">
                          {compactCurrency(item.amount)}
                        </p>
                      </div>
                      <div className="mt-3 h-4 rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full ${index === 0 ? "bg-[#08783f]" : index === 1 ? "bg-[#f5bd20]" : index === 2 ? "bg-[#1976d2]" : "bg-slate-400"}`}
                          style={{
                            width: `${Math.max(6, Math.round((item.amount / maxFund) * 100))}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="mt-7 flex min-h-48 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 text-center text-sm font-semibold text-slate-500">
                Belum ada data sumber dana Pengadaan Langsung
              </div>
            )}
          </section>

          <section className="min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-[#16227c]">
                  Daftar Paket Siap / Sedang Diproses
                </h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  Paket Pengadaan Langsung yang siap atau sedang dalam proses
                  pengadaan.
                </p>
              </div>
              <ExportExcelButton
                columns={[
                  "Kode RUP",
                  "Nama Paket",
                  "Unit Pengusul",
                  "Sumber Dana",
                  "Pagu Anggaran",
                  "Status Pengadaan",
                  "Progres",
                ]}
                rows={decorated.map((item) => [
                  item.row.kodeRup,
                  item.row.namaPaket,
                  item.row.unitPengusul,
                  item.row.sumberDana,
                  formatCurrency(Number(item.row.pagu)),
                  statusLabels[item.status],
                  `${item.progress}%`,
                ])}
                fileName="paket-pengadaan-langsung"
              />
            </div>
            {decorated.length ? (
              <>
                <div className="hidden overflow-x-auto lg:block">
                  <table className="w-full min-w-[1180px] text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                      <tr>
                        {[
                          "No.",
                          "Kode RUP",
                          "Nama Paket",
                          "Unit Pengusul",
                          "Sumber Dana",
                          "Pagu Anggaran",
                          "Status Pengadaan",
                          "Progres",
                          "Aksi",
                        ].map((value) => (
                          <th key={value} className="px-4 py-3 font-bold">
                            {value}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {decorated.map((item, index) => (
                        <tr
                          key={item.row.id}
                          className="hover:bg-emerald-50/30"
                        >
                          <td className="px-4 py-4">{index + 1}</td>
                          <td className="px-4 py-4 font-bold text-[#08783f]">
                            {item.row.kodeRup}
                          </td>
                          <td className="max-w-xs px-4 py-4 font-bold text-slate-900">
                            <span className="block break-words">
                              {item.row.namaPaket}
                            </span>
                          </td>
                          <td className="max-w-56 px-4 py-4">
                            <span className="block break-words">
                              {item.row.unitPengusul}
                            </span>
                          </td>
                          <td className="px-4 py-4">{item.row.sumberDana}</td>
                          <td className="whitespace-nowrap px-4 py-4 font-bold">
                            {formatCurrency(Number(item.row.pagu))}
                          </td>
                          <td className="px-4 py-4">
                            <span
                              className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold ring-1 ${statusStyles[item.status]}`}
                            >
                              {statusLabels[item.status]}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="w-28">
                              <div className="mb-1 flex justify-between text-xs font-bold">
                                <span>{item.progress}%</span>
                                <span>
                                  {item.row.pengadaanLangsung?.tahapAktif ||
                                    "RINCIAN"}
                                </span>
                              </div>
                              <div className="h-2 rounded-full bg-slate-100">
                                <div
                                  className="h-full rounded-full bg-[#08783f]"
                                  style={{ width: `${item.progress}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <Link
                              href={`/pengadaan-langsung?id=${item.row.id}`}
                              className="inline-flex min-h-11 items-center rounded-xl bg-[#08783f] px-4 font-bold text-white"
                            >
                              {item.status === "SIAP"
                                ? "Proses"
                                : "Detail / Lanjutkan"}
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="grid gap-3 p-4 lg:hidden">
                  {decorated.map((item) => (
                    <article
                      key={item.row.id}
                      className="min-w-0 rounded-2xl border border-slate-200 p-4"
                    >
                      <div className="flex min-w-0 items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="break-all text-xs font-bold text-[#08783f]">
                            {item.row.kodeRup}
                          </p>
                          <h3 className="mt-1 break-words font-bold text-slate-950">
                            {item.row.namaPaket}
                          </h3>
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold ring-1 ${statusStyles[item.status]}`}
                        >
                          {statusLabels[item.status]}
                        </span>
                      </div>
                      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                        <div>
                          <dt className="text-xs text-slate-400">
                            Unit Pengusul
                          </dt>
                          <dd className="break-words font-semibold">
                            {item.row.unitPengusul}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs text-slate-400">
                            Sumber Dana
                          </dt>
                          <dd className="break-words font-semibold">
                            {item.row.sumberDana}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs text-slate-400">Pagu</dt>
                          <dd className="font-semibold">
                            {formatCurrency(Number(item.row.pagu))}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs text-slate-400">Progres</dt>
                          <dd className="font-semibold">
                            {item.progress}% ·{" "}
                            {item.row.pengadaanLangsung?.tahapAktif ||
                              "RINCIAN"}
                          </dd>
                        </div>
                      </dl>
                      <Link
                        href={`/pengadaan-langsung?id=${item.row.id}`}
                        className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-[#08783f] px-4 font-bold text-white"
                      >
                        {item.status === "SIAP"
                          ? "Proses"
                          : "Detail / Lanjutkan"}
                      </Link>
                    </article>
                  ))}
                </div>
              </>
            ) : (
              <div className="p-10 text-center text-sm font-semibold text-slate-500">
                Belum ada RUP dengan metode Pengadaan Langsung.
              </div>
            )}
          </section>
        </div>
      </main>
      {selected ? (
        <PengadaanLangsungClient
          key={selected.id}
          rup={{
            id: selected.id,
            kodeRup: selected.kodeRup,
            namaPaket: selected.namaPaket,
            unitPengusul: selected.unitPengusul,
            sumberDana: selected.sumberDana,
            tahunAnggaran: selected.tahunAnggaran,
            pagu: selected.pagu.toString(),
            jenisBelanja: selected.jenisBelanja,
            ppkPptk: selected.ppkPptk,
            createdAt: selected.createdAt.toISOString(),
            updatedAt: selected.updatedAt.toISOString(),
          }}
          workflow={
            selected.pengadaanLangsung
              ? {
                  rincian: selected.pengadaanLangsung.rincian,
                  penyedia: selected.pengadaanLangsung.penyedia,
                  negosiasi: selected.pengadaanLangsung.negosiasi,
                  kontrak: selected.pengadaanLangsung.kontrak,
                  pengiriman: selected.pengadaanLangsung.pengiriman,
                  pemeriksaan: selected.pengadaanLangsung.pemeriksaan,
                  pembayaran: selected.pengadaanLangsung.pembayaran,
                  tahapAktif: selected.pengadaanLangsung.tahapAktif,
                }
              : null
          }
          documents={(selected.pengadaanLangsung?.paket.auditDokumen || []).map(
            (document) => ({
              ...document,
              updatedAt: document.updatedAt.toISOString(),
            }),
          )}
        />
      ) : null}
    </>
  );
}
