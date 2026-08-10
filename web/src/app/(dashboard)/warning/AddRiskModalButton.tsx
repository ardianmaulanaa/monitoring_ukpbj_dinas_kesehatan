"use client";

import { useCallback, useState } from "react";
import { Plus, Save } from "lucide-react";
import ModalShell from "@/app/(dashboard)/_shared/ModalShell";

type RiskPackageOption = {
  id: string;
  name: string;
};

type AddRiskModalButtonProps = {
  packages: RiskPackageOption[];
};

const inputClass =
  "h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#08783f] focus:ring-2 focus:ring-emerald-100";

const textareaClass =
  "min-h-24 rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#08783f] focus:ring-2 focus:ring-emerald-100";

export default function AddRiskModalButton({ packages }: AddRiskModalButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const close = useCallback(() => setIsOpen(false), []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError("");

    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/warning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paketId: formData.get("paketId"),
          risiko: formData.get("risiko"),
          level: formData.get("level"),
          status: formData.get("status"),
          mitigasi: formData.get("mitigasi"),
          pic: formData.get("pic"),
          deadline: formData.get("deadline"),
        }),
      });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        setError(payload.message ?? "Data risiko gagal disimpan.");
        return;
      }

      setIsOpen(false);
      window.location.reload();
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#08783f] px-4 text-sm font-black text-white shadow-sm transition hover:bg-[#066532]"
      >
        <Plus className="h-4 w-4" strokeWidth={2.5} />
        Tambah Risiko
      </button>

      <ModalShell
        isOpen={isOpen}
        onClose={close}
        eyebrow="Risiko & Mitigasi"
        title="Tambah Risiko"
        maxWidthClassName="max-w-3xl"
      >
        <form
          className="grid gap-5"
          onSubmit={handleSubmit}
        >
          <div className="grid gap-5 md:grid-cols-2">
            <label className="grid gap-2 md:col-span-2">
              <span className="text-xs font-black uppercase tracking-wide text-slate-500">
                Paket Terkait
              </span>
              <select name="paketId" className={inputClass} defaultValue="">
                <option value="" disabled>
                  Pilih paket pengadaan
                </option>
                {packages.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 md:col-span-2">
              <span className="text-xs font-black uppercase tracking-wide text-slate-500">
                Uraian Risiko
              </span>
              <textarea name="risiko" className={textareaClass} required />
            </label>

            <label className="grid gap-2">
              <span className="text-xs font-black uppercase tracking-wide text-slate-500">
                Level Risiko
              </span>
              <select name="level" className={inputClass} defaultValue="SEDANG">
                <option value="RENDAH">Rendah</option>
                <option value="SEDANG">Sedang</option>
                <option value="TINGGI">Tinggi</option>
              </select>
            </label>

            <label className="grid gap-2">
              <span className="text-xs font-black uppercase tracking-wide text-slate-500">
                Status
              </span>
              <select
                name="status"
                className={inputClass}
                defaultValue="PERLU_TINDAK_LANJUT"
              >
                <option value="PERLU_TINDAK_LANJUT">Perlu Tindak Lanjut</option>
                <option value="PROSES">Proses</option>
                <option value="SELESAI">Selesai</option>
              </select>
            </label>

            <label className="grid gap-2 md:col-span-2">
              <span className="text-xs font-black uppercase tracking-wide text-slate-500">
                Mitigasi
              </span>
              <textarea name="mitigasi" className={textareaClass} required />
            </label>

            <label className="grid gap-2">
              <span className="text-xs font-black uppercase tracking-wide text-slate-500">
                PIC
              </span>
              <input name="pic" className={inputClass} required />
            </label>

            <label className="grid gap-2">
              <span className="text-xs font-black uppercase tracking-wide text-slate-500">
                Deadline
              </span>
              <input name="deadline" className={inputClass} type="date" />
            </label>
          </div>

          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {error}
            </div>
          ) : null}

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
              disabled={isSaving}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#08783f] px-4 text-sm font-black text-white transition hover:bg-[#066532]"
            >
              <Save className="h-4 w-4" />
              {isSaving ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </ModalShell>
    </>
  );
}
