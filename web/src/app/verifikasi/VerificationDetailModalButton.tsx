"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, FileSearch, RotateCcw } from "lucide-react";
import ModalShell from "@/components/modal/ModalShell";
import {
  PlanningDetailContent,
  type PlanningProposalDetail,
} from "@/app/perencanaan/PlanningDetailModalButton";

type HistoryItem = {
  id: string;
  action: string;
  actorName: string;
  createdAt: string;
  note: string | null;
};

type VerificationDetail = PlanningProposalDetail & {
  id: string;
  canVerify: boolean;
  verificationHistory: HistoryItem[];
  verificationNote: string | null;
};

function valueOrDash(value?: string | number | null) {
  return value === null || value === undefined || value === "" ? "-" : String(value);
}

type VerificationDetailModalButtonProps = {
  proposalId: string;
};

export default function VerificationDetailModalButton({
  proposalId,
}: VerificationDetailModalButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isRevisionOpen, setIsRevisionOpen] = useState(false);
  const [detail, setDetail] = useState<VerificationDetail | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState(false);
  const revisionNoteValid = useMemo(() => note.trim().length >= 5, [note]);

  async function openDetail() {
    if (loading) return;

    setIsOpen(true);
    setLoading(true);
    setError("");
    setDetail(null);

    const response = await fetch(`/api/verifikasi/${proposalId}`);
    const payload = await response.json().catch(() => null);
    setLoading(false);

    if (!response.ok) {
      setError(payload?.message ?? "Gagal memuat detail pengajuan.");
      return;
    }

    const loaded = payload?.data as VerificationDetail;
    setDetail(loaded);
    setNote(loaded.verificationNote ?? loaded.revisionNote ?? "");
  }

  function closeDetail() {
    setIsOpen(false);
    setIsApproveOpen(false);
    setIsRevisionOpen(false);
    setDetail(null);
    setNote("");
    setError("");
  }

  async function submit(action: "approve" | "request_revision") {
    if (action === "request_revision" && note.trim().length < 5) {
      setError("Catatan revisi wajib diisi.");
      return;
    }

    setPending(true);
    setError("");

    const response = await fetch(`/api/verifikasi/${proposalId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, note: note.trim() || undefined }),
    });
    const payload = await response.json().catch(() => null);
    setPending(false);

    if (!response.ok) {
      setError(payload?.message ?? "Gagal memproses usulan.");
      return;
    }

    const refreshed = await fetch(`/api/verifikasi/${proposalId}`);
    const refreshedPayload = await refreshed.json().catch(() => null);
    if (refreshed.ok && refreshedPayload?.data) {
      setDetail(refreshedPayload.data as VerificationDetail);
    }
    setIsApproveOpen(false);
    setIsRevisionOpen(false);
    router.refresh();
  }

  const status = detail?.statusUsulan;
  const canAct = Boolean(detail?.canVerify && status === "DIAJUKAN");

  return (
    <>
      <button
        type="button"
        disabled={loading}
        onClick={openDetail}
        className="inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-emerald-200 bg-white px-4 text-sm font-black text-[#08783f] transition hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-[#08783f] focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-55"
      >
        <FileSearch className="h-4 w-4" strokeWidth={2.4} aria-hidden="true" />
        Detail Pengajuan
      </button>

      <ModalShell
        isOpen={isOpen}
        onClose={closeDetail}
        eyebrow="Detail Pengajuan"
        title={detail ? detail.kodeRup : "Memuat pengajuan"}
        maxWidthClassName="max-w-7xl"
      >
        {loading ? (
          <div className="grid gap-3">
            <div className="h-24 animate-pulse rounded-lg bg-slate-100" />
            <div className="h-40 animate-pulse rounded-lg bg-slate-100" />
            <div className="h-32 animate-pulse rounded-lg bg-slate-100" />
          </div>
        ) : null}

        {!loading && error && !detail ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
            {error}
          </div>
        ) : null}

        {detail ? (
          <PlanningDetailContent
            proposal={detail}
            verificationAction={
              <section className="rounded-lg border border-slate-200 bg-white p-4">
                {canAct ? (
                  <>
                    <label className="grid gap-2">
                      <span className="text-xs font-black uppercase tracking-wide text-slate-500">
                        Catatan Verifikasi / Revisi
                      </span>
                      <textarea
                        value={note}
                        onChange={(event) => setNote(event.target.value)}
                        className="min-h-28 rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#08783f] focus:ring-2 focus:ring-emerald-100"
                        placeholder="Tambahkan catatan hasil pemeriksaan atau alasan revisi..."
                      />
                    </label>
                    {error ? (
                      <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-700">
                        {error}
                      </p>
                    ) : null}
                    {!revisionNoteValid ? (
                      <p className="mt-3 text-xs font-bold text-slate-500">
                        Catatan minimal 5 karakter diperlukan untuk minta revisi.
                      </p>
                    ) : null}
                    <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                      <button
                        type="button"
                        disabled={pending || !revisionNoteValid}
                        onClick={() => setIsRevisionOpen(true)}
                        className="inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-orange-200 bg-orange-50 px-4 text-sm font-black text-orange-700 transition hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <RotateCcw className="h-4 w-4" />
                        Minta Revisi
                      </button>
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => setIsApproveOpen(true)}
                        className="inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-[#08783f] px-4 text-sm font-black text-white transition hover:bg-[#066532] disabled:cursor-not-allowed disabled:bg-slate-300"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Setujui Usulan
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-600">
                    {detail.statusUsulan === "PERLU_REVISI"
                      ? `Usulan sedang dalam status revisi. Catatan: ${valueOrDash(detail.revisionNote)}`
                      : detail.statusUsulan === "SIAP_RUP" || detail.statusUsulan === "RUP_TAYANG"
                        ? `Usulan telah disetujui Kepala Unit. Diverifikasi oleh: ${valueOrDash(detail.verifiedBy)}`
                        : "Aksi verifikasi tidak tersedia untuk status atau peran saat ini."}
                  </div>
                )}
              </section>
            }
          />
        ) : null}
      </ModalShell>

      <ModalShell
        isOpen={isApproveOpen}
        onClose={() => setIsApproveOpen(false)}
        eyebrow="Setujui Usulan"
        title="Setujui usulan ini?"
        maxWidthClassName="max-w-lg"
      >
        <p className="text-sm font-semibold leading-6 text-slate-600">
          Usulan yang disetujui akan masuk ke status Siap RUP.
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
            onClick={() => submit("approve")}
            className="h-10 rounded-lg bg-[#08783f] px-4 text-sm font-black text-white disabled:bg-slate-300"
          >
            Setujui
          </button>
        </div>
      </ModalShell>

      <ModalShell
        isOpen={isRevisionOpen}
        onClose={() => setIsRevisionOpen(false)}
        eyebrow="Minta Revisi"
        title="Minta revisi usulan?"
        maxWidthClassName="max-w-lg"
      >
        <p className="text-sm font-semibold leading-6 text-slate-600">
          Usulan akan dikembalikan ke pengusul untuk diperbaiki.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setIsRevisionOpen(false)}
            className="h-10 rounded-lg border border-slate-300 px-4 text-sm font-black text-slate-600"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={pending || !revisionNoteValid}
            onClick={() => submit("request_revision")}
            className="h-10 rounded-lg bg-orange-600 px-4 text-sm font-black text-white disabled:bg-slate-300"
          >
            Kirim Revisi
          </button>
        </div>
      </ModalShell>
    </>
  );
}
