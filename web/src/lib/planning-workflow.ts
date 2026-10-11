import type { RoleCode, StatusUsulan } from "@prisma/client";

export const USULAN_STATUSES = [
  "DRAFT",
  "DIAJUKAN",
  "MENUNGGU_VERIFIKASI_KEPALA_UNIT",
  "DIVERIFIKASI_KEPALA_UNIT",
  "MENUNGGU_VALIDASI_PPK_PPTK",
  "DIVALIDASI_PPK_PPTK",
  "MENUNGGU_PERSETUJUAN_PA_KPA",
  "DISETUJUI_PA_KPA",
  "PERLU_REVISI",
  "SIAP_RUP",
  "RUP_TAYANG",
] as const satisfies StatusUsulan[];

export const verificationQueueStatuses = [
  "DIAJUKAN",
  "MENUNGGU_VERIFIKASI_KEPALA_UNIT",
  "MENUNGGU_VALIDASI_PPK_PPTK",
  "MENUNGGU_PERSETUJUAN_PA_KPA",
  "PERLU_REVISI",
  "SIAP_RUP",
] as const satisfies StatusUsulan[];

export const verificationChecklistItems = [
  ["needValid", "Kebutuhan sesuai kebutuhan unit"],
  ["descriptionValid", "Uraian kebutuhan sudah jelas"],
  ["quantityValid", "Jumlah dan satuan sudah sesuai"],
  ["specificationValid", "Spesifikasi awal sudah memadai"],
  ["estimateValid", "Estimasi biaya tersedia dan wajar secara awal"],
  ["priorityValid", "Prioritas kebutuhan sudah sesuai"],
  ["justificationValid", "Justifikasi kebutuhan dapat diterima"],
  ["budgetMappingValid", "Program / kegiatan / sub-kegiatan sudah sesuai"],
  ["documentValid", "Dokumen pendukung minimum telah tersedia"],
] as const;

export type VerificationChecklistKey =
  (typeof verificationChecklistItems)[number][0];

export type VerificationChecklist = Record<VerificationChecklistKey, boolean>;

export const emptyVerificationChecklist = Object.fromEntries(
  verificationChecklistItems.map(([key]) => [key, false]),
) as VerificationChecklist;

export const planningStatusLabels: Record<string, string> = {
  DRAFT: "DRAFT",
  DIAJUKAN: "DIAJUKAN",
  MENUNGGU_VERIFIKASI_KEPALA_UNIT: "MENUNGGU VERIFIKASI KEPALA UNIT",
  DIVERIFIKASI_KEPALA_UNIT: "DIVERIFIKASI KEPALA UNIT",
  MENUNGGU_VALIDASI_PPK_PPTK: "MENUNGGU VALIDASI PPK / PPTK",
  DIVALIDASI_PPK_PPTK: "DIVALIDASI PPK / PPTK",
  MENUNGGU_PERSETUJUAN_PA_KPA: "MENUNGGU PERSETUJUAN PA / KPA",
  DISETUJUI_PA_KPA: "DISETUJUI PA / KPA",
  PERLU_REVISI: "PERLU REVISI",
  SIAP_RUP: "SIAP RUP",
  RUP_TAYANG: "RUP TAYANG",
  REVISI: "PERLU REVISI",
  DISETUJUI: "DISETUJUI - SIAP RUP",
  SUDAH_TAYANG: "RUP TAYANG",
  BELUM_INPUT: "DRAFT",
  PROSES_VERIFIKASI: "DIAJUKAN",
  MENUNGGU_PPTK: "DIAJUKAN",
  MENUNGGU_PPK: "DIAJUKAN",
  MENUNGGU_KPA_PA: "DIAJUKAN",
  REVISI_PAGU: "PERLU REVISI",
  DITARIK: "DITARIK",
};

