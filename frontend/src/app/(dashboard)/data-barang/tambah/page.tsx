"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  PackagePlus,
  Save,
} from "lucide-react";
import AppHeader from "@/app/(dashboard)/_shared/AppHeader";

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

const inputClass =
  "mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#08783f] focus:ring-4 focus:ring-emerald-100";

export default function Page() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

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
    router.push("/data-barang");
    router.refresh();
  }

  return (
    <>
      <AppHeader
        title="Tambah Barang"
        subtitle="Input kebutuhan barang kesehatan untuk paket pengadaan."
        rightLabel="Data Barang"
      />

      <main className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-4 flex items-center justify-between gap-3">
          <Link
            href="/data-barang"
            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-black text-slate-700 shadow-sm transition hover:border-[#08783f] hover:text-[#08783f]"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={2.4} />
            Kembali
          </Link>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
        >
          <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 md:flex-row md:items-start md:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#08783f] text-white">
                <PackagePlus className="h-6 w-6" strokeWidth={2.4} />
              </div>
              <div className="min-w-0">
                <h2 className="text-xl font-black tracking-[-0.03em] text-slate-950">
                  Data Kebutuhan Barang
                </h2>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                  Gunakan data sesuai dokumen kebutuhan pengadaan: identitas
                  barang, spesifikasi, volume, estimasi harga, dan informasi
                  PDN/TKDN.
                </p>
              </div>
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
              <input
                className={inputClass}
                value={form.kodeBarang}
                onChange={(event) =>
                  updateField("kodeBarang", event.target.value)
                }
                required
              />
            </div>

            <div>
              <FieldLabel required>Nama barang</FieldLabel>
              <input
                className={inputClass}
                value={form.namaBarang}
                onChange={(event) =>
                  updateField("namaBarang", event.target.value)
                }
                required
              />
            </div>

            <div>
              <FieldLabel required>Kategori</FieldLabel>
              <input
                className={inputClass}
                value={form.kategori}
                onChange={(event) => updateField("kategori", event.target.value)}
                required
              />
            </div>

            <div>
              <FieldLabel required>Satuan</FieldLabel>
              <input
                className={inputClass}
                value={form.satuan}
                onChange={(event) => updateField("satuan", event.target.value)}
                required
              />
            </div>

            <div>
              <FieldLabel required>Jumlah kebutuhan</FieldLabel>
              <input
                className={inputClass}
                type="number"
                min="0"
                value={form.jumlahKebutuhan}
                onChange={(event) =>
                  updateField("jumlahKebutuhan", event.target.value)
                }
                placeholder="0"
                required
              />
            </div>

            <div>
              <FieldLabel required>Harga satuan estimasi</FieldLabel>
              <input
                className={inputClass}
                type="number"
                min="0"
                value={form.hargaSatuan}
                onChange={(event) =>
                  updateField("hargaSatuan", event.target.value)
                }
                placeholder="0"
                required
              />
            </div>

            <div>
              <FieldLabel>TKDN (%)</FieldLabel>
              <input
                className={inputClass}
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={form.tkdnPersen}
                onChange={(event) =>
                  updateField("tkdnPersen", event.target.value)
                }
              />
            </div>

            <div>
              <FieldLabel required>Prioritas kebutuhan</FieldLabel>
              <select
                className={inputClass}
                value={form.prioritas}
                onChange={(event) =>
                  updateField(
                    "prioritas",
                    event.target.value as FormState["prioritas"],
                  )
                }
                required
              >
                <option value="RENDAH">Rendah</option>
                <option value="NORMAL">Normal</option>
                <option value="TINGGI">Tinggi</option>
                <option value="MENDESAK">Mendesak</option>
              </select>
            </div>

            <div className="lg:col-span-2">
              <FieldLabel required>Spesifikasi teknis</FieldLabel>
              <textarea
                className="mt-2 min-h-28 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#08783f] focus:ring-4 focus:ring-emerald-100"
                value={form.spesifikasi}
                onChange={(event) =>
                  updateField("spesifikasi", event.target.value)
                }
                placeholder="Tuliskan spesifikasi utama, ukuran, tipe, kompatibilitas alat, masa kedaluwarsa, atau standar mutu."
                required
              />
            </div>

            <div>
              <FieldLabel>Lokasi penerimaan</FieldLabel>
              <input
                className={inputClass}
                value={form.lokasiPenerimaan}
                onChange={(event) =>
                  updateField("lokasiPenerimaan", event.target.value)
                }
              />
            </div>

            <div className="flex items-end">
              <label className="flex min-h-11 w-full items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-black text-slate-800">
                <input
                  type="checkbox"
                  checked={form.isPdn}
                  onChange={(event) =>
                    updateField("isPdn", event.target.checked)
                  }
                  className="h-4 w-4 accent-[#08783f]"
                />
                Produk Dalam Negeri
              </label>
            </div>

            <div className="lg:col-span-2">
              <FieldLabel>Catatan</FieldLabel>
              <textarea
                className="mt-2 min-h-24 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#08783f] focus:ring-4 focus:ring-emerald-100"
                value={form.catatan}
                onChange={(event) => updateField("catatan", event.target.value)}
                placeholder="Catatan kebutuhan, merek pembanding, justifikasi urgent, atau informasi penerimaan."
              />
            </div>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
            <Link
              href="/data-barang"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:border-slate-300"
            >
              Batal
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#08783f] px-4 text-sm font-black text-white shadow-sm transition hover:bg-[#066532] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Save className="h-5 w-5" strokeWidth={2.4} />
              )}
              Simpan barang
            </button>
          </div>
        </form>
      </main>
    </>
  );
}
