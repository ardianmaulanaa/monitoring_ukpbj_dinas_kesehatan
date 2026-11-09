import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateProcurementKpis,
  getDashboardRiskPackageCount,
  isProcurementComplete,
} from "./procurement-completion.ts";
import {
  isFinalPaymentStatus,
  type PengadaanLangsungWorkflowData,
} from "./pengadaan-langsung-status.ts";

function directWorkflow(
  statusPembayaran: string,
  allStagesRecorded = true,
): PengadaanLangsungWorkflowData {
  const recorded = allStagesRecorded ? { saved: true } : {};
  return {
    rincian: recorded,
    penyedia: recorded,
    negosiasi: recorded,
    kontrak: recorded,
    pengiriman: recorded,
    pemeriksaan: recorded,
    pembayaran: { statusPembayaran, nilai: 100 },
    tahapAktif: "PEMBAYARAN",
  };
}

test("E-Purchasing hanya menerima status final yang terkontrol", () => {
  for (const status of ["SELESAI"]) {
    assert.equal(isProcurementComplete({ metodePengadaan: "E_PURCHASING", statusTransaksiKatalog: status }), true);
  }
  for (const status of ["PEMERIKSAAN", "KONTRAK", "GAGAL", "BATAL", "", null]) {
    assert.equal(isProcurementComplete({ metodePengadaan: "E_PURCHASING", statusTransaksiKatalog: status }), false);
  }
  assert.equal(isProcurementComplete({ metodePengadaan: "E_PURCHASING", statusPembayaranEp: "BELUM_DIBAYAR" }), false);
  assert.equal(isProcurementComplete({ metodePengadaan: "E_PURCHASING", statusPembayaranEp: "DIBAYAR" }), true);
});

test("status pembayaran final dinormalisasi tanpa substring longgar", () => {
  assert.equal(isFinalPaymentStatus("Sudah Dibayar"), true);
  assert.equal(isFinalPaymentStatus("lunas"), true);
  assert.equal(isFinalPaymentStatus("BELUM_DIBAYAR"), false);
  assert.equal(isFinalPaymentStatus("AKAN_DIBAYAR"), false);
});

test("Pengadaan Langsung membutuhkan tujuh tahap dan pembayaran final", () => {
  assert.equal(isProcurementComplete({ metodePengadaan: "PENGADAAN_LANGSUNG", pengadaanLangsung: directWorkflow("LUNAS") }), true);
  assert.equal(isProcurementComplete({ metodePengadaan: "PENGADAAN_LANGSUNG", pengadaanLangsung: directWorkflow("BELUM_DIBAYAR") }), false);
  assert.equal(isProcurementComplete({ metodePengadaan: "PENGADAAN_LANGSUNG", pengadaanLangsung: directWorkflow("LUNAS", false) }), false);
});

test("SiRUP/Tender tidak otomatis selesai dan KPI risiko tetap nonaktif", () => {
  assert.equal(isProcurementComplete({ metodePengadaan: "TENDER" }), false);
  assert.equal(getDashboardRiskPackageCount(), 0);
});

test("snapshot 18 paket dihitung dinamis menjadi 14 selesai dan 0 risiko", () => {
  const packages = [
    ...Array.from({ length: 11 }, () => ({ metodePengadaan: "E_PURCHASING", statusTransaksiKatalog: "SELESAI" })),
    ...Array.from({ length: 3 }, () => ({ metodePengadaan: "PENGADAAN_LANGSUNG", pengadaanLangsung: directWorkflow("SUDAH DIBAYAR") })),
    ...Array.from({ length: 3 }, () => ({ metodePengadaan: "E_PURCHASING", statusTransaksiKatalog: "PEMERIKSAAN" })),
    { metodePengadaan: "E_PURCHASING", statusTransaksiKatalog: "KONTRAK" },
  ];
  assert.deepEqual(calculateProcurementKpis(packages), {
    totalPackages: 18,
    completedPackages: 14,
    incompletePackages: 4,
    completedPercentage: 77.8,
    riskyPackages: 0,
    riskyPercentage: 0,
  });
  assert.deepEqual(calculateProcurementKpis([]), {
    totalPackages: 0,
    completedPackages: 0,
    incompletePackages: 0,
    completedPercentage: 0,
    riskyPackages: 0,
    riskyPercentage: 0,
  });
});
