"use client";

import Link from "next/link";
import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, RotateCcw, Save } from "lucide-react";
import ModalShell from "@/components/modal/ModalShell";
import {
  DetailField,
  DetailHorizontalSection,
  DetailInfoCard,
  DetailModalHeader,
  DetailStatusBadge,
} from "@/components/detail/DetailHorizontalSection";
import { formatCurrency } from "@/lib/currency";
import {
  updateRupRevisionAction,
  type RupRevisionState,
} from "@/app/sirup-rup/actions";

export type RupDetailItem = {
  catatan: string | null;
  id: string;
  idRupSirup?: string | null;
  jenisKatalog?: string | null;
  etalaseKatalog?: string | null;
  namaProdukKatalog?: string | null;
  spesifikasiProdukKatalog?: string | null;
  merekTipeKatalog?: string | null;
  jumlahProdukKatalog?: string | null;
  satuanProdukKatalog?: string | null;
  hargaSatuanKatalog?: string | null;
  totalHargaKatalog?: string | null;
  namaPenyediaKatalog?: string | null;
  statusNegosiasiKatalog?: string | null;
  hargaNegosiasiKatalog?: string | null;
  nomorSuratPesanan?: string | null;
  tanggalSuratPesanan?: string | null;
  statusTransaksiKatalog?: string | null;
  catatanKatalog?: string | null;
  jadwalPemilihan: string | null;
  jadwalMulaiRencana?: string | null;
  jadwalSelesaiRencana?: string | null;
  kodeRup: string;
  jenisBelanja?: string | null;
  kegiatan?: string | null;
  kekuranganDokumen?: string | null;
  kendala?: string | null;
  kodeRekening?: string | null;
  kontakPenanggungJawab?: string | null;
  lokasiPaket?: string | null;
  linkSirup?: string | null;
  metodePengadaan: string;
  namaPaket: string;
  outputDiharapkan?: string | null;
  pagu: string;
  picTindakLanjut?: string | null;
  ppkPptk?: string | null;
  prioritas?: string | null;
  program?: string | null;
  caraPengadaan?: string | null;
  sumberDana: string;
  satuanKebutuhan?: string | null;
  spesifikasiAwal?: string | null;
  statusSirup: string;
  statusDokumenPendukung?: string | null;
  statusHps?: string | null;
  statusKak?: string | null;
  statusRancanganKontrak?: string | null;
  subKegiatan?: string | null;
  tanggalInputSirup?: string | null;
  tanggalTayangSirup?: string | null;
  tahunAnggaran: number;
  tindakLanjut?: string | null;
  unitBidang?: string | null;
  unitPengusul: string;
  uraianBelanja?: string | null;
  uraianKebutuhan?: string | null;
  volumeKebutuhan?: string | null;
  waktuKebutuhan?: string | null;
};

type RupDetailModalButtonProps = {
  canEditRevision: boolean;
  item: RupDetailItem;
  statusLabel: string;
  statusStyle: string;
};

const initialState: RupRevisionState = {
  message: "",
  ok: false,
};

const inputClass =
  "h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#08783f] focus:ring-2 focus:ring-emerald-100";

function methodLabel(value: string) {
  const labels: Record<string, string> = {
    TENDER: "Tender",
    NON_TENDER: "Non Tender",
    E_PURCHASING: "E-Purchasing",
    PENGADAAN_LANGSUNG: "Pengadaan Langsung",
    SWAKELOLA: "Swakelola",
  };

  return labels[value] ?? value.replaceAll("_", " ");
}

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

function RevisionSubmitButton({
  children,
  submitMode,
}: {
  children: React.ReactNode;
  submitMode: "save" | "resubmit";
}) {
  return (
    <button
      type="submit"
      name="submitMode"
      value={submitMode}
      className={
        submitMode === "resubmit"
          ? "inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#08783f] px-4 text-sm font-black text-white transition hover:bg-[#066532]"
          : "inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-white px-4 text-sm font-black text-[#08783f] transition hover:bg-emerald-50"
      }
    >
      {submitMode === "resubmit" ? (
        <RotateCcw className="h-4 w-4" strokeWidth={2.4} />
      ) : (
        <Save className="h-4 w-4" strokeWidth={2.4} />
      )}
      {children}
    </button>
  );
}

