"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  Banknote,
  Building2,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  FileCheck2,
  FileSearch,
  History,
  LayoutDashboard,
  RotateCcw,
} from "lucide-react";
import ModalShell from "@/components/modal/ModalShell";
import {
  DetailField,
  DetailModalHeader,
  DetailStatusBadge,
} from "@/components/detail/DetailHorizontalSection";
import { formatCurrency } from "@/lib/currency";
import {
  isDraftStatus,
  isReadyRupStatus,
  isRevisionStatus,
  isRupPublishedStatus,
  planningStatusLabels,
  planningStatusStyles,
} from "@/lib/planning-workflow";

type PlanningProposalDetail = {
  catatan: string | null;
  createdAt: string | null;
  id: string;
  caraPengadaan: string | null;
  estimasiHargaSatuan: string | null;
  idRupSirup: string | null;
  jadwalPemilihan: string | null;
  jadwalMulaiRencana: string | null;
  jadwalSelesaiRencana: string | null;
  jumlahKebutuhan: string | null;
  justifikasi: string | null;
  kekuranganDokumen: string | null;
  kodeRekening: string | null;
  kodeRup: string;
  kontakPenanggungJawab: string | null;
  kegiatan: string | null;
  kendala: string | null;
  jenisBelanja: string | null;
  linkSirup: string | null;
  lokasiPaket: string | null;
  metodePengadaan: string;
  namaPaket: string;
  outputDiharapkan: string | null;
  pagu: string;
  picTindakLanjut: string | null;
  prioritas: string | null;
  program: string | null;
  revisionAt: string | null;
  revisionBy: string | null;
  revisionNote: string | null;
  satuanKebutuhan: string | null;
  submittedAt: string | null;
  sumberDana: string;
  spesifikasiAwal: string | null;
  statusDokumenPendukung: string | null;
  statusHps: string | null;
  statusKak: string | null;
  statusRancanganKontrak: string | null;
  statusSirup: string;
  statusUsulan: string;
  subKegiatan: string | null;
  tanggalInputSirup: string | null;
  tanggalTayangSirup: string | null;
  tahunAnggaran: number;
  tindakLanjut: string | null;
  totalEstimasi: string | null;
  updatedAt: string | null;
  uraianBelanja: string | null;
  uraianKebutuhan: string | null;
  unitBidang: string | null;
  unitPengusul: string;
  volumeKebutuhan: string | null;
  ppkPptk: string | null;
  verifiedAt: string | null;
  verifiedBy: string | null;
  waktuKebutuhan: string | null;
};

type PlanningDetailModalButtonProps = {
  proposal: PlanningProposalDetail;
};

type TabKey =
  | "overview"
  | "unit"
  | "budget"
  | "needs"
  | "schedule"
  | "documents"
  | "verification"
  | "history";

type ProgressTone = "done" | "active" | "pending" | "revision";

const tabs: { key: TabKey; label: string; icon: typeof ClipboardList }[] = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "unit", label: "Unit", icon: Building2 },
  { key: "budget", label: "Anggaran", icon: Banknote },
  { key: "needs", label: "Kebutuhan", icon: ClipboardList },
  { key: "schedule", label: "Jadwal", icon: CalendarDays },
  { key: "documents", label: "Dokumen", icon: FileCheck2 },
  { key: "verification", label: "Verifikasi", icon: ClipboardCheck },
  { key: "history", label: "Riwayat", icon: History },
];

