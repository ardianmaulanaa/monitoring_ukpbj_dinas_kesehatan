import { Prisma, type StatusUsulan } from "@prisma/client";

import { FileSearch } from "lucide-react";

import AppHeader from "@/components/appheader/AppHeader";

import {
  DataCardEmpty,
  DataCardField,
  DataCardRow,
} from "@/components/data-card/DataCardList";

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

  const draftCount = rupData.filter((item) =>
    isDraftStatus(item.statusUsulan),
  ).length;

  const reviewCount = rupData.filter(
    (item) => item.statusUsulan === "DIAJUKAN",
  ).length;

  const revisionCount = rupData.filter((item) =>
    isRevisionStatus(item.statusUsulan),
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

            <div className="bg-slate-50/50 p-4 sm:p-5">
              <div className="mb-3 flex items-center justify-between gap-3 xl:hidden">
                <p className="text-xs font-bold text-slate-500">
                  Geser ke kanan untuk melihat seluruh kolom dan tombol aksi.
                </p>

                <span className="shrink-0 rounded-full bg-white px-3 py-1 text-[11px] font-black text-[#08783f] shadow-sm ring-1 ring-slate-200">
                  Geser →
                </span>
              </div>

              <div className="-mx-1 max-w-full overflow-x-auto overflow-y-hidden px-1 pb-3 overscroll-x-contain [scrollbar-color:#94a3b8_transparent] [scrollbar-gutter:stable] [scrollbar-width:thin]">
                <div className="w-max min-w-full space-y-3">
                  {rupData.length > 0 ? (
                    rupData.map((item) => (
                      <DataCardRow
                        key={item.id}
                        minWidth="2550px"
                        className="xl:min-w-[2550px]"
                        icon={
                          <FileSearch className="h-5 w-5" strokeWidth={2.4} />
                        }
                        columns="56px 140px minmax(300px,1fr) 140px 100px 220px 140px 140px 180px 130px 160px 150px 360px"
                        actions={
                          <div className="flex min-w-max flex-nowrap items-center justify-end gap-2 whitespace-nowrap">
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

                                revisionAt:
                                  item.revisionAt?.toISOString() ?? null,

                                verifiedBy: item.verifiedBy,

                                verifiedAt:
                                  item.verifiedAt?.toISOString() ?? null,

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
                                defaultUnitPengusul={
                                  currentUserProfile?.unitKerja
                                }
                                sumberDanaOptions={sourceFunds}
                                label="Edit"
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

                                  jadwalMulaiRencana: item.jadwalMulaiRencana,

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
                        }
                      >
                        <DataCardField
                          label="Kode Usulan"
                          valueClassName="font-mono text-xs font-black text-slate-600"
                        >
                          <span className="truncate" title={item.kodeRup}>
                            {item.kodeRup}
                          </span>
                        </DataCardField>

                        <DataCardField
                          label="Uraian Kebutuhan"
                          valueClassName="font-black text-[#16227c]"
                        >
                          <p
                            className="line-clamp-2 leading-5"
                            title={item.namaPaket}
                          >
                            {item.namaPaket}
                          </p>
                        </DataCardField>

                        <DataCardField label="Unit">
                          <span className="truncate">{item.unitPengusul}</span>
                        </DataCardField>

                        <DataCardField label="Tahun">
                          {item.tahunAnggaran}
                        </DataCardField>

                        <DataCardField label="Program / Kegiatan">
                          <p className="truncate font-bold text-slate-700">
                            {item.program || "-"}
                          </p>

                          <p className="mt-1 truncate text-xs font-semibold text-slate-500">
                            {item.kegiatan || item.subKegiatan || "-"}
                          </p>
                        </DataCardField>

                        <DataCardField label="Rekening">
                          <span className="truncate">
                            {item.kodeRekening || "-"}
                          </span>
                        </DataCardField>

                        <DataCardField label="Jumlah">
                          <span className="truncate">
                            {item.jumlahKebutuhan?.toString() ??
                              item.volumeKebutuhan ??
                              "-"}{" "}
                            {item.satuanKebutuhan ?? ""}
                          </span>
                        </DataCardField>

                        <DataCardField
                          label="Total Estimasi"
                          valueClassName="whitespace-nowrap font-black text-slate-800"
                        >
                          {formatCurrency(
                            (item.totalEstimasi ?? item.pagu).toString(),
                          )}
                        </DataCardField>

                        <DataCardField label="Prioritas">
                          <span
                            className={`inline-flex max-w-full rounded-full px-3 py-1 text-xs font-black ${priorityClass(item.prioritas)}`}
                          >
                            <span className="truncate">
                              {item.prioritas ? humanize(item.prioritas) : "-"}
                            </span>
                          </span>
                        </DataCardField>

                        <DataCardField label="Status">
                          <span
                            className={`inline-flex max-w-full rounded-full px-3 py-1 text-xs font-black ${planningStatusStyles[item.statusUsulan] ?? "bg-slate-100 text-slate-600"}`}
                          >
                            <span className="truncate">
                              {planningStatusLabels[item.statusUsulan] ??
                                humanize(item.statusUsulan)}
                            </span>
                          </span>
                        </DataCardField>

                        <DataCardField label="Tanggal Pengajuan">
                          <span className="whitespace-nowrap">
                            {item.createdAt.toLocaleDateString("id-ID", {
                              day: "2-digit",

                              month: "short",

                              year: "numeric",
                            })}
                          </span>
                        </DataCardField>
                      </DataCardRow>
                    ))
                  ) : (
                    <DataCardEmpty>
                      <div>
                        <FileSearch className="mx-auto h-14 w-14 text-slate-300" />

                        <p className="mt-4 text-base font-black text-slate-700">
                          Belum ada usulan perencanaan
                        </p>

                        <p className="mt-2 text-sm font-semibold text-slate-500">
                          Tambahkan usulan kebutuhan, KAK, HPS, sumber dana, dan
                          jadwal pemilihan.
                        </p>
                      </div>
                    </DataCardEmpty>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
