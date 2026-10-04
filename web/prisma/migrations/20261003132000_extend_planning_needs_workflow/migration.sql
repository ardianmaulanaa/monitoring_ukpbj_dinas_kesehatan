ALTER TYPE "RupStatus" ADD VALUE IF NOT EXISTS 'DRAFT';
ALTER TYPE "RupStatus" ADD VALUE IF NOT EXISTS 'DIAJUKAN';
ALTER TYPE "RupStatus" ADD VALUE IF NOT EXISTS 'VERIFIKASI';
ALTER TYPE "RupStatus" ADD VALUE IF NOT EXISTS 'REVISI';
ALTER TYPE "RupStatus" ADD VALUE IF NOT EXISTS 'DISETUJUI';
ALTER TYPE "RupStatus" ADD VALUE IF NOT EXISTS 'SIAP_RUP';

ALTER TABLE "rencana_umum_pengadaan"
  ADD COLUMN IF NOT EXISTS "jumlah_kebutuhan" DECIMAL(18,2),
  ADD COLUMN IF NOT EXISTS "estimasi_harga_satuan" DECIMAL(18,2),
  ADD COLUMN IF NOT EXISTS "total_estimasi" DECIMAL(18,2),
  ADD COLUMN IF NOT EXISTS "justifikasi" TEXT,
  ADD COLUMN IF NOT EXISTS "submitted_by" VARCHAR(160),
  ADD COLUMN IF NOT EXISTS "submitted_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "verified_by" VARCHAR(160),
  ADD COLUMN IF NOT EXISTS "verified_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "verification_note" TEXT,
  ADD COLUMN IF NOT EXISTS "verification_checklist" JSONB,
  ADD COLUMN IF NOT EXISTS "revision_note" TEXT,
  ADD COLUMN IF NOT EXISTS "revision_by" VARCHAR(160),
  ADD COLUMN IF NOT EXISTS "revision_at" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "usulan_verification_history" (
  "id" CHAR(36) NOT NULL,
  "proposal_id" CHAR(36) NOT NULL,
  "actor_id" CHAR(36),
  "actor_name" VARCHAR(160) NOT NULL,
  "action" VARCHAR(80) NOT NULL,
  "old_status" "RupStatus",
  "new_status" "RupStatus",
  "note" TEXT,
  "checklist" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "usulan_verification_history_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'usulan_verification_history_proposal_id_fkey'
  ) THEN
    ALTER TABLE "usulan_verification_history"
      ADD CONSTRAINT "usulan_verification_history_proposal_id_fkey"
      FOREIGN KEY ("proposal_id") REFERENCES "rencana_umum_pengadaan"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "usulan_verification_history_proposal_id_idx" ON "usulan_verification_history"("proposal_id");
CREATE INDEX IF NOT EXISTS "usulan_verification_history_actor_id_idx" ON "usulan_verification_history"("actor_id");
CREATE INDEX IF NOT EXISTS "usulan_verification_history_action_idx" ON "usulan_verification_history"("action");
CREATE INDEX IF NOT EXISTS "usulan_verification_history_created_at_idx" ON "usulan_verification_history"("created_at");
