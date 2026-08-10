"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";

const inputClass =
  "h-11 w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#08783f] focus:ring-2 focus:ring-emerald-100";
const labelClass = "text-xs font-black uppercase tracking-wide text-slate-500";

type SumberDanaOption = {
  kode: string;
  nama: string;
};

type RupFormProps = {
  sumberDanaOptions: SumberDanaOption[];
  onCancel?: () => void;
  onSaved?: () => void;
  variant?: "page" | "modal";
  mode?: "rup" | "planning";
};

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

export default function RupForm({
  sumberDanaOptions,
  onCancel,
  onSaved,
  variant = "page",
  mode = "rup",
}: RupFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [pagu, setPagu] = useState("");

  const formattedPagu = useMemo(() => {
    const value = Number(pagu);
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(Number.isFinite(value) ? value : 0);
  }, [pagu]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());

    const response = await fetch("/api/rup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await response.json().catch(() => null);
    setSaving(false);

    if (!response.ok) {
      setError(result?.message ?? "Data RUP gagal disimpan.");
      return;
    }

    if (onSaved) {
      onSaved();
      return;
    }

    router.push("/rup");
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={
        variant === "modal"
          ? "min-w-0 bg-white"
          : "overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
      }
    >
      {variant === "page" ? (
        <div className="border-b border-slate-100 px-5 py-4">
          <h1 className="text-lg font-black text-[#16227c]">
            {mode === "planning"
              ? "Form Usulan Perencanaan"
              : "Form Rencana Umum Pengadaan"}
          </h1>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            {mode === "planning"
              ? "Isi kebutuhan unit, sumber dana, pagu, metode awal, jadwal, dan status approval."
              : "Isi data RUP seperti kode RUP, unit pengusul, sumber dana, pagu, metode, jadwal pemilihan, dan status tayang SIRUP."}
          </p>
        </div>
      ) : null}

      <div className={`grid min-w-0 gap-5 md:grid-cols-2 ${variant === "modal" ? "p-0" : "p-5"}`}>
        <label className="grid min-w-0 gap-2">
          <span className={labelClass}>
            {mode === "planning" ? "Kode Usulan" : "Kode RUP"}
          </span>
          <input
            name="kodeRup"
            required
            className={inputClass}
            placeholder={mode === "planning" ? "USUL-2025-001" : undefined}
          />
        </label>

        <label className="grid min-w-0 gap-2">
          <span className={labelClass}>Tahun Anggaran</span>
          <input
            name="tahunAnggaran"
            type="number"
            min="2000"
            required
            className={inputClass}
            defaultValue={new Date().getFullYear()}
          />
        </label>

        <label className="grid min-w-0 gap-2 md:col-span-2">
          <span className={labelClass}>
            {mode === "planning" ? "Nama Usulan" : "Nama Paket"}
          </span>
          <input name="namaPaket" required className={inputClass} />
        </label>

        <label className="grid min-w-0 gap-2">
          <span className={labelClass}>Unit Pengusul</span>
          <input
            name="unitPengusul"
            required
            className={inputClass}
          />
        </label>

        <label className="grid min-w-0 gap-2">
          <span className={labelClass}>Sumber Dana</span>
          <select
            name="sumberDana"
            required
            className={inputClass}
            defaultValue={sumberDanaOptions[0]?.kode ?? ""}
            disabled={sumberDanaOptions.length === 0}
          >
            {sumberDanaOptions.length === 0 ? (
              <option value="">Master sumber dana belum tersedia</option>
            ) : null}
            {sumberDanaOptions.map((option) => (
              <option key={option.kode} value={option.kode}>
                {option.nama}
              </option>
            ))}
          </select>
        </label>

        <label className="grid min-w-0 gap-2">
          <span className={labelClass}>Pagu</span>
          <input
            name="pagu"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            required
            className={inputClass}
            value={pagu}
            onChange={(event) => setPagu(onlyDigits(event.target.value))}
            placeholder="0"
          />
          <span className="text-xs font-bold text-slate-500">
            {formattedPagu}
          </span>
        </label>

        <label className="grid min-w-0 gap-2">
          <span className={labelClass}>Metode</span>
          <select name="metodePengadaan" required className={inputClass}>
            <option value="E_PURCHASING">e-Katalog</option>
            <option value="TENDER">Tender</option>
            <option value="NON_TENDER">Non Tender</option>
            <option value="PENGADAAN_LANGSUNG">Pengadaan Langsung</option>
            <option value="SWAKELOLA">Swakelola</option>
          </select>
        </label>

        <label className="grid min-w-0 gap-2">
          <span className={labelClass}>Jadwal Pemilihan</span>
          <input
            name="jadwalPemilihan"
            type="date"
            className={inputClass}
          />
        </label>

        <label className="grid min-w-0 gap-2">
          <span className={labelClass}>
            {mode === "planning" ? "Status Approval" : "Status SIRUP"}
          </span>
          <select name="statusSirup" required className={inputClass}>
            {mode === "planning" ? (
              <>
                <option value="BELUM_INPUT">Draft Usulan</option>
                <option value="PROSES_VERIFIKASI">Menunggu Kepala Unit</option>
                <option value="MENUNGGU_PPTK">Menunggu PPTK</option>
                <option value="MENUNGGU_PPK">Menunggu PPK</option>
                <option value="MENUNGGU_KPA_PA">Menunggu KPA/PA</option>
                <option value="REVISI_PAGU">Perlu Revisi</option>
                <option value="SUDAH_TAYANG">Siap RUP/SIRUP</option>
                <option value="DITARIK">Ditolak</option>
              </>
            ) : (
              <>
                <option value="BELUM_INPUT">Belum Input</option>
                <option value="PROSES_VERIFIKASI">Proses Verifikasi</option>
                <option value="SUDAH_TAYANG">Sudah Tayang</option>
                <option value="REVISI_PAGU">Revisi Pagu</option>
                <option value="DITARIK">Ditarik</option>
              </>
            )}
          </select>
        </label>

        <label className="grid min-w-0 gap-2 md:col-span-2">
          <span className={labelClass}>Catatan</span>
          <textarea
            name="catatan"
            className="min-h-28 w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#08783f] focus:ring-2 focus:ring-emerald-100"
          />
        </label>
      </div>

      {error ? (
        <div className={`${variant === "modal" ? "mt-5" : "mx-5"} rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700`}>
          {error}
        </div>
      ) : null}

      <div className={`flex flex-col-reverse gap-3 border-t border-slate-100 sm:flex-row sm:justify-end ${variant === "modal" ? "mt-6 pt-4" : "px-5 py-4"}`}>
        <button
          type="button"
          onClick={onCancel ?? (() => router.back())}
          className="h-11 rounded-lg border border-slate-300 bg-white px-4 text-sm font-black text-slate-600 transition hover:bg-slate-50"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#08783f] px-4 text-sm font-black text-white transition hover:bg-[#066532] disabled:opacity-60"
        >
          <Save className="h-4 w-4" />
          {saving
            ? "Menyimpan..."
            : mode === "planning"
              ? "Simpan Usulan"
              : "Simpan RUP"}
        </button>
      </div>
    </form>
  );
}
