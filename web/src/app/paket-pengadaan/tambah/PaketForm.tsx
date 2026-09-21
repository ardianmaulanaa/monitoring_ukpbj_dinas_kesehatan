"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  ClipboardPlus,
  Loader2,
  Save,
} from "lucide-react";

type SumberDanaOption = {
  kode: string;
  nama: string;
};

type FormState = {
  kodePaket: string;
  namaPaket: string;
  unitPemohon: string;
  satuanKerja: string;
  tahunAnggaran: string;
  sumberDana: string;
  jenisPengadaan: "BARANG" | "JASA";
  kategori: string;
  metodePengadaan:
    | "TENDER"
    | "NON_TENDER"
    | "E_PURCHASING"
    | "PENGADAAN_LANGSUNG"
    | "SWAKELOLA";
  pagu: string;
  hps: string;
  statusPaket:
    | "PERENCANAAN"
    | "SIAP_DIPROSES"
    | "PEMILIHAN"
    | "PEMENANG_DITETAPKAN"
    | "KONTRAK"
    | "SELESAI"
    | "GAGAL"
    | "BATAL"
    | "TERLAMBAT";
  prioritas: "RENDAH" | "NORMAL" | "TINGGI" | "MENDESAK";
  ppkPenanggungJawab: string;
  rencanaMulai: string;
  rencanaSelesai: string;
  lokasiPelaksanaan: string;
  catatan: string;
};

const initialForm: FormState = {
  kodePaket: "",
  namaPaket: "",
  unitPemohon: "",
  satuanKerja: "",
  tahunAnggaran: String(new Date().getFullYear()),
  sumberDana: "",
  jenisPengadaan: "BARANG",
  kategori: "",
  metodePengadaan: "E_PURCHASING",
  pagu: "",
  hps: "",
  statusPaket: "PERENCANAAN",
  prioritas: "NORMAL",
  ppkPenanggungJawab: "",
  rencanaMulai: "",
  rencanaSelesai: "",
  lokasiPelaksanaan: "",
  catatan: "",
};

const inputClass =
  "mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#08783f] focus:ring-4 focus:ring-emerald-100";

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

export type PaketFormProps = {
  variant?: "page" | "modal";
  onCancel?: () => void;
  onSaved?: () => void;
};

