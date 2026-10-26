export const pengadaanLangsungStageKeys = [
  "rincian",
  "penyedia",
  "negosiasi",
  "kontrak",
  "pengiriman",
  "pemeriksaan",
  "pembayaran",
] as const;

export type PengadaanLangsungWorkflowData = {
  rincian: unknown;
  penyedia: unknown;
  negosiasi: unknown;
  kontrak: unknown;
  pengiriman: unknown;
  pemeriksaan: unknown;
  pembayaran: unknown;
  tahapAktif: string;
};

export function jsonObject(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function normalized(value: unknown) {
  return String(value ?? "").trim().toUpperCase();
}

export function isPengadaanLangsungComplete(
  workflow: PengadaanLangsungWorkflowData | null,
) {
  if (!workflow) return false;

  const allStagesRecorded = pengadaanLangsungStageKeys.every(
    (key) => Object.keys(jsonObject(workflow[key])).length > 0,
  );
  const payment = jsonObject(workflow.pembayaran);
  const paymentFinished = ["DIBAYAR", "LUNAS", "SELESAI"].includes(
    normalized(payment.statusPembayaran),
  );

  // Progress 100% hanya menunjukkan tujuh form pernah disimpan. Status akhir
  // pembayaran tetap wajib agar paket sah dikategorikan selesai.
  return allStagesRecorded && paymentFinished;
}

export function getPengadaanLangsungProgress(
  workflow: PengadaanLangsungWorkflowData | null,
) {
  if (!workflow) return 0;
  const completed = pengadaanLangsungStageKeys.filter(
    (key) => Object.keys(jsonObject(workflow[key])).length > 0,
  ).length;
  return Math.round((completed / pengadaanLangsungStageKeys.length) * 100);
}

export function getPengadaanLangsungStatus(
  workflow: PengadaanLangsungWorkflowData | null,
) {
  if (!workflow) return "SIAP" as const;
  const searchable = JSON.stringify(
    pengadaanLangsungStageKeys.map((key) => jsonObject(workflow[key])),
  ).toUpperCase();
  if (/DIBATALKAN|BATAL/.test(searchable)) return "DIBATALKAN" as const;
  if (/PERLU REVISI|REVISI/.test(searchable)) return "REVISI" as const;
  if (isPengadaanLangsungComplete(workflow)) return "SELESAI" as const;
  return getPengadaanLangsungProgress(workflow) > 0 ? ("PROSES" as const) : ("SIAP" as const);
}
