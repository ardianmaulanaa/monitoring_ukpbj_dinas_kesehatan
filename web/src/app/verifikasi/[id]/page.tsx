import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, CheckCircle2, Clock3, FileCheck2 } from "lucide-react";
import AppHeader from "@/components/appheader/AppHeader";
import { getCurrentUser } from "@/lib/auth";
import { formatCurrency } from "@/lib/currency";
import { formatDate } from "@/lib/date";
import {
  canAccessProposalUnit,
  canVerifyProposalUnit,
  planningStatusLabels,
  planningStatusStyles,
} from "@/lib/planning-workflow";
import { prisma } from "@/lib/prisma";
import VerificationActionPanel from "./VerificationActionPanel";

type PageProps = {
  params: Promise<{ id: string }>;
};

function valueOrDash(value?: string | number | null) {
  return value === null || value === undefined || value === "" ? "-" : String(value);
}

function formatDateTime(value?: Date | null) {
  if (!value) return "-";

  return `${formatDate(value)} • ${value.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

function statusBadge(status: string) {
  return (
    <span
      className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-black ${planningStatusStyles[status] ?? "bg-slate-100 text-slate-600"}`}
    >
      {planningStatusLabels[status] ?? status.replaceAll("_", " ")}
    </span>
  );
}

export default async function Page({ params }: PageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const proposal = await prisma.rencanaUmumPengadaan.findUnique({
    where: { id },
    include: {
      verificationHistory: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!proposal) notFound();

  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: { unitKerja: true },
  });

  const canView = canAccessProposalUnit({
    proposalUnit: proposal.unitPengusul,
    userName: user.name,
    userRoles: user.roles,
    userUnit: profile?.unitKerja,
  }) || canAccessProposalUnit({
    proposalUnit: proposal.unitBidang ?? "",
    userName: user.name,
    userRoles: user.roles,
    userUnit: profile?.unitKerja,
  });

  if (!canView) redirect("/unauthorized");

  const canVerify = canVerifyProposalUnit({
    proposalUnit: proposal.unitPengusul,
    userName: user.name,
    userRoles: user.roles,
    userUnit: profile?.unitKerja,
  }) || canVerifyProposalUnit({
    proposalUnit: proposal.unitBidang ?? "",
    userName: user.name,
    userRoles: user.roles,
    userUnit: profile?.unitKerja,
  });

  const totalEstimasi = proposal.totalEstimasi ?? proposal.pagu;

  return (
    <>
      <AppHeader
        title="Verifikasi Usulan"
        subtitle="Periksa usulan kebutuhan sebelum diproses menjadi RUP."
        rightLabel="Kepala Unit"
      />

      <main className="bg-[#f4f7f5] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-4">
          <Link
            href="/verifikasi"
            className="inline-flex items-center gap-2 text-sm font-black text-[#08783f]"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Verifikasi
          </Link>
        </div>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="font-mono text-xs font-black uppercase tracking-wide text-slate-400">
                {proposal.kodeRup}
              </p>
              <h1 className="mt-1 text-2xl font-black text-[#16227c]">
                {proposal.namaPaket}
              </h1>
              <div className="mt-3">{statusBadge(proposal.statusUsulan)}</div>
            </div>
            <div className="grid gap-3 text-sm font-semibold text-slate-600 sm:grid-cols-2 lg:min-w-[360px]">
              <div className="rounded-lg bg-slate-50 px-3 py-2">
                <p className="text-xs font-black uppercase text-slate-400">
                  Tanggal Pengajuan
                </p>
                <p className="mt-1">{formatDateTime(proposal.submittedAt)}</p>
              </div>
              <div className="rounded-lg bg-slate-50 px-3 py-2">
                <p className="text-xs font-black uppercase text-slate-400">
                  Prioritas
                </p>
                <p className="mt-1">{valueOrDash(proposal.prioritas)}</p>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_420px]">
          <div className="grid gap-5">
            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-black text-[#16227c]">Status</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-4">
                {[
                  { label: "Usulan Dibuat", date: proposal.createdAt, done: true },
                  {
                    label: "Diajukan",
                    date: proposal.submittedAt,
                    done: Boolean(proposal.submittedAt),
                  },
                  {
                    label:
                      proposal.statusUsulan === "PERLU_REVISI"
                        ? "Perlu Revisi"
                        : "Verifikasi Kepala Unit",
                    date: proposal.revisionAt ?? proposal.verifiedAt,
                    done: proposal.statusUsulan !== "DIAJUKAN",
                  },
                  {
                    label: "Siap RUP",
                    date: proposal.verifiedAt,
                    done:
                      proposal.statusUsulan === "SIAP_RUP" ||
                      proposal.statusUsulan === "RUP_TAYANG",
                  },
                ].map(({ date, done, label }) => (
                  <div
                    key={String(label)}
                    className="rounded-lg border border-slate-200 bg-slate-50 p-3"
                  >
                    {done ? (
                      <CheckCircle2 className="h-5 w-5 text-[#08783f]" />
                    ) : (
                      <Clock3 className="h-5 w-5 text-slate-400" />
                    )}
                    <p className="mt-2 text-sm font-black text-slate-800">
                      {label}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      {date instanceof Date ? formatDateTime(date) : "Menunggu"}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-black text-[#16227c]">
                Informasi Usulan
              </h2>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {[
                  ["Kode Usulan", proposal.kodeRup],
                  ["Tahun Anggaran", proposal.tahunAnggaran],
                  ["Unit Pengusul / OPD", proposal.unitPengusul],
                  ["Unit / Bidang", proposal.unitBidang],
                  ["Nama PPK / PPTK", proposal.ppkPptk],
                  ["Kontak Penanggung Jawab", proposal.kontakPenanggungJawab],
                  ["Tanggal Dibuat", formatDateTime(proposal.createdAt)],
                  ["Tanggal Diajukan", formatDateTime(proposal.submittedAt)],
                  ["Status", planningStatusLabels[proposal.statusUsulan]],
                ].map(([label, value]) => (
                  <div key={String(label)} className="rounded-lg bg-slate-50 p-3">
                    <p className="text-xs font-black uppercase text-slate-400">
                      {label}
                    </p>
                    <p className="mt-2 break-words text-sm font-bold text-slate-700">
                      {valueOrDash(value)}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-black text-[#16227c]">Data Anggaran</h2>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {[
                  ["Program", proposal.program],
                  ["Kegiatan", proposal.kegiatan],
                  ["Sub Kegiatan", proposal.subKegiatan],
                  ["Kode Rekening Belanja", proposal.kodeRekening],
                  ["Sumber Dana", proposal.sumberDana],
                  ["Pagu / Estimasi", formatCurrency(totalEstimasi.toString())],
                ].map(([label, value]) => (
                  <div key={String(label)} className="rounded-lg bg-slate-50 p-3">
                    <p className="text-xs font-black uppercase text-slate-400">
                      {label}
                    </p>
                    <p className="mt-2 break-words text-sm font-bold text-slate-700">
                      {valueOrDash(value)}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-black text-[#16227c]">Data Kebutuhan</h2>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {[
                  ["Nama", proposal.namaPaket],
                  [
                    "Jumlah",
                    `${proposal.jumlahKebutuhan?.toString() ?? proposal.volumeKebutuhan ?? "-"} ${proposal.satuanKebutuhan ?? ""}`,
                  ],
                  ["Harga Estimasi", formatCurrency(totalEstimasi.toString())],
                  ["Prioritas", proposal.prioritas],
                  ["Spesifikasi Awal", proposal.spesifikasiAwal],
                  ["Justifikasi", proposal.justifikasi],
                ].map(([label, value]) => (
                  <div
                    key={String(label)}
                    className="rounded-lg bg-slate-50 p-3 md:has-[.long-text]:col-span-3"
                  >
                    <p className="text-xs font-black uppercase text-slate-400">
                      {label}
                    </p>
                    <p className="long-text mt-2 whitespace-pre-wrap break-words text-sm font-bold text-slate-700">
                      {valueOrDash(value)}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-black text-[#16227c]">
                Dokumen Pendukung
              </h2>
              <div className="mt-4 grid gap-3 md:grid-cols-4">
                {[
                  ["KAK / Spesifikasi", proposal.statusKak],
                  ["HPS", proposal.statusHps],
                  ["Rancangan Kontrak", proposal.statusRancanganKontrak],
                  ["Dokumen Pendukung", proposal.statusDokumenPendukung],
                ].map(([label, value]) => (
                  <div
                    key={String(label)}
                    className="flex items-start gap-3 rounded-lg bg-slate-50 p-3"
                  >
                    <FileCheck2 className="mt-0.5 h-4 w-4 shrink-0 text-[#08783f]" />
                    <div>
                      <p className="text-xs font-black uppercase text-slate-400">
                        {label}
                      </p>
                      <p className="mt-1 text-sm font-bold text-slate-700">
                        {valueOrDash(value)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-black text-[#16227c]">
                Riwayat Aktivitas
              </h2>
              <div className="mt-4 grid gap-3">
                {proposal.verificationHistory.length > 0 ? (
                  proposal.verificationHistory.map((history) => (
                    <div
                      key={history.id}
                      className="rounded-lg border border-slate-200 bg-slate-50 p-3"
                    >
                      <p className="text-sm font-black text-slate-800">
                        {history.action.replaceAll("_", " ")}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        {formatDateTime(history.createdAt)} oleh{" "}
                        {history.actorName}
                      </p>
                      {history.note ? (
                        <p className="mt-2 whitespace-pre-wrap text-sm font-semibold text-slate-700">
                          Catatan: {history.note}
                        </p>
                      ) : null}
                    </div>
                  ))
                ) : (
                  <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm font-semibold text-slate-500">
                    Belum ada riwayat verifikasi.
                  </p>
                )}
              </div>
            </section>
          </div>

          <VerificationActionPanel
            canVerify={canVerify}
            proposalId={proposal.id}
            status={proposal.statusUsulan}
          />
        </div>
      </main>
    </>
  );
}
