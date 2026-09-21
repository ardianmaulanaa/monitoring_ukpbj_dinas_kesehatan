ALTER TABLE `rencana_umum_pengadaan`
    ADD COLUMN `id_rup_sirup` VARCHAR(80) NULL,
    ADD COLUMN `tanggal_input_sirup` VARCHAR(120) NULL,
    ADD COLUMN `tanggal_tayang_sirup` VARCHAR(120) NULL,
    ADD COLUMN `link_sirup` VARCHAR(255) NULL;

CREATE INDEX `rencana_umum_pengadaan_id_rup_sirup_idx` ON `rencana_umum_pengadaan`(`id_rup_sirup`);
