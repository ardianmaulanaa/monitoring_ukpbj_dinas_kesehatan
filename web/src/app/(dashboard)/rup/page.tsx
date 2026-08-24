import { ClipboardList, Search } from "lucide-react";
import AppHeader from "@/app/(dashboard)/_shared/AppHeader";
import { getCurrentUser } from "@/lib/auth";
import { formatCurrency } from "@/lib/currency";
import { prisma } from "@/lib/prisma";
import { getActiveSumberDanaOptions } from "@/lib/sumber-dana";
import AddRupModalButton from "./AddRupModalButton";
import RupDetailModalButton from "./RupDetailModalButton";

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
            { namaPaket: { contains: q } },
            { unitPengusul: { contains: q } },
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
        rightLabel="Perencanaan"
      />

      <main className="bg-[#f4f7f5]">
        <form className="border-b border-slate-200 bg-white px-4 py-3 sm:px-6 lg:px-8">
          <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[auto_minmax(132px,150px)_minmax(190px,220px)_minmax(132px,170px)] xl:grid-cols-[auto_minmax(132px,150px)_minmax(190px,220px)_minmax(132px,170px)_minmax(150px,180px)_minmax(240px,1fr)] xl:items-center">
              <span className="self-center text-sm font-black text-slate-400">
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
                <option value="SUDAH_TAYANG">Sudah Tayang</option>
                <option value="PROSES_VERIFIKASI">Proses Verifikasi</option>
                <option value="MENUNGGU_PPTK">Menunggu PPTK</option>
                <option value="MENUNGGU_PPK">Menunggu PPK</option>
                <option value="MENUNGGU_KPA_PA">Menunggu KPA/PA</option>
                <option value="BELUM_INPUT">Belum Input</option>
                <option value="REVISI_PAGU">Revisi Pagu</option>
                <option value="DITARIK">Ditarik</option>
              </select>

              <label className="flex h-9 w-full items-center gap-2 rounded-full border border-slate-300 bg-slate-50 px-4 text-sm text-slate-500 focus-within:border-[#08783f] focus-within:ring-2 focus-within:ring-emerald-100 sm:col-span-2 lg:col-span-4 xl:col-span-1">
                <Search className="h-4 w-4" />
                <input
                  name="q"
                  defaultValue={q ?? ""}
                  placeholder="Cari paket RUP..."
                  className="min-w-0 flex-1 bg-transparent font-semibold outline-none"
                />
              </label>
          </div>
        </form>

        <section className="px-4 py-6 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-2">
                <ClipboardList className="h-5 w-5 shrink-0 text-[#08783f]" />
                <h1 className="truncate text-lg font-black text-[#16227c]">
                  Data SIRUP / Rencana Umum Pengadaan (RUP)
                </h1>
              </div>

              <AddRupModalButton sumberDanaOptions={sourceFunds} />
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-[1080px] w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-black uppercase text-slate-400">
                    <th className="px-4 py-3">Kode RUP</th>
                    <th className="px-4 py-3">Nama Paket</th>
                    <th className="px-4 py-3">Unit Pengusul</th>
                    <th className="px-4 py-3">Sumber Dana</th>
                    <th className="px-4 py-3">Pagu (Rp)</th>
                    <th className="px-4 py-3">Metode</th>
                    <th className="px-4 py-3">Jadwal Pemilihan</th>
                    <th className="px-4 py-3">Status SIRUP</th>
                    <th className="px-4 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rupData.length > 0 ? (
                    rupData.map((item) => (
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
                          {item.jadwalPemilihan || "-"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${statusStyles[item.statusSirup]}`}
                          >
                            {labelize(item.statusSirup)}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-right">
                          <RupDetailModalButton
                            item={{
                              id: item.id,
                              kodeRup: item.kodeRup,
                              namaPaket: item.namaPaket,
                              unitPengusul: item.unitPengusul,
                              sumberDana: item.sumberDana,
                              pagu: item.pagu.toString(),
                              metodePengadaan: item.metodePengadaan,
                              jadwalPemilihan: item.jadwalPemilihan,
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
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} className="px-4 py-12 text-center">
                        <p className="text-base font-black text-slate-700">
                          Belum ada data RUP
                        </p>
                        <p className="mt-2 text-sm font-semibold text-slate-500">
                          Data akan tampil setelah RUP/SIRUP diinput atau
                          disinkronkan ke database.
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
