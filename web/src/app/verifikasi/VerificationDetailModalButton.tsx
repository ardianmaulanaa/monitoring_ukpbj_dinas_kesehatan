"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, FileSearch, RotateCcw } from "lucide-react";
import ModalShell from "@/components/modal/ModalShell";
import {
  DetailField,
  DetailHorizontalSection,
  DetailInfoCard,
  DetailModalHeader,
  DetailStatusBadge,
} from "@/components/detail/DetailHorizontalSection";
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
          <div className="grid gap-4">
            <DetailModalHeader
              code={detail.kodeRup}
              title={detail.namaPaket}
              badge={
                <DetailStatusBadge
                  className={
                    planningStatusStyles[detail.statusUsulan] ??
                    "bg-slate-100 text-slate-600 ring-slate-200"
                  }
                >
                  {planningStatusLabels[detail.statusUsulan] ?? detail.statusUsulan}
                </DetailStatusBadge>
              }
              items={[
                { label: "Unit Pengusul", value: detail.unitPengusul },
                { label: "Tahun Anggaran", value: `TA ${detail.tahunAnggaran}` },
                { label: "Pagu", value: money(totalEstimasi) },
                { label: "Metode", value: "-" },
                { label: "Tanggal Pengajuan", value: dateTime(detail.submittedAt) },
              ]}
            />

            <DetailHorizontalSection>
              <DetailInfoCard title="Identitas Usulan">
                <DetailField label="Kode Usulan" value={detail.kodeRup} />
                <DetailField
                  label="Status"
                  value={planningStatusLabels[detail.statusUsulan] ?? detail.statusUsulan}
                />
                <DetailField label="Unit Pengusul" value={detail.unitPengusul} />
                <DetailField label="Unit / Bidang" value={detail.unitBidang} />
                <DetailField label="PPK / PPTK" value={null} />
                <DetailField label="Kontak Penanggung Jawab" value={null} />
                <DetailField label="Tanggal Pengajuan" value={dateTime(detail.submittedAt)} />
              </DetailInfoCard>

              <DetailInfoCard title="Program & Anggaran">
                <DetailField label="Program" value={detail.program} />
                <DetailField label="Kegiatan" value={detail.kegiatan} />
                <DetailField label="Sub Kegiatan" value={detail.subKegiatan} />
                <DetailField label="Kode Rekening" value={detail.kodeRekening} />
                <DetailField label="Sumber Dana" value={detail.sumberDana} />
                <DetailField
                  label="Pagu"
                  value={money(totalEstimasi)}
                  valueClassName="whitespace-nowrap"
                />
                <DetailField label="Tahun Anggaran" value={`TA ${detail.tahunAnggaran}`} />
              </DetailInfoCard>

              <DetailInfoCard title="Kebutuhan">
                <DetailField label="Uraian Belanja" value={detail.namaPaket} />
                <DetailField label="Uraian Kebutuhan" value={detail.uraianKebutuhan} />
                <DetailField label="Jenis Belanja" value={null} />
                <DetailField
                  label="Volume / Satuan"
                  value={`${valueOrDash(
                    detail.jumlahKebutuhan ?? detail.volumeKebutuhan,
                  )} ${detail.satuanKebutuhan ?? ""}`}
                />
                <DetailField label="Prioritas" value={detail.prioritas} />
                <DetailField label="Waktu Kebutuhan" value={null} />
                <DetailField label="Output yang Diharapkan" value={detail.justifikasi} />
                <DetailField label="Spesifikasi Awal" value={detail.spesifikasiAwal} />
              </DetailInfoCard>

              <DetailInfoCard title="Jadwal & RUP/SIRUP">
                <DetailField label="ID RUP SIRUP" value={null} />
                <DetailField label="Link SIRUP" value={null} />
                <DetailField label="Tanggal Input SIRUP" value={null} />
                <DetailField label="Tanggal Tayang SIRUP" value={null} />
                <DetailField label="Jadwal Pemilihan" value={null} />
                <DetailField label="Jadwal Rencana" value={null} />
                <DetailField label="Cara Pengadaan" value={null} />
                <DetailField label="Metode Pengadaan" value={null} />
              </DetailInfoCard>

              <DetailInfoCard title="E-Purchasing / Katalog">
                <DetailField label="Jenis Katalog" value={null} />
                <DetailField label="Etalase Katalog" value={null} />
                <DetailField label="Nama Produk Katalog" value={null} />
                <DetailField label="Merek / Tipe" value={null} />
                <DetailField label="Harga Satuan Tayang" value={null} />
                <DetailField label="Total Harga Tayang" value={null} />
                <DetailField label="Penyedia Katalog" value={null} />
                <DetailField label="Status Negosiasi" value={null} />
                <DetailField label="Harga Negosiasi" value={null} />
                <DetailField label="Nomor Surat Pesanan" value={null} />
                <DetailField label="Tanggal Surat Pesanan" value={null} />
                <DetailField label="Status Transaksi Katalog" value={null} />
              </DetailInfoCard>

              <DetailInfoCard title="Dokumen">
                <DetailField label="Status KAK" value={detail.statusKak ?? "BELUM ADA"} />
                <DetailField label="Status HPS" value={detail.statusHps ?? "BELUM ADA"} />
                <DetailField
                  label="Status Rancangan Kontrak"
                  value={detail.statusRancanganKontrak ?? "BELUM ADA"}
                />
                <DetailField
                  label="Status Dokumen Pendukung"
                  value={detail.statusDokumenPendukung ?? "BELUM ADA"}
                />
                <DetailField label="Kekurangan Dokumen" value={null} />
              </DetailInfoCard>

              <DetailInfoCard title="Catatan & Tindak Lanjut">
                <DetailField label="Kendala" value={detail.catatan} />
                <DetailField label="Tindak Lanjut" value={null} />
                <DetailField label="PIC Tindak Lanjut" value={null} />
                <DetailField
                  label="Catatan / Revisi"
                  value={detail.revisionNote || detail.verificationNote || detail.catatan}
                />
                <DetailField label="Catatan E-Purchasing" value={null} />
              </DetailInfoCard>
            </DetailHorizontalSection>

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
