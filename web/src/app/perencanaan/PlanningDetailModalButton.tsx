"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { type RoleCode, type RupStatus } from "@prisma/client";
import { CheckCircle2, FileCheck2, FileSearch, UsersRound } from "lucide-react";
import ModalShell from "@/components/modal/ModalShell";
import { formatCurrency } from "@/lib/currency";

type PlanningProposalDetail = {
  id: string;
  kodeRup: string;
  namaPaket: string;
  unitPengusul: string;
  program: string | null;
  kegiatan: string | null;
  subKegiatan: string | null;
  kodeRekening: string | null;
  sumberDana: string;
  pagu: string;
  metodePengadaan: string;
  jadwalPemilihan: string | null;
  picTindakLanjut: string | null;
  tindakLanjut: string | null;
  statusKak: string | null;
  statusHps: string | null;
  statusRancanganKontrak: string | null;
  statusDokumenPendukung: string | null;
  catatan: string | null;
  statusSirup: RupStatus;
};

type ApprovalStep = {
  status: RupStatus;
  label: string;
  roles: RoleCode[];
  helper: string;
};

type PlanningDetailModalButtonProps = {
  currentUserRoles: RoleCode[];
  planningApprovalRoleFlow: ApprovalStep[];
  planningStatusLabels: Record<string, string>;
  planningStatusStyles: Record<string, string>;
  proposal: PlanningProposalDetail;
  roleNames: Partial<Record<RoleCode, string>>;
  updatePlanningApprovalAction: (formData: FormData) => Promise<void>;
};

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

function getVisibleRoles(step: ApprovalStep, userRoles: RoleCode[]) {
  if (userRoles.includes("SUPER_ADMIN")) return step.roles;

  const matchingRoles = step.roles.filter((role) => userRoles.includes(role));
  return matchingRoles.length > 0 ? matchingRoles : step.roles;
}

export default function PlanningDetailModalButton({
  currentUserRoles,
  planningApprovalRoleFlow,
  planningStatusLabels,
  planningStatusStyles,
  proposal,
  roleNames,
  updatePlanningApprovalAction,
}: PlanningDetailModalButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const close = useCallback(() => setIsOpen(false), []);

  const activeStep =
    planningApprovalRoleFlow.find((step) => step.status === proposal.statusSirup) ??
    null;
  const canActHere = Boolean(
    activeStep &&
      (currentUserRoles.includes("SUPER_ADMIN") ||
        activeStep.roles.some((role) => currentUserRoles.includes(role))),
  );
  const visibleRoles = activeStep
    ? getVisibleRoles(activeStep, currentUserRoles)
    : [];
  const isRejected = proposal.statusSirup === "DITARIK";
  const isComplete = proposal.statusSirup === "SUDAH_TAYANG";

  async function handleAction(formData: FormData) {
    await updatePlanningApprovalAction(formData);
    router.refresh();
    setIsOpen(false);
  }

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
        onClose={close}
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
                  Approval tersedia di bagian bawah popup.
                </p>
              </div>
            </div>
            <span
              className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-black ${planningStatusStyles[proposal.statusSirup] ?? "bg-slate-100 text-slate-600"}`}
            >
              {planningStatusLabels[proposal.statusSirup] ??
                humanize(proposal.statusSirup)}
            </span>
          </div>

          <div className="grid gap-3 lg:grid-cols-3">
            {[
              ["Kode RUP", proposal.kodeRup],
              ["Nama Paket", proposal.namaPaket],
              ["Unit Pengusul", proposal.unitPengusul],
              ["Program", proposal.program || "-"],
              ["Kegiatan", proposal.kegiatan || proposal.subKegiatan || "-"],
              ["Kode Rekening", proposal.kodeRekening || "-"],
              ["Sumber Dana", proposal.sumberDana],
              ["Pagu", formatCurrency(proposal.pagu)],
              ["Metode", methodLabel(proposal.metodePengadaan)],
              ["Jadwal Pemilihan", proposal.jadwalPemilihan || "-"],
              ["PIC Tindak Lanjut", proposal.picTindakLanjut || "-"],
              ["Tindak Lanjut", proposal.tindakLanjut || "-"],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3"
              >
                <p className="text-xs font-black uppercase text-slate-400">
                  {label}
                </p>
                <p className="mt-2 break-words text-sm font-bold text-slate-700">
                  {value}
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
                [
                  "Rancangan Kontrak",
                  proposal.statusRancanganKontrak || "BELUM_ADA",
                ],
                [
                  "Dokumen Pendukung",
                  proposal.statusDokumenPendukung || "BELUM_ADA",
                ],
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

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-black uppercase text-slate-400">
              Catatan / Revisi
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm font-semibold leading-6 text-slate-700">
              {proposal.catatan || "Belum ada catatan revisi."}
            </p>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <UsersRound className="h-5 w-5 text-[#08783f]" />
              <h3 className="text-base font-black text-[#16227c]">
                Approval Role
              </h3>
            </div>

            {activeStep ? (
              <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-black text-slate-900">
                      {activeStep.label}
                    </p>
                    <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
                      {activeStep.helper}
                    </p>
                    <p className="mt-2 text-[11px] font-black uppercase text-slate-400">
                      {visibleRoles
                        .map((role) => roleNames[role] ?? role)
                        .join(" / ")}
                    </p>
                  </div>
                  <span className="w-fit shrink-0 rounded-full bg-blue-100 px-2 py-1 text-[11px] font-black text-blue-700">
                    Menunggu aksi
                  </span>
                </div>

                <form action={handleAction} className="mt-4 grid gap-2">
                  <input type="hidden" name="id" value={proposal.id} />
                  <button
                    name="action"
                    value="approve"
                    disabled={!canActHere}
                    className="h-9 rounded-lg bg-[#08783f] px-3 text-xs font-black text-white transition hover:bg-[#066532] disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    Approve
                  </button>
                </form>

                <form action={handleAction} className="mt-2 grid gap-2">
                  <input type="hidden" name="id" value={proposal.id} />
                  <textarea
                    name="catatanAksi"
                    required={canActHere}
                    disabled={!canActHere}
                    placeholder="Alasan revisi / penolakan"
                    className="min-h-20 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold leading-5 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#08783f] focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-100"
                  />
                  <button
                    name="action"
                    value="revise"
                    disabled={!canActHere}
                    className="h-9 rounded-lg border border-amber-200 bg-amber-50 px-3 text-xs font-black text-amber-700 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    Minta Revisi
                  </button>
                  <button
                    name="action"
                    value="reject"
                    disabled={!canActHere}
                    className="h-9 rounded-lg border border-red-200 bg-red-50 px-3 text-xs font-black text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    Tolak
                  </button>
                </form>

                {!canActHere ? (
                  <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs font-bold leading-5 text-amber-700">
                    Role login saat ini:{" "}
                    {currentUserRoles.length > 0
                      ? currentUserRoles
                          .map((role) => roleNames[role] ?? role)
                          .join(", ")
                      : "-"}
                    . Aksi hanya aktif untuk role yang sedang memegang status
                    usulan.
                  </p>
                ) : null}
              </div>
            ) : (
              <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-black text-slate-700">
                  {isComplete
                    ? "Usulan sudah selesai disetujui."
                    : isRejected
                      ? "Usulan sudah ditolak."
                      : "Tidak ada approval aktif untuk status ini."}
                </p>
              </div>
            )}
          </div>
        </div>
      </ModalShell>
    </>
  );
}
