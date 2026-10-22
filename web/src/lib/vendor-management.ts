import type { RoleCode, VendorPresentationStatus, VendorProfileStatus } from "@prisma/client";

export type VendorPermission =
  | "vendor.read" | "vendor.create" | "vendor.update" | "vendor.verify" | "vendor.archive"
  | "product.read" | "product.create" | "product.update" | "product.archive"
  | "presentation.read" | "presentation.create" | "presentation.schedule" | "presentation.evaluate"
  | "evaluation.read" | "evaluation.create" | "evaluation.review" | "evaluation.finalize"
  | "vendor_report.read" | "vendor_report.export";

const rolePermissions: Partial<Record<RoleCode, VendorPermission[]>> = {
  SUPER_ADMIN: ["vendor.read", "vendor.create", "vendor.update", "vendor.verify", "vendor.archive", "product.read", "product.create", "product.update", "product.archive", "presentation.read", "presentation.create", "presentation.schedule", "presentation.evaluate", "evaluation.read", "evaluation.create", "evaluation.review", "evaluation.finalize", "vendor_report.read", "vendor_report.export"],
  UKPBJ: ["vendor.read", "vendor.create", "vendor.update", "vendor.verify", "vendor.archive", "product.read", "product.create", "product.update", "product.archive", "presentation.read", "presentation.create", "presentation.schedule", "evaluation.read", "evaluation.review", "vendor_report.read", "vendor_report.export"],
  LPSE_ADMIN: ["vendor.read", "vendor.create", "vendor.update", "vendor.verify", "product.read", "product.create", "product.update", "presentation.read", "presentation.create", "presentation.schedule", "evaluation.read", "evaluation.review", "vendor_report.read", "vendor_report.export"],
  LEADER: ["vendor.read", "product.read", "presentation.read", "evaluation.read", "evaluation.review", "vendor_report.read", "vendor_report.export"],
  PPK: ["vendor.read", "product.read", "presentation.read", "presentation.create", "presentation.evaluate", "evaluation.read", "evaluation.create", "evaluation.review", "evaluation.finalize", "vendor_report.read", "vendor_report.export"],
  PPTK: ["vendor.read", "product.read", "presentation.read", "presentation.evaluate", "evaluation.read", "evaluation.create", "vendor_report.read"],
  PROCUREMENT_OFFICER: ["vendor.read", "product.read", "presentation.read", "presentation.create", "evaluation.read", "evaluation.create", "vendor_report.read"],
  SELECTION_WORKGROUP: ["vendor.read", "product.read", "presentation.read", "presentation.evaluate", "evaluation.read", "evaluation.create", "vendor_report.read"],
  PA: ["vendor.read", "product.read", "presentation.read", "evaluation.read", "vendor_report.read", "vendor_report.export"],
  KPA: ["vendor.read", "product.read", "presentation.read", "evaluation.read", "vendor_report.read", "vendor_report.export"],
  AUDITOR: ["vendor.read", "product.read", "presentation.read", "evaluation.read", "vendor_report.read", "vendor_report.export"],
  VIEWER: ["vendor.read", "product.read", "presentation.read", "evaluation.read", "vendor_report.read"],
};

export function hasVendorPermission(roles: RoleCode[], permission: VendorPermission) {
  return roles.some((role) => rolePermissions[role]?.includes(permission));
}

export const vendorStatusTransitions: Record<VendorProfileStatus, VendorProfileStatus[]> = {
  DRAFT: ["PENDING_REVIEW", "ARCHIVED"],
  PENDING_REVIEW: ["NEEDS_REVISION", "VERIFIED_INTERNAL", "ARCHIVED"],
  NEEDS_REVISION: ["PENDING_REVIEW", "ARCHIVED"],
  VERIFIED_INTERNAL: ["NEEDS_REVISION", "ARCHIVED"],
  ARCHIVED: ["DRAFT"],
};

export const presentationStatusTransitions: Record<VendorPresentationStatus, VendorPresentationStatus[]> = {
  SUBMITTED: ["SCHEDULED", "RESCHEDULE_REQUESTED", "CANCELLED"],
  SCHEDULED: ["RESCHEDULE_REQUESTED", "COMPLETED", "CANCELLED"],
  RESCHEDULE_REQUESTED: ["SCHEDULED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

export function normalizeIdentifier(value: string) {
  return value.replace(/[^0-9A-Za-z]/g, "").toUpperCase();
}

export function maskTaxId(value: string | null) {
  if (!value) return "-";
  const normalized = normalizeIdentifier(value);
  return normalized.length <= 6 ? "••••••" : `${normalized.slice(0, 3)}••••••${normalized.slice(-3)}`;
}
