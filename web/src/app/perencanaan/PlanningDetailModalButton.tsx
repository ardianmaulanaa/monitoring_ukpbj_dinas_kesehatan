"use client";

import { useState } from "react";
import { CheckCircle2, FileCheck2, FileSearch, RotateCcw } from "lucide-react";
import ModalShell from "@/components/modal/ModalShell";
import { formatCurrency } from "@/lib/currency";
import { planningStatusLabels, planningStatusStyles } from "@/lib/planning-workflow";

type PlanningProposalDetail = {
  catatan: string | null;
  id: string;
  estimasiHargaSatuan: string | null;
  jadwalPemilihan: string | null;
  jumlahKebutuhan: string | null;
  justifikasi: string | null;
  kodeRekening: string | null;
  kodeRup: string;
  kontakPenanggungJawab: string | null;
  kegiatan: string | null;
  metodePengadaan: string;
  namaPaket: string;
  pagu: string;
  picTindakLanjut: string | null;
  prioritas: string | null;
  program: string | null;
  revisionAt: string | null;
  revisionBy: string | null;
  revisionNote: string | null;
  satuanKebutuhan: string | null;
  sumberDana: string;
  spesifikasiAwal: string | null;
  statusDokumenPendukung: string | null;
  statusHps: string | null;
  statusKak: string | null;
  statusRancanganKontrak: string | null;
  statusSirup: string;
  statusUsulan: string;
  subKegiatan: string | null;
  tahunAnggaran: number;
  tindakLanjut: string | null;
  totalEstimasi: string | null;
  unitBidang: string | null;
  unitPengusul: string;
  ppkPptk: string | null;
  verifiedAt: string | null;
  verifiedBy: string | null;
};

type PlanningDetailModalButtonProps = {
  proposal: PlanningProposalDetail;
};

function valueOrDash(value?: string | number | null) {
  return value === null || value === undefined || value === "" ? "-" : String(value);
}

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
    E_PURCHASING: "e-Katalog",
    PENGADAAN_LANGSUNG: "Pengadaan Langsung",
    SWAKELOLA: "Swakelola",
  };

  return labels[value] ?? humanize(value);
}

