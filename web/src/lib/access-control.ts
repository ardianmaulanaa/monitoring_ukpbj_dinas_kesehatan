export type AppRoleCode =
  | "SUPER_ADMIN"
  | "OPERATOR"
  | "LEADER"
  | "PPTK"
  | "PA"
  | "KPA"
  | "PPK"
  | "PROCUREMENT_OFFICER"
  | "SELECTION_WORKGROUP"
  | "UKPBJ"
  | "LPSE_ADMIN"
  | "AUDITOR"
  | "VIEWER";

const allRoles: AppRoleCode[] = [
  "SUPER_ADMIN",
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
  "AUDITOR",
  "VIEWER",
];

const planningRoles: AppRoleCode[] = [
  "SUPER_ADMIN",
  "OPERATOR",
  "LEADER",
  "PPTK",
  "PA",
  "KPA",
  "PPK",
  "UKPBJ",
];

const procurementRoles: AppRoleCode[] = [
  "SUPER_ADMIN",
  "PPK",
  "PROCUREMENT_OFFICER",
  "SELECTION_WORKGROUP",
  "UKPBJ",
];

const contractRoles: AppRoleCode[] = [
  "SUPER_ADMIN",
  "PA",
  "KPA",
  "PPK",
  "PROCUREMENT_OFFICER",
  "UKPBJ",
  "AUDITOR",
];

const monitoringRoles: AppRoleCode[] = [
  "SUPER_ADMIN",
  "PA",
  "KPA",
  "PPK",
  "PROCUREMENT_OFFICER",
  "UKPBJ",
  "AUDITOR",
];

const reportingRoles: AppRoleCode[] = [
  "SUPER_ADMIN",
  "PA",
  "KPA",
  "PPK",
  "UKPBJ",
  "AUDITOR",
  "VIEWER",
];

const routeAccess: { prefix: string; roles: AppRoleCode[] }[] = [
  { prefix: "/dashboard", roles: allRoles },
  { prefix: "/profile", roles: allRoles },
  { prefix: "/pengadaan/perencanaan", roles: planningRoles },
  { prefix: "/rup", roles: [...planningRoles, "LPSE_ADMIN", "VIEWER", "AUDITOR"] },
  { prefix: "/katalog", roles: procurementRoles },
  { prefix: "/pengadaan", roles: procurementRoles },
  { prefix: "/paket", roles: [...planningRoles, ...procurementRoles] },
  { prefix: "/data-barang", roles: ["SUPER_ADMIN", "OPERATOR", "PPK", "UKPBJ"] },
  { prefix: "/kontrak", roles: contractRoles },
  { prefix: "/progres", roles: monitoringRoles },
  { prefix: "/serah-terima", roles: monitoringRoles },
  { prefix: "/realisasi", roles: [...monitoringRoles, "VIEWER"] },
  { prefix: "/warning", roles: monitoringRoles },
  { prefix: "/audit", roles: ["SUPER_ADMIN", "PA", "KPA", "UKPBJ", "AUDITOR"] },
  { prefix: "/timeline", roles: allRoles },
  { prefix: "/penyedia", roles: ["SUPER_ADMIN", "PPK", "PROCUREMENT_OFFICER", "SELECTION_WORKGROUP", "UKPBJ"] },
  { prefix: "/klinik", roles: ["SUPER_ADMIN", "OPERATOR", "LEADER", "PPK", "UKPBJ"] },
  { prefix: "/dokumen", roles: [...planningRoles, ...procurementRoles, "AUDITOR"] },
  { prefix: "/laporan", roles: reportingRoles },
  { prefix: "/master", roles: ["SUPER_ADMIN"] },
  { prefix: "/pengaturan", roles: ["SUPER_ADMIN"] },
  { prefix: "/admin/sinkronisasi", roles: ["SUPER_ADMIN", "LPSE_ADMIN"] },
  { prefix: "/admin", roles: ["SUPER_ADMIN"] },
];

export function hasRole(userRoles: string[], allowedRoles: string[]) {
  return userRoles.some((role) => allowedRoles.includes(role));
}

export function getAllowedRolesForPath(pathname: string) {
  const match = routeAccess.find(
    (item) => pathname === item.prefix || pathname.startsWith(`${item.prefix}/`),
  );

  return match?.roles ?? allRoles;
}

export function canAccessPath(pathname: string, userRoles: string[]) {
  if (userRoles.includes("SUPER_ADMIN")) {
    return true;
  }

  return hasRole(userRoles, getAllowedRolesForPath(pathname));
}
