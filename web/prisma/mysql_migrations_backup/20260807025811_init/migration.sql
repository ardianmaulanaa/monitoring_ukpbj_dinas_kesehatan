-- CreateTable
CREATE TABLE `users` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(160) NOT NULL,
    `email` VARCHAR(180) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `nip` VARCHAR(40) NULL,
    `jabatan` VARCHAR(120) NULL,
    `unit_kerja` VARCHAR(160) NULL,
    `nomor_telepon` VARCHAR(40) NULL,
    `avatar_url` VARCHAR(255) NULL,
    `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    `last_login_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    INDEX `users_name_idx`(`name`),
    INDEX `users_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `roles` (
    `id` CHAR(36) NOT NULL,
    `code` ENUM('SUPER_ADMIN', 'LPSE_ADMIN', 'OPERATOR', 'LEADER', 'PPTK', 'PA', 'KPA', 'PPK', 'PROCUREMENT_OFFICER', 'SELECTION_WORKGROUP', 'UKPBJ', 'AUDITOR', 'VIEWER') NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `description` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `roles_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_roles` (
    `id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NOT NULL,
    `role_id` CHAR(36) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `user_roles_role_id_idx`(`role_id`),
    UNIQUE INDEX `user_roles_user_id_role_id_key`(`user_id`, `role_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_logs` (
    `id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NULL,
    `action` ENUM('LOGIN', 'LOGOUT', 'CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'EXPORT') NOT NULL,
    `entity` VARCHAR(120) NOT NULL,
    `entity_id` VARCHAR(120) NULL,
    `before` JSON NULL,
    `after` JSON NULL,
    `ip_address` VARCHAR(80) NULL,
    `user_agent` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `audit_logs_user_id_idx`(`user_id`),
    INDEX `audit_logs_action_idx`(`action`),
    INDEX `audit_logs_entity_idx`(`entity`),
    INDEX `audit_logs_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `data_barang` (
    `id` CHAR(36) NOT NULL,
    `kode_barang` VARCHAR(80) NOT NULL,
    `nama_barang` VARCHAR(180) NOT NULL,
    `kategori` VARCHAR(80) NOT NULL,
    `spesifikasi` TEXT NOT NULL,
    `satuan` VARCHAR(40) NOT NULL,
    `jumlah_kebutuhan` INTEGER NOT NULL DEFAULT 0,
    `harga_satuan` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `estimasi_total` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `tkdn_persen` DECIMAL(5, 2) NULL,
    `is_pdn` BOOLEAN NOT NULL DEFAULT false,
    `prioritas` ENUM('RENDAH', 'NORMAL', 'TINGGI', 'MENDESAK') NOT NULL DEFAULT 'NORMAL',
    `lokasi_penerimaan` VARCHAR(160) NULL,
    `catatan` TEXT NULL,
    `status` ENUM('AKTIF', 'NONAKTIF') NOT NULL DEFAULT 'AKTIF',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `data_barang_kode_barang_key`(`kode_barang`),
    INDEX `data_barang_nama_barang_idx`(`nama_barang`),
    INDEX `data_barang_kategori_idx`(`kategori`),
    INDEX `data_barang_prioritas_idx`(`prioritas`),
    INDEX `data_barang_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `paket_pengadaan` (
    `id` CHAR(36) NOT NULL,
    `kode_paket` VARCHAR(80) NOT NULL,
    `nama_paket` VARCHAR(220) NOT NULL,
    `unit_pemohon` VARCHAR(160) NOT NULL,
    `satuan_kerja` VARCHAR(160) NULL,
    `tahun_anggaran` INTEGER NOT NULL,
    `sumber_dana` VARCHAR(120) NOT NULL,
    `jenis_pengadaan` ENUM('BARANG', 'JASA') NOT NULL DEFAULT 'BARANG',
    `kategori` VARCHAR(100) NOT NULL,
    `metode_pengadaan` ENUM('TENDER', 'NON_TENDER', 'E_PURCHASING', 'PENGADAAN_LANGSUNG', 'SWAKELOLA') NOT NULL,
    `pagu` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `hps` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `status_paket` ENUM('PERENCANAAN', 'SIAP_DIPROSES', 'PEMILIHAN', 'PEMENANG_DITETAPKAN', 'KONTRAK', 'SELESAI', 'GAGAL', 'BATAL', 'TERLAMBAT') NOT NULL DEFAULT 'PERENCANAAN',
    `prioritas` ENUM('RENDAH', 'NORMAL', 'TINGGI', 'MENDESAK') NOT NULL DEFAULT 'NORMAL',
    `ppk_penanggung_jawab` VARCHAR(160) NULL,
    `rencana_mulai` DATE NULL,
    `rencana_selesai` DATE NULL,
    `lokasi_pelaksanaan` VARCHAR(180) NULL,
    `catatan` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `paket_pengadaan_kode_paket_key`(`kode_paket`),
    INDEX `paket_pengadaan_nama_paket_idx`(`nama_paket`),
    INDEX `paket_pengadaan_unit_pemohon_idx`(`unit_pemohon`),
    INDEX `paket_pengadaan_tahun_anggaran_idx`(`tahun_anggaran`),
    INDEX `paket_pengadaan_kategori_idx`(`kategori`),
    INDEX `paket_pengadaan_metode_pengadaan_idx`(`metode_pengadaan`),
    INDEX `paket_pengadaan_status_paket_idx`(`status_paket`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `kontrak` (
    `id` CHAR(36) NOT NULL,
    `nomor_kontrak` VARCHAR(100) NOT NULL,
    `paket_id` CHAR(36) NULL,
    `nama_paket` VARCHAR(220) NOT NULL,
    `penyedia` VARCHAR(180) NOT NULL,
    `nilai_kontrak` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `tanggal_kontrak` DATE NULL,
    `tanggal_mulai` DATE NULL,
    `tanggal_selesai` DATE NULL,
    `status` ENUM('DRAFT', 'AKTIF', 'SELESAI', 'TERLAMBAT', 'BATAL') NOT NULL DEFAULT 'DRAFT',
    `catatan` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `kontrak_nomor_kontrak_key`(`nomor_kontrak`),
    INDEX `kontrak_paket_id_idx`(`paket_id`),
    INDEX `kontrak_nama_paket_idx`(`nama_paket`),
    INDEX `kontrak_penyedia_idx`(`penyedia`),
    INDEX `kontrak_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rencana_umum_pengadaan` (
    `id` CHAR(36) NOT NULL,
    `kode_rup` VARCHAR(80) NOT NULL,
    `nama_paket` VARCHAR(220) NOT NULL,
    `unit_pengusul` VARCHAR(160) NOT NULL,
    `sumber_dana` VARCHAR(120) NOT NULL,
    `pagu` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `metode_pengadaan` ENUM('TENDER', 'NON_TENDER', 'E_PURCHASING', 'PENGADAAN_LANGSUNG', 'SWAKELOLA') NOT NULL,
    `jadwal_pemilihan` VARCHAR(120) NULL,
    `tahun_anggaran` INTEGER NOT NULL,
    `status_sirup` ENUM('BELUM_INPUT', 'PROSES_VERIFIKASI', 'MENUNGGU_PPTK', 'MENUNGGU_PPK', 'MENUNGGU_KPA_PA', 'SUDAH_TAYANG', 'REVISI_PAGU', 'DITARIK') NOT NULL DEFAULT 'BELUM_INPUT',
    `catatan` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `rencana_umum_pengadaan_kode_rup_key`(`kode_rup`),
    INDEX `rencana_umum_pengadaan_nama_paket_idx`(`nama_paket`),
    INDEX `rencana_umum_pengadaan_unit_pengusul_idx`(`unit_pengusul`),
    INDEX `rencana_umum_pengadaan_sumber_dana_idx`(`sumber_dana`),
    INDEX `rencana_umum_pengadaan_tahun_anggaran_idx`(`tahun_anggaran`),
    INDEX `rencana_umum_pengadaan_metode_pengadaan_idx`(`metode_pengadaan`),
    INDEX `rencana_umum_pengadaan_status_sirup_idx`(`status_sirup`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sumber_dana` (
    `id` CHAR(36) NOT NULL,
    `kode` VARCHAR(40) NOT NULL,
    `nama` VARCHAR(120) NOT NULL,
    `aktif` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `sumber_dana_kode_key`(`kode`),
    INDEX `sumber_dana_nama_idx`(`nama`),
    INDEX `sumber_dana_aktif_idx`(`aktif`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `user_roles` ADD CONSTRAINT `user_roles_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_roles` ADD CONSTRAINT `user_roles_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
