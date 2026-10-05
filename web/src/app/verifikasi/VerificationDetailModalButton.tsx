"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, FileSearch, RotateCcw } from "lucide-react";
import ModalShell from "@/components/modal/ModalShell";
import { formatCurrency } from "@/lib/currency";
import { planningStatusLabels, planningStatusStyles } from "@/lib/planning-workflow";

type HistoryItem = {
  id: string;
  action: string;
  actorName: string;
  createdAt: string;
  note: string | null;
};

type VerificationDetail = {
  id: string;
  canVerify: boolean;
  catatan: string | null;
  createdAt: string;
  estimasiHargaSatuan: string | number | null;
  jumlahKebutuhan: string | number | null;
  justifikasi: string | null;
  kegiatan: string | null;
  kodeRekening: string | null;
  kodeRup: string;
  namaPaket: string;
  pagu: string | number;
  prioritas: string | null;
  program: string | null;
  revisionAt: string | null;
  revisionBy: string | null;
  revisionNote: string | null;
  satuanKebutuhan: string | null;
  spesifikasiAwal: string | null;
  statusDokumenPendukung: string | null;
  statusHps: string | null;
  statusKak: string | null;
  statusRancanganKontrak: string | null;
  statusUsulan: "DIAJUKAN" | "PERLU_REVISI" | "SIAP_RUP" | "RUP_TAYANG" | "DRAFT";
  subKegiatan: string | null;
  submittedAt: string | null;
  sumberDana: string;
  tahunAnggaran: number;
  totalEstimasi: string | number | null;
  unitBidang: string | null;
  unitPengusul: string;
  uraianKebutuhan: string | null;
  verifiedAt: string | null;
  verifiedBy: string | null;
  verificationHistory: HistoryItem[];
  verificationNote: string | null;
  volumeKebutuhan: string | null;
};

function valueOrDash(value?: string | number | null) {
  return value === null || value === undefined || value === "" ? "-" : String(value);
}

function dateTime(value?: string | null) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function money(value?: string | number | null) {
  return formatCurrency(String(value ?? 0));
}

function DetailRow({
  label,
  value,
  wide = false,
}: {
  label: string;
  value?: string | number | null;
  wide?: boolean;
}) {
  return (
    <div className={`rounded-lg bg-slate-50 p-3 ${wide ? "md:col-span-2" : ""}`}>
      <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-1 whitespace-pre-wrap break-words text-sm font-bold text-slate-700">
        {valueOrDash(value)}
      </p>
    </div>
  );
}

