import { revalidatePath } from "next/cache";
import { Prisma, type RoleCode, type RupStatus } from "@prisma/client";
import { FileSearch } from "lucide-react";
import AppHeader from "@/components/appheader/AppHeader";
import AddRupModalButton from "@/components/button/sirup-rup/AddRupModalButton";
import DeleteRupButton from "@/components/button/sirup-rup/DeleteRupButton";
import EditRupModalButton from "@/components/button/sirup-rup/EditRupModalButton";
import PlanningDetailModalButton from "@/app/perencanaan/PlanningDetailModalButton";
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

const planningApprovalRoleFlow: {
  status: RupStatus;
  label: string;
  roles: RoleCode[];
  helper: string;
}[] = [
  {
    status: "BELUM_INPUT",
    label: "Unit Pengusul",
    roles: ["OPERATOR"],
    helper: "Ajukan usulan awal ke Kepala Unit.",
  },
  {
    status: "PROSES_VERIFIKASI",
    label: "Kepala Unit",
    roles: ["LEADER"],
    helper: "Validasi kebutuhan unit dan kelengkapan awal.",
  },
  {
    status: "MENUNGGU_PPTK",
    label: "PPTK",
    roles: ["PPTK"],
    helper: "Cek kegiatan, output, jadwal, dan anggaran.",
  },
  {
    status: "MENUNGGU_PPK",
    label: "PPK",
    roles: ["PPK"],
    helper: "Review KAK, spesifikasi, HPS, dan metode.",
  },
  {
    status: "MENUNGGU_KPA_PA",
    label: "KPA/PA",
    roles: ["KPA", "PA"],
    helper: "Approval akhir sebelum siap RUP/SIRUP.",
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
  const actionNote = String(formData.get("catatanAksi") ?? "").trim();
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
  if ((action === "revise" || action === "reject") && !actionNote) return;

  await prisma.rencanaUmumPengadaan.update({
    where: { id },
    data: {
      statusSirup: nextStatus,
      ...(action === "revise" || action === "reject"
        ? {
            catatan:
              action === "reject"
                ? `Ditolak: ${actionNote}`
                : `Revisi diminta: ${actionNote}`,
          }
        : {}),
    },
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
  const sourceFunds = await getActiveSumberDanaOptions();
  const currentUser = await getCurrentUser();
  const currentUserRoles = currentUser?.roles ?? [];
  const canDeletePlanning = canDeletePlanningProposal(currentUserRoles);

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
                                sumberDana: item.sumberDana,
                                pagu: item.pagu.toString(),
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
                                catatan: item.catatan,
                                statusSirup: item.statusSirup,
                              }}
                              currentUserRoles={currentUserRoles}
                              planningApprovalRoleFlow={
                                planningApprovalRoleFlow
                              }
                              planningStatusLabels={planningStatusLabels}
                              planningStatusStyles={planningStatusStyles}
                              roleNames={roleNames}
                              updatePlanningApprovalAction={
                                updatePlanningApprovalAction
                              }
                            />
                            {canDeletePlanning ? (
                              <EditRupModalButton
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
                                  satuanKebutuhan: item.satuanKebutuhan,
                                  spesifikasiAwal: item.spesifikasiAwal,
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
        </section>
      </main>
    </>
  );
}
