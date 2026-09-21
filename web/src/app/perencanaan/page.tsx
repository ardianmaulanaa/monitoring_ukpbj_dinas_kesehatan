import { revalidatePath } from "next/cache";
import { Prisma, type RoleCode, type RupStatus } from "@prisma/client";
import {
  CheckCircle2,
  FileCheck2,
  FileSearch,
  Search,
  UsersRound,
} from "lucide-react";
import AppHeader from "@/components/dashboard/AppHeader";
import AddRupModalButton from "@/components/sirup-rup/AddRupModalButton";
import DeleteRupButton from "@/components/sirup-rup/DeleteRupButton";
import RupDetailModalButton from "@/components/sirup-rup/RupDetailModalButton";
import { getCurrentUser } from "@/lib/auth";
import { formatCurrency } from "@/lib/currency";
import { canDeletePlanningProposal } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { getActiveSumberDanaOptions } from "@/lib/sumber-dana";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const planningStatusLabels: Record<string, string> = {
  BELUM_INPUT: "Draft Usulan",
  PROSES_VERIFIKASI: "Menunggu Kepala Unit",
  MENUNGGU_PPTK: "Menunggu PPTK",
  MENUNGGU_PPK: "Menunggu PPK",
  MENUNGGU_KPA_PA: "Menunggu KPA/PA",
  REVISI_PAGU: "Perlu Revisi",
  SUDAH_TAYANG: "Siap RUP/SIRUP",
  DITARIK: "Ditolak",
};

const planningStatusStyles: Record<string, string> = {
  BELUM_INPUT: "bg-slate-100 text-slate-600",
  PROSES_VERIFIKASI: "bg-amber-100 text-amber-700",
  MENUNGGU_PPTK: "bg-blue-100 text-blue-700",
  MENUNGGU_PPK: "bg-violet-100 text-violet-700",
  MENUNGGU_KPA_PA: "bg-indigo-100 text-indigo-700",
  REVISI_PAGU: "bg-orange-100 text-orange-700",
  SUDAH_TAYANG: "bg-emerald-100 text-emerald-700",
  DITARIK: "bg-red-100 text-red-700",
};

const planningStatusRole: Partial<Record<RupStatus, RoleCode[]>> = {
  BELUM_INPUT: ["OPERATOR"],
  PROSES_VERIFIKASI: ["LEADER"],
  MENUNGGU_PPTK: ["PPTK"],
  MENUNGGU_PPK: ["PPK"],
  MENUNGGU_KPA_PA: ["KPA", "PA"],
};

const planningNextStatus: Partial<Record<RupStatus, RupStatus>> = {
  BELUM_INPUT: "PROSES_VERIFIKASI",
  PROSES_VERIFIKASI: "MENUNGGU_PPTK",
  MENUNGGU_PPTK: "MENUNGGU_PPK",
  MENUNGGU_PPK: "MENUNGGU_KPA_PA",
  MENUNGGU_KPA_PA: "SUDAH_TAYANG",
};

const planningApprovalFlow = [
  {
    label: "Draft Usulan",
    helper: "Unit input kebutuhan, volume, pagu, jadwal, dan dokumen awal.",
  },
  {
    label: "Kepala Unit",
    helper: "Validasi bahwa kebutuhan benar diperlukan oleh unit pengusul.",
  },
  {
    label: "PPTK",
    helper: "Cek kesesuaian kegiatan, output, jadwal, dan anggaran.",
  },
  {
    label: "PPK",
    helper:
      "Review KAK, spesifikasi teknis, HPS, metode, dan rancangan kontrak.",
  },
  {
    label: "KPA/PA",
    helper: "Approval akhir sebelum paket siap masuk RUP/SIRUP.",
  },
  {
    label: "Siap RUP/SIRUP",
    helper: "Admin dapat input atau sinkronkan ke SIRUP.",
  },
];