export default function RupDetailModalButton({
  canEditRevision,
  item,
  statusLabel,
  statusStyle,
}: RupDetailModalButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [state, formAction] = useActionState(
    updateRupRevisionAction,
    initialState,
  );
  const [pagu, setPagu] = useState(onlyDigits(item.pagu));

  const formattedPagu = useMemo(() => formatCurrency(pagu), [pagu]);
  const showRevisionForm =
    item.statusSirup === "REVISI_PAGU" && canEditRevision;

  useEffect(() => {
    if (state.ok) router.refresh();
  }, [router, state.ok]);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-white px-4 text-sm font-black text-[#08783f] transition hover:bg-emerald-50"
      >
        <Eye className="h-4 w-4" strokeWidth={2.4} />
        Detail
      </button>

      <ModalShell
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        eyebrow="Detail Perencanaan"
        title={item.namaPaket}
        maxWidthClassName="max-w-7xl"
      >
        <div className="grid gap-5">
          <DetailModalHeader
            code={item.kodeRup}
            title={item.namaPaket}
            badge={<DetailStatusBadge className={statusStyle}>{statusLabel}</DetailStatusBadge>}
            action={
              item.metodePengadaan === "E_PURCHASING" &&
              item.statusSirup === "SUDAH_TAYANG" ? (
                <Link
                  href={`/e-purchasing?detailId=${item.id}`}
                  className="inline-flex h-9 items-center justify-center rounded-lg border border-emerald-200 bg-white px-4 text-sm font-black text-[#08783f] transition hover:bg-emerald-50"
                >
                  Proses E-Purchasing
                </Link>
              ) : null
            }
            items={[
              { label: "Unit Pengusul", value: item.unitPengusul },
              { label: "Tahun Anggaran", value: `TA ${item.tahunAnggaran}` },
              { label: "Pagu", value: formatCurrency(item.pagu) },
              { label: "Metode", value: methodLabel(item.metodePengadaan) },
              { label: "Sumber Dana", value: item.sumberDana },
            ]}
          />

          <DetailHorizontalSection>
            <DetailInfoCard title="Identitas Usulan">
              <DetailField label="Kode Usulan" value={item.kodeRup} />
              <DetailField label="Status" value={statusLabel} />
              <DetailField label="Unit Pengusul" value={item.unitPengusul} />
              <DetailField label="Unit / Bidang" value={item.unitBidang} />
              <DetailField label="PPK / PPTK" value={item.ppkPptk} />
              <DetailField
                label="Kontak Penanggung Jawab"
                value={item.kontakPenanggungJawab}
              />
            </DetailInfoCard>

            <DetailInfoCard title="Program & Anggaran">
              <DetailField label="Program" value={item.program} />
              <DetailField label="Kegiatan" value={item.kegiatan} />
              <DetailField label="Sub Kegiatan" value={item.subKegiatan} />
              <DetailField label="Kode Rekening" value={item.kodeRekening} />
              <DetailField label="Sumber Dana" value={item.sumberDana} />
              <DetailField
                label="Pagu"
                value={formatCurrency(item.pagu)}
                valueClassName="whitespace-nowrap"
              />
              <DetailField label="Tahun Anggaran" value={`TA ${item.tahunAnggaran}`} />
            </DetailInfoCard>

            <DetailInfoCard title="Kebutuhan">
              <DetailField label="Uraian Belanja" value={item.uraianBelanja} />
              <DetailField label="Uraian Kebutuhan" value={item.uraianKebutuhan} />
              <DetailField label="Jenis Belanja" value={item.jenisBelanja} />
              <DetailField
                label="Volume / Satuan"
                value={`${item.volumeKebutuhan || "-"} ${
                  item.satuanKebutuhan || ""
                }`.trim()}
              />
              <DetailField label="Prioritas" value={item.prioritas} />
              <DetailField label="Waktu Kebutuhan" value={item.waktuKebutuhan} />
              <DetailField label="Output yang Diharapkan" value={item.outputDiharapkan} />
            </DetailInfoCard>

            <DetailInfoCard title="Jadwal & RUP/SIRUP">
              <DetailField label="ID RUP SIRUP" value={item.idRupSirup} />
              <DetailField label="Link SIRUP" value={item.linkSirup} />
              <DetailField label="Tanggal Input SIRUP" value={item.tanggalInputSirup} />
              <DetailField label="Tanggal Tayang SIRUP" value={item.tanggalTayangSirup} />
              <DetailField label="Jadwal Pemilihan" value={item.jadwalPemilihan} />
              <DetailField
                label="Jadwal Rencana"
                value={`${item.jadwalMulaiRencana || "-"} s.d. ${
                  item.jadwalSelesaiRencana || "-"
                }`}
              />
              <DetailField label="Cara Pengadaan" value={item.caraPengadaan} />
              <DetailField
                label="Metode Pengadaan"
                value={methodLabel(item.metodePengadaan)}
              />
            </DetailInfoCard>

            <DetailInfoCard title="E-Purchasing / Katalog">
              <DetailField label="Jenis Katalog" value={item.jenisKatalog} />
              <DetailField label="Etalase Katalog" value={item.etalaseKatalog} />
              <DetailField label="Nama Produk Katalog" value={item.namaProdukKatalog} />
              <DetailField label="Merek / Tipe" value={item.merekTipeKatalog} />
              <DetailField
                label="Harga Satuan Tayang"
                value={
                  item.hargaSatuanKatalog
                    ? formatCurrency(item.hargaSatuanKatalog)
                    : null
                }
                valueClassName="whitespace-nowrap"
              />
              <DetailField
                label="Total Harga Tayang"
                value={
                  item.totalHargaKatalog
                    ? formatCurrency(item.totalHargaKatalog)
                    : null
                }
                valueClassName="whitespace-nowrap"
              />
              <DetailField label="Penyedia Katalog" value={item.namaPenyediaKatalog} />
              <DetailField label="Status Negosiasi" value={item.statusNegosiasiKatalog} />
              <DetailField
                label="Harga Negosiasi"
                value={
                  item.hargaNegosiasiKatalog
                    ? formatCurrency(item.hargaNegosiasiKatalog)
                    : null
                }
                valueClassName="whitespace-nowrap"
              />
              <DetailField label="Nomor Surat Pesanan" value={item.nomorSuratPesanan} />
              <DetailField label="Tanggal Surat Pesanan" value={item.tanggalSuratPesanan} />
              <DetailField label="Status Transaksi Katalog" value={item.statusTransaksiKatalog} />
            </DetailInfoCard>

            <DetailInfoCard title="Dokumen">
              <DetailField label="Status KAK" value={item.statusKak} />
              <DetailField label="Status HPS" value={item.statusHps} />
              <DetailField
                label="Status Rancangan Kontrak"
                value={item.statusRancanganKontrak}
              />
              <DetailField
                label="Status Dokumen Pendukung"
                value={item.statusDokumenPendukung}
              />
              <DetailField label="Kekurangan Dokumen" value={item.kekuranganDokumen} />
            </DetailInfoCard>

            <DetailInfoCard title="Catatan & Tindak Lanjut">
              <DetailField label="Kendala" value={item.kendala} />
              <DetailField label="Tindak Lanjut" value={item.tindakLanjut} />
              <DetailField label="PIC Tindak Lanjut" value={item.picTindakLanjut} />
              <DetailField
                label="Catatan / Revisi"
                value={item.catatan || "Belum ada catatan revisi."}
              />
              <DetailField label="Catatan E-Purchasing" value={item.catatanKatalog} />
            </DetailInfoCard>
          </DetailHorizontalSection>

          {item.statusSirup === "REVISI_PAGU" && !canEditRevision ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold leading-6 text-amber-700">
              Revisi hanya dapat diubah oleh unit pengusul.
            </div>
          ) : null}

          {showRevisionForm ? (
            <form
              action={formAction}
              className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-4"
            >
              <input type="hidden" name="id" value={item.id} />
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-xs font-black uppercase tracking-wide text-[#08783f]">
                    Pagu Revisi
                  </span>
                  <input
                    name="pagu"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    required
                    value={pagu}
                    onChange={(event) =>
                      setPagu(onlyDigits(event.target.value))
                    }
                    className={inputClass}
                  />
                  <span className="text-xs font-bold text-slate-500">
                    {formattedPagu}
                  </span>
                </label>

                <label className="grid gap-2">
                  <span className="text-xs font-black uppercase tracking-wide text-[#08783f]">
                    Lokasi Paket
                  </span>
                  <input
                    name="lokasiPaket"
                    defaultValue={item.lokasiPaket ?? ""}
                    className={inputClass}
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-xs font-black uppercase tracking-wide text-[#08783f]">
                    Jadwal Pemilihan
                  </span>
                  <input
                    name="jadwalPemilihan"
                    type="date"
                    defaultValue={item.jadwalPemilihan ?? ""}
                    className={inputClass}
                  />
                </label>

                <label className="grid gap-2 sm:col-span-2">
                  <span className="text-xs font-black uppercase tracking-wide text-[#08783f]">
                    Catatan Revisi Unit Pengusul
                  </span>
                  <textarea
                    name="catatan"
                    defaultValue={item.catatan ?? ""}
                    className="min-h-28 w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm font-semibold leading-6 text-slate-700 outline-none transition focus:border-[#08783f] focus:ring-2 focus:ring-emerald-100"
                  />
                </label>
              </div>

              {state.message ? (
                <p
                  className={`mt-4 rounded-lg px-3 py-2 text-sm font-bold ${
                    state.ok
                      ? "bg-emerald-100 text-[#08783f]"
                      : "bg-red-50 text-red-700"
                  }`}
                >
                  {state.message}
                </p>
              ) : null}

              <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <RevisionSubmitButton submitMode="save">
                  Simpan Revisi
                </RevisionSubmitButton>
                <RevisionSubmitButton submitMode="resubmit">
                  Simpan & Ajukan Ulang
                </RevisionSubmitButton>
              </div>
            </form>
          ) : null}
        </div>
      </ModalShell>
    </>
  );
}
