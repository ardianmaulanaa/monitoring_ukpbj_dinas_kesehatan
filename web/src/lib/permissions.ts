import type { RoleCode } from "@prisma/client";

const fullAccessRoles: RoleCode[] = ["SUPER_ADMIN"];

const nonExecutiveRoles: RoleCode[] = [
  "AUDITOR",
  "LPSE_ADMIN",
  "OPERATOR",
  "PPTK",
  "PROCUREMENT_OFFICER",
  "SELECTION_WORKGROUP",
  "UKPBJ",
  "VIEWER",
];

export function hasAnyRole(userRoles: RoleCode[], allowedRoles: RoleCode[]) {
  return userRoles.some((role) => allowedRoles.includes(role));
}

export function canMutateTransaction(userRoles: RoleCode[]) {
  if (hasAnyRole(userRoles, fullAccessRoles)) {
    return true;
  }

  if (hasAnyRole(userRoles, nonExecutiveRoles)) {
    return false;
  }

  return hasAnyRole(userRoles, [
    "LEADER",
    "PA",
    "KPA",
    "PPK",
  ]);
}

export function canAccessAdmin(userRoles: RoleCode[]) {
  return hasAnyRole(userRoles, ["SUPER_ADMIN"]);
}

export function canApprovePlanning(userRoles: RoleCode[]) {
  return hasAnyRole(userRoles, ["SUPER_ADMIN", "LEADER", "PA", "KPA", "PPK"]);
}

export function canDeletePlanningProposal(userRoles: RoleCode[]) {
  return hasAnyRole(userRoles, ["SUPER_ADMIN"]);
}

export function canSyncSirup(userRoles: RoleCode[]) {
  return hasAnyRole(userRoles, ["SUPER_ADMIN"]);
}

export function canAuditReadiness(userRoles: RoleCode[]) {
  return hasAnyRole(userRoles, ["SUPER_ADMIN", "PA", "KPA", "PPK"]);
}
