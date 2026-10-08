import { BarChart3, ClipboardList, Landmark, PieChart } from "lucide-react";

import AppHeader from "@/components/appheader/AppHeader";

import {
  DataCardBadge,
  DataCardCurrency,
  DataCardEmpty,
  DataCardField,
  DataCardRow,
  DataCardTextLong,
  DataCardTextShort,
} from "@/components/data-card/DataCardList";

import { getCurrentUser } from "@/lib/auth";

import { formatCurrency } from "@/lib/currency";

import { prisma } from "@/lib/prisma";

import SirupRupLineChart from "@/components/charts/SirupRupLineChart";

import CompleteSirupModalButton from "@/components/button/sirup-rup/CompleteSirupModalButton";

import DeleteRupButton from "@/components/button/sirup-rup/DeleteRupButton";

import ImportRupModalButton from "@/components/button/sirup-rup/ImportRupModalButton";

import RupDetailModalButton from "@/components/button/sirup-rup/RupDetailModalButton";

import { canProcessRup } from "@/lib/planning-workflow";

type RupPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const statusStyles: Record<string, string> = {
  SIAP_RUP: "bg-emerald-100 text-emerald-700",

  BELUM_INPUT: "bg-slate-100 text-slate-600",

  PROSES_VERIFIKASI: "bg-amber-100 text-amber-700",

  MENUNGGU_PPTK: "bg-blue-100 text-blue-700",

  MENUNGGU_PPK: "bg-violet-100 text-violet-700",

  MENUNGGU_KPA_PA: "bg-indigo-100 text-indigo-700",

  SUDAH_TAYANG: "bg-emerald-100 text-emerald-700",

  REVISI_PAGU: "bg-orange-100 text-orange-700",

  DITARIK: "bg-red-100 text-red-700",
};

