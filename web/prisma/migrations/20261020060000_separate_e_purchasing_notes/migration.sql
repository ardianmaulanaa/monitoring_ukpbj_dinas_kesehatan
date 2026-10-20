-- Keep legacy catatan_katalog unchanged because its originating workflow stage
-- cannot be determined reliably for historical rows.
ALTER TABLE "rencana_umum_pengadaan"
  ADD COLUMN IF NOT EXISTS "catatan_pengiriman" TEXT,
  ADD COLUMN IF NOT EXISTS "catatan_pemeriksaan" TEXT,
  ADD COLUMN IF NOT EXISTS "catatan_pembayaran" TEXT;
