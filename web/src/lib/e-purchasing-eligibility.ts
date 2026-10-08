import {
  PaketMetodePengadaan,
  RupStatus,
  StatusUsulan,
  type Prisma,
} from "@prisma/client";

export const ePurchasingEligibleSirupStatuses = [
  RupStatus.SIAP_RUP,
  RupStatus.SUDAH_TAYANG,
] as const;

export const ePurchasingEligibleProposalStatuses = [
  StatusUsulan.SIAP_RUP,
  StatusUsulan.RUP_TAYANG,
] as const;

export function buildEPurchasingEligibilityWhere(
  extraWhere: Prisma.RencanaUmumPengadaanWhereInput = {},
): Prisma.RencanaUmumPengadaanWhereInput {
  return {
    metodePengadaan: PaketMetodePengadaan.E_PURCHASING,
    AND: [
      extraWhere,
      {
        OR: [
          { statusSirup: { in: [...ePurchasingEligibleSirupStatuses] } },
          { statusUsulan: { in: [...ePurchasingEligibleProposalStatuses] } },
        ],
      },
    ],
  };
}

export function isEligibleForEPurchasing(data: {
  metodePengadaan?: PaketMetodePengadaan | string | null;
  statusSirup?: RupStatus | string | null;
  statusUsulan?: StatusUsulan | string | null;
}) {
  if (data.metodePengadaan !== PaketMetodePengadaan.E_PURCHASING) {
    return false;
  }

  return (
    (ePurchasingEligibleSirupStatuses as readonly string[]).includes(
      String(data.statusSirup ?? ""),
    ) ||
    (ePurchasingEligibleProposalStatuses as readonly string[]).includes(
      String(data.statusUsulan ?? ""),
    )
  );
}
