"use client";

import { FormEvent, useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, Plus, Save } from "lucide-react";
import ModalShell from "@/app/(dashboard)/_shared/ModalShell";

const inputClass =
  "mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#08783f] focus:ring-4 focus:ring-emerald-100";

type FormState = {
  kodeBarang: string;
  namaBarang: string;
  kategori: string;
  spesifikasi: string;
  satuan: string;
  jumlahKebutuhan: string;
  hargaSatuan: string;
  tkdnPersen: string;
  isPdn: boolean;
  prioritas: "RENDAH" | "NORMAL" | "TINGGI" | "MENDESAK";
  lokasiPenerimaan: string;
  catatan: string;
};

const initialForm: FormState = {
  kodeBarang: "",
  namaBarang: "",
  kategori: "",
  spesifikasi: "",
  satuan: "",
  jumlahKebutuhan: "",
  hargaSatuan: "",
  tkdnPersen: "",
  isPdn: false,
  prioritas: "NORMAL",
  lokasiPenerimaan: "",
  catatan: "",
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

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

export default function AddDataBarangModalButton() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState<FormState>(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const close = useCallback(() => setIsOpen(false), []);

  const estimasiTotal = useMemo(() => {
    const jumlah = Number(form.jumlahKebutuhan) || 0;
    const harga = Number(form.hargaSatuan) || 0;
    return jumlah * harga;
  }, [form.hargaSatuan, form.jumlahKebutuhan]);

  function updateField<TField extends keyof FormState>(
    field: TField,
    value: FormState[TField],
  ) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccess(false);

    const response = await fetch("/api/data-barang", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        jumlahKebutuhan: Number(form.jumlahKebutuhan),
        hargaSatuan: Number(form.hargaSatuan),
        tkdnPersen: form.tkdnPersen === "" ? undefined : Number(form.tkdnPersen),
        status: "AKTIF",
      }),
    });

    const result = await response.json().catch(() => null);

    if (!response.ok) {
      setError(result?.message ?? "Data barang gagal disimpan.");
      setIsSubmitting(false);
      return;
    }

    setSuccess(true);
    setIsSubmitting(false);
    setForm(initialForm);
    setIsOpen(false);
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#08783f] px-4 text-sm font-black text-white shadow-sm transition hover:bg-[#066532]"
      >
        <Plus className="h-5 w-5" strokeWidth={2.3} />
        Tambah barang
      </button>

      <ModalShell
        isOpen={isOpen}
        onClose={close}
        eyebrow="Data Barang"
        title="Tambah Barang"
      >
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-950">
                Data Kebutuhan Barang
              </h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                Input identitas barang, spesifikasi, volume, estimasi harga,
                dan informasi PDN/TKDN.
              </p>
            </div>
            <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-[#08783f]">
                Estimasi Total
              </p>
              <p className="mt-1 text-lg font-black text-slate-950">
                {formatCurrency(estimasiTotal)}
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
              Data barang berhasil disimpan.
            </div>
          ) : null}

          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            <div>
              <FieldLabel required>Kode barang</FieldLabel>
              <input className={inputClass} value={form.kodeBarang} onChange={(event) => updateField("kodeBarang", event.target.value)} required />
            </div>
            <div>
              <FieldLabel required>Nama barang</FieldLabel>
              <input className={inputClass} value={form.namaBarang} onChange={(event) => updateField("namaBarang", event.target.value)} required />
            </div>
            <div>
              <FieldLabel required>Kategori</FieldLabel>
              <input className={inputClass} value={form.kategori} onChange={(event) => updateField("kategori", event.target.value)} required />
            </div>
            <div>
              <FieldLabel required>Satuan</FieldLabel>
              <input className={inputClass} value={form.satuan} onChange={(event) => updateField("satuan", event.target.value)} required />
            </div>
            <div>
              <FieldLabel required>Jumlah kebutuhan</FieldLabel>
              <input className={inputClass} type="number" min="0" value={form.jumlahKebutuhan} onChange={(event) => updateField("jumlahKebutuhan", event.target.value)} required />
            </div>
            <div>
              <FieldLabel required>Harga satuan estimasi</FieldLabel>
              <input className={inputClass} type="number" min="0" value={form.hargaSatuan} onChange={(event) => updateField("hargaSatuan", event.target.value)} required />
            </div>
            <div>
              <FieldLabel>TKDN (%)</FieldLabel>
              <input className={inputClass} type="number" min="0" max="100" step="0.01" value={form.tkdnPersen} onChange={(event) => updateField("tkdnPersen", event.target.value)} />
            </div>
            <div>
              <FieldLabel required>Prioritas kebutuhan</FieldLabel>
              <select className={inputClass} value={form.prioritas} onChange={(event) => updateField("prioritas", event.target.value as FormState["prioritas"])} required>
                <option value="RENDAH">Rendah</option>
                <option value="NORMAL">Normal</option>
                <option value="TINGGI">Tinggi</option>
                <option value="MENDESAK">Mendesak</option>
              </select>
            </div>
            <div className="lg:col-span-2">
              <FieldLabel required>Spesifikasi teknis</FieldLabel>
              <textarea className="mt-2 min-h-24 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#08783f] focus:ring-4 focus:ring-emerald-100" value={form.spesifikasi} onChange={(event) => updateField("spesifikasi", event.target.value)} required />
            </div>
            <div>
              <FieldLabel>Lokasi penerimaan</FieldLabel>
              <input className={inputClass} value={form.lokasiPenerimaan} onChange={(event) => updateField("lokasiPenerimaan", event.target.value)} />
            </div>
            <div className="flex items-end">
              <label className="flex min-h-11 w-full items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-black text-slate-800">
                <input type="checkbox" checked={form.isPdn} onChange={(event) => updateField("isPdn", event.target.checked)} className="h-4 w-4 accent-[#08783f]" />
                Produk Dalam Negeri
              </label>
            </div>
            <div className="lg:col-span-2">
              <FieldLabel>Catatan</FieldLabel>
              <textarea className="mt-2 min-h-20 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#08783f] focus:ring-4 focus:ring-emerald-100" value={form.catatan} onChange={(event) => updateField("catatan", event.target.value)} />
            </div>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
            <button type="button" onClick={close} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:border-slate-300">
              Batal
            </button>
            <button type="submit" disabled={isSubmitting} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#08783f] px-4 text-sm font-black text-white shadow-sm transition hover:bg-[#066532] disabled:opacity-70">
              {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" strokeWidth={2.4} />}
              Simpan barang
            </button>
          </div>
        </form>
      </ModalShell>
    </>
  );
}