function humanize(value: string) {
  return value
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function methodLabel(value: string) {
  const labels: Record<string, string> = {
    TENDER: "Tender",
    NON_TENDER: "Non Tender",
    E_PURCHASING: "E-Purchasing",
    PENGADAAN_LANGSUNG: "Pengadaan Langsung",
    SWAKELOLA: "Swakelola",
  };

  return labels[value] ?? humanize(value);
}

function dateLabel(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function dateTimeLabel(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function scheduleRange(start?: string | null, end?: string | null) {
  if (!start && !end) return "-";
  if (start && end) return `${dateLabel(start)} - ${dateLabel(end)}`;
  return dateLabel(start ?? end);
}

function statusLabel(value?: string | null) {
  if (!value) return "-";
  return planningStatusLabels[value] ?? humanize(value);
}

function documentStatusBadge(value?: string | null) {
  const normalized = (value ?? "").toUpperCase();
  const complete = ["ADA", "LENGKAP", "TERSEDIA", "SELESAI"].includes(normalized);
  const missing = ["BELUM", "BELUM_ADA", "TIDAK_ADA", "KURANG", "BELUM_LENGKAP"].includes(normalized);

  return (
    <DetailStatusBadge
      className={
        complete
          ? "bg-emerald-100 text-[#08783f] ring-emerald-200"
          : missing
            ? "bg-orange-100 text-orange-700 ring-orange-200"
            : "bg-blue-50 text-blue-700 ring-blue-200"
      }
    >
      {value ? humanize(value) : "-"}
    </DetailStatusBadge>
  );
}

function TabButton({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: typeof ClipboardList;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-9 items-center justify-center gap-2 rounded-lg border px-3 text-xs font-black transition ${
        active
          ? "border-[#08783f] bg-emerald-50 text-[#08783f]"
          : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-800"
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

function FieldGrid({ children }: { children: ReactNode }) {
  return <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{children}</section>;
}

function ContentPanel({ children }: { children: ReactNode }) {
  return <div className="min-w-0">{children}</div>;
}

function ProgressCard({
  helper,
  label,
  tone,
}: {
  helper?: string;
  label: string;
  tone: ProgressTone;
}) {
  const className =
    tone === "done"
      ? "border-emerald-200 bg-emerald-50 text-[#08783f]"
      : tone === "active"
        ? "border-blue-200 bg-blue-50 text-blue-700"
        : tone === "revision"
          ? "border-amber-200 bg-amber-50 text-amber-700"
          : "border-slate-200 bg-slate-50 text-slate-400";
  const marker = tone === "done" ? "✓" : tone === "active" ? "●" : tone === "revision" ? "!" : "○";

  return (
    <div className={`rounded-lg border px-3 py-2 ${className}`}>
      <div className="flex items-center gap-2 text-sm font-black">
        <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-xs">
          {marker}
        </span>
        <span className="min-w-0 break-words">{label}</span>
      </div>
      {helper ? <p className="mt-2 text-xs font-semibold leading-5 opacity-80">{helper}</p> : null}
    </div>
  );
}

function getPlanningProgress(status: string) {
  const revision = isRevisionStatus(status);
  const ready = isReadyRupStatus(status) || isRupPublishedStatus(status);
  const submitted = status === "DIAJUKAN" || revision || ready;

  return [
    {
      helper: "Usulan dibuat operator.",
      label: "Draft Usulan",
      tone: isDraftStatus(status) ? "active" : "done",
    },
    {
      helper: submitted ? "Usulan sudah dikirim ke Kepala Unit." : "Belum diajukan.",
      label: "Diajukan",
      tone: submitted ? "done" : "pending",
    },
    {
      helper: revision
        ? "Usulan dikembalikan untuk diperbaiki."
        : ready
          ? "Verifikasi Kepala Unit selesai."
          : status === "DIAJUKAN"
            ? "Menunggu verifikasi Kepala Unit."
            : "Menunggu pengajuan operator.",
      label: revision ? "Perlu Revisi" : "Verifikasi Kepala Unit",
      tone: revision ? "revision" : ready ? "done" : status === "DIAJUKAN" ? "active" : "pending",
    },
    {
      helper: isRupPublishedStatus(status)
        ? "Proses dilanjutkan ke SIRUP/RUP."
        : ready
          ? "Siap diproses pada modul SIRUP/RUP."
          : "Menunggu persetujuan Kepala Unit.",
      label: "Siap RUP",
      tone: ready ? "done" : "pending",
    },
  ] as const;
}

function VerificationSummary({ proposal }: { proposal: PlanningProposalDetail }) {
  const revision = isRevisionStatus(proposal.statusUsulan);
  const ready = isReadyRupStatus(proposal.statusUsulan) || isRupPublishedStatus(proposal.statusUsulan);
  const waiting = proposal.statusUsulan === "DIAJUKAN";

  if (revision) {
    return (
      <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
        <div className="flex items-center gap-2">
          <RotateCcw className="h-5 w-5 text-orange-700" />
          <p className="text-sm font-black text-orange-800">PERLU REVISI</p>
        </div>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
          Usulan dikembalikan oleh Kepala Unit untuk diperbaiki operator.
        </p>
      </div>
    );
  }

  if (ready) {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-[#08783f]" />
          <p className="text-sm font-black text-[#08783f]">DISETUJUI KEPALA UNIT</p>
        </div>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
          Usulan siap dilanjutkan ke modul SIRUP/RUP.
        </p>
      </div>
    );
  }

  if (waiting) {
    return (
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <p className="text-sm font-black text-blue-800">MENUNGGU VERIFIKASI KEPALA UNIT</p>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
          Approval Perencanaan hanya melalui Kepala Unit sebelum paket siap RUP.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <p className="text-sm font-black text-slate-700">DRAFT USULAN</p>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
        Usulan belum diajukan ke Kepala Unit.
      </p>
    </div>
  );
}

function HistoryPanel({ proposal }: { proposal: PlanningProposalDetail }) {
  const items = [
    proposal.createdAt
      ? {
          date: proposal.createdAt,
          description: "Usulan dibuat",
          icon: "+",
        }
      : null,
    proposal.updatedAt && proposal.updatedAt !== proposal.createdAt
      ? {
          date: proposal.updatedAt,
          description: "Draft / detail usulan diperbarui",
          icon: "✎",
        }
      : null,
    proposal.submittedAt
      ? {
          date: proposal.submittedAt,
          description: "Usulan diajukan untuk verifikasi Kepala Unit",
          icon: "●",
        }
      : null,
    proposal.revisionAt
      ? {
          date: proposal.revisionAt,
          description: `Usulan perlu revisi${proposal.revisionBy ? ` oleh ${proposal.revisionBy}` : ""}`,
          icon: "!",
        }
      : null,
    proposal.verifiedAt
      ? {
          date: proposal.verifiedAt,
          description: `Usulan disetujui Kepala Unit${proposal.verifiedBy ? ` oleh ${proposal.verifiedBy}` : ""}`,
          icon: "✓",
        }
      : null,
  ]
    .filter(Boolean)
    .sort((a, b) => new Date(b!.date).getTime() - new Date(a!.date).getTime());

  if (items.length === 0) {
    return <DetailField label="Riwayat" value="Belum ada riwayat proses." />;
  }

  return (
    <ol className="grid gap-3">
      {items.map((item) => (
        <li key={`${item!.date}-${item!.description}`} className="flex gap-3 rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3">
          <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-xs font-black text-[#08783f] ring-1 ring-slate-200">
            {item!.icon}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-black text-slate-800">{item!.description}</p>
            <p className="mt-1 text-xs font-bold text-slate-500">{dateTimeLabel(item!.date)}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export default function PlanningDetailModalButton({
  proposal,
}: PlanningDetailModalButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const progress = useMemo(
    () => getPlanningProgress(proposal.statusUsulan),
    [proposal.statusUsulan],
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-white px-4 text-sm font-black text-[#08783f] transition hover:bg-emerald-50"
      >
        <FileSearch className="h-4 w-4" strokeWidth={2.4} />
        Detail
      </button>

      <ModalShell
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        eyebrow="Perencanaan"
        title={proposal.namaPaket}
        maxWidthClassName="max-w-7xl"
      >
        <div className="grid gap-5">
          <DetailModalHeader
            code={proposal.kodeRup}
            title={proposal.namaPaket}
            badge={
              <DetailStatusBadge
                className={
                  planningStatusStyles[proposal.statusUsulan] ??
                  "bg-slate-100 text-slate-600 ring-slate-200"
                }
              >
                {statusLabel(proposal.statusUsulan)}
              </DetailStatusBadge>
            }
            items={[
              { label: "Unit Pengusul", value: proposal.unitPengusul },
              { label: "Tahun Anggaran", value: `TA ${proposal.tahunAnggaran}` },
              {
                label: "Pagu / Estimasi",
                value: formatCurrency(proposal.totalEstimasi ?? proposal.pagu),
              },
              { label: "Metode", value: methodLabel(proposal.metodePengadaan) },
              { label: "Sumber Dana", value: proposal.sumberDana },
            ]}
          />

          <div className="overflow-x-auto border-b border-slate-200 pb-2">
            <div className="flex min-w-max gap-2">
              {tabs.map((tab) => (
                <TabButton
                  key={tab.key}
                  active={activeTab === tab.key}
                  icon={tab.icon}
                  label={tab.label}
                  onClick={() => setActiveTab(tab.key)}
                />
              ))}
            </div>
          </div>

          {activeTab === "overview" ? (
            <ContentPanel>
              <FieldGrid>
                <DetailField label="Kode Usulan" value={proposal.kodeRup} />
                <DetailField label="Unit" value={proposal.unitPengusul} />
                <DetailField label="Tahun Anggaran" value={`TA ${proposal.tahunAnggaran}`} />
                <DetailField
                  label="Total Estimasi"
                  value={formatCurrency(proposal.totalEstimasi ?? proposal.pagu)}
                  valueClassName="whitespace-nowrap"
                />
                <DetailField label="Program" value={proposal.program} />
                <DetailField label="Kegiatan" value={proposal.kegiatan} />
                <DetailField label="Sub Kegiatan" value={proposal.subKegiatan} />
                <DetailField label="PPK / PPTK" value={proposal.ppkPptk} />
                <DetailField label="Sumber Dana" value={proposal.sumberDana} />
                <DetailField label="Metode Pengadaan" value={methodLabel(proposal.metodePengadaan)} />
                <DetailField label="Prioritas" value={proposal.prioritas} />
                <DetailField label="Status Saat Ini" value={statusLabel(proposal.statusUsulan)} />
              </FieldGrid>

              <section className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
                <p className="text-xs font-black uppercase tracking-wide text-[#08783f]">
                  Progress Perencanaan
                </p>
                <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  {progress.map((item) => (
                    <ProgressCard
                      key={item.label}
                      helper={item.helper}
                      label={item.label}
                      tone={item.tone}
                    />
                  ))}
                </div>
              </section>
            </ContentPanel>
          ) : null}

          {activeTab === "unit" ? (
            <ContentPanel>
              <FieldGrid>
                <DetailField label="Unit Pengusul / OPD" value={proposal.unitPengusul} />
                <DetailField label="Unit / Bidang" value={proposal.unitBidang} />
                <DetailField label="PPK / PPTK" value={proposal.ppkPptk} />
                <DetailField label="Kontak Penanggung Jawab" value={proposal.kontakPenanggungJawab} />
                <DetailField label="Kode Usulan" value={proposal.kodeRup} />
                <DetailField label="Tahun Anggaran" value={`TA ${proposal.tahunAnggaran}`} />
              </FieldGrid>
            </ContentPanel>
          ) : null}

          {activeTab === "budget" ? (
            <ContentPanel>
              <FieldGrid>
                <DetailField className="md:col-span-2" label="Program" value={proposal.program} />
                <DetailField className="md:col-span-2" label="Kegiatan" value={proposal.kegiatan} />
                <DetailField className="md:col-span-2" label="Sub Kegiatan" value={proposal.subKegiatan} />
                <DetailField label="Kode Rekening" value={proposal.kodeRekening} />
                <DetailField label="Sumber Dana" value={proposal.sumberDana} />
                <DetailField
                  label="Pagu"
                  value={formatCurrency(proposal.pagu)}
                  valueClassName="whitespace-nowrap"
                />
                <DetailField
                  label="Estimasi Harga Satuan"
                  value={
                    proposal.estimasiHargaSatuan
                      ? formatCurrency(proposal.estimasiHargaSatuan)
                      : "-"
                  }
                  valueClassName="whitespace-nowrap"
                />
                <DetailField
                  label="Total Estimasi"
                  value={formatCurrency(proposal.totalEstimasi ?? proposal.pagu)}
                  valueClassName="whitespace-nowrap"
                />
              </FieldGrid>
            </ContentPanel>
          ) : null}

          {activeTab === "needs" ? (
            <ContentPanel>
              <FieldGrid>
                <DetailField className="md:col-span-2" label="Uraian Belanja" value={proposal.uraianBelanja ?? proposal.namaPaket} />
                <DetailField className="md:col-span-2" label="Uraian Kebutuhan" value={proposal.uraianKebutuhan} />
                <DetailField label="Jumlah" value={proposal.jumlahKebutuhan} />
                <DetailField label="Satuan" value={proposal.satuanKebutuhan} />
                <DetailField label="Volume Kebutuhan" value={proposal.volumeKebutuhan} />
                <DetailField label="Prioritas" value={proposal.prioritas} />
                <DetailField label="Waktu Kebutuhan" value={dateLabel(proposal.waktuKebutuhan)} />
                <DetailField className="md:col-span-2" label="Spesifikasi Awal" value={proposal.spesifikasiAwal} />
                <DetailField className="md:col-span-2" label="Justifikasi" value={proposal.justifikasi} />
                <DetailField className="md:col-span-2 lg:col-span-4" label="Output yang Diharapkan" value={proposal.outputDiharapkan} />
              </FieldGrid>
            </ContentPanel>
          ) : null}

          {activeTab === "schedule" ? (
            <ContentPanel>
              <FieldGrid>
                <DetailField label="Cara Pengadaan" value={proposal.caraPengadaan} />
                <DetailField label="Metode Pengadaan" value={methodLabel(proposal.metodePengadaan)} />
                <DetailField label="Jadwal Pemilihan" value={dateLabel(proposal.jadwalPemilihan)} />
                <DetailField label="Lokasi Paket" value={proposal.lokasiPaket} />
                <DetailField label="Jadwal Mulai Rencana" value={dateLabel(proposal.jadwalMulaiRencana)} />
                <DetailField label="Jadwal Selesai Rencana" value={dateLabel(proposal.jadwalSelesaiRencana)} />
                <DetailField className="md:col-span-2" label="Rentang Jadwal Rencana" value={scheduleRange(proposal.jadwalMulaiRencana, proposal.jadwalSelesaiRencana)} />
              </FieldGrid>
            </ContentPanel>
          ) : null}

          {activeTab === "documents" ? (
            <ContentPanel>
              <FieldGrid>
                <DetailField label="Status KAK" value={documentStatusBadge(proposal.statusKak)} />
                <DetailField label="Status HPS" value={documentStatusBadge(proposal.statusHps)} />
                <DetailField label="Status Rancangan Kontrak" value={documentStatusBadge(proposal.statusRancanganKontrak)} />
                <DetailField label="Status Dokumen Pendukung" value={documentStatusBadge(proposal.statusDokumenPendukung)} />
                <DetailField className="md:col-span-2 lg:col-span-4" label="Kekurangan Dokumen" value={proposal.kekuranganDokumen} />
              </FieldGrid>
            </ContentPanel>
          ) : null}

          {activeTab === "verification" ? (
            <ContentPanel>
              <div className="grid gap-4">
                <VerificationSummary proposal={proposal} />
                <FieldGrid>
                  <DetailField label="Status Verifikasi" value={statusLabel(proposal.statusUsulan)} />
                  <DetailField
                    label={isRevisionStatus(proposal.statusUsulan) ? "Direvisi Oleh" : "Verifier"}
                    value={proposal.revisionBy ?? proposal.verifiedBy ?? "Kepala Unit"}
                  />
                  <DetailField
                    label="Tanggal Verifikasi"
                    value={dateTimeLabel(proposal.revisionAt ?? proposal.verifiedAt)}
                  />
                  <DetailField label="Alur" value="Operator -> Kepala Unit -> Siap RUP" />
                  <DetailField
                    className="md:col-span-2 lg:col-span-4"
                    label={isRevisionStatus(proposal.statusUsulan) ? "Catatan Revisi" : "Catatan Verifikasi"}
                    value={proposal.revisionNote ?? proposal.catatan}
                  />
                </FieldGrid>
              </div>
            </ContentPanel>
          ) : null}

          {activeTab === "history" ? (
            <ContentPanel>
              <HistoryPanel proposal={proposal} />
            </ContentPanel>
          ) : null}
        </div>
      </ModalShell>
    </>
  );
}
