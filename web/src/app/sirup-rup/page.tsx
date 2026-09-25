import { BarChart3, ClipboardList, Landmark, PieChart } from "lucide-react";
import AppHeader from "@/components/appheader/AppHeader";
import { getCurrentUser } from "@/lib/auth";
import { formatCurrency } from "@/lib/currency";
import { prisma } from "@/lib/prisma";
import SirupRupLineChart from "@/components/charts/SirupRupLineChart";
import CompleteSirupModalButton from "@/components/button/sirup-rup/CompleteSirupModalButton";
import DeleteRupButton from "@/components/button/sirup-rup/DeleteRupButton";
import RupDetailModalButton from "@/components/button/sirup-rup/RupDetailModalButton";
import { canDeletePlanningProposal } from "@/lib/permissions";

type RupPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const statusStyles = {
  BELUM_INPUT: "bg-slate-100 text-slate-600",
  PROSES_VERIFIKASI: "bg-amber-100 text-amber-700",
  MENUNGGU_PPTK: "bg-blue-100 text-blue-700",
  MENUNGGU_PPK: "bg-violet-100 text-violet-700",
  MENUNGGU_KPA_PA: "bg-indigo-100 text-indigo-700",
  SUDAH_TAYANG: "bg-emerald-100 text-emerald-700",
  REVISI_PAGU: "bg-orange-100 text-orange-700",
  DITARIK: "bg-red-100 text-red-700",
};

const statusLabels = {
  BELUM_INPUT: "Belum Input",
  PROSES_VERIFIKASI: "Proses Verifikasi",
  MENUNGGU_PPTK: "Menunggu PPTK",
  MENUNGGU_PPK: "Menunggu PPK",
  MENUNGGU_KPA_PA: "Menunggu KPA/PA",
  SUDAH_TAYANG: "Sudah Tayang",
  REVISI_PAGU: "Perlu Revisi",
  DITARIK: "Ditarik",
};

function getParam(
  searchParams: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] : value;
}

function labelize(value: string) {
  return value
    .replaceAll("_", " ")
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

  return labels[value] ?? labelize(value);
}

function methodBarClass(value: string) {
  const styles: Record<string, string> = {
    E_PURCHASING: "bg-[#08783f]",
    TENDER: "bg-[#1976d2]",
    NON_TENDER: "bg-[#f57c00]",
    PENGADAAN_LANGSUNG: "bg-[#7c3aed]",
    SWAKELOLA: "bg-[#0f766e]",
  };

  return styles[value] ?? "bg-slate-500";
}

function sourceFundBarClass(index: number) {
  const styles = ["bg-[#08783f]", "bg-[#f5bd20]", "bg-[#159cc3]", "bg-[#e53935]"];

  return styles[index % styles.length];
}

