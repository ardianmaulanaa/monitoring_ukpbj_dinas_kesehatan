"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ClipboardCheck, Save } from "lucide-react";
import ModalShell from "@/components/modal/ModalShell";
import { formatCurrency } from "@/lib/currency";
import {
  updateSirupPublicationAction,
  type SirupPublicationState,
} from "@/app/sirup-rup/actions";

type CompleteSirupItem = {
  catatan: string | null;
  id: string;
  idRupSirup: string | null;
  jadwalPemilihan: string | null;
  jenisKatalog: string | null;
  etalaseKatalog: string | null;
  namaProdukKatalog: string | null;
  spesifikasiProdukKatalog: string | null;
  merekTipeKatalog: string | null;
  jumlahProdukKatalog: string | null;
  satuanProdukKatalog: string | null;
  hargaSatuanKatalog: string | null;
  totalHargaKatalog: string | null;
  namaPenyediaKatalog: string | null;
  statusNegosiasiKatalog: string | null;
  hargaNegosiasiKatalog: string | null;
  nomorSuratPesanan: string | null;
  tanggalSuratPesanan: string | null;
  statusTransaksiKatalog: string | null;
  catatanKatalog: string | null;
  kodeRup: string;
  linkSirup: string | null;
  metodePengadaan: string;
  namaPaket: string;
  pagu: string;
  statusSirup: string;
  sumberDana: string;
  tanggalInputSirup: string | null;
  tanggalTayangSirup: string | null;
  tahunAnggaran: number;
  unitPengusul: string;
};

type CompleteSirupModalButtonProps = {
  item: CompleteSirupItem;
  label?: string;
};

const initialState: SirupPublicationState = {
  message: "",
  ok: false,
};

const inputClass =
  "h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#08783f] focus:ring-2 focus:ring-emerald-100";
const labelClass = "text-xs font-black uppercase tracking-wide text-slate-500";

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

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