function Section({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-black uppercase tracking-wide text-[#16227c]">
        {title}
      </h3>
      <div className="mt-3 grid gap-3 md:grid-cols-2">{children}</div>
    </section>
  );
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
  const [detail, setDetail] = useState<VerificationDetail | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState(false);

  const totalEstimasi = useMemo(
    () => detail?.totalEstimasi ?? detail?.pagu ?? 0,
    [detail],
  );

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
        maxWidthClassName="max-w-6xl"
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
          <div className="grid gap-4">
            <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="font-mono text-xs font-black uppercase tracking-wide text-slate-400">
                  {detail.kodeRup}
                </p>
                <h2 className="mt-1 break-words text-xl font-black text-[#16227c]">
                  {detail.namaPaket}
                </h2>
              </div>
              <span
                className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-black ${
                  planningStatusStyles[detail.statusUsulan] ??
                  "bg-slate-100 text-slate-600"
                }`}
              >
                {planningStatusLabels[detail.statusUsulan] ?? detail.statusUsulan}
              </span>
            </div>

            <Section title="Informasi Pengajuan">
              <DetailRow label="Kode Usulan" value={detail.kodeRup} />
              <DetailRow label="Tahun Anggaran" value={detail.tahunAnggaran} />
              <DetailRow label="Unit Pengusul" value={detail.unitPengusul} />
              <DetailRow label="Unit / Bidang" value={detail.unitBidang} />
              <DetailRow label="Tanggal Pengajuan" value={dateTime(detail.submittedAt)} />
              <DetailRow label="Prioritas" value={detail.prioritas} />
            </Section>

            <Section title="Data Anggaran">
              <DetailRow label="Program" value={detail.program} />
              <DetailRow label="Kegiatan" value={detail.kegiatan} />
              <DetailRow label="Sub Kegiatan" value={detail.subKegiatan} />
              <DetailRow label="Kode Rekening" value={detail.kodeRekening} />
              <DetailRow label="Sumber Dana" value={detail.sumberDana} />
              <DetailRow label="Pagu / Total Estimasi" value={money(totalEstimasi)} />
            </Section>

            <Section title="Data Kebutuhan">
              <DetailRow label="Nama / Uraian" value={detail.namaPaket} />
              <DetailRow
                label="Jumlah"
                value={`${valueOrDash(detail.jumlahKebutuhan ?? detail.volumeKebutuhan)} ${detail.satuanKebutuhan ?? ""}`}
              />
              <DetailRow
                label="Estimasi Harga Satuan"
                value={money(detail.estimasiHargaSatuan)}
              />
              <DetailRow label="Total Estimasi" value={money(totalEstimasi)} />
              <DetailRow label="Spesifikasi Awal" value={detail.spesifikasiAwal} wide />
              <DetailRow label="Justifikasi" value={detail.justifikasi} wide />
            </Section>

            <Section title="Dokumen Pendukung">
              <DetailRow label="KAK / Spesifikasi" value={detail.statusKak ?? "BELUM ADA"} />
              <DetailRow label="HPS" value={detail.statusHps ?? "BELUM ADA"} />
              <DetailRow
                label="Rancangan Kontrak"
                value={detail.statusRancanganKontrak ?? "BELUM ADA"}
              />
              <DetailRow
                label="Dokumen Pendukung"
                value={detail.statusDokumenPendukung ?? "BELUM ADA"}
              />
            </Section>

            {detail.statusUsulan === "PERLU_REVISI" ? (
              <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
                <p className="text-xs font-black uppercase text-orange-700">
                  Catatan Revisi
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm font-bold text-orange-800">
                  {valueOrDash(detail.revisionNote)}
                </p>
              </div>
            ) : null}

            {detail.statusUsulan === "SIAP_RUP" || detail.statusUsulan === "RUP_TAYANG" ? (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                <p className="flex items-center gap-2 text-sm font-black text-emerald-800">
                  <CheckCircle2 className="h-4 w-4" />
                  Usulan sudah disetujui Kepala Unit.
                </p>
                <p className="mt-2 text-sm font-bold text-emerald-800">
                  Diverifikasi oleh: {valueOrDash(detail.verifiedBy)} •{" "}
                  {dateTime(detail.verifiedAt)}
                </p>
                {detail.verificationNote ? (
                  <p className="mt-2 whitespace-pre-wrap text-sm font-semibold text-emerald-800">
                    Catatan: {detail.verificationNote}
                  </p>
                ) : null}
              </div>
            ) : null}

            <section className="rounded-lg border border-slate-200 bg-white p-4">
              <label className="grid gap-2">
                <span className="text-xs font-black uppercase tracking-wide text-slate-500">
                  Catatan Verifikasi
                </span>
                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  disabled={!canAct}
                  className="min-h-28 rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#08783f] focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-100"
                  placeholder="Tambahkan catatan hasil pemeriksaan jika diperlukan..."
                />
              </label>
              {error ? (
                <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-700">
                  {error}
                </p>
              ) : null}
            </section>

            {detail.verificationHistory.length > 0 ? (
              <section className="rounded-lg border border-slate-200 bg-white p-4">
                <h3 className="text-sm font-black uppercase tracking-wide text-[#16227c]">
                  Riwayat Aktivitas
                </h3>
                <div className="mt-3 grid gap-2">
                  {detail.verificationHistory.map((history) => (
                    <div key={history.id} className="rounded-lg bg-slate-50 p-3">
                      <p className="text-sm font-black text-slate-800">
                        {history.action.replaceAll("_", " ")}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        {dateTime(history.createdAt)} oleh {history.actorName}
                      </p>
                      {history.note ? (
                        <p className="mt-2 whitespace-pre-wrap text-sm font-semibold text-slate-700">
                          Catatan: {history.note}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            <div className="mt-1 flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeDetail}
                className="h-10 whitespace-nowrap rounded-lg border border-slate-300 bg-white px-4 text-sm font-black text-slate-600 transition hover:bg-slate-50"
              >
                Tutup
              </button>
              {canAct ? (
                <>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => submit("request_revision")}
                    className="inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-orange-200 bg-orange-50 px-4 text-sm font-black text-orange-700 transition hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Minta Revisi
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => setIsApproveOpen(true)}
                    className="inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-[#08783f] px-4 text-sm font-black text-white transition hover:bg-[#066532] disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Setujui Usulan
                  </button>
                </>
              ) : null}
            </div>
          </div>
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
    </>
  );
}