function decimalNumber(value: { toString(): string } | number | string) {
  const parsed = Number(value.toString());

  return Number.isFinite(parsed) ? parsed : 0;
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

function parseTimelineDate(value?: Date | string | null) {
  if (!value) return null;

  const parsed = value instanceof Date ? value : new Date(value);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function monthLabel(value: string) {
  const [year, month] = value.split("-");
  const date = new Date(Number(year), Number(month) - 1);

  return date.toLocaleDateString("id-ID", {
    month: "short",
  });
}

function monthKey(year: number, monthIndex: number) {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
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

export default async function Page({ searchParams }: RupPageProps) {
  const params = (await searchParams) ?? {};
  const q = getParam(params, "q")?.trim();
  const tahunAnggaran = getParam(params, "tahunAnggaran");
  const sumberDana = getParam(params, "sumberDana");
  const unitPengusul = getParam(params, "unitPengusul");
  const statusSirup = getParam(params, "statusSirup");

  const where = {
    ...(q
      ? {
          OR: [
            { kodeRup: { contains: q } },
            { idRupSirup: { contains: q } },
            { namaPaket: { contains: q } },
            { unitPengusul: { contains: q } },
            { lokasiPaket: { contains: q } },
          ],
        }
      : {}),
    ...(tahunAnggaran ? { tahunAnggaran: Number(tahunAnggaran) } : {}),
    ...(sumberDana ? { sumberDana } : {}),
    ...(unitPengusul ? { unitPengusul } : {}),
    ...(statusSirup
      ? {
          statusSirup: statusSirup as
            | "BELUM_INPUT"
            | "PROSES_VERIFIKASI"
            | "MENUNGGU_PPTK"
            | "MENUNGGU_PPK"
            | "MENUNGGU_KPA_PA"
            | "SUDAH_TAYANG"
            | "REVISI_PAGU"
            | "DITARIK",
        }
      : {}),
  };

  const rupData = await prisma.rencanaUmumPengadaan.findMany({
    where,
    orderBy: [{ tahunAnggaran: "desc" }, { createdAt: "desc" }],
    take: 100,
  });

  const totalPagu = rupData.reduce(
    (total, item) => total + decimalNumber(item.pagu),
    0,
  );
  const methodSummary = Object.values(
    rupData.reduce<
      Record<string, { label: string; key: string; count: number; amount: number }>
    >((accumulator, item) => {
      const key = item.metodePengadaan;
      const current = accumulator[key] ?? {
        key,
        label: methodLabel(key),
        count: 0,
        amount: 0,
      };

      current.count += 1;
      current.amount += decimalNumber(item.pagu);
      accumulator[key] = current;

      return accumulator;
    }, {}),
  ).sort((left, right) => right.amount - left.amount);
  const sourceFundSummary = Object.values(
    rupData.reduce<
      Record<string, { label: string; count: number; amount: number }>
    >((accumulator, item) => {
      const key = item.sumberDana;
      const current = accumulator[key] ?? {
        label: key,
        count: 0,
        amount: 0,
      };

      current.count += 1;
      current.amount += decimalNumber(item.pagu);
      accumulator[key] = current;

      return accumulator;
    }, {}),
  ).sort((left, right) => right.amount - left.amount);
  const maxMethodAmount = Math.max(...methodSummary.map((item) => item.amount), 1);
  const maxSourceFundAmount = Math.max(
    ...sourceFundSummary.map((item) => item.amount),
    1,
  );
  const dominantMethod = methodSummary[0];
  const dominantSourceFund = sourceFundSummary[0];
  const approvedRupData = rupData.filter(
    (item) => item.statusSirup === "SUDAH_TAYANG",
  );
  const chartYear =
    Number(tahunAnggaran) ||
    approvedRupData
      .map((item) => {
        const timelineDate =
          parseTimelineDate(item.jadwalMulaiRencana) ??
          parseTimelineDate(item.jadwalPemilihan) ??
          parseTimelineDate(item.waktuKebutuhan) ??
          parseTimelineDate(item.tanggalTayangSirup) ??
          parseTimelineDate(item.tanggalInputSirup) ??
          parseTimelineDate(item.createdAt);

        return timelineDate?.getFullYear();
      })
      .find((year): year is number => Boolean(year)) ||
    new Date().getFullYear();
  const monthlyPaguSummary = Object.values(
    approvedRupData.reduce<
      Record<string, { key: string; label: string; count: number; amount: number }>
    >(
      (accumulator, item) => {
      const timelineDate =
        parseTimelineDate(item.jadwalMulaiRencana) ??
        parseTimelineDate(item.jadwalPemilihan) ??
        parseTimelineDate(item.waktuKebutuhan) ??
        parseTimelineDate(item.tanggalTayangSirup) ??
        parseTimelineDate(item.tanggalInputSirup) ??
        parseTimelineDate(item.createdAt);

      if (!timelineDate) return accumulator;
      if (timelineDate.getFullYear() !== chartYear) return accumulator;

      const key = monthKey(chartYear, timelineDate.getMonth());
      const current = accumulator[key] ?? {
        key,
        label: monthLabel(key),
        count: 0,
        amount: 0,
      };

      current.count += 1;
      current.amount += decimalNumber(item.pagu);
      accumulator[key] = current;

      return accumulator;
      },
      Object.fromEntries(
        Array.from({ length: 12 }, (_, monthIndex) => {
          const key = monthKey(chartYear, monthIndex);

          return [
            key,
            {
              key,
              label: monthLabel(key),
              count: 0,
              amount: 0,
            },
          ];
        }),
      ),
    ),
  )
    .sort((left, right) => left.key.localeCompare(right.key));
  const latestMonthlyPagu = monthlyPaguSummary.findLast(
    (item) => item.amount > 0,
  );
  const currentUser = await getCurrentUser();
  const canManageRup = canDeletePlanningProposal(currentUser?.roles ?? []);
  const currentUserProfile = currentUser
    ? await prisma.user.findUnique({
        where: { id: currentUser.id },
        select: { unitKerja: true },
      })
    : null;

  return (
    <>
      <AppHeader
        title="SIRUP / RUP"
        subtitle="UKPBJ › Data RUP"
        rightLabel="Publikasi SIRUP"
      />

      <main className="bg-[#f4f7f5]">
        <section className="px-3 py-5 sm:px-6 sm:py-6 lg:px-8">
          <div className="mb-6 grid gap-4 xl:grid-cols-[1fr_1fr]">
            <div className="xl:col-span-2">
              <SirupRupLineChart
                labels={monthlyPaguSummary.map((item) => item.label)}
                paguData={monthlyPaguSummary.map((item) => item.amount)}
                packageData={monthlyPaguSummary.map((item) => item.count)}
                latestPagu={latestMonthlyPagu?.amount ?? 0}
                primarySourceFund={dominantSourceFund?.label}
                totalPackages={approvedRupData.length}
                totalPagu={approvedRupData.reduce(
                  (total, item) => total + decimalNumber(item.pagu),
                  0,
                )}
              />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-[11px] font-black uppercase text-[#08783f]">
                    Grafik Metode
                  </p>
                  <h2 className="mt-1 text-base font-black leading-tight text-[#16227c] sm:text-lg">
                    Distribusi paket berdasarkan metode
                  </h2>
                </div>
                <BarChart3 className="h-6 w-6 text-[#08783f]" />
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl bg-slate-50 p-3 sm:p-4">
                  <p className="text-[11px] font-black uppercase text-slate-400">
                    Total Paket
                  </p>
                  <p className="mt-1 truncate text-xl font-black text-slate-950 sm:text-2xl">
                    {rupData.length.toLocaleString("id-ID")}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 sm:p-4">
                  <p className="text-[11px] font-black uppercase text-slate-400">
                    Total Pagu
                  </p>
                  <p className="mt-1 truncate text-xl font-black text-slate-950 sm:text-2xl">
                    {formatCompactCurrency(totalPagu)}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 sm:p-4">
                  <p className="text-[11px] font-black uppercase text-slate-400">
                    Metode Dominan
                  </p>
                  <p className="mt-1 truncate text-xl font-black text-slate-950 sm:text-2xl">
                    {dominantMethod?.label ?? "-"}
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-4">
                {methodSummary.length > 0 ? (
                  methodSummary.map((item) => (
                    <div key={item.key}>
                      <div className="mb-2 flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black text-slate-900">
                            {item.label}
                          </p>
                          <p className="mt-0.5 text-xs font-semibold text-slate-500">
                            {item.count.toLocaleString("id-ID")} paket
                          </p>
                        </div>
                        <p className="text-sm font-black text-slate-900 sm:shrink-0">
                          {formatCompactCurrency(item.amount)}
                        </p>
                      </div>
                      <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full ${methodBarClass(item.key)}`}
                          style={{
                            width: `${Math.max((item.amount / maxMethodAmount) * 100, 8)}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm font-semibold text-slate-500">
                    Belum ada data metode pengadaan.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-[11px] font-black uppercase text-[#08783f]">
                    Grafik Sumber Dana
                  </p>
                  <h2 className="mt-1 text-base font-black leading-tight text-[#16227c] sm:text-lg">
                    Distribusi pagu berdasarkan sumber dana
                  </h2>
                </div>
                <PieChart className="h-6 w-6 text-[#08783f]" />
              </div>

              <div className="mt-5 rounded-xl bg-[#edf7f1] p-3 sm:p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-[#08783f]">
                    <Landmark className="h-5 w-5" strokeWidth={2.5} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-black uppercase text-[#08783f]">
                      Sumber dana terbesar
                    </p>
                    <p className="mt-1 truncate text-lg font-black text-slate-950 sm:text-xl">
                      {dominantSourceFund?.label ?? "-"}
                    </p>
                  </div>
                  <p className="text-sm font-black text-slate-900 sm:ml-auto sm:shrink-0">
                    {formatCompactCurrency(dominantSourceFund?.amount ?? 0)}
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-4">
                {sourceFundSummary.length > 0 ? (
                  sourceFundSummary.map((item, index) => (
                    <div key={item.label}>
                      <div className="mb-2 flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black text-slate-900">
                            {item.label}
                          </p>
                          <p className="mt-0.5 text-xs font-semibold text-slate-500">
                            {item.count.toLocaleString("id-ID")} paket
                          </p>
                        </div>
                        <p className="text-sm font-black text-slate-900 sm:shrink-0">
                          {formatCompactCurrency(item.amount)}
                        </p>
                      </div>
                      <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full ${sourceFundBarClass(index)}`}
                          style={{
                            width: `${Math.max((item.amount / maxSourceFundAmount) * 100, 8)}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm font-semibold text-slate-500">
                    Belum ada data sumber dana.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-2">
                <ClipboardList className="h-5 w-5 shrink-0 text-[#08783f]" />
                <h1 className="truncate text-lg font-black text-[#16227c]">
                  Paket Perencanaan ke SIRUP / RUP
                </h1>
              </div>

              <p className="text-sm font-semibold text-slate-500">
                Paket diambil dari Perencanaan, lalu dilengkapi data tayang
                SIRUP.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-[1320px] w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-black uppercase text-slate-400">
                    <th className="px-4 py-3">Kode Usulan</th>
                    <th className="px-4 py-3">ID RUP SIRUP</th>
                    <th className="px-4 py-3">Nama Paket</th>

                    <th className="px-4 py-3">Unit Pengusul</th>
                    <th className="px-4 py-3">Jenis Belanja</th>
                    <th className="px-4 py-3">Lokasi Paket</th>
                    <th className="px-4 py-3">Sumber Dana</th>
                    <th className="px-4 py-3">Pagu (Rp)</th>
                    <th className="px-4 py-3">Metode Final</th>
                    <th className="px-4 py-3">Tanggal Tayang</th>
                    <th className="px-4 py-3">Status SIRUP</th>
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
                        <td className="whitespace-nowrap px-4 py-4 font-mono text-xs font-bold text-slate-500">
                          {item.idRupSirup || "-"}
                        </td>
                        <td className="max-w-[280px] px-4 py-4 font-black text-[#16227c]">
                          {item.namaPaket}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 font-semibold text-slate-600">
                          {item.unitPengusul}
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 font-semibold text-slate-600">
                          {item.jenisBelanja || "-"}
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 font-semibold text-slate-600">
                          {item.lokasiPaket || "-"}
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
                        <td className="whitespace-nowrap px-4 py-4 font-semibold text-slate-600">
                          {item.tanggalTayangSirup || "-"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${statusStyles[item.statusSirup]}`}
                          >
                            {labelize(item.statusSirup)}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4">
                          <div className="flex justify-end gap-2">
                          <RupDetailModalButton
                            item={{
                              id: item.id,
                              kodeRup: item.kodeRup,
                              idRupSirup: item.idRupSirup,
                              jenisKatalog: item.jenisKatalog,
                              etalaseKatalog: item.etalaseKatalog,
                              namaProdukKatalog: item.namaProdukKatalog,
                              spesifikasiProdukKatalog:
                                item.spesifikasiProdukKatalog,
                              merekTipeKatalog: item.merekTipeKatalog,
                              jumlahProdukKatalog: item.jumlahProdukKatalog,
                              satuanProdukKatalog: item.satuanProdukKatalog,
                              hargaSatuanKatalog:
                                item.hargaSatuanKatalog?.toString() ?? null,
                              totalHargaKatalog:
                                item.totalHargaKatalog?.toString() ?? null,
                              namaPenyediaKatalog:
                                item.namaPenyediaKatalog,
                              statusNegosiasiKatalog:
                                item.statusNegosiasiKatalog,
                              hargaNegosiasiKatalog:
                                item.hargaNegosiasiKatalog?.toString() ?? null,
                              nomorSuratPesanan: item.nomorSuratPesanan,
                              tanggalSuratPesanan:
                                item.tanggalSuratPesanan,
                              statusTransaksiKatalog:
                                item.statusTransaksiKatalog,
                              catatanKatalog: item.catatanKatalog,
                              namaPaket: item.namaPaket,
                              unitPengusul: item.unitPengusul,
                              lokasiPaket: item.lokasiPaket,
                              jenisBelanja: item.jenisBelanja,
                              sumberDana: item.sumberDana,
                              pagu: item.pagu.toString(),
                              metodePengadaan: item.metodePengadaan,
                              jadwalPemilihan: item.jadwalPemilihan,
                              tanggalInputSirup: item.tanggalInputSirup,
                              tanggalTayangSirup: item.tanggalTayangSirup,
                              linkSirup: item.linkSirup,
                              tahunAnggaran: item.tahunAnggaran,
                              statusSirup: item.statusSirup,
                              catatan: item.catatan,
                            }}
                            statusLabel={
                              statusLabels[item.statusSirup] ??
                              labelize(item.statusSirup)
                            }
                            statusStyle={
                              statusStyles[item.statusSirup] ??
                              "bg-slate-100 text-slate-600"
                            }
                            canEditRevision={
                              currentUser?.roles.includes("SUPER_ADMIN") ||
                              normalizeUnit(currentUserProfile?.unitKerja) ===
                                normalizeUnit(item.unitPengusul) ||
                              normalizeUnit(currentUser?.name) ===
                                normalizeUnit(item.unitPengusul)
                            }
                          />
                          {canManageRup ? (
                            <>
                              <CompleteSirupModalButton
                                label="Edit SIRUP/RUP"
                                item={{
                                  id: item.id,
                                  kodeRup: item.kodeRup,
                                  idRupSirup: item.idRupSirup,
                                  jenisKatalog: item.jenisKatalog,
                                  etalaseKatalog: item.etalaseKatalog,
                                  namaProdukKatalog: item.namaProdukKatalog,
                                  spesifikasiProdukKatalog:
                                    item.spesifikasiProdukKatalog,
                                  merekTipeKatalog: item.merekTipeKatalog,
                                  jumlahProdukKatalog:
                                    item.jumlahProdukKatalog,
                                  satuanProdukKatalog:
                                    item.satuanProdukKatalog,
                                  hargaSatuanKatalog:
                                    item.hargaSatuanKatalog?.toString() ??
                                    null,
                                  totalHargaKatalog:
                                    item.totalHargaKatalog?.toString() ?? null,
                                  namaPenyediaKatalog:
                                    item.namaPenyediaKatalog,
                                  statusNegosiasiKatalog:
                                    item.statusNegosiasiKatalog,
                                  hargaNegosiasiKatalog:
                                    item.hargaNegosiasiKatalog?.toString() ??
                                    null,
                                  nomorSuratPesanan: item.nomorSuratPesanan,
                                  tanggalSuratPesanan:
                                    item.tanggalSuratPesanan,
                                  statusTransaksiKatalog:
                                    item.statusTransaksiKatalog,
                                  catatanKatalog: item.catatanKatalog,
                                  namaPaket: item.namaPaket,
                                  unitPengusul: item.unitPengusul,
                                  sumberDana: item.sumberDana,
                                  pagu: item.pagu.toString(),
                                  metodePengadaan: item.metodePengadaan,
                                  jadwalPemilihan: item.jadwalPemilihan,
                                  tanggalInputSirup: item.tanggalInputSirup,
                                  tanggalTayangSirup: item.tanggalTayangSirup,
                                  linkSirup: item.linkSirup,
                                  tahunAnggaran: item.tahunAnggaran,
                                  statusSirup: item.statusSirup,
                                  catatan: item.catatan,
                                }}
                              />
                              <DeleteRupButton
                                id={item.id}
                                namaPaket={item.namaPaket}
                              />
                            </>
                          ) : null}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={12} className="px-4 py-12 text-center">
                        <p className="text-base font-black text-slate-700">
                          Belum ada paket perencanaan
                        </p>
                        <p className="mt-2 text-sm font-semibold text-slate-500">
                          Tambahkan paket di halaman Perencanaan, lalu lengkapi
                          data SIRUP di halaman ini.
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
