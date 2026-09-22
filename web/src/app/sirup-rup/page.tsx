import { ClipboardList } from "lucide-react";
import AppHeader from "@/components/appheader/AppHeader";
import { getCurrentUser } from "@/lib/auth";
import { formatCurrency } from "@/lib/currency";
import { prisma } from "@/lib/prisma";
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
        <section className="px-4 py-6 sm:px-6 lg:px-8">
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
