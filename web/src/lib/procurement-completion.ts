import {
  isFinalPaymentStatus,
  isPengadaanLangsungComplete,
  type PengadaanLangsungWorkflowData,
} from "./pengadaan-langsung-status.ts";

type CompletionInput = {
  metodePengadaan: string;
  statusTransaksiKatalog?: string | null;
  statusPembayaranEp?: string | null;
  pengadaanLangsung?: PengadaanLangsungWorkflowData | null;
};

function statusToken(value: unknown) {
  return String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

/** Satu sumber aturan completion untuk KPI dan ringkasan metode pengadaan. */
export function isProcurementComplete(input: CompletionInput) {
  if (input.metodePengadaan === "PENGADAAN_LANGSUNG") {
    return isPengadaanLangsungComplete(input.pengadaanLangsung ?? null);
  }

  if (input.metodePengadaan === "E_PURCHASING") {
    return (
      statusToken(input.statusTransaksiKatalog) === "SELESAI" ||
      isFinalPaymentStatus(input.statusPembayaranEp)
    );
  }

  // Tender/Non-Tender belum memiliki relasi status pelaksanaan pada RUP.
  // Bersikap konservatif agar status SiRUP/RUP tidak dianggap selesai.
  return false;
}

/**
 * Pengukuran risiko dashboard dinonaktifkan sementara berdasarkan keputusan
 * bisnis. Data risiko, revisi, kendala, gagal, dan batal tetap dipertahankan.
 */
export function getDashboardRiskPackageCount() {
  return 0;
}

export function calculateProcurementKpis(packages: CompletionInput[]) {
  const totalPackages = packages.length;
  const completedPackages = packages.filter(isProcurementComplete).length;
  return {
    totalPackages,
    completedPackages,
    incompletePackages: totalPackages - completedPackages,
    completedPercentage:
      totalPackages > 0
        ? Math.round((completedPackages / totalPackages) * 1_000) / 10
        : 0,
    riskyPackages: getDashboardRiskPackageCount(),
    riskyPercentage: 0,
  };
}
