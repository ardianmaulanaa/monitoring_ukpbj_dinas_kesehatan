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

export const ePurchasingStartedWhere: Prisma.RencanaUmumPengadaanWhereInput = {
  OR: [
    { statusTransaksiKatalog: { not: null } },
    { namaProdukKatalog: { not: null } },
    { namaPenyediaKatalog: { not: null } },
    { hargaNegosiasiKatalog: { not: null } },
    { nomorSuratPesanan: { not: null } },
    { nomorSpkKontrak: { not: null } },
    { statusPengirimanEp: { not: null } },
    { nomorBast: { not: null } },
    { statusPembayaranEp: { not: null } },
  ],
};

export const ePurchasingCompletedWhere: Prisma.RencanaUmumPengadaanWhereInput = {
  OR: [
    { statusTransaksiKatalog: "SELESAI" },
    { statusPembayaranEp: "DIBAYAR" },
  ],
};

export function buildEPurchasingSummaryWhere(
  eligibleWhere: Prisma.RencanaUmumPengadaanWhereInput,
) {
  return {
    total: eligibleWhere,
    ready: {
      AND: [eligibleWhere, { NOT: ePurchasingStartedWhere }],
    } satisfies Prisma.RencanaUmumPengadaanWhereInput,
    inProgress: {
      AND: [
        eligibleWhere,
        ePurchasingStartedWhere,
        { NOT: ePurchasingCompletedWhere },
      ],
    } satisfies Prisma.RencanaUmumPengadaanWhereInput,
    completed: {
      AND: [eligibleWhere, ePurchasingCompletedWhere],
    } satisfies Prisma.RencanaUmumPengadaanWhereInput,
  };
}
