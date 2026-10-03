"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, FileUp, Upload } from "lucide-react";
import ModalShell from "@/components/modal/ModalShell";
import { formatCurrency } from "@/lib/currency";

type ImportRow = {
  rowNumber: number;
  kodeRup: string;
  namaPaket: string;
  kegiatan: string | null;
  sumberDana: string;
  lokasiPaket: string | null;
  metodePengadaan: string;
  pagu: number;
  status: "valid" | "invalid" | "duplicate";
  errors: string[];
};

type PreviewPayload = {
  rows: ImportRow[];
  summary: {
    total: number;
    valid: number;
    duplicate: number;
    invalid: number;
  };
  tahunAnggaran: number;
  unitPengusul: string;
};

const inputClass =
  "h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#08783f] focus:ring-2 focus:ring-emerald-100";
const labelClass = "text-xs font-black uppercase tracking-wide text-slate-500";

function methodLabel(value: string) {
  const labels: Record<string, string> = {
    TENDER: "Tender",
    NON_TENDER: "Non Tender",
    E_PURCHASING: "E-Purchasing",
    PENGADAAN_LANGSUNG: "Pengadaan Langsung",
    SWAKELOLA: "Swakelola",
  };

  return labels[value] ?? value;
}

function statusClass(status: ImportRow["status"]) {
  if (status === "valid") return "bg-emerald-100 text-[#08783f]";
  if (status === "duplicate") return "bg-amber-100 text-amber-700";

  return "bg-red-100 text-red-700";
}

function statusLabel(status: ImportRow["status"]) {
  if (status === "valid") return "Siap import";
  if (status === "duplicate") return "Sudah ada";

  return "Tidak valid";
}

