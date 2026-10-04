import type { RoleCode, StatusUsulan } from "@prisma/client";

export const USULAN_STATUSES = [
  "DRAFT",
  "DIAJUKAN",
  "PERLU_REVISI",
  "SIAP_RUP",
  "RUP_TAYANG",
] as const satisfies StatusUsulan[];

export const verificationQueueStatuses = [
  "DIAJUKAN",
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
  return status === "DISETUJUI" || status === "SIAP_RUP";
}

export function isRupPublishedStatus(status: StatusUsulan | string) {
  return status === "RUP_TAYANG" || status === "SUDAH_TAYANG";
}

export function canEditUsulan(userRoles: RoleCode[], status: StatusUsulan) {
  if (userRoles.includes("SUPER_ADMIN")) return true;
  if (!userRoles.some((role) => ["OPERATOR", "LEADER"].includes(role))) {
    return false;
  }

  return isDraftStatus(status) || isRevisionStatus(status);
}

export function canViewVerification(userRoles: RoleCode[]) {
  return userRoles.some((role) =>
    ["SUPER_ADMIN", "LEADER", "UKPBJ", "LPSE_ADMIN"].includes(role),
  );
}

export function canRunVerification(userRoles: RoleCode[]) {
  return userRoles.some((role) => ["SUPER_ADMIN", "LEADER"].includes(role));
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
      ["SUPER_ADMIN", "UKPBJ", "LPSE_ADMIN"].includes(role),
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
  return canRunVerification(args.userRoles) && canAccessProposalUnit(args);
}

export function canSubmitTransition(from: StatusUsulan, to: StatusUsulan) {
  return (
    (isDraftStatus(from) && to === "DIAJUKAN") ||
    (isRevisionStatus(from) && to === "DIAJUKAN")
  );
}

export function canVerificationTransition(from: StatusUsulan, to: StatusUsulan) {
  return (
    (from === "DIAJUKAN" && to === "PERLU_REVISI") ||
    (from === "DIAJUKAN" && to === "SIAP_RUP")
  );
}