export default function PaketForm({
  variant = "page",
  onCancel,
  onSaved,
}: PaketFormProps) {
  const [form, setForm] = useState<FormState>(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [sumberDanaOptions, setSumberDanaOptions] = useState<SumberDanaOption[]>([]);

  const paguValue = useMemo(() => Number(form.pagu) || 0, [form.pagu]);
  const hpsValue = useMemo(() => Number(form.hps) || 0, [form.hps]);

  useEffect(() => {
    let ignore = false;

    async function loadSumberDana() {
      const response = await fetch("/api/master/sumber-dana");
      const result = await response.json().catch(() => null);
      const rows = Array.isArray(result?.data)
        ? result.data.filter((item: SumberDanaOption & { aktif?: boolean }) => item.aktif !== false)
        : [];

      if (!ignore) {
        setSumberDanaOptions(rows);
        setForm((current) => ({
          ...current,
          sumberDana: current.sumberDana || rows[0]?.kode || "",
        }));
      }
    }

    loadSumberDana();

    return () => {
      ignore = true;
    };
  }, []);

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

    const response = await fetch("/api/paket", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        tahunAnggaran: Number(form.tahunAnggaran),
        pagu: Number(form.pagu),
        hps: Number(form.hps),
      }),
    });

    const result = await response.json().catch(() => null);

    if (!response.ok) {
      setError(result?.message ?? "Data paket gagal disimpan.");
      setIsSubmitting(false);
      return;
    }

    setSuccess(true);
    setIsSubmitting(false);
    setForm(initialForm);
    onSaved?.();
  }

  return (
    <form
          onSubmit={handleSubmit}
          className={variant === "modal" ? "bg-white" : "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"}
        >
          <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 md:flex-row md:items-start md:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#08783f] text-white">
                <ClipboardPlus className="h-6 w-6" strokeWidth={2.4} />
              </div>
              <div className="min-w-0">
                <h2 className="text-xl font-black tracking-[-0.03em] text-slate-950">
                  Data Paket Pengadaan
                </h2>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                  Paket berisi identitas pengadaan, unit pemohon, anggaran,
                  metode pemilihan, jadwal, status, dan PPK penanggung jawab.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-[#08783f]">
                  Pagu
                </p>
                <p className="mt-1 text-base font-black text-slate-950">
                  {formatCurrency(paguValue)}
                </p>
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-[#08783f]">
                  HPS
                </p>
                <p className="mt-1 text-base font-black text-slate-950">
                  {formatCurrency(hpsValue)}
                </p>
              </div>
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
              Data paket berhasil disimpan.
            </div>
          ) : null}

          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            <div>
              <FieldLabel required>Kode paket</FieldLabel>
              <input
                className={inputClass}
                value={form.kodePaket}
                onChange={(event) =>
                  updateField("kodePaket", event.target.value)
                }
                required
              />
            </div>

            <div>
              <FieldLabel required>Nama paket</FieldLabel>
              <input
                className={inputClass}
                value={form.namaPaket}
                onChange={(event) =>
                  updateField("namaPaket", event.target.value)
                }
                required
              />
            </div>

            <div>
              <FieldLabel required>Unit pemohon</FieldLabel>
              <input
                className={inputClass}
                value={form.unitPemohon}
                onChange={(event) =>
                  updateField("unitPemohon", event.target.value)
                }
                required
              />
            </div>

            <div>
              <FieldLabel>Satuan kerja</FieldLabel>
              <input
                className={inputClass}
                value={form.satuanKerja}
                onChange={(event) =>
                  updateField("satuanKerja", event.target.value)
                }
              />
            </div>

            <div>
              <FieldLabel required>Tahun anggaran</FieldLabel>
              <input
                className={inputClass}
                inputMode="numeric"
                value={form.tahunAnggaran}
                onChange={(event) =>
                  updateField(
                    "tahunAnggaran",
                    event.target.value.replace(/\D/g, ""),
                  )
                }
                required
              />
            </div>

            <div>
              <FieldLabel required>Sumber dana</FieldLabel>
              <select
                className={inputClass}
                value={form.sumberDana}
                onChange={(event) =>
                  updateField("sumberDana", event.target.value)
                }
                disabled={sumberDanaOptions.length === 0}
                required
              >
                {sumberDanaOptions.length === 0 ? (
                  <option value="">Master sumber dana belum tersedia</option>
                ) : null}
                {sumberDanaOptions.map((sumberDana) => (
                  <option key={sumberDana.kode} value={sumberDana.kode}>
                    {sumberDana.nama}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <FieldLabel required>Jenis pengadaan</FieldLabel>
              <select
                className={inputClass}
                value={form.jenisPengadaan}
                onChange={(event) =>
                  updateField(
                    "jenisPengadaan",
                    event.target.value as FormState["jenisPengadaan"],
                  )
                }
                required
              >
                <option value="BARANG">Barang</option>
                <option value="JASA">Jasa</option>
              </select>
            </div>

            <div>
              <FieldLabel required>Kategori utama</FieldLabel>
              <input
                className={inputClass}
                value={form.kategori}
                onChange={(event) => updateField("kategori", event.target.value)}
                required
              />
            </div>

            <div>
              <FieldLabel required>Metode pengadaan</FieldLabel>
              <select
                className={inputClass}
                value={form.metodePengadaan}
                onChange={(event) =>
                  updateField(
                    "metodePengadaan",
                    event.target.value as FormState["metodePengadaan"],
                  )
                }
                required
              >
                <option value="TENDER">Tender</option>
                <option value="NON_TENDER">Non Tender</option>
                <option value="E_PURCHASING">E-Purchasing</option>
                <option value="PENGADAAN_LANGSUNG">Pengadaan Langsung</option>
                <option value="SWAKELOLA">Swakelola</option>
              </select>
            </div>

            <div>
              <FieldLabel required>Status paket</FieldLabel>
              <select
                className={inputClass}
                value={form.statusPaket}
                onChange={(event) =>
                  updateField(
                    "statusPaket",
                    event.target.value as FormState["statusPaket"],
                  )
                }
                required
              >
                <option value="PERENCANAAN">Perencanaan</option>
                <option value="SIAP_DIPROSES">Siap Diproses</option>
                <option value="PEMILIHAN">Pemilihan</option>
                <option value="PEMENANG_DITETAPKAN">Pemenang Ditetapkan</option>
                <option value="KONTRAK">Kontrak</option>
                <option value="SELESAI">Selesai</option>
                <option value="GAGAL">Gagal</option>
                <option value="BATAL">Batal</option>
                <option value="TERLAMBAT">Terlambat</option>
              </select>
            </div>

            <div>
              <FieldLabel required>Pagu anggaran</FieldLabel>
              <input
                className={inputClass}
                inputMode="numeric"
                value={form.pagu}
                onChange={(event) =>
                  updateField("pagu", event.target.value.replace(/\D/g, ""))
                }
                placeholder="0"
                required
              />
            </div>

            <div>
              <FieldLabel required>HPS</FieldLabel>
              <input
                className={inputClass}
                inputMode="numeric"
                value={form.hps}
                onChange={(event) =>
                  updateField("hps", event.target.value.replace(/\D/g, ""))
                }
                placeholder="0"
                required
              />
            </div>

            <div>
              <FieldLabel required>Prioritas</FieldLabel>
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

            <div>
              <FieldLabel>PPK penanggung jawab</FieldLabel>
              <input
                className={inputClass}
                value={form.ppkPenanggungJawab}
                onChange={(event) =>
                  updateField("ppkPenanggungJawab", event.target.value)
                }
                placeholder="Nama PPK"
              />
            </div>

            <div>
              <FieldLabel>Rencana mulai</FieldLabel>
              <input
                className={inputClass}
                type="date"
                value={form.rencanaMulai}
                onChange={(event) =>
                  updateField("rencanaMulai", event.target.value)
                }
              />
            </div>

            <div>
              <FieldLabel>Rencana selesai</FieldLabel>
              <input
                className={inputClass}
                type="date"
                value={form.rencanaSelesai}
                onChange={(event) =>
                  updateField("rencanaSelesai", event.target.value)
                }
              />
            </div>

            <div className="lg:col-span-2">
              <FieldLabel>Lokasi pelaksanaan/penerimaan</FieldLabel>
              <input
                className={inputClass}
                value={form.lokasiPelaksanaan}
                onChange={(event) =>
                  updateField("lokasiPelaksanaan", event.target.value)
                }
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

          <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:border-slate-300"
            >
              Batal
            </button>
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
              Simpan paket
            </button>
          </div>
    </form>
  );
}
