DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'StatusUsulan') THEN
    CREATE TYPE "StatusUsulan" AS ENUM (
      'DRAFT',
      'DIAJUKAN',
      'PERLU_REVISI',
      'SIAP_RUP',
      'RUP_TAYANG'
    );
  END IF;
END $$;

ALTER TABLE "rencana_umum_pengadaan"
  ADD COLUMN IF NOT EXISTS "status_usulan" "StatusUsulan" NOT NULL DEFAULT 'DRAFT';

UPDATE "rencana_umum_pengadaan"
SET "status_usulan" = CASE
  WHEN "status_sirup"::text IN ('DIAJUKAN', 'VERIFIKASI') THEN 'DIAJUKAN'::"StatusUsulan"
  WHEN "status_sirup"::text IN ('REVISI', 'REVISI_PAGU') THEN 'PERLU_REVISI'::"StatusUsulan"
  WHEN "status_sirup"::text IN ('DISETUJUI', 'SIAP_RUP') THEN 'SIAP_RUP'::"StatusUsulan"
  WHEN "status_sirup"::text = 'SUDAH_TAYANG' THEN 'RUP_TAYANG'::"StatusUsulan"
  ELSE 'DRAFT'::"StatusUsulan"
END
WHERE "status_usulan" = 'DRAFT'::"StatusUsulan";

ALTER TABLE "usulan_verification_history"
  ALTER COLUMN "old_status" TYPE "StatusUsulan"
  USING CASE
    WHEN "old_status"::text IN ('DIAJUKAN', 'VERIFIKASI') THEN 'DIAJUKAN'::"StatusUsulan"
    WHEN "old_status"::text IN ('REVISI', 'REVISI_PAGU') THEN 'PERLU_REVISI'::"StatusUsulan"
    WHEN "old_status"::text IN ('DISETUJUI', 'SIAP_RUP') THEN 'SIAP_RUP'::"StatusUsulan"
    WHEN "old_status"::text = 'SUDAH_TAYANG' THEN 'RUP_TAYANG'::"StatusUsulan"
    WHEN "old_status" IS NULL THEN NULL
    ELSE 'DRAFT'::"StatusUsulan"
  END,
  ALTER COLUMN "new_status" TYPE "StatusUsulan"
  USING CASE
    WHEN "new_status"::text IN ('DIAJUKAN', 'VERIFIKASI') THEN 'DIAJUKAN'::"StatusUsulan"
    WHEN "new_status"::text IN ('REVISI', 'REVISI_PAGU') THEN 'PERLU_REVISI'::"StatusUsulan"
    WHEN "new_status"::text IN ('DISETUJUI', 'SIAP_RUP') THEN 'SIAP_RUP'::"StatusUsulan"
    WHEN "new_status"::text = 'SUDAH_TAYANG' THEN 'RUP_TAYANG'::"StatusUsulan"
    WHEN "new_status" IS NULL THEN NULL
    ELSE 'DRAFT'::"StatusUsulan"
  END;

CREATE INDEX IF NOT EXISTS "rencana_umum_pengadaan_status_usulan_idx"
  ON "rencana_umum_pengadaan"("status_usulan");
