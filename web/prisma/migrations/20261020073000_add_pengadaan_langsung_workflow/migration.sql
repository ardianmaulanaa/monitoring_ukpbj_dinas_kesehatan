CREATE TABLE IF NOT EXISTS "pengadaan_langsung_workflow" (
  "id" CHAR(36) NOT NULL,
  "rup_id" CHAR(36) NOT NULL,
  "paket_id" CHAR(36) NOT NULL,
  "rincian" JSONB,
  "penyedia" JSONB,
  "negosiasi" JSONB,
  "kontrak" JSONB,
  "pengiriman" JSONB,
  "pemeriksaan" JSONB,
  "pembayaran" JSONB,
  "tahap_aktif" VARCHAR(40) NOT NULL DEFAULT 'RINCIAN',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "pengadaan_langsung_workflow_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "pengadaan_langsung_workflow_rup_id_fkey" FOREIGN KEY ("rup_id") REFERENCES "rencana_umum_pengadaan"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "pengadaan_langsung_workflow_paket_id_fkey" FOREIGN KEY ("paket_id") REFERENCES "paket_pengadaan"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "pengadaan_langsung_workflow_rup_id_key" ON "pengadaan_langsung_workflow"("rup_id");
CREATE UNIQUE INDEX IF NOT EXISTS "pengadaan_langsung_workflow_paket_id_key" ON "pengadaan_langsung_workflow"("paket_id");
CREATE INDEX IF NOT EXISTS "pengadaan_langsung_workflow_tahap_aktif_idx" ON "pengadaan_langsung_workflow"("tahap_aktif");
