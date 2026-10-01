ALTER TABLE `rencana_umum_pengadaan`
    ADD COLUMN `jenis_katalog` VARCHAR(80) NULL,
    ADD COLUMN `etalase_katalog` VARCHAR(160) NULL,
    ADD COLUMN `nama_produk_katalog` VARCHAR(220) NULL,
    ADD COLUMN `spesifikasi_produk_katalog` TEXT NULL,
    ADD COLUMN `merek_tipe_katalog` VARCHAR(160) NULL,
    ADD COLUMN `jumlah_produk_katalog` VARCHAR(80) NULL,
    ADD COLUMN `satuan_produk_katalog` VARCHAR(60) NULL,
    ADD COLUMN `harga_satuan_katalog` DECIMAL(18, 2) NULL,
    ADD COLUMN `total_harga_katalog` DECIMAL(18, 2) NULL,
    ADD COLUMN `nama_penyedia_katalog` VARCHAR(180) NULL,
    ADD COLUMN `status_negosiasi_katalog` VARCHAR(80) NULL,
    ADD COLUMN `harga_negosiasi_katalog` DECIMAL(18, 2) NULL,
    ADD COLUMN `nomor_surat_pesanan` VARCHAR(120) NULL,
    ADD COLUMN `tanggal_surat_pesanan` VARCHAR(120) NULL,
    ADD COLUMN `status_transaksi_katalog` VARCHAR(80) NULL,
    ADD COLUMN `catatan_katalog` TEXT NULL;

CREATE INDEX `rencana_umum_pengadaan_status_transaksi_katalog_idx` ON `rencana_umum_pengadaan`(`status_transaksi_katalog`);
