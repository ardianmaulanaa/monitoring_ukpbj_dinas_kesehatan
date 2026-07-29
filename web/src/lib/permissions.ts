import type { RoleCode } from "@prisma/client";

const fullAccessRoles: RoleCode[] = ["SUPER_ADMIN"];

const readOnlyRoles: RoleCode[] = ["AUDITOR", "VIEWER"];

export function hasAnyRole(userRoles: RoleCode[], allowedRoles: RoleCode[]) {
  return userRoles.some((role) => allowedRoles.includes(role));
}

export function canMutateTransaction(userRoles: RoleCode[]) {
  if (hasAnyRole(userRoles, fullAccessRoles)) {
    return true;
  }

  if (hasAnyRole(userRoles, readOnlyRoles)) {
    return false;
  }

  return hasAnyRole(userRoles, [
    "OPERATOR",
    "LEADER",
    "PPTK",
    "PA",
    "KPA",
    "PPK",
    "PROCUREMENT_OFFICER",
    "SELECTION_WORKGROUP",
    "UKPBJ",
    "LPSE_ADMIN",
  ]);
}

export function canAccessAdmin(userRoles: RoleCode[]) {
  return hasAnyRole(userRoles, ["SUPER_ADMIN", "LPSE_ADMIN"]);
}

export function canApprovePlanning(userRoles: RoleCode[]) {
  return hasAnyRole(userRoles, ["SUPER_ADMIN", "LEADER", "PPTK", "PA", "KPA", "PPK"]);
}

export function canSyncSirup(userRoles: RoleCode[]) {
  return hasAnyRole(userRoles, ["SUPER_ADMIN", "LPSE_ADMIN"]);
}

export function canAuditReadiness(userRoles: RoleCode[]) {
  return hasAnyRole(userRoles, ["SUPER_ADMIN", "AUDITOR", "UKPBJ", "PA", "KPA"]);
}