export const planningStatusStyles: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-600",
  DIAJUKAN: "bg-blue-100 text-blue-700",
  MENUNGGU_VERIFIKASI_KEPALA_UNIT: "bg-blue-100 text-blue-700",
  DIVERIFIKASI_KEPALA_UNIT: "bg-emerald-100 text-emerald-700",
  MENUNGGU_VALIDASI_PPK_PPTK: "bg-blue-100 text-blue-700",
  DIVALIDASI_PPK_PPTK: "bg-emerald-100 text-emerald-700",
  MENUNGGU_PERSETUJUAN_PA_KPA: "bg-blue-100 text-blue-700",
  DISETUJUI_PA_KPA: "bg-emerald-100 text-emerald-700",
  PERLU_REVISI: "bg-orange-100 text-orange-700",
  SIAP_RUP: "bg-emerald-100 text-emerald-700",
  RUP_TAYANG: "bg-green-100 text-green-800",
  REVISI: "bg-orange-100 text-orange-700",
  DISETUJUI: "bg-emerald-100 text-emerald-700",
  SUDAH_TAYANG: "bg-green-100 text-green-800",
  BELUM_INPUT: "bg-slate-100 text-slate-600",
  PROSES_VERIFIKASI: "bg-blue-100 text-blue-700",
  MENUNGGU_PPTK: "bg-blue-100 text-blue-700",
  MENUNGGU_PPK: "bg-blue-100 text-blue-700",
  MENUNGGU_KPA_PA: "bg-blue-100 text-blue-700",
  REVISI_PAGU: "bg-orange-100 text-orange-700",
  DITARIK: "bg-red-100 text-red-700",
};

export function normalizeUnit(value?: string | null) {
  return value?.trim().toLowerCase() ?? "";
}