const statusLabels: Record<string, string> = {
  SIAP_RUP: "Siap RUP",

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

    E_PURCHASING: "E-Purchasing",

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
  const styles = [
    "bg-[#08783f]",

    "bg-[#f5bd20]",

    "bg-[#159cc3]",

    "bg-[#e53935]",
  ];

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

function sourceFundClass(value: string) {
  const normalized = normalizeFundingSource(value);

  if (normalized.includes("BLUD")) return "bg-emerald-100 text-[#08783f]";

  if (normalized.includes("APBD")) return "bg-amber-100 text-amber-700";

  if (normalized.includes("DBHCHT")) return "bg-red-100 text-red-700";

  return "bg-emerald-100 text-emerald-700";
}

function normalizeFundingSource(value?: string | null) {
  const normalized = value?.trim().replace(/\s+/g, " ").toUpperCase();

  return normalized || "TIDAK TERISI";
}

function normalizeUnit(value?: string | null) {
  return value?.trim().toLowerCase() ?? "";
}

function buildDistributionSummary<T>(
  data: T[],

  getKey: (item: T) => string | null | undefined,

  getLabel: (key: string) => string,

  getAmount: (item: T) => number,
) {
  return Object.values(
    data.reduce<
      Record<string, { label: string; count: number; amount: number }>
    >((accumulator, item) => {
      const rawKey = getKey(item)?.trim() || "Tidak Terisi";

      const current = accumulator[rawKey] ?? {
        label: getLabel(rawKey),

        count: 0,

        amount: 0,
      };

      current.count += 1;

      current.amount += getAmount(item);

      accumulator[rawKey] = current;

      return accumulator;
    }, {}),
  ).sort((left, right) => right.amount - left.amount);
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

    ...(statusSirup === "SIAP_RUP"
      ? { statusUsulan: "SIAP_RUP" as const }
      : statusSirup
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
      Record<
        string,
        { label: string; key: string; count: number; amount: number }
      >
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

  const sourceFundSummary = buildDistributionSummary(
    rupData,

    (item) => normalizeFundingSource(item.sumberDana),

    (key) => key,

    (item) => decimalNumber(item.pagu),
  );

  const maxMethodAmount = Math.max(
    ...methodSummary.map((item) => item.amount),

    1,
  );

  const maxSourceFundAmount = Math.max(
    ...sourceFundSummary.map((item) => item.amount),

    1,
  );

  const dominantMethod = methodSummary[0];

  const dominantSourceFund = sourceFundSummary[0];

  const rupChartCategories = [
    {
      key: "sumberDana" as const,

      label: "Sumber Dana Utama",

      items: buildDistributionSummary(
        rupData,

        (item) => normalizeFundingSource(item.sumberDana),

        (key) => key,

        (item) => decimalNumber(item.pagu),
      ),
    },

    {
      key: "metodeFinal" as const,

      label: "Metode Final",

      items: buildDistributionSummary(
        rupData,

        (item) => item.metodePengadaan,

        methodLabel,

        (item) => decimalNumber(item.pagu),
      ),
    },

    {
      key: "jenisBarang" as const,

      label: "Jenis Barang",

      items: buildDistributionSummary(
        rupData,

        (item) => item.jenisBelanja,

        (key) => key,

        (item) => decimalNumber(item.pagu),
      ),
    },
  ];

  const dominantChartSourceFund = rupChartCategories[0]?.items[0];

  const currentUser = await getCurrentUser();

  const canManageRup = canProcessRup(currentUser?.roles ?? []);

  const currentUserProfile = currentUser
    ? await prisma.user.findUnique({
        where: { id: currentUser.id },

        select: { unitKerja: true },
      })
    : null;

  return (
    <>
      <AppHeader title="SIRUP / RUP" rightLabel="Publikasi SIRUP" />

      <main className="bg-[#f4f7f5]">
        <section className="px-3 py-5 sm:px-6 sm:py-6 lg:px-8">
          <div className="mb-6 grid gap-4 xl:grid-cols-[1fr_1fr]">
            <div className="xl:col-span-2">
              <SirupRupLineChart
                categories={rupChartCategories}
                primarySourceFund={dominantChartSourceFund?.label}
                totalPackages={rupData.length}
                totalPagu={totalPagu}
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

              <div className="flex flex-col gap-2 sm:items-end">
                {canManageRup ? <ImportRupModalButton /> : null}

                <p className="max-w-xl text-right text-sm font-semibold leading-5 text-slate-500">
                  Paket diambil dari Perencanaan, lalu dilengkapi data tayang
                  SIRUP.
                </p>
              </div>
            </div>

            <div className="bg-slate-50/50 p-4 sm:p-5">
              {rupData.length > 0 ? (
                <>
                  <div className="-mx-1 max-w-full overflow-x-auto overflow-y-hidden px-1 pb-3 [scrollbar-color:#94a3b8_transparent] [scrollbar-width:thin]">
                    <div className="min-w-full space-y-3">
                      {rupData.map((item) => (
                        <DataCardRow
                          key={item.id}
                          minWidth="2780px"
                          className="xl:min-w-[2780px]"
                          icon={
                            <ClipboardList
                              className="h-5 w-5"
                              strokeWidth={2.4}
                            />
                          }
                          columns="56px 140px 130px minmax(300px,1.45fr) minmax(220px,1fr) 150px minmax(170px,0.9fr) 150px 190px 170px 160px 170px minmax(420px,auto)"
                          actions={
                            <div className="flex min-w-max flex-nowrap items-center justify-end gap-2 whitespace-nowrap">
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

                                  namaPenyediaKatalog: item.namaPenyediaKatalog,

                                  statusNegosiasiKatalog:
                                    item.statusNegosiasiKatalog,

                                  hargaNegosiasiKatalog:
                                    item.hargaNegosiasiKatalog?.toString() ??
                                    null,

                                  nomorSuratPesanan: item.nomorSuratPesanan,

                                  tanggalSuratPesanan: item.tanggalSuratPesanan,

                                  statusTransaksiKatalog:
                                    item.statusTransaksiKatalog,

                                  catatanKatalog: item.catatanKatalog,

                                  namaPaket: item.namaPaket,

                                  unitPengusul: item.unitPengusul,

                                  lokasiPaket: item.lokasiPaket,

                                  jenisBelanja: item.jenisBelanja,

                                  sumberDana: normalizeFundingSource(
                                    item.sumberDana,
                                  ),

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
                                  normalizeUnit(
                                    currentUserProfile?.unitKerja,
                                  ) === normalizeUnit(item.unitPengusul) ||
                                  normalizeUnit(currentUser?.name) ===
                                    normalizeUnit(item.unitPengusul)
                                }
                              />

                              {canManageRup ? (
                                <>
                                  <CompleteSirupModalButton
                                    label={
                                      item.statusUsulan === "SIAP_RUP"
                                        ? "Proses RUP"
                                        : "Edit SIRUP/RUP"
                                    }
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
                                        item.totalHargaKatalog?.toString() ??
                                        null,

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

                                      tanggalTayangSirup:
                                        item.tanggalTayangSirup,

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
                          }
                        >
                          <DataCardField
                            label="Kode Usulan"
                            valueClassName="font-mono text-xs font-black text-slate-600"
                          >
                            <DataCardTextShort title={item.kodeRup}>
                              {item.kodeRup}
                            </DataCardTextShort>
                          </DataCardField>

                          <DataCardField
                            label="ID RUP SIRUP"
                            valueClassName="font-mono text-xs font-black text-slate-600"
                          >
                            <DataCardTextShort title={item.idRupSirup || "-"}>
                              {item.idRupSirup || "-"}
                            </DataCardTextShort>
                          </DataCardField>

                          <DataCardField
                            label="Nama Paket"
                            valueClassName="font-black text-[#16227c]"
                          >
                            <DataCardTextLong title={item.namaPaket}>
                              {item.namaPaket}
                            </DataCardTextLong>

                            <DataCardTextShort
                              className="mt-1 text-xs font-bold text-slate-500"
                              title={item.unitPengusul}
                            >
                              Unit: {item.unitPengusul}
                            </DataCardTextShort>
                          </DataCardField>

                          <DataCardField label="Unit Pengusul">
                            <DataCardTextLong title={item.unitPengusul}>
                              {item.unitPengusul}
                            </DataCardTextLong>
                          </DataCardField>

                          <DataCardField label="Jenis Belanja">
                            <DataCardBadge
                              className="bg-slate-100 text-slate-600"
                              title={item.jenisBelanja || "-"}
                            >
                              {item.jenisBelanja || "-"}
                            </DataCardBadge>
                          </DataCardField>

                          <DataCardField label="Lokasi Paket">
                            <DataCardTextLong title={item.lokasiPaket || "-"}>
                              {item.lokasiPaket || "-"}
                            </DataCardTextLong>
                          </DataCardField>

                          <DataCardField label="Sumber Dana">
                            <DataCardBadge
                              className={sourceFundClass(item.sumberDana)}
                              title={normalizeFundingSource(item.sumberDana)}
                            >
                              {normalizeFundingSource(item.sumberDana)}
                            </DataCardBadge>
                          </DataCardField>

                          <DataCardField
                            label="Pagu"
                            valueClassName="whitespace-nowrap font-black text-slate-800"
                          >
                            <DataCardCurrency>
                              {formatCurrency(item.pagu.toString())}
                            </DataCardCurrency>
                          </DataCardField>

                          <DataCardField
                            label="Metode Final"
                            valueClassName="whitespace-nowrap"
                          >
                            <DataCardTextShort title={methodLabel(item.metodePengadaan)}>
                              {methodLabel(item.metodePengadaan)}
                            </DataCardTextShort>
                          </DataCardField>

                          <DataCardField
                            label="Tanggal Tayang"
                            valueClassName="whitespace-nowrap"
                          >
                            <DataCardTextShort title={item.tanggalTayangSirup || "-"}>
                              {item.tanggalTayangSirup || "-"}
                            </DataCardTextShort>
                          </DataCardField>

                          <DataCardField
                            label="Status SIRUP"
                            valueClassName="whitespace-nowrap"
                          >
                            <DataCardBadge
                              className={statusStyles[item.statusSirup]}
                              title={labelize(item.statusSirup)}
                            >
                              {labelize(item.statusSirup)}
                            </DataCardBadge>
                          </DataCardField>
                        </DataCardRow>
                      ))}
                    </div>
                  </div>

                  <div className="mt-1 flex items-center justify-end gap-2 text-xs font-bold text-slate-400 2xl:hidden">
                    <span>
                      Geser horizontal untuk melihat seluruh data dan aksi
                    </span>

                    <span aria-hidden="true">→</span>
                  </div>
                </>
              ) : (
                <DataCardEmpty>
                  <div>
                    <p className="text-base font-black text-slate-700">
                      Belum ada paket perencanaan
                    </p>

                    <p className="mt-2 text-sm font-semibold text-slate-500">
                      Tambahkan paket di halaman Perencanaan, lalu lengkapi data
                      SIRUP di halaman ini.
                    </p>
                  </div>
                </DataCardEmpty>
              )}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