export default function ImportRupModalButton() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [tahunAnggaran, setTahunAnggaran] = useState(
    String(new Date().getFullYear()),
  );
  const [unitPengusul, setUnitPengusul] = useState("");
  const [preview, setPreview] = useState<PreviewPayload | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const validRows = useMemo(
    () => preview?.rows.filter((row) => row.status === "valid") ?? [],
    [preview],
  );

  function close() {
    if (isPreviewing || isImporting) return;

    setIsOpen(false);
  }

  function resetPreview() {
    setPreview(null);
    setMessage("");
    setError("");
  }

  async function handlePreview(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsPreviewing(true);
    setError("");
    setMessage("");
    setPreview(null);

    if (!file) {
      setError("Pilih file PDF SiRUP LKPP atau Excel RUP.");
      setIsPreviewing(false);
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("tahunAnggaran", tahunAnggaran);
    formData.append("unitPengusul", unitPengusul);

    const response = await fetch("/api/rup/import/preview", {
      method: "POST",
      body: formData,
    });
    const result = await response.json().catch(() => null);
    setIsPreviewing(false);

    if (!response.ok) {
      setError(result?.message ?? "File import gagal diproses.");
      return;
    }

    setPreview(result.data);
    setMessage(result.message ?? "Preview import RUP berhasil dibuat.");
  }

  async function handleImport() {
    if (!preview || validRows.length === 0) return;

    setIsImporting(true);
    setError("");
    setMessage("");

    const response = await fetch("/api/rup/import/commit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tahunAnggaran: preview.tahunAnggaran,
        unitPengusul: preview.unitPengusul,
        rows: validRows.map((row) => ({
          kodeRup: row.kodeRup,
          namaPaket: row.namaPaket,
          kegiatan: row.kegiatan,
          sumberDana: row.sumberDana,
          lokasiPaket: row.lokasiPaket,
          metodePengadaan: row.metodePengadaan,
          pagu: row.pagu,
        })),
      }),
    });
    const result = await response.json().catch(() => null);
    setIsImporting(false);

    if (!response.ok) {
      setError(result?.message ?? "Data RUP gagal diimport.");
      return;
    }

    setMessage(
      `${result.message} Berhasil: ${result.data?.created ?? 0}, dilewati: ${
        result.data?.skipped ?? 0
      }.`,
    );
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#08783f] px-4 text-sm font-black text-white transition hover:bg-[#066532]"
      >
        <FileUp className="h-4 w-4" strokeWidth={2.5} />
        Import RUP
      </button>

      <ModalShell
        isOpen={isOpen}
        onClose={close}
        eyebrow="SIRUP / RUP"
        title="Import RUP"
        maxWidthClassName="max-w-6xl"
      >
        <form onSubmit={handlePreview} className="grid gap-4 md:grid-cols-3">
          <label className="grid gap-2">
            <span className={labelClass}>File PDF / Excel</span>
            <input
              type="file"
              accept=".pdf,.xls,.xlsx,application/pdf"
              required
              className={inputClass}
              onChange={(event) => {
                setFile(event.target.files?.[0] ?? null);
                resetPreview();
              }}
            />
          </label>

          <label className="grid gap-2">
            <span className={labelClass}>Tahun Anggaran</span>
            <input
              type="number"
              min="2000"
              required
              className={inputClass}
              value={tahunAnggaran}
              onChange={(event) => {
                setTahunAnggaran(event.target.value);
                resetPreview();
              }}
            />
          </label>

          <label className="grid gap-2">
            <span className={labelClass}>Unit Pengusul</span>
            <input
              required
              className={inputClass}
              value={unitPengusul}
              onChange={(event) => {
                setUnitPengusul(event.target.value);
                resetPreview();
              }}
              placeholder="Contoh: Uptd Laboratorium Kesehatan"
            />
          </label>

          <div className="md:col-span-3">
            <button
              type="submit"
              disabled={isPreviewing}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#08783f] bg-white px-4 text-sm font-black text-[#08783f] transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Upload className="h-4 w-4" strokeWidth={2.5} />
              {isPreviewing ? "Memproses" : "Preview Import"}
            </button>
          </div>
        </form>

        {error ? (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        ) : null}

        {message ? (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-[#08783f]">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            {message}
          </div>
        ) : null}

        {preview ? (
          <div className="mt-5 overflow-hidden rounded-lg border border-slate-200">
            <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-black text-slate-900">
                  Preview Data RUP
                </p>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  Total {preview.summary.total} baris, siap import{" "}
                  {preview.summary.valid}, duplikat {preview.summary.duplicate},
                  tidak valid {preview.summary.invalid}.
                </p>
              </div>
              <button
                type="button"
                onClick={handleImport}
                disabled={validRows.length === 0 || isImporting}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#08783f] px-4 text-sm font-black text-white transition hover:bg-[#066532] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <CheckCircle2 className="h-4 w-4" strokeWidth={2.5} />
                {isImporting ? "Mengimport" : "Import ke RUP"}
              </button>
            </div>

            <div className="max-h-[52vh] overflow-auto">
              <table className="min-w-[1180px] w-full border-collapse text-left text-sm">
                <thead className="sticky top-0 bg-white">
                  <tr className="border-b border-slate-200 text-xs font-black uppercase text-slate-400">
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Kode RUP</th>
                    <th className="px-4 py-3">Nama Paket</th>
                    <th className="px-4 py-3">Kegiatan</th>
                    <th className="px-4 py-3">Sumber Dana</th>
                    <th className="px-4 py-3">Lokasi</th>
                    <th className="px-4 py-3">Pemilihan Penyedia</th>
                    <th className="px-4 py-3">Pagu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {preview.rows.map((row) => (
                    <tr key={`${row.rowNumber}-${row.kodeRup}`}>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${statusClass(
                            row.status,
                          )}`}
                        >
                          {statusLabel(row.status)}
                        </span>
                        {row.errors.length > 0 ? (
                          <p className="mt-1 text-xs font-semibold text-red-600">
                            {row.errors.join(" ")}
                          </p>
                        ) : null}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-xs font-bold text-slate-500">
                        {row.kodeRup}
                      </td>
                      <td className="max-w-[260px] px-4 py-3 font-black text-[#16227c]">
                        {row.namaPaket}
                      </td>
                      <td className="max-w-[260px] px-4 py-3 font-semibold text-slate-600">
                        {row.kegiatan || "-"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-semibold text-slate-600">
                        {row.sumberDana || "-"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-semibold text-slate-600">
                        {row.lokasiPaket || "-"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-semibold text-slate-600">
                        {methodLabel(row.metodePengadaan)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-semibold text-slate-600">
                        {formatCurrency(row.pagu)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </ModalShell>
    </>
  );
}
