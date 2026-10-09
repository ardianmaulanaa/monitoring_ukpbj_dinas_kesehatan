"use client";

import Link from "next/link";
import { useActionState, useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  Banknote,
  Building2,
  CalendarDays,
  ClipboardList,
  Eye,
  FileCheck2,
  History,
  LayoutDashboard,
  RotateCcw,
  Save,
} from "lucide-react";
import ModalShell from "@/components/modal/ModalShell";
import {
  DetailField,
  DetailModalHeader,
  DetailStatusBadge,
} from "@/components/detail/DetailHorizontalSection";
import { formatCurrency } from "@/lib/currency";
import {
  updateRupRevisionAction,
  type RupRevisionState,
} from "@/app/sirup-rup/actions";

export type RupDetailItem = {
  catatan: string | null;
  createdAt?: string | null;
  id: string;
  idRupSirup?: string | null;
  jenisKatalog?: string | null;
  etalaseKatalog?: string | null;
  namaProdukKatalog?: string | null;
  spesifikasiProdukKatalog?: string | null;
  merekTipeKatalog?: string | null;
  jumlahProdukKatalog?: string | null;
  satuanProdukKatalog?: string | null;
  hargaSatuanKatalog?: string | null;
  totalHargaKatalog?: string | null;
  namaPenyediaKatalog?: string | null;
  statusNegosiasiKatalog?: string | null;
  hargaNegosiasiKatalog?: string | null;
  nomorSuratPesanan?: string | null;
  tanggalSuratPesanan?: string | null;
  statusTransaksiKatalog?: string | null;
  catatanKatalog?: string | null;
  jadwalPemilihan: string | null;
  jadwalMulaiRencana?: string | null;
  jadwalSelesaiRencana?: string | null;
  kodeRup: string;
  jenisBelanja?: string | null;
  jumlahKebutuhan?: string | null;
  justifikasi?: string | null;
  kegiatan?: string | null;
  kekuranganDokumen?: string | null;
  kendala?: string | null;
  kodeRekening?: string | null;
  kontakPenanggungJawab?: string | null;
  lokasiPaket?: string | null;
  linkSirup?: string | null;
  metodePengadaan: string;
  namaPaket: string;
  outputDiharapkan?: string | null;
  pagu: string;
  picTindakLanjut?: string | null;
  ppkPptk?: string | null;
  prioritas?: string | null;
  program?: string | null;
  caraPengadaan?: string | null;
  sumberDana: string;
  satuanKebutuhan?: string | null;
  spesifikasiAwal?: string | null;
  statusSirup: string;
  statusDokumenPendukung?: string | null;
  statusHps?: string | null;
  statusKak?: string | null;
  statusRancanganKontrak?: string | null;
  subKegiatan?: string | null;
  tanggalInputSirup?: string | null;
  tanggalTayangSirup?: string | null;
  tahunAnggaran: number;
  tindakLanjut?: string | null;
  unitBidang?: string | null;
  unitPengusul: string;
  updatedAt?: string | null;
  uraianBelanja?: string | null;
  uraianKebutuhan?: string | null;
  volumeKebutuhan?: string | null;
  waktuKebutuhan?: string | null;
};

type RupDetailModalButtonProps = {
  canEditRevision: boolean;
  item: RupDetailItem;
  statusLabel: string;
  statusStyle: string;
};

const initialState: RupRevisionState = {
  message: "",
  ok: false,
};

const inputClass =
  "h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#08783f] focus:ring-2 focus:ring-emerald-100";

type TabKey =
  | "overview"
  | "unit"
  | "budget"
  | "needs"
  | "schedule"
  | "rup"
  | "documents"
  | "history";

type ProgressTone = "done" | "active" | "pending" | "revision";

const tabs: { key: TabKey; label: string; icon: typeof ClipboardList }[] = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "unit", label: "Unit", icon: Building2 },
  { key: "budget", label: "Anggaran", icon: Banknote },
  { key: "needs", label: "Kebutuhan", icon: ClipboardList },
  { key: "schedule", label: "Jadwal", icon: CalendarDays },
  { key: "rup", label: "RUP / SIRUP", icon: FileCheck2 },
  { key: "documents", label: "Dokumen", icon: FileCheck2 },
  { key: "history", label: "Riwayat", icon: History },
];

