"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, RotateCcw, Save } from "lucide-react";
import ModalShell from "@/components/modal/ModalShell";
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
const labelClass = "text-xs font-black uppercase tracking-wide text-slate-400";

function methodLabel(value: string) {
  const labels: Record<string, string> = {
    TENDER: "Tender",
    NON_TENDER: "Non Tender",
    E_PURCHASING: "e-Katalog",
    PENGADAAN_LANGSUNG: "Pengadaan Langsung",
    SWAKELOLA: "Swakelola",
  };

  return labels[value] ?? value.replaceAll("_", " ");
}

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
      <dt className={labelClass}>{label}</dt>
      <dd className="break-words text-sm font-bold text-slate-700">{value}</dd>
    </div>
  );
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
        maxWidthClassName="max-w-4xl"
      >
        <div className="grid gap-5">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-4">
            <div>
              <p className="font-mono text-xs font-black uppercase tracking-wide text-slate-400">
                {item.kodeRup}
              </p>
              <p className="mt-1 text-lg font-black text-[#16227c]">
                {item.namaPaket}
              </p>
            </div>
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${statusStyle}`}
            >
              {statusLabel}
            </span>
          </div>

          <dl className="grid gap-3 sm:grid-cols-2">
            <DetailRow label="Unit Pengusul" value={item.unitPengusul} />
            <DetailRow label="ID RUP SIRUP" value={item.idRupSirup || "-"} />
            <DetailRow
              label="Tanggal Input SIRUP"
              value={item.tanggalInputSirup || "-"}
            />
            <DetailRow
              label="Tanggal Tayang SIRUP"
              value={item.tanggalTayangSirup || "-"}
            />
            <DetailRow label="Unit / Bidang" value={item.unitBidang || "-"} />
            <DetailRow label="PPK / PPTK" value={item.ppkPptk || "-"} />
            <DetailRow
              label="Kontak Penanggung Jawab"
              value={item.kontakPenanggungJawab || "-"}
            />
            <DetailRow label="Program" value={item.program || "-"} />
            <DetailRow label="Kegiatan" value={item.kegiatan || "-"} />
            <DetailRow label="Sub Kegiatan" value={item.subKegiatan || "-"} />
            <DetailRow
              label="Kode Rekening"
              value={item.kodeRekening || "-"}
            />
            <DetailRow label="Lokasi Paket" value={item.lokasiPaket || "-"} />
            <DetailRow label="Jenis Belanja" value={item.jenisBelanja || "-"} />

            <DetailRow label="Sumber Dana" value={item.sumberDana} />
            <DetailRow label="Pagu" value={formatCurrency(item.pagu)} />
            <DetailRow
              label="Volume / Satuan"
              value={`${item.volumeKebutuhan || "-"} ${item.satuanKebutuhan || ""}`.trim()}
            />
            <DetailRow label="Prioritas" value={item.prioritas || "-"} />
            <DetailRow
              label="Waktu Kebutuhan"
              value={item.waktuKebutuhan || "-"}
            />
            <DetailRow
              label="Cara Pengadaan"
              value={item.caraPengadaan || "-"}
            />
            <DetailRow
              label="Metode Pengadaan"
              value={methodLabel(item.metodePengadaan)}
            />
            <DetailRow
              label="Jadwal Pemilihan"
              value={item.jadwalPemilihan || "-"}
            />
            <DetailRow
              label="Jadwal Rencana"
              value={`${item.jadwalMulaiRencana || "-"} s.d. ${
                item.jadwalSelesaiRencana || "-"
              }`}
            />
            <DetailRow
              label="Tahun Anggaran"
              value={`TA ${item.tahunAnggaran}`}
            />
            <DetailRow label="Link SIRUP" value={item.linkSirup || "-"} />
            {item.metodePengadaan === "E_PURCHASING" ? (
              <>
                <DetailRow
                  label="Jenis Katalog"
                  value={item.jenisKatalog || "-"}
                />
                <DetailRow
                  label="Etalase Katalog"
                  value={item.etalaseKatalog || "-"}
                />
                <DetailRow
                  label="Nama Produk Katalog"
                  value={item.namaProdukKatalog || "-"}
                />
                <DetailRow
                  label="Merek / Tipe"
                  value={item.merekTipeKatalog || "-"}
                />
                <DetailRow
                  label="Jumlah / Satuan"
                  value={`${item.jumlahProdukKatalog || "-"} ${
                    item.satuanProdukKatalog || ""
                  }`.trim()}
                />
                <DetailRow
                  label="Harga Satuan Tayang"
                  value={
                    item.hargaSatuanKatalog
                      ? formatCurrency(item.hargaSatuanKatalog)
                      : "-"
                  }
                />
                <DetailRow
                  label="Total Harga Tayang"
                  value={
                    item.totalHargaKatalog
                      ? formatCurrency(item.totalHargaKatalog)
                      : "-"
                  }
                />
                <DetailRow
                  label="Penyedia Katalog"
                  value={item.namaPenyediaKatalog || "-"}
                />
                <DetailRow
                  label="Status Negosiasi"
                  value={item.statusNegosiasiKatalog || "-"}
                />
                <DetailRow
                  label="Harga Negosiasi"
                  value={
                    item.hargaNegosiasiKatalog
                      ? formatCurrency(item.hargaNegosiasiKatalog)
                      : "-"
                  }
                />
                <DetailRow
                  label="Nomor Surat Pesanan"
                  value={item.nomorSuratPesanan || "-"}
                />
                <DetailRow
                  label="Tanggal Surat Pesanan"
                  value={item.tanggalSuratPesanan || "-"}
                />
                <DetailRow
                  label="Status Transaksi Katalog"
                  value={item.statusTransaksiKatalog || "-"}
                />
              </>
            ) : null}
            <DetailRow label="Status KAK" value={item.statusKak || "-"} />
            <DetailRow label="Status HPS" value={item.statusHps || "-"} />
            <DetailRow
              label="Status Rancangan Kontrak"
              value={item.statusRancanganKontrak || "-"}
            />
            <DetailRow
              label="Status Dokumen Pendukung"
              value={item.statusDokumenPendukung || "-"}
            />
          </dl>

          {[
            ["Uraian Belanja", item.uraianBelanja],
            ["Uraian Kebutuhan", item.uraianKebutuhan],
            ["Spesifikasi Awal", item.spesifikasiAwal],
            ["Spesifikasi Produk Katalog", item.spesifikasiProdukKatalog],
            ["Output yang Diharapkan", item.outputDiharapkan],
            ["Kekurangan Dokumen", item.kekuranganDokumen],
            ["Kendala", item.kendala],
            ["Tindak Lanjut", item.tindakLanjut],
            ["Catatan e-Katalog", item.catatanKatalog],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-lg border border-slate-200 bg-slate-50 p-4"
            >
              <p className={labelClass}>{label}</p>
              <p className="mt-2 whitespace-pre-wrap text-sm font-semibold leading-6 text-slate-700">
                {value || "-"}
              </p>
            </div>
          ))}

          <DetailRow
            label="PIC Tindak Lanjut"
            value={item.picTindakLanjut || "-"}
          />

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className={labelClass}>Catatan / Revisi</p>
            <p className="mt-2 whitespace-pre-wrap text-sm font-semibold leading-6 text-slate-700">
              {item.catatan || "Belum ada catatan revisi."}
            </p>
          </div>

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