function dateLabel(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

function StatusUsulan({ proposal }: { proposal: PlanningProposalDetail }) {
  if (proposal.statusUsulan === "DIAJUKAN") {
    return (
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <p className="text-sm font-black text-blue-800">MENUNGGU VERIFIKASI</p>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
          Usulan telah diajukan dan sedang menunggu verifikasi Kepala Unit.
        </p>
      </div>
    );
  }

  if (proposal.statusUsulan === "PERLU_REVISI") {
    return (
      <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
        <div className="flex items-center gap-2">
          <RotateCcw className="h-5 w-5 text-orange-700" />
          <p className="text-sm font-black text-orange-800">PERLU REVISI</p>
        </div>
        <p className="mt-3 text-xs font-black uppercase text-orange-700">
          Catatan Kepala Unit
        </p>
        <p className="mt-2 whitespace-pre-wrap text-sm font-semibold leading-6 text-slate-700">
          {proposal.revisionNote || proposal.catatan || "Belum ada catatan revisi."}
        </p>
        {proposal.revisionBy ? (
          <p className="mt-2 text-xs font-bold text-slate-500">
            Oleh {proposal.revisionBy} • {dateLabel(proposal.revisionAt)}
          </p>
        ) : null}
      </div>
    );
  }

  if (
    proposal.statusUsulan === "SIAP_RUP"
  ) {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-[#08783f]" />
          <p className="text-sm font-black text-[#08783f]">VERIFIKASI SELESAI</p>
        </div>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
          Diverifikasi oleh: {proposal.verifiedBy || "Kepala Unit"}
        </p>
        <p className="mt-1 text-sm font-semibold leading-6 text-slate-700">
          Tanggal: {dateLabel(proposal.verifiedAt)}
        </p>
        <p className="mt-2 text-sm font-black text-[#08783f]">Status: SIAP RUP</p>
      </div>
    );
  }

  if (proposal.statusUsulan === "RUP_TAYANG") {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
        <p className="text-sm font-black text-[#08783f]">RUP TAYANG</p>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
          Usulan sudah diproses dan dicatat sebagai RUP tayang.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <p className="text-sm font-black text-slate-700">DRAFT</p>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
        Pengusul sedang membuat usulan.
      </p>
    </div>
  );
}

export default function PlanningDetailModalButton({
  proposal,
}: PlanningDetailModalButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

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
        eyebrow="Detail Perencanaan"
        title={proposal.namaPaket}
        maxWidthClassName="max-w-6xl"
      >
        <div className="grid gap-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-center gap-2">
              <FileCheck2 className="h-5 w-5 shrink-0 text-[#08783f]" />
              <div className="min-w-0">
                <h3 className="truncate text-lg font-black text-[#16227c]">
                  Detail Usulan
                </h3>
                <p className="mt-1 text-xs font-bold text-slate-500">
                  Status verifikasi ditampilkan tanpa approval bertingkat.
                </p>
              </div>
            </div>
            <span
              className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-black ${planningStatusStyles[proposal.statusUsulan] ?? "bg-slate-100 text-slate-600"}`}
            >
              {planningStatusLabels[proposal.statusUsulan] ??
                humanize(proposal.statusUsulan)}
            </span>
          </div>

          <div className="grid gap-3 lg:grid-cols-3">
            {[
              ["Kode Usulan", proposal.kodeRup],
              ["Nama / Uraian", proposal.namaPaket],
              ["Unit Pengusul", proposal.unitPengusul],
              ["Tahun Anggaran", proposal.tahunAnggaran],
              ["Unit / Bidang", proposal.unitBidang],
              ["PPK / PPTK", proposal.ppkPptk],
              ["Program", proposal.program],
              ["Kegiatan", proposal.kegiatan],
              ["Sub Kegiatan", proposal.subKegiatan],
              ["Kode Rekening", proposal.kodeRekening],
              ["Sumber Dana", proposal.sumberDana],
              ["Pagu / Total Estimasi", formatCurrency(proposal.totalEstimasi ?? proposal.pagu)],
              ["Jumlah", `${valueOrDash(proposal.jumlahKebutuhan)} ${proposal.satuanKebutuhan ?? ""}`],
              ["Metode", methodLabel(proposal.metodePengadaan)],
              ["Jadwal Pemilihan", proposal.jadwalPemilihan],
              ["Prioritas", proposal.prioritas],
              ["PIC Tindak Lanjut", proposal.picTindakLanjut],
              ["Tindak Lanjut", proposal.tindakLanjut],
            ].map(([label, value]) => (
              <div
                key={String(label)}
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3"
              >
                <p className="text-xs font-black uppercase text-slate-400">
                  {label}
                </p>
                <p className="mt-2 break-words text-sm font-bold text-slate-700">
                  {valueOrDash(value)}
                </p>
              </div>
            ))}
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            {[
              ["Spesifikasi Awal", proposal.spesifikasiAwal],
              ["Justifikasi", proposal.justifikasi],
              ["Catatan", proposal.catatan],
            ].map(([label, value]) => (
              <div
                key={String(label)}
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3"
              >
                <p className="text-xs font-black uppercase text-slate-400">
                  {label}
                </p>
                <p className="mt-2 whitespace-pre-wrap break-words text-sm font-semibold leading-6 text-slate-700">
                  {valueOrDash(value)}
                </p>
              </div>
            ))}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <FileCheck2 className="h-5 w-5 text-[#08783f]" />
              <h3 className="text-base font-black text-[#16227c]">
                Dokumen Awal
              </h3>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["KAK", proposal.statusKak || "BELUM_ADA"],
                ["HPS", proposal.statusHps || "BELUM_ADA"],
                ["Rancangan Kontrak", proposal.statusRancanganKontrak || "BELUM_ADA"],
                ["Dokumen Pendukung", proposal.statusDokumenPendukung || "BELUM_ADA"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3"
                >
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-[#08783f]" />
                  <div>
                    <p className="text-xs font-black uppercase text-slate-400">
                      {label}
                    </p>
                    <p className="mt-1 text-sm font-bold text-slate-600">
                      {value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-base font-black text-[#16227c]">
              Status Usulan
            </h3>
            <div className="mt-3">
              <StatusUsulan proposal={proposal} />
            </div>
          </div>
        </div>
      </ModalShell>
    </>
  );
}