function canonicalUnit(value?: string | null) {
  return normalizeUnit(value)
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\b(seksi|unit|bidang|laboratorium|lab|instalasi)\b/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function unitScopeTerms(value?: string | null) {
  const terms = new Set<string>();
  const normalized = normalizeUnit(value);
  const canonical = canonicalUnit(value);

  if (normalized) terms.add(normalized);
  if (canonical) terms.add(canonical);

  return Array.from(terms).filter((term) => term.length >= 4);
}

export function isSameUnitScope(
  proposalUnit?: string | null,
  userUnit?: string | null,
) {
  const proposalTerms = unitScopeTerms(proposalUnit);
  const userTerms = unitScopeTerms(userUnit);

  return proposalTerms.some((proposalTerm) =>
    userTerms.some(
      (userTerm) =>
        proposalTerm === userTerm ||
        proposalTerm.includes(userTerm) ||
        userTerm.includes(proposalTerm),
    ),
  );
}

export function isDraftStatus(status: StatusUsulan | string) {
  return status === "DRAFT" || status === "BELUM_INPUT";
}

export function isRevisionStatus(status: StatusUsulan | string) {
  return status === "PERLU_REVISI" || status === "REVISI" || status === "REVISI_PAGU";
}

export function isReadyRupStatus(status: StatusUsulan | string) {
  return status === "DISETUJUI" || status === "DISETUJUI_PA_KPA" || status === "SIAP_RUP";
}

export function isRupPublishedStatus(status: StatusUsulan | string) {
  return status === "RUP_TAYANG" || status === "SUDAH_TAYANG";
}

export function canEditUsulan(userRoles: RoleCode[], status: StatusUsulan) {
  if (userRoles.includes("SUPER_ADMIN")) return true;
  if (!userRoles.includes("OPERATOR")) {
    return false;
  }

  return isDraftStatus(status) || isRevisionStatus(status);
}

export function canViewVerification(userRoles: RoleCode[]) {
  return userRoles.some((role) =>
    ["SUPER_ADMIN", "LEADER", "PPTK", "PPK", "PA", "KPA", "UKPBJ", "LPSE_ADMIN"].includes(role),
  );
}

export function canRunHeadUnitVerification(userRoles: RoleCode[]) {
  return userRoles.some((role) => ["SUPER_ADMIN", "LEADER"].includes(role));
}

export function canRunPpkPptkValidation(userRoles: RoleCode[]) {
  return userRoles.some((role) => ["SUPER_ADMIN", "PPK", "PPTK"].includes(role));
}

export function canRunPaKpaApproval(userRoles: RoleCode[]) {
  return userRoles.some((role) => ["SUPER_ADMIN", "PA", "KPA"].includes(role));
}

export function canProcessRup(userRoles: RoleCode[]) {
  return userRoles.some((role) =>
    ["SUPER_ADMIN", "UKPBJ", "LPSE_ADMIN"].includes(role),
  );
}

export function canAccessProposalUnit({
  proposalUnit,
  userName,
  userRoles,
  userUnit,
}: {
  proposalUnit: string;
  userName?: string | null;
  userRoles: RoleCode[];
  userUnit?: string | null;
}) {
  if (
    userRoles.some((role) =>
      ["SUPER_ADMIN", "PPTK", "PPK", "PA", "KPA", "UKPBJ", "LPSE_ADMIN"].includes(role),
    )
  ) {
    return true;
  }

  if (!userRoles.includes("LEADER")) return false;

  return (
    isSameUnitScope(proposalUnit, userUnit) ||
    isSameUnitScope(proposalUnit, userName)
  );
}

export function canVerifyProposalUnit(args: Parameters<typeof canAccessProposalUnit>[0]) {
  return canRunHeadUnitVerification(args.userRoles) && canAccessProposalUnit(args);
}

export function canSubmitTransition(from: StatusUsulan, to: StatusUsulan) {
  return (
    (isDraftStatus(from) && to === "MENUNGGU_VERIFIKASI_KEPALA_UNIT") ||
    (isRevisionStatus(from) && to === "MENUNGGU_VERIFIKASI_KEPALA_UNIT") ||
    (isDraftStatus(from) && to === "DIAJUKAN") ||
    (isRevisionStatus(from) && to === "DIAJUKAN")
  );
}

export function canVerificationTransition(from: StatusUsulan, to: StatusUsulan) {
  return (
    ((["DIAJUKAN", "MENUNGGU_VERIFIKASI_KEPALA_UNIT"] as StatusUsulan[]).includes(from) &&
      (to === "PERLU_REVISI" || to === "MENUNGGU_VALIDASI_PPK_PPTK")) ||
    (from === "MENUNGGU_VALIDASI_PPK_PPTK" &&
      (to === "PERLU_REVISI" || to === "MENUNGGU_PERSETUJUAN_PA_KPA")) ||
    (from === "MENUNGGU_PERSETUJUAN_PA_KPA" &&
      (to === "PERLU_REVISI" || to === "SIAP_RUP"))
  );
}

export type PlanningApprovalStage = "kepala_unit" | "ppk_pptk" | "pa_kpa";

export const headUnitWaitingStatuses = [
  "DIAJUKAN",
  "MENUNGGU_VERIFIKASI_KEPALA_UNIT",
] as const satisfies StatusUsulan[];

export function getApprovalStage(status: StatusUsulan | string): PlanningApprovalStage | null {
  if ((headUnitWaitingStatuses as readonly string[]).includes(status)) return "kepala_unit";
  if (status === "MENUNGGU_VALIDASI_PPK_PPTK") return "ppk_pptk";
  if (status === "MENUNGGU_PERSETUJUAN_PA_KPA") return "pa_kpa";
  return null;
}

export function getPrimaryApprovalRole(userRoles: RoleCode[], stage: PlanningApprovalStage) {
  if (stage === "kepala_unit" && userRoles.includes("LEADER")) return "LEADER";
  if (stage === "ppk_pptk" && userRoles.includes("PPK")) return "PPK";
  if (stage === "ppk_pptk" && userRoles.includes("PPTK")) return "PPTK";
  if (stage === "pa_kpa" && userRoles.includes("PA")) return "PA";
  if (stage === "pa_kpa" && userRoles.includes("KPA")) return "KPA";
  if (userRoles.includes("SUPER_ADMIN")) return "SUPER_ADMIN";
  return null;
}

export function canRunApprovalStage(userRoles: RoleCode[], stage: PlanningApprovalStage | null) {
  if (!stage) return false;
  if (stage === "kepala_unit") return canRunHeadUnitVerification(userRoles);
  if (stage === "ppk_pptk") return canRunPpkPptkValidation(userRoles);
  return canRunPaKpaApproval(userRoles);
}

export function nextApprovalStatus(stage: PlanningApprovalStage, action: "approve" | "request_revision") {
  if (action === "request_revision") return "PERLU_REVISI" as const;
  if (stage === "kepala_unit") return "MENUNGGU_VALIDASI_PPK_PPTK" as const;
  if (stage === "ppk_pptk") return "MENUNGGU_PERSETUJUAN_PA_KPA" as const;
  return "SIAP_RUP" as const;
}
