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
  "LEADER",
  "PA",
  "KPA",
  "PPK",
];

const planningRoles: AppRoleCode[] = [
  "SUPER_ADMIN",
  "LEADER",
  "PA",
  "KPA",
  "PPK",
];

const procurementRoles: AppRoleCode[] = [
  "SUPER_ADMIN",
  "PPK",
];

const contractRoles: AppRoleCode[] = [
  "SUPER_ADMIN",
  "PA",
  "KPA",
  "PPK",
];

const monitoringRoles: AppRoleCode[] = [
  "SUPER_ADMIN",
  "PA",
  "KPA",
  "PPK",
];

const reportingRoles: AppRoleCode[] = [
  "SUPER_ADMIN",
  "PA",
  "KPA",
  "PPK",
];

const routeAccess: { prefix: string; roles: AppRoleCode[] }[] = [
  { prefix: "/dashboard", roles: allRoles },
  { prefix: "/notifications", roles: allRoles },
  { prefix: "/profile", roles: allRoles },
  { prefix: "/perencanaan", roles: planningRoles },
  { prefix: "/sirup-rup", roles: planningRoles },
  { prefix: "/katalog-v6-v5", roles: procurementRoles },
  { prefix: "/tender-non-tender", roles: procurementRoles },
  { prefix: "/paket-pengadaan", roles: [...planningRoles, ...procurementRoles] },
  { prefix: "/data-barang", roles: ["SUPER_ADMIN", "PPK"] },
  { prefix: "/kontrak-sp", roles: contractRoles },
  { prefix: "/progres-fisik", roles: monitoringRoles },
  { prefix: "/serah-terima", roles: monitoringRoles },
  { prefix: "/realisasi-belanja", roles: monitoringRoles },
  { prefix: "/risiko-mitigasi", roles: monitoringRoles },
  { prefix: "/audit-readiness", roles: ["SUPER_ADMIN", "PA", "KPA", "PPK"] },
  { prefix: "/timeline", roles: allRoles },
  { prefix: "/vendor-pasar", roles: [] },
  { prefix: "/klinik-ukpbj", roles: ["SUPER_ADMIN", "LEADER", "PPK"] },
  { prefix: "/dokumen-template", roles: [...planningRoles, ...procurementRoles] },
  { prefix: "/laporan", roles: reportingRoles },
  { prefix: "/master-data", roles: ["SUPER_ADMIN"] },
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