function methodLabel(value: string) {
  const labels: Record<string, string> = {
    TENDER: "Tender",
    NON_TENDER: "Non Tender",
    E_PURCHASING: "E-Purchasing",
    PENGADAAN_LANGSUNG: "Pengadaan Langsung",
    SWAKELOLA: "Swakelola",
  };

  return labels[value] ?? value.replaceAll("_", " ");
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

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

function linkValue(value?: string | null) {
  if (!value) return null;

  try {
    const url = new URL(value);

    return (
      <Link
        href={url.toString()}
        target="_blank"
        rel="noreferrer"
        className="text-[#08783f] underline decoration-emerald-200 underline-offset-4"
      >
        Buka SIRUP ↗
      </Link>
    );
  } catch {
    return value;
  }
}

function RevisionSubmitButton({
  children,
  submitMode,
}: {
  children: React.ReactNode;
  submitMode: "save" | "resubmit";
}) {
  return (
    <button
      type="submit"
      name="submitMode"
      value={submitMode}
      className={
        submitMode === "resubmit"
          ? "inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#08783f] px-4 text-sm font-black text-white transition hover:bg-[#066532]"
          : "inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-white px-4 text-sm font-black text-[#08783f] transition hover:bg-emerald-50"
      }
    >
      {submitMode === "resubmit" ? (
        <RotateCcw className="h-4 w-4" strokeWidth={2.4} />
      ) : (
        <Save className="h-4 w-4" strokeWidth={2.4} />
      )}
      {children}
    </button>
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
      className={`inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg border px-3 text-xs font-black transition ${
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
  return <section className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-4">{children}</section>;
}

function ContentPanel({ children }: { children: ReactNode }) {
  return <div className="min-w-0">{children}</div>;
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
      {value ? value.replaceAll("_", " ") : "-"}
    </DetailStatusBadge>
  );
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

function getRupProgress(item: RupDetailItem, statusLabel: string) {
  const hasSirupIdentity = Boolean(item.idRupSirup);
  const hasPublishedData = Boolean(item.tanggalInputSirup && item.tanggalTayangSirup);
  const hasFinalData = Boolean(hasSirupIdentity && hasPublishedData && item.metodePengadaan && item.pagu);
  const isPublished = item.statusSirup === "SUDAH_TAYANG";
  const isRevision = item.statusSirup === "REVISI_PAGU";
  const routeLabel =
    item.metodePengadaan === "E_PURCHASING"
      ? "Siap Diproses di E-Purchasing"
      : `Siap Diproses di ${methodLabel(item.metodePengadaan)}`;

  return [
    {
      helper: "Paket sudah tersedia sebagai usulan pengadaan.",
      label: "Draft",
      tone: item.statusSirup === "BELUM_INPUT" ? "active" : "done",
    },
    {
      helper:
        item.statusSirup === "BELUM_INPUT"
          ? "Menunggu kelengkapan data RUP."
          : "Paket masuk alur SIRUP/RUP.",
      label: "Siap RUP",
      tone: item.statusSirup === "BELUM_INPUT" ? "pending" : "done",
    },
    {
      helper: hasFinalData ? "Identitas, tanggal, metode, dan pagu final tersedia." : "Lengkapi ID, tanggal tayang, metode, dan pagu final.",
      label: "Data SIRUP",
      tone: hasFinalData ? "done" : item.statusSirup === "BELUM_INPUT" ? "pending" : "active",
    },
    {
      helper: isPublished ? "RUP sudah tayang." : isRevision ? "Data perlu revisi sebelum tayang." : `Status saat ini: ${statusLabel}.`,
      label: isRevision ? "Perlu Revisi" : "Sudah Tayang",
      tone: isRevision ? "revision" : isPublished ? "done" : hasFinalData ? "active" : "pending",
    },
    {
      helper: isPublished ? routeLabel : "Menunggu status Sudah Tayang.",
      label: "Siap Dilanjutkan",
      tone: isPublished ? "active" : "pending",
    },
  ] as const;
}

function HistoryPanel({ item }: { item: RupDetailItem }) {
  const entries = [
    item.createdAt
      ? {
          date: item.createdAt,
          description: "Paket dibuat",
          icon: "+",
        }
      : null,
    item.updatedAt && item.updatedAt !== item.createdAt
      ? {
          date: item.updatedAt,
          description: "Data paket diperbarui",
          icon: "✎",
        }
      : null,
    item.tanggalInputSirup
      ? {
          date: item.tanggalInputSirup,
          description: item.idRupSirup
            ? `ID RUP ditambahkan: ${item.idRupSirup}`
            : "Data SIRUP diinput",
          icon: "●",
        }
      : null,
    item.tanggalTayangSirup
      ? {
          date: item.tanggalTayangSirup,
          description: `RUP ditayangkan dengan metode final ${methodLabel(item.metodePengadaan)}`,
          icon: "✓",
        }
      : null,
  ]
    .filter(Boolean)
    .sort((a, b) => new Date(b!.date).getTime() - new Date(a!.date).getTime());

  if (entries.length === 0) {
    return <DetailField label="Riwayat" value="Belum ada riwayat SIRUP/RUP." />;
  }

  return (
    <ol className="grid gap-3">
      {entries.map((entry) => (
        <li
          key={`${entry!.date}-${entry!.description}`}
          className="flex min-w-0 gap-3 rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3"
        >
          <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-xs font-black text-[#08783f] ring-1 ring-slate-200">
            {entry!.icon}
          </span>
          <div className="min-w-0">
            <p className="break-words text-sm font-black text-slate-800">{entry!.description}</p>
            <p className="mt-1 text-xs font-bold text-slate-500">{dateTimeLabel(entry!.date)}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export default function RupDetailModalButton({
  canEditRevision,
  item,
  statusLabel,
  statusStyle,
}: RupDetailModalButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [state, formAction] = useActionState(
    updateRupRevisionAction,
    initialState,
  );
  const [pagu, setPagu] = useState(onlyDigits(item.pagu));
  const [activeTab, setActiveTab] = useState<TabKey>("overview");

  const formattedPagu = useMemo(() => formatCurrency(pagu), [pagu]);
  const progress = useMemo(
    () => getRupProgress(item, statusLabel),
    [item, statusLabel],
  );
  const showRevisionForm =
    item.statusSirup === "REVISI_PAGU" && canEditRevision;

  useEffect(() => {
    if (state.ok) router.refresh();
  }, [router, state.ok]);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-white px-4 text-sm font-black text-[#08783f] transition hover:bg-emerald-50"
      >
        <Eye className="h-4 w-4" strokeWidth={2.4} />
        Detail
      </button>

      <ModalShell
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        eyebrow="Detail SIRUP / RUP"
        title={item.namaPaket}
        maxWidthClassName="max-w-7xl"
      >
        <div className="grid min-w-0 gap-5 overflow-x-hidden">
          <DetailModalHeader
            code={item.idRupSirup ? `RUP ${item.idRupSirup}` : item.kodeRup}
            title={item.namaPaket}
            badge={<DetailStatusBadge className={statusStyle}>{statusLabel}</DetailStatusBadge>}
            action={
              item.metodePengadaan === "E_PURCHASING" &&
              item.statusSirup === "SUDAH_TAYANG" ? (
                <Link
                  href={`/e-purchasing?detailId=${item.id}`}
                  className="inline-flex h-9 items-center justify-center rounded-lg border border-emerald-200 bg-white px-4 text-sm font-black text-[#08783f] transition hover:bg-emerald-50"
                >
                  Proses E-Purchasing
                </Link>
              ) : null
            }
            items={[
              { label: "Unit Pengusul", value: item.unitPengusul },
              { label: "Tahun Anggaran", value: `TA ${item.tahunAnggaran}` },
              { label: "Pagu Final", value: formatCurrency(item.pagu) },
              { label: "Metode Final", value: methodLabel(item.metodePengadaan) },
              { label: "Sumber Dana", value: item.sumberDana },
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
                <DetailField label="Kode Usulan" value={item.kodeRup} />
                <DetailField label="ID RUP SIRUP" value={item.idRupSirup} />
                <DetailField label="Unit" value={item.unitPengusul} />
                <DetailField label="Tahun Anggaran" value={`TA ${item.tahunAnggaran}`} />
                <DetailField
                  label="Pagu Awal"
                  value={formatCurrency(item.pagu)}
                  valueClassName="whitespace-nowrap"
                />
                <DetailField
                  label="Pagu Final"
                  value={formatCurrency(item.pagu)}
                  valueClassName="whitespace-nowrap"
                />
                <DetailField label="Sumber Dana" value={item.sumberDana} />
                <DetailField label="Status SIRUP" value={statusLabel} />
                <DetailField label="Metode Awal" value={methodLabel(item.metodePengadaan)} />
                <DetailField label="Metode Final" value={methodLabel(item.metodePengadaan)} />
                <DetailField label="Tanggal Input" value={dateLabel(item.tanggalInputSirup)} />
                <DetailField label="Tanggal Tayang" value={dateLabel(item.tanggalTayangSirup)} />
              </FieldGrid>

              <section className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
                <p className="text-xs font-black uppercase tracking-wide text-[#08783f]">
                  Progress SIRUP / RUP
                </p>
                <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                  {progress.map((step) => (
                    <ProgressCard
                      key={step.label}
                      helper={step.helper}
                      label={step.label}
                      tone={step.tone}
                    />
                  ))}
                </div>
              </section>
            </ContentPanel>
          ) : null}

          {activeTab === "unit" ? (
            <ContentPanel>
              <FieldGrid>
                <DetailField label="Unit Pengusul / OPD" value={item.unitPengusul} />
                <DetailField label="Unit / Bidang" value={item.unitBidang} />
                <DetailField label="PPK / PPTK" value={item.ppkPptk} />
                <DetailField label="Kontak Penanggung Jawab" value={item.kontakPenanggungJawab} />
                <DetailField label="Kode Usulan" value={item.kodeRup} />
                <DetailField label="Tahun Anggaran" value={`TA ${item.tahunAnggaran}`} />
              </FieldGrid>
            </ContentPanel>
          ) : null}

          {activeTab === "budget" ? (
            <ContentPanel>
              <FieldGrid>
                <DetailField className="md:col-span-2" label="Program" value={item.program} />
                <DetailField className="md:col-span-2" label="Kegiatan" value={item.kegiatan} />
                <DetailField className="md:col-span-2" label="Sub Kegiatan" value={item.subKegiatan} />
                <DetailField label="Kode Rekening" value={item.kodeRekening} />
                <DetailField label="Sumber Dana" value={item.sumberDana} />
                <DetailField
                  label="Pagu Awal"
                  value={formatCurrency(item.pagu)}
                  valueClassName="whitespace-nowrap"
                />
                <DetailField
                  label="Pagu Final SIRUP"
                  value={formatCurrency(item.pagu)}
                  valueClassName="whitespace-nowrap"
                />
              </FieldGrid>
            </ContentPanel>
          ) : null}

          {activeTab === "needs" ? (
            <ContentPanel>
              <FieldGrid>
                <DetailField className="md:col-span-2" label="Uraian Belanja" value={item.uraianBelanja ?? item.namaPaket} />
                <DetailField className="md:col-span-2" label="Uraian Kebutuhan" value={item.uraianKebutuhan} />
                <DetailField label="Jumlah" value={item.jumlahKebutuhan} />
                <DetailField label="Satuan" value={item.satuanKebutuhan} />
                <DetailField label="Volume" value={item.volumeKebutuhan} />
                <DetailField label="Prioritas" value={item.prioritas} />
                <DetailField label="Waktu Kebutuhan" value={dateLabel(item.waktuKebutuhan)} />
                <DetailField className="md:col-span-2" label="Spesifikasi Awal" value={item.spesifikasiAwal} />
                <DetailField className="md:col-span-2" label="Justifikasi" value={item.justifikasi} />
                <DetailField className="md:col-span-2 lg:col-span-4" label="Output yang Diharapkan" value={item.outputDiharapkan} />
              </FieldGrid>
            </ContentPanel>
          ) : null}

          {activeTab === "schedule" ? (
            <ContentPanel>
              <FieldGrid>
                <DetailField label="Jadwal Pemilihan" value={dateLabel(item.jadwalPemilihan)} />
                <DetailField label="Jadwal Mulai Rencana" value={dateLabel(item.jadwalMulaiRencana)} />
                <DetailField label="Jadwal Selesai Rencana" value={dateLabel(item.jadwalSelesaiRencana)} />
                <DetailField label="Lokasi Paket" value={item.lokasiPaket} />
                <DetailField label="Cara Pengadaan" value={item.caraPengadaan} />
                <DetailField label="Metode Pengadaan Awal" value={methodLabel(item.metodePengadaan)} />
                <DetailField label="Tanggal Input SIRUP" value={dateLabel(item.tanggalInputSirup)} />
                <DetailField label="Tanggal Tayang SIRUP" value={dateLabel(item.tanggalTayangSirup)} />
                <DetailField className="md:col-span-2" label="Rentang Jadwal Rencana" value={scheduleRange(item.jadwalMulaiRencana, item.jadwalSelesaiRencana)} />
              </FieldGrid>
            </ContentPanel>
          ) : null}

          {activeTab === "rup" ? (
            <ContentPanel>
              <FieldGrid>
                <DetailField label="ID RUP SIRUP" value={item.idRupSirup} />
                <DetailField label="Status SIRUP" value={statusLabel} />
                <DetailField label="Tanggal Input SIRUP" value={dateLabel(item.tanggalInputSirup)} />
                <DetailField label="Tanggal Tayang SIRUP" value={dateLabel(item.tanggalTayangSirup)} />
                <DetailField label="Metode Final" value={methodLabel(item.metodePengadaan)} />
                <DetailField
                  label="Pagu Final"
                  value={formatCurrency(item.pagu)}
                  valueClassName="whitespace-nowrap"
                />
                <DetailField label="Link SIRUP" value={linkValue(item.linkSirup)} />
                <DetailField label="Catatan Perubahan" value={item.catatan} />
              </FieldGrid>
            </ContentPanel>
          ) : null}

          {activeTab === "documents" ? (
            <ContentPanel>
              <FieldGrid>
                <DetailField label="Status KAK" value={documentStatusBadge(item.statusKak)} />
                <DetailField label="Status HPS" value={documentStatusBadge(item.statusHps)} />
                <DetailField label="Status Rancangan Kontrak" value={documentStatusBadge(item.statusRancanganKontrak)} />
                <DetailField label="Status Dokumen Pendukung" value={documentStatusBadge(item.statusDokumenPendukung)} />
                <DetailField className="md:col-span-2 lg:col-span-4" label="Kekurangan Dokumen" value={item.kekuranganDokumen} />
              </FieldGrid>
            </ContentPanel>
          ) : null}

          {activeTab === "history" ? (
            <ContentPanel>
              <HistoryPanel item={item} />
            </ContentPanel>
          ) : null}

          {item.statusSirup === "REVISI_PAGU" && !canEditRevision ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold leading-6 text-amber-700">
              Revisi hanya dapat diubah oleh unit pengusul.
            </div>
          ) : null}

          {showRevisionForm ? (
            <form
              action={formAction}
              className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-4"
            >
              <input type="hidden" name="id" value={item.id} />
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-xs font-black uppercase tracking-wide text-[#08783f]">
                    Pagu Revisi
                  </span>
                  <input
                    name="pagu"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    required
                    value={pagu}
                    onChange={(event) =>
                      setPagu(onlyDigits(event.target.value))
                    }
                    className={inputClass}
                  />
                  <span className="text-xs font-bold text-slate-500">
                    {formattedPagu}
                  </span>
                </label>

                <label className="grid gap-2">
                  <span className="text-xs font-black uppercase tracking-wide text-[#08783f]">
                    Lokasi Paket
                  </span>
                  <input
                    name="lokasiPaket"
                    defaultValue={item.lokasiPaket ?? ""}
                    className={inputClass}
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-xs font-black uppercase tracking-wide text-[#08783f]">
                    Jadwal Pemilihan
                  </span>
                  <input
                    name="jadwalPemilihan"
                    type="date"
                    defaultValue={item.jadwalPemilihan ?? ""}
                    className={inputClass}
                  />
                </label>

                <label className="grid gap-2 sm:col-span-2">
                  <span className="text-xs font-black uppercase tracking-wide text-[#08783f]">
                    Catatan Revisi Unit Pengusul
                  </span>
                  <textarea
                    name="catatan"
                    defaultValue={item.catatan ?? ""}
                    className="min-h-28 w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm font-semibold leading-6 text-slate-700 outline-none transition focus:border-[#08783f] focus:ring-2 focus:ring-emerald-100"
                  />
                </label>
              </div>

              {state.message ? (
                <p
                  className={`mt-4 rounded-lg px-3 py-2 text-sm font-bold ${
                    state.ok
                      ? "bg-emerald-100 text-[#08783f]"
                      : "bg-red-50 text-red-700"
                  }`}
                >
                  {state.message}
                </p>
              ) : null}

              <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <RevisionSubmitButton submitMode="save">
                  Simpan Revisi
                </RevisionSubmitButton>
                <RevisionSubmitButton submitMode="resubmit">
                  Simpan & Ajukan Ulang
                </RevisionSubmitButton>
              </div>
            </form>
          ) : null}
        </div>
      </ModalShell>
    </>
  );
}
