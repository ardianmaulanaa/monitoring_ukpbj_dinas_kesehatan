"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, RotateCcw } from "lucide-react";
import ModalShell from "@/components/modal/ModalShell";

type VerificationActionPanelProps = {
  canVerify: boolean;
  proposalId: string;
  status: string;
};

export default function VerificationActionPanel({
  canVerify,
  proposalId,
  status,
}: VerificationActionPanelProps) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const canAct = canVerify && status === "DIAJUKAN";

  async function submitVerification(
    payload:
      | { action: "approve"; note?: string }
      | { action: "request_revision"; note: string },
  ) {
    setPending(true);
    setMessage("");

    const response = await fetch(`/api/verifikasi/${proposalId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json().catch(() => null);
    setPending(false);

    if (!response.ok) {
      const detail = Array.isArray(result?.errors)
        ? result.errors.map((item: { message?: string }) => item.message).join(" ")
        : "";
      setMessage(result?.message ?? detail ?? "Gagal memproses usulan.");
      return;
    }

    router.push("/verifikasi");
    router.refresh();
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <p className="text-xs font-black uppercase text-[#08783f]">
          Verifikasi Kepala Unit
        </p>
        <h2 className="mt-1 text-lg font-black text-[#16227c]">
          Catatan Verifikasi
        </h2>
        <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
          Tambahkan catatan hasil pemeriksaan jika diperlukan. Catatan wajib
          diisi ketika meminta revisi.
        </p>
      </div>

      <label className="mt-4 grid gap-2">
        <span className="text-xs font-black uppercase tracking-wide text-slate-500">
          Catatan Verifikasi
        </span>
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          disabled={!canAct}
          className="min-h-28 rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#08783f] focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-100"
          placeholder="Tambahkan catatan hasil verifikasi jika diperlukan..."
        />
      </label>

      {message ? (
        <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-700">
          {message}
        </p>
      ) : null}

      <div className="mt-5 flex flex-col-reverse gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={() => router.push("/verifikasi")}
          className="h-11 rounded-lg border border-slate-300 bg-white px-4 text-sm font-black text-slate-600 transition hover:bg-slate-50"
        >
          Kembali
        </button>
        <button
          type="button"
          disabled={!canAct || pending}
          onClick={() => {
            if (note.trim().length < 5) {
              setMessage("Catatan revisi wajib diisi.");
              return;
            }
            submitVerification({ action: "request_revision", note });
          }}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-4 text-sm font-black text-orange-700 transition hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RotateCcw className="h-4 w-4" />
          Minta Revisi
        </button>
        <button
          type="button"
          disabled={!canAct || pending}
          onClick={() => setIsApproveOpen(true)}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#08783f] px-4 text-sm font-black text-white transition hover:bg-[#066532] disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          <CheckCircle2 className="h-4 w-4" />
          Setujui Usulan
        </button>
      </div>

      <ModalShell
        isOpen={isApproveOpen}
        onClose={() => setIsApproveOpen(false)}
        eyebrow="Setujui Usulan"
        title="Setujui Usulan"
      >
        <p className="text-sm font-semibold leading-6 text-slate-600">
          Pastikan seluruh data telah diperiksa. Setelah disetujui, usulan akan
          masuk ke daftar Siap RUP.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setIsApproveOpen(false)}
            className="h-10 rounded-lg border border-slate-300 px-4 text-sm font-black text-slate-600"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              submitVerification({
                action: "approve",
                note,
              })
            }
            className="h-10 rounded-lg bg-[#08783f] px-4 text-sm font-black text-white disabled:bg-slate-300"
          >
            Setujui Usulan
          </button>
        </div>
      </ModalShell>
    </div>
  );
}
