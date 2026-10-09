"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  ClipboardList,
  FileCheck2,
  Handshake,
  History,
  LayoutDashboard,
  PackageSearch,
  ReceiptText,
  Truck,
  WalletCards,
} from "lucide-react";
import ModalShell from "@/components/modal/ModalShell";
import {
  DetailField,
  DetailModalHeader,
  DetailStatusBadge,
} from "@/components/detail/DetailHorizontalSection";
import type { EPurchasingDraft } from "@/app/katalog-v6-v5/KatalogManualWorkflowClient";
import { formatCurrency } from "@/lib/currency";
import {
  getEPurchasingCompleteness,
  getFirstIncompleteEPurchasingStage,
} from "@/lib/workflow-completeness";

type EPurchasingReadOnlyDetailModalProps = {
  basePath?: string;
  draft: EPurchasingDraft;
  rup: {
    id: string;
    idRupSirup?: string | null;
    kodeRup: string;
    linkSirup?: string | null;
    lokasiPaket?: string | null;
    namaPaket: string;
    unitPengusul: string;
    sumberDana: string;
    pagu: number;
    tahunAnggaran: number;
    program?: string | null;
    kegiatan?: string | null;
    subKegiatan?: string | null;
    ppkPptk?: string | null;
    metodePengadaan: string;
    statusSirup?: string | null;
    tanggalInputSirup?: string | null;
    tanggalTayangSirup?: string | null;
  };
  stageLabel: string;
};

type TabKey =
  | "overview"
  | "rup"
  | "product"
  | "provider"
  | "negotiation"
  | "contract"
  | "delivery"
  | "inspection"
  | "payment"
  | "documents"
  | "history";

const tabs: { key: TabKey; label: string; icon: typeof ClipboardList }[] = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "rup", label: "RUP / SIRUP", icon: FileCheck2 },
  { key: "product", label: "Produk", icon: PackageSearch },
  { key: "provider", label: "Penyedia", icon: Truck },
  { key: "negotiation", label: "Negosiasi", icon: Handshake },
  { key: "contract", label: "Kontrak", icon: ReceiptText },
  { key: "delivery", label: "Pengiriman", icon: Truck },
  { key: "inspection", label: "Pemeriksaan", icon: FileCheck2 },
  { key: "payment", label: "Pembayaran", icon: WalletCards },
  { key: "documents", label: "Dokumen", icon: ClipboardList },
  { key: "history", label: "Riwayat", icon: History },
];

const orderedStageKeys = [
  "rup",
  "product",
  "provider",
  "negotiation",
  "contract",
  "delivery",
  "inspection",
  "payment",
] as const;

