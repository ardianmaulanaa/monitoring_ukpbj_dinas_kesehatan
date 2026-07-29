"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, FilePlus2, Loader2, Plus, Save } from "lucide-react";
import ModalShell from "../_shared/ModalShell";

type PaketOption = {
  id: string;
  namaPaket: string;
};

type FormState = {
  nomorKontrak: string;
  paketId: string;
  namaPaket: string;
  penyedia: string;
  nilaiKontrak: string;
  tanggalKontrak: string;
  tanggalMulai: string;
  tanggalSelesai: string;
  status: "DRAFT" | "AKTIF" | "SELESAI" | "TERLAMBAT" | "BATAL";
  catatan: string;
};

const initialForm: FormState = {
  nomorKontrak: "",
  paketId: "",
  namaPaket: "",
  penyedia: "",
  nilaiKontrak: "",
  tanggalKontrak: "",
  tanggalMulai: "",
  tanggalSelesai: "",
  status: "DRAFT",
  catatan: "",
};

const inputClass =
  "mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#08783f] focus:ring-4 focus:ring-emerald-100";

function FieldLabel({
  children,
  required,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="text-sm font-black text-slate-800">
      {children}
      {required ? <span className="text-red-600"> *</span> : null}
    </label>
  );
}

export default function AddKontrakModalButton() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [paketOptions, setPaketOptions] = useState<PaketOption[]>([]);
  const [form, setForm] = useState<FormState>(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    if (!isOpen) return;

    let ignore = false;

    async function loadPaketOptions() {
      const response = await fetch("/api/paket");
      const result = await response.json().catch(() => null);
      const rows = Array.isArray(result?.data) ? result.data : [];

      if (!ignore) {
        setPaketOptions(
          rows.map((item: PaketOption) => ({
            id: item.id,
            namaPaket: item.namaPaket,
          })),
        );
      }
    }

    loadPaketOptions();

    return () => {
      ignore = true;
    };
  }, [isOpen]);

  function updateField<TField extends keyof FormState>(
    field: TField,
    value: FormState[TField],
  ) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handlePaketChange(paketId: string) {
    const selected = paketOptions.find((item) => item.id === paketId);

    setForm((current) => ({
      ...current,
      paketId,
      namaPaket: selected?.namaPaket ?? current.namaPaket,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccess(false);

    const response = await fetch("/api/kontrak", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        nilaiKontrak: Number(form.nilaiKontrak),
      }),
    });

    const result = await response.json().catch(() => null);

    if (!response.ok) {
      setError(result?.message ?? "Data kontrak gagal disimpan.");
      setIsSubmitting(false);
      return;
    }

    setSuccess(true);
    setIsSubmitting(false);
    setForm(initialForm);
    router.refresh();
    close();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#08783f] px-4 text-sm font-black text-white shadow-sm transition hover:bg-[#066532]"
      >
        <Plus className="h-5 w-5" strokeWidth={2.3} />
        Tambah kontrak
      </button>

      <ModalShell
        isOpen={isOpen}
        onClose={close}
        eyebrow="Kontrak & SP"
        title="Tambah kontrak"
        maxWidthClassName="max-w-4xl"
      >
        <form className="bg-white" onSubmit={handleSubmit}>
          <div className="flex items-start gap-4 border-b border-slate-100 pb-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#08783f] text-white">
              <FilePlus2 className="h-6 w-6" strokeWidth={2.4} />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-black tracking-[-0.03em] text-slate-950">
                Data Kontrak & Surat Pesanan
              </h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                Isi nomor kontrak, paket terkait, penyedia, nilai kontrak, masa berlaku,
                dan status pelaksanaan.
              </p>
            </div>
          </div>

          {error ? (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
              {error}
            </div>
          ) : null}

          {success ? (
            <div className="mt-5 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
              Data kontrak berhasil disimpan.
            </div>
          ) : null}

          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            <div>
              <FieldLabel required>Nomor kontrak / SP</FieldLabel>
              <input
                className={inputClass}
                value={form.nomorKontrak}
                onChange={(event) => updateField("nomorKontrak", event.target.value)}
                required
              />
            </div>

            <div>
              <FieldLabel>Paket terkait</FieldLabel>
              <select
                className={inputClass}
                value={form.paketId}
                onChange={(event) => handlePaketChange(event.target.value)}
              >
                <option value="">Pilih paket dari database</option>
                {paketOptions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.namaPaket}
                  </option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-2">
              <FieldLabel required>Nama paket</FieldLabel>
              <input
                className={inputClass}
                value={form.namaPaket}
                onChange={(event) => updateField("namaPaket", event.target.value)}
                required
              />
            </div>

            <div>
              <FieldLabel required>Penyedia</FieldLabel>
              <input
                className={inputClass}
                value={form.penyedia}
                onChange={(event) => updateField("penyedia", event.target.value)}
                required
              />
            </div>

            <div>
              <FieldLabel required>Nilai kontrak</FieldLabel>
              <input
                className={inputClass}
                inputMode="numeric"
                pattern="[0-9]*"
                value={form.nilaiKontrak}
                onChange={(event) =>
                  updateField("nilaiKontrak", event.target.value.replace(/\D/g, ""))
                }
                required
              />
            </div>

            <div>
              <FieldLabel>Tanggal kontrak</FieldLabel>
              <input
                className={inputClass}
                type="date"
                value={form.tanggalKontrak}
                onChange={(event) => updateField("tanggalKontrak", event.target.value)}
              />
            </div>

            <div>
              <FieldLabel>Status</FieldLabel>
              <select
                className={inputClass}
                value={form.status}
                onChange={(event) =>
                  updateField("status", event.target.value as FormState["status"])
                }
              >
                <option value="DRAFT">Draft</option>
                <option value="AKTIF">Aktif</option>
                <option value="SELESAI">Selesai</option>
                <option value="TERLAMBAT">Terlambat</option>
                <option value="BATAL">Batal</option>
              </select>
            </div>

            <div>
              <FieldLabel>Tanggal mulai</FieldLabel>
              <input
                className={inputClass}
                type="date"
                value={form.tanggalMulai}
                onChange={(event) => updateField("tanggalMulai", event.target.value)}
              />
            </div>

            <div>
              <FieldLabel>Tanggal selesai</FieldLabel>
              <input
                className={inputClass}
                type="date"
                value={form.tanggalSelesai}
                onChange={(event) => updateField("tanggalSelesai", event.target.value)}
              />
            </div>

            <div className="lg:col-span-2">
              <FieldLabel>Catatan</FieldLabel>
              <textarea
                className="mt-2 min-h-24 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#08783f] focus:ring-4 focus:ring-emerald-100"
                value={form.catatan}
                onChange={(event) => updateField("catatan", event.target.value)}
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-5">
            <button
              type="button"
              onClick={close}
              className="h-11 rounded-xl border border-slate-300 bg-white px-5 text-sm font-black text-slate-600 transition hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#08783f] px-5 text-sm font-black text-white transition hover:bg-[#066532] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Simpan
            </button>
          </div>
        </form>
      </ModalShell>
    </>
  );
}