const roleNames: Partial<Record<RoleCode, string>> = {
  SUPER_ADMIN: "Super Admin",
  LPSE_ADMIN: "Admin LPSE",
  OPERATOR: "Operator",
  LEADER: "Kepala Unit",
  PPTK: "PPTK",
  PPK: "PPK",
  PA: "PA",
  KPA: "KPA",
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

function methodLabel(value: string) {
  const labels: Record<string, string> = {
    TENDER: "Tender",
    NON_TENDER: "Non Tender",
    E_PURCHASING: "e-Katalog",
    PENGADAAN_LANGSUNG: "Pengadaan Langsung",
    SWAKELOLA: "Swakelola",
  };

  return labels[value] ?? humanize(value);
}

function sourceFundClass(value: string) {
  const normalized = value.toUpperCase();

  if (normalized.includes("BLUD")) return "bg-emerald-100 text-[#08783f]";
  if (normalized.includes("APBD")) return "bg-amber-100 text-amber-700";
  if (normalized.includes("DBHCHT")) return "bg-red-100 text-red-700";

  return "bg-emerald-100 text-emerald-700";
}

function normalizeUnit(value?: string | null) {
  return value?.trim().toLowerCase() ?? "";
}

function canActOnPlanningStatus(userRoles: RoleCode[], status: RupStatus) {
  if (userRoles.includes("SUPER_ADMIN")) {
    return Boolean(planningNextStatus[status]);
  }

  const allowedRoles = planningStatusRole[status] ?? [];
  return userRoles.some((role) => allowedRoles.includes(role));
}

async function updatePlanningApprovalAction(formData: FormData) {
  "use server";

  const user = await getCurrentUser();
  if (!user) return;

  const id = String(formData.get("id") ?? "");
  const action = String(formData.get("action") ?? "");
  const proposal = await prisma.rencanaUmumPengadaan.findUnique({
    where: { id },
    select: { statusSirup: true },
  });

  if (!proposal || !canActOnPlanningStatus(user.roles, proposal.statusSirup)) {
    return;
  }

  const nextStatus =
    action === "revise"
      ? "REVISI_PAGU"
      : action === "reject"
        ? "DITARIK"
        : planningNextStatus[proposal.statusSirup];

  if (!nextStatus) return;

  await prisma.rencanaUmumPengadaan.update({
    where: { id },
    data: { statusSirup: nextStatus },
  });

  revalidatePath("/perencanaan");
  revalidatePath("/sirup-rup");
}

export default async function Page({ searchParams }: PageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const q = getParam(resolvedSearchParams, "q")?.trim();
  const tahunAnggaran = getParam(resolvedSearchParams, "tahunAnggaran");
  const sumberDana = getParam(resolvedSearchParams, "sumberDana");
  const unitPengusul = getParam(resolvedSearchParams, "unitPengusul");
  const statusSirup = getParam(resolvedSearchParams, "statusSirup");

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
    ...(statusSirup ? { statusSirup: statusSirup as RupStatus } : {}),
  };

  const rupData = await prisma.rencanaUmumPengadaan.findMany({
    where,
    orderBy: [{ tahunAnggaran: "desc" }, { createdAt: "desc" }],
    take: 100,
  });
  const years = await prisma.rencanaUmumPengadaan.findMany({
    distinct: ["tahunAnggaran"],
    orderBy: { tahunAnggaran: "desc" },
    select: { tahunAnggaran: true },
  });
  const sourceFunds = await getActiveSumberDanaOptions();
  const units = await prisma.rencanaUmumPengadaan.findMany({
    distinct: ["unitPengusul"],
    orderBy: { unitPengusul: "asc" },
    select: { unitPengusul: true },
  });
  const currentUser = await getCurrentUser();
  const currentUserRoles = currentUser?.roles ?? [];
  const canDeletePlanning = canDeletePlanningProposal(currentUserRoles);
  const currentUserProfile = currentUser
    ? await prisma.user.findUnique({
        where: { id: currentUser.id },
        select: { unitKerja: true },
      })
    : null;

  const totalPagu = rupData.reduce(
    (sum, item) => sum + decimalNumber(item.pagu),
    0,
  );
  const draftCount = rupData.filter(
    (item) => item.statusSirup === "BELUM_INPUT",
  ).length;
  const reviewCount = rupData.filter((item) =>
    [
      "PROSES_VERIFIKASI",
      "MENUNGGU_PPTK",
      "MENUNGGU_PPK",
      "MENUNGGU_KPA_PA",
    ].includes(item.statusSirup),
  ).length;
  const revisionCount = rupData.filter(
    (item) => item.statusSirup === "REVISI_PAGU",
  ).length;
  const readyCount = rupData.filter(
    (item) => item.statusSirup === "SUDAH_TAYANG",
  ).length;
  const selectedProposal =
    rupData.find((item) =>
      canActOnPlanningStatus(currentUserRoles, item.statusSirup),
    ) ?? rupData[0];
  const canActOnSelectedProposal = selectedProposal
    ? canActOnPlanningStatus(currentUserRoles, selectedProposal.statusSirup)
    : false;
  const selectedNextStatus = selectedProposal
    ? planningNextStatus[selectedProposal.statusSirup]
    : undefined;

  return (
    <>
      <AppHeader
        title="Perencanaan Pengadaan"
        subtitle="UKPBJ › Perencanaan"
        rightLabel="Tahapan"
      />
      <main className="bg-[#f4f7f5]">
        <form className="border-b border-slate-200 bg-white px-4 py-3 sm:px-6 lg:px-8">
          <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[auto_minmax(132px,150px)_minmax(190px,220px)_minmax(132px,170px)] xl:grid-cols-[auto_minmax(132px,150px)_minmax(190px,220px)_minmax(132px,170px)_minmax(150px,180px)_minmax(240px,1fr)] xl:items-center">
            <span className="self-center text-sm font-black text-slate-400 sm:col-span-2 lg:col-span-1">
              Filter:
            </span>

            <select
              name="tahunAnggaran"
              defaultValue={tahunAnggaran ?? ""}
              className="h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-600 outline-none transition focus:border-[#08783f] focus:ring-2 focus:ring-emerald-100"
            >
              <option value="">Semua Tahun</option>
              {years.map((year) => (
                <option key={year.tahunAnggaran} value={year.tahunAnggaran}>
                  TA {year.tahunAnggaran}
                </option>
              ))}
            </select>

            <select
              name="sumberDana"
              defaultValue={sumberDana ?? ""}
              className="h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-600 outline-none transition focus:border-[#08783f] focus:ring-2 focus:ring-emerald-100"
            >
              <option value="">Semua Sumber Dana</option>
              {sourceFunds.map((item) => (
                <option key={item.kode} value={item.kode}>
                  {item.nama}
                </option>
              ))}
            </select>

            <select
              name="unitPengusul"
              defaultValue={unitPengusul ?? ""}
              className="h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-600 outline-none transition focus:border-[#08783f] focus:ring-2 focus:ring-emerald-100"
            >
              <option value="">Semua Unit</option>
              {units.map((item) => (
                <option key={item.unitPengusul} value={item.unitPengusul}>
                  {item.unitPengusul}
                </option>
              ))}
            </select>

            <select
              name="statusSirup"
              defaultValue={statusSirup ?? ""}
              className="h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-600 outline-none transition focus:border-[#08783f] focus:ring-2 focus:ring-emerald-100"
            >
              <option value="">Semua Status</option>
              <option value="BELUM_INPUT">Draft Usulan</option>
              <option value="PROSES_VERIFIKASI">Menunggu Kepala Unit</option>
              <option value="MENUNGGU_PPTK">Menunggu PPTK</option>
              <option value="MENUNGGU_PPK">Menunggu PPK</option>
              <option value="MENUNGGU_KPA_PA">Menunggu KPA/PA</option>
              <option value="REVISI_PAGU">Perlu Revisi</option>
              <option value="SUDAH_TAYANG">Siap RUP/SIRUP</option>
              <option value="DITARIK">Ditolak</option>
            </select>

            <label className="flex h-9 w-full items-center gap-2 rounded-full border border-slate-300 bg-slate-50 px-4 text-sm text-slate-500 focus-within:border-[#08783f] focus-within:ring-2 focus-within:ring-emerald-100 sm:col-span-2 lg:col-span-4 xl:col-span-1">
              <Search className="h-4 w-4" />
              <input
                name="q"
                defaultValue={q ?? ""}
                placeholder="Cari usulan pengadaan..."
                className="min-w-0 flex-1 bg-transparent font-semibold outline-none"
              />
            </label>
          </div>
        </form>

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
                helper: "Kepala Unit/PPTK/PPK/KPA",
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

          <div className="mb-5 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="grid gap-3 p-5 lg:grid-cols-6">
              {planningApprovalFlow.map((step, index) => (
                <div
                  key={step.label}
                  className="relative rounded-lg border border-slate-200 bg-slate-50 p-4"
                >
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#08783f] text-xs font-black text-white">
                    {index + 1}
                  </span>
                  <p className="mt-3 text-sm font-black text-slate-900">
                    {step.label}
                  </p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
                    {step.helper}
                  </p>
                </div>
              ))}
            </div>
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
                sumberDanaOptions={sourceFunds}
                label="Tambah Usulan"
                mode="planning"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-[1320px] w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-black uppercase text-slate-400">
                    <th className="px-4 py-3">Kode RUP</th>
                    <th className="px-4 py-3">Nama Usulan</th>
                    <th className="px-4 py-3">Unit</th>
                    <th className="px-4 py-3">Program / Kegiatan</th>
                    <th className="px-4 py-3">Rekening</th>
                    <th className="px-4 py-3">Sumber Dana</th>
                    <th className="px-4 py-3">Pagu</th>
                    <th className="px-4 py-3">Metode</th>
                    <th className="px-4 py-3">Kesiapan Dokumen</th>
                    <th className="px-4 py-3">Status</th>
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
                        <td className="whitespace-nowrap px-4 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${sourceFundClass(item.sumberDana)}`}
                          >
                            {item.sumberDana}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 font-semibold text-slate-600">
                          {formatCurrency(item.pagu.toString())}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 font-semibold text-slate-600">
                          {methodLabel(item.metodePengadaan)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4">
                          <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
                            KAK {item.statusKak || "BELUM_ADA"} / HPS{" "}
                            {item.statusHps || "BELUM_ADA"}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${planningStatusStyles[item.statusSirup] ?? "bg-slate-100 text-slate-600"}`}
                          >
                            {planningStatusLabels[item.statusSirup] ??
                              humanize(item.statusSirup)}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <RupDetailModalButton
                              item={{
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
                                satuanKebutuhan: item.satuanKebutuhan,
                                spesifikasiAwal: item.spesifikasiAwal,
                                outputDiharapkan: item.outputDiharapkan,
                                prioritas: item.prioritas,
                                waktuKebutuhan: item.waktuKebutuhan,
                                caraPengadaan: item.caraPengadaan,
                                metodePengadaan: item.metodePengadaan,
                                jadwalPemilihan: item.jadwalPemilihan,
                                jadwalMulaiRencana: item.jadwalMulaiRencana,
                                jadwalSelesaiRencana: item.jadwalSelesaiRencana,
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
                              statusLabel={
                                planningStatusLabels[item.statusSirup] ??
                                humanize(item.statusSirup)
                              }
                              statusStyle={
                                planningStatusStyles[item.statusSirup] ??
                                "bg-slate-100 text-slate-600"
                              }
                              canEditRevision={
                                currentUserRoles.includes("SUPER_ADMIN") ||
                                normalizeUnit(currentUserProfile?.unitKerja) ===
                                  normalizeUnit(item.unitPengusul) ||
                                normalizeUnit(currentUser?.name) ===
                                  normalizeUnit(item.unitPengusul)
                              }
                            />
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
                      <td colSpan={11} className="px-4 py-16 text-center">
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

          <div className="mt-5 grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <FileCheck2 className="h-5 w-5 text-[#08783f]" />
                <h2 className="text-lg font-black text-[#16227c]">
                  Dokumen Awal yang Dicek
                </h2>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {[
                  "KAK / kerangka acuan kerja",
                  "Spesifikasi teknis dan volume",
                  "HPS dan referensi harga",
                  "Sumber dana dan pagu",
                  "Telaah TKDN/impor bila perlu",
                  "Rancangan kontrak/SPK",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3"
                  >
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-[#08783f]" />
                    <span className="text-sm font-bold text-slate-600">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <UsersRound className="h-5 w-5 text-[#08783f]" />
                <h2 className="text-lg font-black text-[#16227c]">
                  Aksi Sesuai Role
                </h2>
              </div>
              <div className="mt-4 rounded-lg bg-slate-50 p-4">
                <p className="text-xs font-black uppercase text-slate-400">
                  Usulan aktif
                </p>
                <p className="mt-2 text-sm font-black text-[#16227c]">
                  {selectedProposal?.namaPaket ?? "Belum ada usulan"}
                </p>
                <p className="mt-1 text-xs font-bold text-slate-500">
                  Status:{" "}
                  {selectedProposal
                    ? (planningStatusLabels[selectedProposal.statusSirup] ??
                      humanize(selectedProposal.statusSirup))
                    : "-"}
                </p>
                <p className="mt-1 text-xs font-bold text-slate-500">
                  Role login:{" "}
                  {currentUserRoles.length > 0
                    ? currentUserRoles
                        .map((role) => roleNames[role] ?? role)
                        .join(", ")
                    : "-"}
                </p>
                {selectedProposal && !canActOnSelectedProposal ? (
                  <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs font-bold leading-5 text-amber-700">
                    Akun ini belum bisa approve status ini. Pilih usulan yang
                    sedang menunggu role login.
                  </p>
                ) : null}
              </div>
              <form
                action={updatePlanningApprovalAction}
                className="mt-4 grid gap-2"
              >
                <input
                  type="hidden"
                  name="id"
                  value={selectedProposal?.id ?? ""}
                />
                <button
                  name="action"
                  value="approve"
                  disabled={!canActOnSelectedProposal}
                  className="h-10 rounded-lg bg-[#08783f] px-4 text-sm font-black text-white transition hover:bg-[#066532] disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {selectedNextStatus
                    ? `Approve ke ${planningStatusLabels[selectedNextStatus]}`
                    : "Ajukan / Approve Tahap Ini"}
                </button>
                <button
                  name="action"
                  value="revise"
                  disabled={!canActOnSelectedProposal}
                  className="h-10 rounded-lg border border-amber-200 bg-amber-50 px-4 text-sm font-black text-amber-700 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
                >
                  Minta Revisi
                </button>
                <button
                  name="action"
                  value="reject"
                  disabled={!canActOnSelectedProposal}
                  className="h-10 rounded-lg border border-red-200 bg-red-50 px-4 text-sm font-black text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
                >
                  Tolak Usulan
                </button>
              </form>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