function humanize(value?: string | null) {
  if (!value) return "-";

  return value
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function methodLabel(value?: string | null) {
  const labels: Record<string, string> = {
    E_PURCHASING: "E-Purchasing",
    NON_TENDER: "Non Tender",
    PENGADAAN_LANGSUNG: "Pengadaan Langsung",
    SWAKELOLA: "Swakelola",
    TENDER: "Tender",
  };

  return value ? (labels[value] ?? humanize(value)) : "-";
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

function rupiah(value?: number | string | null) {
  const amount = Number(value ?? 0);
  if (!Number.isFinite(amount) || amount <= 0) return "-";
  return formatCurrency(amount);
}

function numberValue(value?: string | number | null) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function percent(value: number) {
  return `${Math.max(0, Math.min(100, Math.round(value)))}%`;
}

function linkValue(value?: string | null, label = "Buka Link ↗") {
  if (!value) return "-";

  try {
    const url = new URL(value);

    return (
      <Link
        href={url.toString()}
        target="_blank"
        rel="noopener noreferrer"
        className="font-semibold text-[#08783f] underline decoration-emerald-200 underline-offset-4"
      >
        {label}
      </Link>
    );
  } catch {
    return value;
  }
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
      className={`inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg border px-3 text-xs font-semibold transition ${
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

function TimelineItem({
  date,
  label,
}: {
  date?: string | null;
  label: string;
}) {
  return (
    <div className="relative border-l border-emerald-200 pb-4 pl-4 last:pb-0">
      <span className="absolute -left-[5px] top-1 h-2.5 w-2.5 rounded-full bg-[#08783f]" />
      <p className="text-xs font-semibold uppercase tracking-[0.04em] text-slate-500">
        {dateLabel(date)}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-800">{label}</p>
    </div>
  );
}

export default function EPurchasingReadOnlyDetailModal({
  basePath = "/e-purchasing",
  draft,
  rup,
  stageLabel,
}: EPurchasingReadOnlyDetailModalProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const totalHargaTayang =
    numberValue(draft.totalHargaKatalog) ||
    numberValue(draft.jumlahProdukKatalog) * numberValue(draft.hargaSatuanKatalog);
  const hargaFinal = numberValue(draft.hargaNegosiasiKatalog);
  const hargaPenawaran = numberValue(draft.hargaPenawaranKatalog) || totalHargaTayang;
  const efisiensi =
    hargaPenawaran > 0 && hargaFinal > 0
      ? ((hargaPenawaran - hargaFinal) / hargaPenawaran) * 100
      : 0;
  const completeness = useMemo(
    () =>
      getEPurchasingCompleteness({
        ...draft,
        idRupSirup: rup.idRupSirup,
        linkSirup: rup.linkSirup,
        metodePengadaan: rup.metodePengadaan,
        namaPaket: rup.namaPaket,
        pagu: rup.pagu,
        statusSirup: rup.statusSirup,
        sumberDana: rup.sumberDana,
        tanggalTayangSirup: rup.tanggalTayangSirup,
        tahunAnggaran: rup.tahunAnggaran,
        unitPengusul: rup.unitPengusul,
      }),
    [draft, rup],
  );
  const currentStage = getFirstIncompleteEPurchasingStage(completeness);
  const progress = orderedStageKeys.map((key) => ({
    active: key === currentStage,
    done: completeness.sections[key].complete,
    label: completeness.sections[key].label,
  }));

  function closeModal() {
    router.push(basePath);
  }

  return (
    <ModalShell
      isOpen
      onClose={closeModal}
      eyebrow="E-Purchasing"
      title={rup.namaPaket}
      maxWidthClassName="max-w-7xl"
    >
      <div className="grid gap-5">
        <DetailModalHeader
          code={`RUP ${rup.idRupSirup || rup.kodeRup}`}
          title={rup.namaPaket}
          badge={
            <DetailStatusBadge className="bg-emerald-100 text-[#08783f] ring-emerald-200">
              {stageLabel}
            </DetailStatusBadge>
          }
          items={[
            { label: "Unit", value: rup.unitPengusul },
            { label: "Tahun", value: `TA ${rup.tahunAnggaran}` },
            { label: "Pagu", value: rupiah(rup.pagu) },
            { label: "Metode", value: methodLabel(rup.metodePengadaan) },
            { label: "Sumber Dana", value: rup.sumberDana },
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
          <FieldGrid>
            <DetailField label="Kode RUP" value={rup.kodeRup} />
            <DetailField label="Unit" value={rup.unitPengusul} />
            <DetailField label="Tahun Anggaran" value={`TA ${rup.tahunAnggaran}`} />
            <DetailField label="Pagu" value={rupiah(rup.pagu)} />
            <DetailField label="Program" value={rup.program} />
            <DetailField label="Kegiatan" value={rup.kegiatan} />
            <DetailField label="Sub Kegiatan" value={rup.subKegiatan} />
            <DetailField label="PPK / PPTK" value={rup.ppkPptk} />
            <DetailField label="Sumber Dana" value={rup.sumberDana} />
            <DetailField label="Metode Final" value={methodLabel(rup.metodePengadaan)} />
            <DetailField label="Lokasi" value={rup.lokasiPaket} />
            <DetailField
              label="Tahap Saat Ini"
              value={completeness.complete ? "Selesai" : completeness.sections[currentStage].label}
            />
            <DetailField label="Status" value={stageLabel} />
            <DetailField label="Kelengkapan" value={`${completeness.percentage}%`} />
            <DetailField label="Harga Final" value={rupiah(hargaFinal)} />
            <DetailField label="Penyedia" value={draft.namaPenyediaKatalog} />
          </FieldGrid>
        ) : null}

        {activeTab === "rup" ? (
          <FieldGrid>
            <DetailField label="ID RUP SIRUP" value={rup.idRupSirup} />
            <DetailField label="Status SIRUP" value={humanize(rup.statusSirup)} />
            <DetailField label="Tanggal Input" value={dateLabel(rup.tanggalInputSirup)} />
            <DetailField label="Tanggal Tayang" value={dateLabel(rup.tanggalTayangSirup)} />
            <DetailField label="Metode Final" value={methodLabel(rup.metodePengadaan)} />
            <DetailField label="Pagu Final" value={rupiah(rup.pagu)} />
            <DetailField label="Link SIRUP" value={linkValue(rup.linkSirup, "Buka SIRUP ↗")} />
          </FieldGrid>
        ) : null}

        {activeTab === "product" ? (
          <FieldGrid>
            <DetailField label="Nama Produk" value={draft.namaProdukKatalog} />
            <DetailField label="Merk / Tipe" value={draft.merekTipeKatalog} />
            <DetailField label="Jumlah" value={draft.jumlahProdukKatalog} />
            <DetailField label="Satuan" value={draft.satuanProdukKatalog} />
            <DetailField label="Platform / Versi Katalog" value={draft.jenisKatalog} />
            <DetailField label="Etalase" value={draft.etalaseKatalog} />
            <DetailField label="Kategori Produk" value={draft.kategoriProdukKatalog} />
            <DetailField label="Harga Tayang Satuan" value={rupiah(draft.hargaSatuanKatalog)} />
            <DetailField label="Harga Tayang Total" value={rupiah(totalHargaTayang)} />
            <DetailField label="Link Produk" value={linkValue(draft.linkProdukKatalog, "Buka Produk ↗")} />
            <DetailField className="lg:col-span-2" label="Spesifikasi Katalog" value={draft.spesifikasiProdukKatalog} />
          </FieldGrid>
        ) : null}

        {activeTab === "provider" ? (
          <FieldGrid>
            <DetailField label="Nama Penyedia" value={draft.namaPenyediaKatalog} />
            <DetailField label="Kontak" value={draft.kontakPenyediaKatalog} />
            <DetailField label="Email" value={draft.emailPenyediaKatalog} />
            <DetailField className="lg:col-span-2" label="Alamat" value={draft.alamatPenyediaKatalog} />
          </FieldGrid>
        ) : null}

        {activeTab === "negotiation" ? (
          <FieldGrid>
            <DetailField label="Harga Tayang" value={rupiah(totalHargaTayang)} />
            <DetailField label="Harga Penawaran" value={rupiah(hargaPenawaran)} />
            <DetailField label="Harga Negosiasi" value={rupiah(hargaFinal)} />
            <DetailField label="Selisih" value={rupiah(Math.max(hargaPenawaran - hargaFinal, 0))} />
            <DetailField label="Efisiensi" value={efisiensi > 0 ? percent(efisiensi) : "-"} />
            <DetailField label="Status Negosiasi" value={humanize(draft.statusNegosiasiKatalog)} />
            <DetailField className="lg:col-span-2" label="Catatan" value={draft.catatanKatalog} />
          </FieldGrid>
        ) : null}

        {activeTab === "contract" ? (
          <FieldGrid>
            <DetailField label="Nomor SPPBJ" value={draft.nomorSppbj} />
            <DetailField label="Tanggal SPPBJ" value={dateLabel(draft.tanggalSppbj)} />
            <DetailField label="Status Surat Pesanan" value={humanize(draft.statusSuratPesanan)} />
            <DetailField label="Nomor Surat Pesanan" value={draft.nomorSuratPesanan} />
            <DetailField label="Tanggal Surat Pesanan" value={dateLabel(draft.tanggalSuratPesanan)} />
            <DetailField label="Nomor SPK / Kontrak" value={draft.nomorSpkKontrak} />
            <DetailField label="Tanggal Kontrak" value={dateLabel(draft.tanggalKontrakEp)} />
            <DetailField label="Nomor SPMK" value={draft.nomorSpmk} />
            <DetailField label="Tanggal SPMK" value={dateLabel(draft.tanggalSpmk)} />
          </FieldGrid>
        ) : null}

        {activeTab === "delivery" ? (
          <FieldGrid>
            <DetailField label="Status Pengiriman" value={humanize(draft.statusPengirimanEp)} />
            <DetailField label="Tanggal Rencana" value={dateLabel(draft.tanggalRencanaKirim)} />
            <DetailField label="Tanggal Aktual" value={dateLabel(draft.tanggalAktualKirim)} />
            <DetailField label="Nomor Surat Jalan" value={draft.nomorSuratJalan} />
            <DetailField className="lg:col-span-2" label="Catatan" value={draft.catatanKatalog} />
          </FieldGrid>
        ) : null}

        {activeTab === "inspection" ? (
          <FieldGrid>
            <DetailField label="Status Uji Fungsi" value={humanize(draft.statusUjiFungsi)} />
            <DetailField label="Nomor BA Uji Fungsi" value={draft.nomorBaUjiFungsi} />
            <DetailField label="Tanggal Uji Fungsi" value={dateLabel(draft.tanggalUjiFungsi)} />
            <DetailField label="Status Pemeriksaan" value={humanize(draft.statusPemeriksaanEp)} />
            <DetailField label="Nomor BA Pemeriksaan" value={draft.nomorBaPemeriksaan} />
            <DetailField label="Tanggal Pemeriksaan" value={dateLabel(draft.tanggalPemeriksaan)} />
            <DetailField label="Hasil Pemeriksaan" value={humanize(draft.hasilPemeriksaan)} />
            <DetailField label="Nomor BAST" value={draft.nomorBast} />
            <DetailField label="Tanggal BAST" value={dateLabel(draft.tanggalBast)} />
          </FieldGrid>
        ) : null}

        {activeTab === "payment" ? (
          <FieldGrid>
            <DetailField label="Status Dokumen Pembayaran" value={humanize(draft.statusDokumenPembayaran)} />
            <DetailField label="Status Pembayaran" value={humanize(draft.statusPembayaranEp)} />
            <DetailField label="Nilai Pembayaran" value={rupiah(draft.nilaiPembayaran)} />
            <DetailField label="Invoice" value={draft.nomorInvoice} />
            <DetailField label="Faktur" value={draft.nomorFaktur} />
            <DetailField label="Tanggal Pembayaran" value={dateLabel(draft.tanggalPembayaranEp)} />
          </FieldGrid>
        ) : null}

        {activeTab === "documents" ? (
          <FieldGrid>
            <DetailField label="SPPBJ" value={draft.nomorSppbj} />
            <DetailField label="Surat Pesanan" value={draft.nomorSuratPesanan} />
            <DetailField label="SPK / Kontrak" value={draft.nomorSpkKontrak} />
            <DetailField label="SPMK" value={draft.nomorSpmk} />
            <DetailField label="BA Uji Fungsi" value={draft.nomorBaUjiFungsi} />
            <DetailField label="BA Pemeriksaan" value={draft.nomorBaPemeriksaan} />
            <DetailField label="BAST" value={draft.nomorBast} />
            <DetailField label="Invoice" value={draft.nomorInvoice} />
            <DetailField label="Faktur" value={draft.nomorFaktur} />
          </FieldGrid>
        ) : null}

        {activeTab === "history" ? (
          <section className="rounded-xl border border-slate-200 bg-white p-4">
            {draft.namaProdukKatalog ||
            draft.namaPenyediaKatalog ||
            draft.statusNegosiasiKatalog ||
            draft.nomorSuratPesanan ||
            draft.statusPengirimanEp ||
            draft.nomorBast ||
            draft.statusPembayaranEp ? (
              <div className="grid gap-1">
                {draft.namaProdukKatalog ? (
                  <TimelineItem date={rup.tanggalTayangSirup} label="Data produk katalog tersimpan." />
                ) : null}
                {draft.namaPenyediaKatalog ? (
                  <TimelineItem date={rup.tanggalTayangSirup} label="Data penyedia tersimpan." />
                ) : null}
                {draft.statusNegosiasiKatalog ? (
                  <TimelineItem date={rup.tanggalTayangSirup} label={`Negosiasi: ${humanize(draft.statusNegosiasiKatalog)}.`} />
                ) : null}
                {draft.nomorSuratPesanan ? (
                  <TimelineItem date={draft.tanggalSuratPesanan} label="Surat pesanan tercatat." />
                ) : null}
                {draft.statusPengirimanEp ? (
                  <TimelineItem date={draft.tanggalAktualKirim || draft.tanggalRencanaKirim} label={`Pengiriman: ${humanize(draft.statusPengirimanEp)}.`} />
                ) : null}
                {draft.nomorBast ? (
                  <TimelineItem date={draft.tanggalBast} label="BAST tercatat." />
                ) : null}
                {draft.statusPembayaranEp ? (
                  <TimelineItem date={draft.tanggalPembayaranEp} label={`Pembayaran: ${humanize(draft.statusPembayaranEp)}.`} />
                ) : null}
              </div>
            ) : (
              <p className="text-sm font-semibold text-slate-500">
                Belum ada riwayat proses E-Purchasing yang tersimpan.
              </p>
            )}
          </section>
        ) : null}

        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.04em] text-[#08783f]">
            Progress E-Purchasing
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {progress.map((item) => (
              <div
                key={item.label}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold ${
                  item.done
                    ? "border-emerald-200 bg-emerald-50 text-[#08783f]"
                    : item.active
                      ? "border-blue-200 bg-blue-50 text-blue-700"
                      : "border-slate-200 bg-slate-50 text-slate-400"
                }`}
              >
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs">
                  {item.done ? "✓" : item.active ? "●" : "○"}
                </span>
                {item.label}
              </div>
            ))}
          </div>
        </section>
      </div>
    </ModalShell>
  );
}
