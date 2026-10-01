-- CreateTable
CREATE TABLE `risiko_mitigasi` (
    `id` CHAR(36) NOT NULL,
    `paket_id` CHAR(36) NULL,
    `risiko` TEXT NOT NULL,
    `level` ENUM('RENDAH', 'SEDANG', 'TINGGI') NOT NULL DEFAULT 'SEDANG',
    `mitigasi` TEXT NOT NULL,
    `pic` VARCHAR(160) NOT NULL,
    `deadline` DATE NULL,
    `status` ENUM('PERLU_TINDAK_LANJUT', 'PROSES', 'SELESAI') NOT NULL DEFAULT 'PERLU_TINDAK_LANJUT',
    `catatan` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `risiko_mitigasi_paket_id_idx`(`paket_id`),
    INDEX `risiko_mitigasi_level_idx`(`level`),
    INDEX `risiko_mitigasi_status_idx`(`status`),
    INDEX `risiko_mitigasi_deadline_idx`(`deadline`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `penyedia` (
    `id` CHAR(36) NOT NULL,
    `nama` VARCHAR(180) NOT NULL,
    `npwp` VARCHAR(40) NULL,
    `alamat` TEXT NULL,
    `kontak_person` VARCHAR(120) NULL,
    `email` VARCHAR(180) NULL,
    `telepon` VARCHAR(40) NULL,
    `kategori` VARCHAR(100) NULL,
    `status` ENUM('AKTIF', 'NONAKTIF', 'BLACKLIST') NOT NULL DEFAULT 'AKTIF',
    `catatan` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `penyedia_nama_key`(`nama`),
    INDEX `penyedia_nama_idx`(`nama`),
    INDEX `penyedia_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `realisasi_belanja` (
    `id` CHAR(36) NOT NULL,
    `paket_id` CHAR(36) NULL,
    `kontrak_id` CHAR(36) NULL,
    `sumber_dana` VARCHAR(120) NOT NULL,
    `tahun_anggaran` INTEGER NOT NULL,
    `nilai_pagu` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `nilai_hps` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `nilai_kontrak` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `nilai_realisasi` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `tanggal_bayar` DATE NULL,
    `nomor_bukti` VARCHAR(100) NULL,
    `catatan` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `realisasi_belanja_paket_id_idx`(`paket_id`),
    INDEX `realisasi_belanja_kontrak_id_idx`(`kontrak_id`),
    INDEX `realisasi_belanja_sumber_dana_idx`(`sumber_dana`),
    INDEX `realisasi_belanja_tahun_anggaran_idx`(`tahun_anggaran`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `progres_paket` (
    `id` CHAR(36) NOT NULL,
    `paket_id` CHAR(36) NULL,
    `tahap` VARCHAR(120) NOT NULL,
    `persentase` INTEGER NOT NULL DEFAULT 0,
    `status` ENUM('RENCANA', 'BERJALAN', 'SELESAI', 'TERLAMBAT') NOT NULL DEFAULT 'BERJALAN',
    `tanggal` DATE NULL,
    `catatan` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `progres_paket_paket_id_idx`(`paket_id`),
    INDEX `progres_paket_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `serah_terima` (
    `id` CHAR(36) NOT NULL,
    `paket_id` CHAR(36) NULL,
    `kontrak_id` CHAR(36) NULL,
    `nomor_dokumen` VARCHAR(100) NOT NULL,
    `tanggal_dokumen` DATE NULL,
    `pemeriksa` VARCHAR(160) NULL,
    `status` ENUM('RENCANA', 'BERJALAN', 'SELESAI', 'TERLAMBAT') NOT NULL DEFAULT 'BERJALAN',
    `catatan` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `serah_terima_nomor_dokumen_key`(`nomor_dokumen`),
    INDEX `serah_terima_paket_id_idx`(`paket_id`),
    INDEX `serah_terima_kontrak_id_idx`(`kontrak_id`),
    INDEX `serah_terima_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `timeline_events` (
    `id` CHAR(36) NOT NULL,
    `paket_id` CHAR(36) NULL,
    `kontrak_id` CHAR(36) NULL,
    `judul` VARCHAR(180) NOT NULL,
    `tahap` VARCHAR(120) NOT NULL,
    `unit_kerja` VARCHAR(160) NULL,
    `tanggal_mulai` DATE NULL,
    `tanggal_selesai` DATE NULL,
    `status` ENUM('RENCANA', 'BERJALAN', 'SELESAI', 'TERLAMBAT') NOT NULL DEFAULT 'RENCANA',
    `catatan` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `timeline_events_paket_id_idx`(`paket_id`),
    INDEX `timeline_events_kontrak_id_idx`(`kontrak_id`),
    INDEX `timeline_events_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_checklist` (
    `id` CHAR(36) NOT NULL,
    `paket_id` CHAR(36) NULL,
    `dokumen` VARCHAR(160) NOT NULL,
    `status` ENUM('BELUM_ADA', 'PROSES', 'LENGKAP') NOT NULL DEFAULT 'BELUM_ADA',
    `catatan` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `audit_checklist_status_idx`(`status`),
    UNIQUE INDEX `audit_checklist_paket_id_dokumen_key`(`paket_id`, `dokumen`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `klinik_konsultasi` (
    `id` CHAR(36) NOT NULL,
    `unit_kerja` VARCHAR(160) NOT NULL,
    `jenis` VARCHAR(120) NOT NULL,
    `pertanyaan` TEXT NOT NULL,
    `jawaban` TEXT NULL,
    `status` ENUM('BARU', 'DIPROSES', 'SELESAI') NOT NULL DEFAULT 'BARU',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `klinik_konsultasi_unit_kerja_idx`(`unit_kerja`),
    INDEX `klinik_konsultasi_jenis_idx`(`jenis`),
    INDEX `klinik_konsultasi_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `dokumen_template` (
    `id` CHAR(36) NOT NULL,
    `nama` VARCHAR(180) NOT NULL,
    `jenis` ENUM('DOKUMEN', 'TEMPLATE') NOT NULL DEFAULT 'DOKUMEN',
    `kategori` VARCHAR(120) NULL,
    `file_url` VARCHAR(255) NULL,
    `status` ENUM('DRAFT', 'AKTIF', 'NONAKTIF') NOT NULL DEFAULT 'AKTIF',
    `catatan` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `dokumen_template_nama_idx`(`nama`),
    INDEX `dokumen_template_jenis_idx`(`jenis`),
    INDEX `dokumen_template_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `laporan_tersimpan` (
    `id` CHAR(36) NOT NULL,
    `judul` VARCHAR(180) NOT NULL,
    `jenis` ENUM('PAKET', 'REALISASI', 'KONTRAK', 'RISIKO', 'AUDIT') NOT NULL,
    `tahun_anggaran` INTEGER NULL,
    `periode` VARCHAR(80) NULL,
    `file_url` VARCHAR(255) NULL,
    `status` ENUM('DRAFT', 'TERBIT', 'ARSIP') NOT NULL DEFAULT 'DRAFT',
    `catatan` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `laporan_tersimpan_jenis_idx`(`jenis`),
    INDEX `laporan_tersimpan_tahun_anggaran_idx`(`tahun_anggaran`),
    INDEX `laporan_tersimpan_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `risiko_mitigasi` ADD CONSTRAINT `risiko_mitigasi_paket_id_fkey` FOREIGN KEY (`paket_id`) REFERENCES `paket_pengadaan`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `realisasi_belanja` ADD CONSTRAINT `realisasi_belanja_paket_id_fkey` FOREIGN KEY (`paket_id`) REFERENCES `paket_pengadaan`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `realisasi_belanja` ADD CONSTRAINT `realisasi_belanja_kontrak_id_fkey` FOREIGN KEY (`kontrak_id`) REFERENCES `kontrak`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `progres_paket` ADD CONSTRAINT `progres_paket_paket_id_fkey` FOREIGN KEY (`paket_id`) REFERENCES `paket_pengadaan`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `serah_terima` ADD CONSTRAINT `serah_terima_paket_id_fkey` FOREIGN KEY (`paket_id`) REFERENCES `paket_pengadaan`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `serah_terima` ADD CONSTRAINT `serah_terima_kontrak_id_fkey` FOREIGN KEY (`kontrak_id`) REFERENCES `kontrak`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `timeline_events` ADD CONSTRAINT `timeline_events_paket_id_fkey` FOREIGN KEY (`paket_id`) REFERENCES `paket_pengadaan`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `timeline_events` ADD CONSTRAINT `timeline_events_kontrak_id_fkey` FOREIGN KEY (`kontrak_id`) REFERENCES `kontrak`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_checklist` ADD CONSTRAINT `audit_checklist_paket_id_fkey` FOREIGN KEY (`paket_id`) REFERENCES `paket_pengadaan`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
