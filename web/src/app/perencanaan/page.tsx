import { Prisma, type StatusUsulan } from "@prisma/client";
import { FileSearch } from "lucide-react";
import AppHeader from "@/components/appheader/AppHeader";
import AddRupModalButton from "@/components/button/sirup-rup/AddRupModalButton";
import DeleteRupButton from "@/components/button/sirup-rup/DeleteRupButton";
import EditRupModalButton from "@/components/button/sirup-rup/EditRupModalButton";
import PlanningDetailModalButton from "@/app/perencanaan/PlanningDetailModalButton";
import { getCurrentUser } from "@/lib/auth";
import { formatCurrency } from "@/lib/currency";
import { isDatabaseConnectionError } from "@/lib/database-errors";
import { canDeletePlanningProposal } from "@/lib/permissions";
import {
  canEditUsulan,
  isDraftStatus,
  isReadyRupStatus,
  isRevisionStatus,
  planningStatusLabels,
  planningStatusStyles,
} from "@/lib/planning-workflow";
import { prisma } from "@/lib/prisma";
import { getActiveSumberDanaOptions } from "@/lib/sumber-dana";

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

function decimalNumber(value: Prisma.Decimal | number | string | null) {
  if (value instanceof Prisma.Decimal) return value.toNumber();
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value) || 0;
  return 0;
}

