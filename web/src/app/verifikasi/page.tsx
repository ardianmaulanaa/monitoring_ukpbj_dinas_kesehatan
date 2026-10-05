import { redirect } from "next/navigation";
import { ClipboardCheck, FileSearch } from "lucide-react";
import AppHeader from "@/components/appheader/AppHeader";
import VerificationDetailModalButton from "@/app/verifikasi/VerificationDetailModalButton";
import { getCurrentUser } from "@/lib/auth";
import { formatCurrency } from "@/lib/currency";
import { formatDate } from "@/lib/date";
import {
  canViewVerification,
  planningStatusLabels,
  planningStatusStyles,
  unitScopeTerms,
} from "@/lib/planning-workflow";
import { prisma } from "@/lib/prisma";
import type { Prisma, StatusUsulan } from "@prisma/client";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getParam(
  searchParams: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] : value;
}

function dateLabel(value?: Date | null) {
  if (!value) return "-";
  return formatDate(value);
}

function statusFilter(value?: string) {
  const map: Record<string, StatusUsulan> = {
    MENUNGGU: "DIAJUKAN",
    PERLU_REVISI: "PERLU_REVISI",
    SIAP_RUP: "SIAP_RUP",
  };

  return value ? map[value] : undefined;
}

function priorityClass(value: string | null) {
  const normalized = (value ?? "").toUpperCase();
  if (normalized === "MENDESAK") return "bg-red-100 text-red-700";
  if (normalized === "TINGGI") return "bg-amber-100 text-amber-700";
  if (normalized === "RENDAH") return "bg-slate-100 text-slate-600";
  return "bg-blue-100 text-blue-700";
}

