"use client";

import { useCallback, useState } from "react";
import { Plus, Save } from "lucide-react";
import ModalShell from "./ModalShell";

type GenericInputModalButtonProps = {
  label: string;
  moduleName: string;
};

const inputClass =
  "h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#08783f] focus:ring-2 focus:ring-emerald-100";

export default function GenericInputModalButton({
  label,
  moduleName,
}: GenericInputModalButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const close = useCallback(() => setIsOpen(false), []);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#08783f] px-4 text-sm font-black text-white shadow-sm transition hover:bg-[#066532]"
      >
        <Plus className="h-5 w-5" strokeWidth={2.3} />
        {label}
      </button>

      <ModalShell
        isOpen={isOpen}
        onClose={close}
        eyebrow={moduleName}
        title={label}
        maxWidthClassName="max-w-3xl"
      >
        <form
          className="grid gap-5"
          onSubmit={(event) => {
            event.preventDefault();
            setIsOpen(false);
          }}
        >
          <div className="grid gap-5 md:grid-cols-2">
            <label className="grid gap-2 md:col-span-2">
              <span className="text-xs font-black uppercase tracking-wide text-slate-500">
                Nama / uraian
              </span>
              <input className={inputClass} required />
            </label>
            <label className="grid gap-2">
              <span className="text-xs font-black uppercase tracking-wide text-slate-500">
                Status
              </span>
              <select className={inputClass} defaultValue="DRAFT">
                <option value="DRAFT">Draft</option>
                <option value="AKTIF">Aktif</option>
                <option value="PROSES">Proses</option>
              </select>
            </label>
            <label className="grid gap-2">
              <span className="text-xs font-black uppercase tracking-wide text-slate-500">
                Tanggal
              </span>
              <input className={inputClass} type="date" />
            </label>
            <label className="grid gap-2 md:col-span-2">
              <span className="text-xs font-black uppercase tracking-wide text-slate-500">
                Catatan
              </span>
              <textarea className="min-h-24 rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#08783f] focus:ring-2 focus:ring-emerald-100" />
            </label>
          </div>
          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={close}
              className="h-11 rounded-lg border border-slate-300 bg-white px-4 text-sm font-black text-slate-600 transition hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#08783f] px-4 text-sm font-black text-white transition hover:bg-[#066532]"
            >
              <Save className="h-4 w-4" />
              Simpan
            </button>
          </div>
        </form>
      </ModalShell>
    </>
  );
}