function humanize(value: string) {
  return value
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function priorityClass(value: string | null) {
  const normalized = (value ?? "").toUpperCase();

  if (normalized === "MENDESAK") return "bg-red-100 text-red-700";
  if (normalized === "TINGGI") return "bg-amber-100 text-amber-700";
  if (normalized === "RENDAH") return "bg-slate-100 text-slate-600";

  return "bg-blue-100 text-blue-700";
}

async function getPlanningRows(where: Prisma.RencanaUmumPengadaanWhereInput) {
  const query = () =>
    prisma.rencanaUmumPengadaan.findMany({
      where,
      orderBy: [{ tahunAnggaran: "desc" }, { createdAt: "desc" }],
      take: 100,
    });

  try {
    return await query();
  } catch (error) {
    if (!isDatabaseConnectionError(error)) {
      throw error;
    }

    await prisma.$disconnect().catch(() => undefined);

    try {
      return await query();
    } catch (retryError) {
      if (isDatabaseConnectionError(retryError)) {
        return [];
      }

      throw retryError;
    }
  }
}

export default async function Page({ searchParams }: PageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const q = getParam(resolvedSearchParams, "q")?.trim();
  const tahunAnggaran = getParam(resolvedSearchParams, "tahunAnggaran");
  const sumberDana = getParam(resolvedSearchParams, "sumberDana");
  const unitPengusul = getParam(resolvedSearchParams, "unitPengusul");
  const statusUsulan =
    getParam(resolvedSearchParams, "statusUsulan") ??
    getParam(resolvedSearchParams, "statusSirup");

  const where: Prisma.RencanaUmumPengadaanWhereInput = {
    ...(q
      ? {
          OR: [
            { kodeRup: { contains: q } },
            { namaPaket: { contains: q } },
            { unitPengusul: { contains: q } },
          ],
        }
      : {}),
    ...(tahunAnggaran ? { tahunAnggaran: Number(tahunAnggaran) } : {}),
    ...(sumberDana ? { sumberDana } : {}),
    ...(unitPengusul ? { unitPengusul } : {}),
    ...(statusUsulan ? { statusUsulan: statusUsulan as StatusUsulan } : {}),
  };

  const [rupData, sourceFunds, currentUser] = await Promise.all([
    getPlanningRows(where),
    getActiveSumberDanaOptions(),
    getCurrentUser(),
  ]);
  const currentUserRoles = currentUser?.roles ?? [];
  const currentUserProfile = currentUser
    ? await prisma.user.findUnique({
        where: { id: currentUser.id },
        select: { unitKerja: true },
      })
    : null;
  const canDeletePlanning = canDeletePlanningProposal(currentUserRoles);

  const totalPagu = rupData.reduce(
    (sum, item) => sum + decimalNumber(item.totalEstimasi ?? item.pagu),
    0,
  );
  const draftCount = rupData.filter(
    (item) => isDraftStatus(item.statusUsulan),
  ).length;
  const reviewCount = rupData.filter((item) => item.statusUsulan === "DIAJUKAN").length;
  const revisionCount = rupData.filter(
    (item) => isRevisionStatus(item.statusUsulan),
  ).length;
  const readyCount = rupData.filter(
    (item) =>
      isReadyRupStatus(item.statusUsulan) || item.statusUsulan === "RUP_TAYANG",
  ).length;

  return (
    <>
      <AppHeader
        title="Perencanaan Pengadaan"
        subtitle="UKPBJ › Perencanaan"
        rightLabel="Tahapan"
      />
      <main className="bg-[#f4f7f5]">
        <section className="px-4 py-6 sm:px-6 lg:px-8">
          <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              {
                label: "Total Usulan",
                value: rupData.length.toLocaleString("id-ID"),
                helper: formatCurrency(totalPagu),
                tone: "border-l-[#1976d2]",
              },
              {
                label: "Draft Usulan",
                value: draftCount.toLocaleString("id-ID"),
                helper: "Belum diajukan unit",
                tone: "border-l-slate-400",
              },
              {
                label: "Menunggu Review",
                value: reviewCount.toLocaleString("id-ID"),
                helper: "Menunggu Kepala Unit",
                tone: "border-l-[#f57c00]",
              },
              {
                label: "Siap RUP/SIRUP",
                value: readyCount.toLocaleString("id-ID"),
                helper:
                  revisionCount > 0
                    ? `${revisionCount} perlu revisi`
                    : "Bisa dilanjutkan",
                tone: "border-l-[#43a047]",
              },
            ].map((item) => (
              <div
                key={item.label}
                className={`rounded-lg border border-slate-200 border-l-4 bg-white px-4 py-3 shadow-sm ${item.tone}`}
              >
                <p className="text-xs font-black uppercase text-slate-400">
                  {item.label}
                </p>
                <p className="mt-2 text-2xl font-black text-[#16227c]">
                  {item.value}
                </p>
                <p className="mt-1 text-xs font-bold text-slate-500">
                  {item.helper}
                </p>
              </div>
            ))}
          </div>

          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-2">
                <FileSearch className="h-5 w-5 shrink-0 text-[#08783f]" />
                <h1 className="truncate text-lg font-black text-[#16227c]">
                  Perencanaan Pengadaan
                </h1>
              </div>

              <AddRupModalButton
                defaultUnitPengusul={currentUserProfile?.unitKerja}
                sumberDanaOptions={sourceFunds}
                label="Tambah Usulan"
                mode="planning"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-[1420px] w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-black uppercase text-slate-400">
                    <th className="px-4 py-3">Kode Usulan</th>
                    <th className="px-4 py-3">Uraian Kebutuhan</th>
                    <th className="px-4 py-3">Unit</th>
                    <th className="px-4 py-3">Tahun</th>
                    <th className="px-4 py-3">Program / Kegiatan</th>
                    <th className="px-4 py-3">Rekening</th>
                    <th className="px-4 py-3">Jumlah</th>
                    <th className="px-4 py-3">Total Estimasi</th>
                    <th className="px-4 py-3">Prioritas</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Tanggal Pengajuan</th>
                    <th className="px-4 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rupData.length > 0 ? (
                    rupData.map((item) => (
                      <tr
                        key={item.id}
                        className="transition hover:bg-slate-50"
                      >
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
                        <td className="max-w-[260px] px-4 py-4">
                          <p className="truncate font-bold text-slate-700">
                            {item.program || "-"}
                          </p>
                          <p className="mt-1 truncate text-xs font-semibold text-slate-500">
                            {item.kegiatan || item.subKegiatan || "-"}
                          </p>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 font-semibold text-slate-600">
                          {item.kodeRekening || "-"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 font-semibold text-slate-600">
                          {item.jumlahKebutuhan?.toString() ??
                            item.volumeKebutuhan ??
                            "-"}{" "}
                          {item.satuanKebutuhan ?? ""}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 font-semibold text-slate-600">
                          {formatCurrency(
                            (item.totalEstimasi ?? item.pagu).toString(),
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${priorityClass(item.prioritas)}`}
                          >
                            {item.prioritas ? humanize(item.prioritas) : "-"}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${planningStatusStyles[item.statusUsulan] ?? "bg-slate-100 text-slate-600"}`}
                          >
                            {planningStatusLabels[item.statusUsulan] ??
                              humanize(item.statusUsulan)}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 font-semibold text-slate-600">
                          {item.createdAt.toLocaleDateString("id-ID", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <PlanningDetailModalButton
                              proposal={{
                                id: item.id,
                                kodeRup: item.kodeRup,
                                namaPaket: item.namaPaket,
                                unitPengusul: item.unitPengusul,
                                program: item.program,
                                kegiatan: item.kegiatan,
                                subKegiatan: item.subKegiatan,
                                kodeRekening: item.kodeRekening,
                                tahunAnggaran: item.tahunAnggaran,
                                unitBidang: item.unitBidang,
                                ppkPptk: item.ppkPptk,
                                kontakPenanggungJawab:
                                  item.kontakPenanggungJawab,
                                sumberDana: item.sumberDana,
                                pagu: item.pagu.toString(),
                                jumlahKebutuhan:
                                  item.jumlahKebutuhan?.toString() ?? null,
                                satuanKebutuhan: item.satuanKebutuhan,
                                spesifikasiAwal: item.spesifikasiAwal,
                                estimasiHargaSatuan:
                                  item.estimasiHargaSatuan?.toString() ?? null,
                                totalEstimasi:
                                  item.totalEstimasi?.toString() ?? null,
                                prioritas: item.prioritas,
                                justifikasi: item.justifikasi,
                                metodePengadaan: item.metodePengadaan,
                                jadwalPemilihan: item.jadwalPemilihan,
                                picTindakLanjut: item.picTindakLanjut,
                                tindakLanjut: item.tindakLanjut,
                                statusKak: item.statusKak,
                                statusHps: item.statusHps,
                                statusRancanganKontrak:
                                  item.statusRancanganKontrak,
                                statusDokumenPendukung:
                                  item.statusDokumenPendukung,
                                revisionNote: item.revisionNote,
                                revisionBy: item.revisionBy,
                                revisionAt: item.revisionAt?.toISOString() ?? null,
                                verifiedBy: item.verifiedBy,
                                verifiedAt: item.verifiedAt?.toISOString() ?? null,
                                catatan: item.catatan,
                                statusSirup: item.statusSirup,
                                statusUsulan: item.statusUsulan,
                              }}
                            />
                            {canEditUsulan(
                              currentUserRoles,
                              item.statusUsulan,
                            ) ? (
                              <EditRupModalButton
                                defaultUnitPengusul={currentUserProfile?.unitKerja}
                                sumberDanaOptions={sourceFunds}
                                label="Edit Perencanaan"
                                mode="planning"
                                initialData={{
                                  id: item.id,
                                  kodeRup: item.kodeRup,
                                  namaPaket: item.namaPaket,
                                  jenisBelanja: item.jenisBelanja,
                                  lokasiPaket: item.lokasiPaket,
                                  unitBidang: item.unitBidang,
                                  ppkPptk: item.ppkPptk,
                                  kontakPenanggungJawab:
                                    item.kontakPenanggungJawab,
                                  program: item.program,
                                  kegiatan: item.kegiatan,
                                  subKegiatan: item.subKegiatan,
                                  kodeRekening: item.kodeRekening,
                                  uraianBelanja: item.uraianBelanja,
                                  unitPengusul: item.unitPengusul,
                                  sumberDana: item.sumberDana,
                                  pagu: item.pagu.toString(),
                                  uraianKebutuhan: item.uraianKebutuhan,
                                  volumeKebutuhan: item.volumeKebutuhan,
                                  jumlahKebutuhan:
                                    item.jumlahKebutuhan?.toString() ?? null,
                                  satuanKebutuhan: item.satuanKebutuhan,
                                  spesifikasiAwal: item.spesifikasiAwal,
                                  estimasiHargaSatuan:
                                    item.estimasiHargaSatuan?.toString() ??
                                    null,
                                  totalEstimasi:
                                    item.totalEstimasi?.toString() ?? null,
                                  justifikasi: item.justifikasi,
                                  outputDiharapkan: item.outputDiharapkan,
                                  prioritas: item.prioritas,
                                  waktuKebutuhan: item.waktuKebutuhan,
                                  caraPengadaan: item.caraPengadaan,
                                  metodePengadaan: item.metodePengadaan,
                                  jadwalPemilihan: item.jadwalPemilihan,
                                  jadwalMulaiRencana:
                                    item.jadwalMulaiRencana,
                                  jadwalSelesaiRencana:
                                    item.jadwalSelesaiRencana,
                                  tahunAnggaran: item.tahunAnggaran,
                                  statusSirup: item.statusSirup,
                                  statusKak: item.statusKak,
                                  statusHps: item.statusHps,
                                  statusRancanganKontrak:
                                    item.statusRancanganKontrak,
                                  statusDokumenPendukung:
                                    item.statusDokumenPendukung,
                                  kekuranganDokumen: item.kekuranganDokumen,
                                  kendala: item.kendala,
                                  tindakLanjut: item.tindakLanjut,
                                  picTindakLanjut: item.picTindakLanjut,
                                  catatan: item.catatan,
                                }}
                              />
                            ) : null}
                            {canDeletePlanning ? (
                              <DeleteRupButton
                                id={item.id}
                                namaPaket={item.namaPaket}
                              />
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={12} className="px-4 py-16 text-center">
                        <FileSearch className="mx-auto h-14 w-14 text-slate-300" />
                        <p className="mt-4 text-base font-black text-slate-700">
                          Belum ada usulan perencanaan
                        </p>
                        <p className="mt-2 text-sm font-semibold text-slate-500">
                          Tambahkan usulan kebutuhan, KAK, HPS, sumber dana, dan
                          jadwal pemilihan.
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