export default async function Page({ searchParams }: PageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!canViewVerification(user.roles)) redirect("/unauthorized");

  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: { unitKerja: true },
  });
  const params = (await searchParams) ?? {};
  const q = getParam(params, "q")?.trim();
  const tahunAnggaran = getParam(params, "tahunAnggaran");
  const unit = getParam(params, "unit")?.trim();
  const prioritas = getParam(params, "prioritas")?.trim();
  const status = statusFilter(getParam(params, "status"));
  const isAdminScope = user.roles.some((role) =>
    ["SUPER_ADMIN", "UKPBJ", "LPSE_ADMIN"].includes(role),
  );
  const leaderTerms = user.roles.includes("LEADER")
    ? unitScopeTerms(profile?.unitKerja ?? user.name)
    : [];
  const unitTextFilters = leaderTerms.flatMap((term) => [
    { unitPengusul: { contains: term, mode: "insensitive" as const } },
    { unitBidang: { contains: term, mode: "insensitive" as const } },
  ]);

  const unitScope: Prisma.RencanaUmumPengadaanWhereInput =
    leaderTerms.length > 0 && !isAdminScope
      ? {
          OR: unitTextFilters,
        }
      : {};

  const baseWhere: Prisma.RencanaUmumPengadaanWhereInput = {
    statusUsulan: { in: ["DIAJUKAN", "PERLU_REVISI", "SIAP_RUP"] },
    ...unitScope,
  };

  const where: Prisma.RencanaUmumPengadaanWhereInput = {
    AND: [
      baseWhere,
      ...(q
        ? [
            {
              OR: [
                { kodeRup: { contains: q } },
                { namaPaket: { contains: q } },
                { unitPengusul: { contains: q } },
              ],
            },
          ]
        : []),
    ],
    ...(status ? { statusUsulan: status } : {}),
    ...(tahunAnggaran ? { tahunAnggaran: Number(tahunAnggaran) } : {}),
    ...(unit && (isAdminScope || leaderTerms.includes(unit.toLowerCase()))
      ? { unitPengusul: unit }
      : {}),
    ...(prioritas ? { prioritas } : {}),
  };

  const [rows, counts, units, years] = await Promise.all([
    prisma.rencanaUmumPengadaan.findMany({
      where,
      orderBy: [{ submittedAt: "asc" }, { createdAt: "asc" }],
      take: 100,
    }),
    prisma.rencanaUmumPengadaan.groupBy({
      by: ["statusUsulan"],
      where: baseWhere,
      _count: { _all: true },
    }),
    prisma.rencanaUmumPengadaan.findMany({
      where: unitScope,
      distinct: ["unitPengusul"],
      select: { unitPengusul: true },
      orderBy: { unitPengusul: "asc" },
    }),
    prisma.rencanaUmumPengadaan.findMany({
      where: unitScope,
      distinct: ["tahunAnggaran"],
      select: { tahunAnggaran: true },
      orderBy: { tahunAnggaran: "desc" },
    }),
  ]);

  const countByStatus = Object.fromEntries(
    counts.map((item) => [item.statusUsulan, item._count._all]),
  );
  const waitingCount = countByStatus.DIAJUKAN ?? 0;
  const revisionCount = countByStatus.PERLU_REVISI ?? 0;
  const readyCount = countByStatus.SIAP_RUP ?? 0;
  const totalCount = waitingCount + revisionCount + readyCount;

  return (
    <>
      <AppHeader
        title="Verifikasi Usulan"
        rightLabel="Inbox"
      />

      <main className="bg-[#f4f7f5] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["Menunggu Verifikasi", waitingCount, "border-l-[#1976d2]"],
            ["Perlu Revisi", revisionCount, "border-l-[#f57c00]"],
            ["Disetujui / Siap RUP", readyCount, "border-l-[#43a047]"],
            ["Total Usulan", totalCount, "border-l-slate-400"],
          ].map(([label, value, tone]) => (
            <div
              key={String(label)}
              className={`rounded-lg border border-slate-200 border-l-4 bg-white px-4 py-3 shadow-sm ${tone}`}
            >
              <p className="text-xs font-black uppercase text-slate-400">
                {label}
              </p>
              <p className="mt-2 text-2xl font-black text-[#16227c]">
                {Number(value).toLocaleString("id-ID")}
              </p>
            </div>
          ))}
        </div>

        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-center gap-2">
              <ClipboardCheck className="h-5 w-5 shrink-0 text-[#08783f]" />
              <h1 className="truncate text-lg font-black text-[#16227c]">
                Inbox Verifikasi
              </h1>
            </div>

            <form className="grid gap-2 lg:grid-cols-[220px_160px_180px_160px_150px]">
              <input
                name="q"
                defaultValue={q ?? ""}
                placeholder="Cari kode atau nama usulan..."
                className="h-10 rounded-lg border border-slate-300 px-3 text-sm font-semibold outline-none focus:border-[#08783f]"
              />
              <select
                name="status"
                defaultValue={getParam(params, "status") ?? ""}
                className="h-10 rounded-lg border border-slate-300 px-3 text-sm font-semibold outline-none focus:border-[#08783f]"
              >
                <option value="">Semua Status</option>
                <option value="MENUNGGU">Menunggu Verifikasi</option>
                <option value="PERLU_REVISI">Perlu Revisi</option>
                <option value="SIAP_RUP">Siap RUP</option>
              </select>
              <select
                name="unit"
                defaultValue={unit ?? ""}
                className="h-10 rounded-lg border border-slate-300 px-3 text-sm font-semibold outline-none focus:border-[#08783f]"
              >
                <option value="">Semua Unit</option>
                {units.map((item) => (
                  <option key={item.unitPengusul} value={item.unitPengusul}>
                    {item.unitPengusul}
                  </option>
                ))}
              </select>
              <select
                name="tahunAnggaran"
                defaultValue={tahunAnggaran ?? ""}
                className="h-10 rounded-lg border border-slate-300 px-3 text-sm font-semibold outline-none focus:border-[#08783f]"
              >
                <option value="">Semua Tahun</option>
                {years.map((item) => (
                  <option key={item.tahunAnggaran} value={item.tahunAnggaran}>
                    {item.tahunAnggaran}
                  </option>
                ))}
              </select>
              <button className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#08783f] px-4 text-sm font-black text-white">
                <FileSearch className="h-4 w-4" />
                Filter
              </button>
            </form>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[1120px] w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-black uppercase text-slate-400">
                  <th className="px-4 py-3">Kode Usulan</th>
                  <th className="px-4 py-3">Nama / Uraian</th>
                  <th className="px-4 py-3">Unit</th>
                  <th className="px-4 py-3">Tahun</th>
                  <th className="px-4 py-3">Total Estimasi</th>
                  <th className="px-4 py-3">Prioritas</th>
                  <th className="px-4 py-3">Tanggal Pengajuan</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.length > 0 ? (
                  rows.map((item) => (
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
                      <td className="whitespace-nowrap px-4 py-4 font-semibold text-slate-600">
                        {item.tahunAnggaran}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 font-semibold text-slate-600">
                        {formatCurrency((item.totalEstimasi ?? item.pagu).toString())}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${priorityClass(item.prioritas)}`}
                        >
                          {item.prioritas ?? "-"}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 font-semibold text-slate-600">
                        {dateLabel(item.submittedAt ?? item.createdAt)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${planningStatusStyles[item.statusUsulan] ?? "bg-slate-100 text-slate-600"}`}
                        >
                          {planningStatusLabels[item.statusUsulan] ?? item.statusUsulan}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-right">
                        <VerificationDetailModalButton proposalId={item.id} />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center">
                      <p className="text-base font-black text-slate-700">
                        Tidak ada usulan yang menunggu verifikasi.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </>
  );
}
