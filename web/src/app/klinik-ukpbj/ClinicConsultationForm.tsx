"use client";

import { useState } from "react";

type ClinicConsultationFormProps = {
  units: string[];
  types: string[];
};

const inputClass =
  "mt-1 h-9 w-full rounded-md border border-slate-300 bg-white px-3 font-semibold text-slate-600";

export default function ClinicConsultationForm({
  units,
  types,
}: ClinicConsultationFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError("");

    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/klinik", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          unitKerja: formData.get("unitKerja"),
          jenis: formData.get("jenis"),
          pertanyaan: formData.get("pertanyaan"),
        }),
      });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        setError(payload.message ?? "Konsultasi gagal disimpan.");
        return;
      }

      window.location.reload();
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="space-y-3 p-5" onSubmit={handleSubmit}>
      <label className="block text-sm font-black text-slate-400">
        Unit Kerja
        <select name="unitKerja" className={inputClass} required defaultValue="">
          <option value="" disabled>
            Pilih Unit
          </option>
          {units.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm font-black text-slate-400">
        Jenis Konsultasi
        {types.length > 0 ? (
          <select name="jenis" className={inputClass} required defaultValue="">
            <option value="" disabled>
              Pilih Jenis
            </option>
            {types.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        ) : (
          <input
            name="jenis"
            className={inputClass}
            placeholder="Tulis jenis konsultasi"
            required
          />
        )}
      </label>
      <label className="block text-sm font-black text-slate-400">
        Pertanyaan / Permasalahan
        <textarea
          name="pertanyaan"
          className="mt-1 min-h-[138px] w-full rounded-md border border-slate-300 px-3 py-3 font-semibold text-slate-600 outline-none"
          placeholder="Tuliskan pertanyaan atau permasalahan pengadaan Anda..."
          required
        />
      </label>
      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
          {error}
        </div>
      ) : null}
      <button
        type="submit"
        disabled={isSaving}
        className="h-10 rounded-md bg-[#08783f] px-5 text-sm font-black text-white"
      >
        {isSaving ? "Mengirim..." : "Kirim Konsultasi"}
      </button>
    </form>
  );
}