export default function CompleteSirupModalButton({
  item,
  label = "Lengkapi SIRUP",
}: CompleteSirupModalButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [state, setState] = useState<SirupPublicationState>(initialState);
  const [isPending, startTransition] = useTransition();
  const [pagu, setPagu] = useState(onlyDigits(item.pagu));
  const [metodePengadaan, setMetodePengadaan] = useState(
    item.metodePengadaan,
  );

  const formattedPagu = useMemo(() => formatCurrency(pagu), [pagu]);

  function openModal() {
    setState(initialState);
    setPagu(onlyDigits(item.pagu));
    setMetodePengadaan(item.metodePengadaan);
    setIsOpen(true);
  }

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const nextState = await updateSirupPublicationAction(state, formData);
      setState(nextState);

      if (!nextState.ok) return;

      if (nextState.data) {
        setPagu(onlyDigits(nextState.data.pagu));
        setMetodePengadaan(nextState.data.metodePengadaan);
      }

      setIsOpen(false);
      router.refresh();
    });
  }

  function closeModal() {
    setIsOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-[#08783f] px-4 text-sm font-black text-white transition hover:bg-[#066532]"
      >
        <ClipboardCheck className="h-4 w-4" strokeWidth={2.4} />
        {label}
      </button>

      <ModalShell
        isOpen={isOpen}
        onClose={closeModal}
        eyebrow="SIRUP / RUP"
        title={label}
        maxWidthClassName="max-w-4xl"
      >
        <form action={handleSubmit} className="grid gap-5">
          <input type="hidden" name="id" value={item.id} />

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="font-mono text-xs font-black uppercase tracking-wide text-slate-400">
              {item.kodeRup}
            </p>
            <p className="mt-1 text-lg font-black text-[#16227c]">
              {item.namaPaket}
            </p>
            <div className="mt-3 grid gap-2 text-sm font-semibold text-slate-600 sm:grid-cols-2">
              <p>OPD: {item.unitPengusul}</p>
              <p>TA: {item.tahunAnggaran}</p>
              <p>Sumber Dana: {item.sumberDana}</p>
              <p>Metode Awal: {methodLabel(item.metodePengadaan)}</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2">
              <span className={labelClass}>ID RUP SIRUP</span>
              <input
                name="idRupSirup"
                defaultValue={item.idRupSirup ?? ""}
                className={inputClass}
                placeholder="Contoh: 54321001"
              />
            </label>

            <label className="grid gap-2">
              <span className={labelClass}>Status SIRUP</span>
              <select
                name="statusSirup"
                required
                defaultValue={item.statusSirup}
                className={inputClass}
              >
                <option value="SIAP_RUP">Siap RUP</option>
                <option value="BELUM_INPUT">Belum Input</option>
                <option value="PROSES_VERIFIKASI">Proses Verifikasi</option>
                <option value="SUDAH_TAYANG">Sudah Tayang</option>
                <option value="REVISI_PAGU">Revisi Pagu</option>
                <option value="DITARIK">Ditarik</option>
              </select>
            </label>

            <label className="grid gap-2">
              <span className={labelClass}>Tanggal Input SIRUP</span>
              <input
                name="tanggalInputSirup"
                type="date"
                defaultValue={item.tanggalInputSirup ?? ""}
                className={inputClass}
              />
            </label>

            <label className="grid gap-2">
              <span className={labelClass}>Tanggal Tayang SIRUP</span>
              <input
                name="tanggalTayangSirup"
                type="date"
                defaultValue={item.tanggalTayangSirup ?? ""}
                className={inputClass}
              />
            </label>

            <label className="grid gap-2">
              <span className={labelClass}>Metode Final SIRUP</span>
              <select
                name="metodePengadaan"
                required
                value={metodePengadaan}
                onChange={(event) => setMetodePengadaan(event.target.value)}
                className={inputClass}
              >
                <option value="E_PURCHASING">E-Purchasing</option>
                <option value="TENDER">Tender</option>
                <option value="NON_TENDER">Non Tender</option>
                <option value="PENGADAAN_LANGSUNG">Pengadaan Langsung</option>
                <option value="SWAKELOLA">Swakelola</option>
              </select>
            </label>

            <label className="grid gap-2">
              <span className={labelClass}>Pagu Final SIRUP</span>
              <input
                name="pagu"
                inputMode="numeric"
                pattern="[0-9]*"
                required
                value={pagu}
                onChange={(event) => setPagu(onlyDigits(event.target.value))}
                className={inputClass}
              />
              <span className="text-xs font-bold text-slate-500">
                {formattedPagu}
              </span>
            </label>

            <label className="grid gap-2 sm:col-span-2">
              <span className={labelClass}>Link SIRUP</span>
              <input
                name="linkSirup"
                type="url"
                defaultValue={item.linkSirup ?? ""}
                className={inputClass}
                placeholder="https://sirup.lkpp.go.id/..."
              />
            </label>

            <label className="grid gap-2 sm:col-span-2">
              <span className={labelClass}>Catatan Perubahan</span>
              <textarea
                name="catatan"
                defaultValue={item.catatan ?? ""}
                className="min-h-28 w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm font-semibold leading-6 text-slate-700 outline-none transition focus:border-[#08783f] focus:ring-2 focus:ring-emerald-100"
                placeholder="Isi jika ada perbedaan dari data perencanaan."
              />
            </label>
          </div>

          {state.message ? (
            <p
              className={`rounded-lg px-3 py-2 text-sm font-bold ${
                state.ok
                  ? "bg-emerald-100 text-[#08783f]"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {state.message}
            </p>
          ) : null}

          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="h-11 rounded-lg border border-slate-300 bg-white px-4 text-sm font-black text-slate-600 transition hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#08783f] px-4 text-sm font-black text-white transition hover:bg-[#066532]"
            >
              <Save className="h-4 w-4" strokeWidth={2.4} />
              {isPending ? "Menyimpan..." : "Simpan Data SIRUP"}
            </button>
          </div>
        </form>
      </ModalShell>
    </>
  );
}
