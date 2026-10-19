-- Atribut klasifikasi internal yang nullable agar data lama tetap kompatibel.
ALTER TABLE "rencana_umum_pengadaan"
ADD COLUMN "kategori_barang" VARCHAR(40);
