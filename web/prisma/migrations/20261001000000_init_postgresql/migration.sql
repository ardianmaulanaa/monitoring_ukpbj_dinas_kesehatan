-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "RoleCode" AS ENUM ('SUPER_ADMIN', 'LPSE_ADMIN', 'OPERATOR', 'LEADER', 'PPTK', 'PA', 'KPA', 'PPK', 'PROCUREMENT_OFFICER', 'SELECTION_WORKGROUP', 'UKPBJ', 'AUDITOR', 'VIEWER');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('LOGIN', 'LOGOUT', 'CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'EXPORT');

-- CreateEnum
CREATE TYPE "BarangPrioritas" AS ENUM ('RENDAH', 'NORMAL', 'TINGGI', 'MENDESAK');

-- CreateEnum
CREATE TYPE "BarangStatus" AS ENUM ('AKTIF', 'NONAKTIF');

-- CreateEnum
CREATE TYPE "PaketJenisPengadaan" AS ENUM ('BARANG', 'JASA');

-- CreateEnum
CREATE TYPE "PaketMetodePengadaan" AS ENUM ('TENDER', 'NON_TENDER', 'E_PURCHASING', 'PENGADAAN_LANGSUNG', 'SWAKELOLA');

-- CreateEnum
CREATE TYPE "PaketStatus" AS ENUM ('PERENCANAAN', 'SIAP_DIPROSES', 'PERSIAPAN_DOKUMEN', 'PENJADWALAN', 'PENGUMUMAN_UNDANGAN', 'EVALUASI_KLARIFIKASI', 'PEMILIHAN', 'PEMENANG_DITETAPKAN', 'KONTRAK', 'SELESAI', 'GAGAL', 'BATAL', 'TERLAMBAT');

-- CreateEnum
CREATE TYPE "RupStatus" AS ENUM ('BELUM_INPUT', 'PROSES_VERIFIKASI', 'MENUNGGU_PPTK', 'MENUNGGU_PPK', 'MENUNGGU_KPA_PA', 'SUDAH_TAYANG', 'REVISI_PAGU', 'DITARIK');

-- CreateEnum
CREATE TYPE "KontrakStatus" AS ENUM ('DRAFT', 'AKTIF', 'SELESAI', 'TERLAMBAT', 'BATAL');

-- CreateEnum
CREATE TYPE "RisikoLevel" AS ENUM ('RENDAH', 'SEDANG', 'TINGGI');

-- CreateEnum
CREATE TYPE "RisikoStatus" AS ENUM ('PERLU_TINDAK_LANJUT', 'PROSES', 'SELESAI');

-- CreateEnum
CREATE TYPE "PenyediaStatus" AS ENUM ('AKTIF', 'NONAKTIF', 'BLACKLIST');

-- CreateEnum
CREATE TYPE "TimelineStatus" AS ENUM ('RENCANA', 'BERJALAN', 'SELESAI', 'TERLAMBAT');

-- CreateEnum
CREATE TYPE "AuditDokumenStatus" AS ENUM ('BELUM_ADA', 'PROSES', 'LENGKAP');

-- CreateEnum
CREATE TYPE "KlinikStatus" AS ENUM ('BARU', 'DIPROSES', 'SELESAI');

-- CreateEnum
CREATE TYPE "DokumenJenis" AS ENUM ('DOKUMEN', 'TEMPLATE');

-- CreateEnum
CREATE TYPE "DokumenStatus" AS ENUM ('DRAFT', 'AKTIF', 'NONAKTIF');

-- CreateEnum
CREATE TYPE "LaporanJenis" AS ENUM ('PAKET', 'REALISASI', 'KONTRAK', 'RISIKO', 'AUDIT');

-- CreateEnum
CREATE TYPE "LaporanStatus" AS ENUM ('DRAFT', 'TERBIT', 'ARSIP');

-- CreateTable
CREATE TABLE "users" (
    "id" CHAR(36) NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "email" VARCHAR(180) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "nip" VARCHAR(40),
    "jabatan" VARCHAR(120),
    "unit_kerja" VARCHAR(160),
    "nomor_telepon" VARCHAR(40),
    "avatar_url" VARCHAR(255),
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" CHAR(36) NOT NULL,
    "code" "RoleCode" NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "description" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "id" CHAR(36) NOT NULL,
    "user_id" CHAR(36) NOT NULL,
    "role_id" CHAR(36) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" CHAR(36) NOT NULL,
    "user_id" CHAR(36),
    "action" "AuditAction" NOT NULL,
    "entity" VARCHAR(120) NOT NULL,
    "entity_id" VARCHAR(120),
    "before" JSONB,
    "after" JSONB,
    "ip_address" VARCHAR(80),
    "user_agent" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_barang" (
    "id" CHAR(36) NOT NULL,
    "kode_barang" VARCHAR(80) NOT NULL,
    "nama_barang" VARCHAR(180) NOT NULL,
    "kategori" VARCHAR(80) NOT NULL,
    "spesifikasi" TEXT NOT NULL,
    "satuan" VARCHAR(40) NOT NULL,
    "jumlah_kebutuhan" INTEGER NOT NULL DEFAULT 0,
    "harga_satuan" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "estimasi_total" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "tkdn_persen" DECIMAL(5,2),
    "is_pdn" BOOLEAN NOT NULL DEFAULT false,
    "prioritas" "BarangPrioritas" NOT NULL DEFAULT 'NORMAL',
    "lokasi_penerimaan" VARCHAR(160),
    "catatan" TEXT,
    "status" "BarangStatus" NOT NULL DEFAULT 'AKTIF',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "data_barang_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "paket_pengadaan" (
    "id" CHAR(36) NOT NULL,
    "kode_paket" VARCHAR(80) NOT NULL,
    "nama_paket" VARCHAR(220) NOT NULL,
    "unit_pemohon" VARCHAR(160) NOT NULL,
    "satuan_kerja" VARCHAR(160),
    "tahun_anggaran" INTEGER NOT NULL,
    "sumber_dana" VARCHAR(120) NOT NULL,
    "jenis_pengadaan" "PaketJenisPengadaan" NOT NULL DEFAULT 'BARANG',
    "kategori" VARCHAR(100) NOT NULL,
    "metode_pengadaan" "PaketMetodePengadaan" NOT NULL,
    "pagu" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "hps" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "status_paket" "PaketStatus" NOT NULL DEFAULT 'PERENCANAAN',
    "prioritas" "BarangPrioritas" NOT NULL DEFAULT 'NORMAL',
    "ppk_penanggung_jawab" VARCHAR(160),
    "rencana_mulai" DATE,
    "rencana_selesai" DATE,
    "lokasi_pelaksanaan" VARCHAR(180),
    "catatan" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "paket_pengadaan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kontrak" (
    "id" CHAR(36) NOT NULL,
    "nomor_kontrak" VARCHAR(100) NOT NULL,
    "paket_id" CHAR(36),
    "nama_paket" VARCHAR(220) NOT NULL,
    "penyedia" VARCHAR(180) NOT NULL,
    "nilai_kontrak" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "tanggal_kontrak" DATE,
    "tanggal_mulai" DATE,
    "tanggal_selesai" DATE,
    "status" "KontrakStatus" NOT NULL DEFAULT 'DRAFT',
    "catatan" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kontrak_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rencana_umum_pengadaan" (
    "id" CHAR(36) NOT NULL,
    "kode_rup" VARCHAR(80) NOT NULL,
    "nama_paket" VARCHAR(220) NOT NULL,
    "jenis_belanja" VARCHAR(120),
    "unit_pengusul" VARCHAR(160) NOT NULL,
    "unit_bidang" VARCHAR(160),
    "ppk_pptk" VARCHAR(160),
    "kontak_penanggung_jawab" VARCHAR(80),
    "program" VARCHAR(180),
    "kegiatan" VARCHAR(180),
    "sub_kegiatan" VARCHAR(180),
    "kode_rekening" VARCHAR(80),
    "uraian_belanja" TEXT,
    "sumber_dana" VARCHAR(120) NOT NULL,
    "pagu" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "uraian_kebutuhan" TEXT,
    "volume_kebutuhan" VARCHAR(80),
    "satuan_kebutuhan" VARCHAR(60),
    "spesifikasi_awal" TEXT,
    "output_diharapkan" TEXT,
    "prioritas" VARCHAR(80),
    "waktu_kebutuhan" VARCHAR(120),
    "cara_pengadaan" VARCHAR(80),
    "metode_pengadaan" "PaketMetodePengadaan" NOT NULL,
    "lokasi_paket" VARCHAR(180),
    "jadwal_pemilihan" VARCHAR(120),
    "id_rup_sirup" VARCHAR(80),
    "tanggal_input_sirup" VARCHAR(120),
    "tanggal_tayang_sirup" VARCHAR(120),
    "link_sirup" VARCHAR(255),
    "jenis_katalog" VARCHAR(80),
    "etalase_katalog" VARCHAR(160),
    "nama_produk_katalog" VARCHAR(220),
    "spesifikasi_produk_katalog" TEXT,
    "merek_tipe_katalog" VARCHAR(160),
    "jumlah_produk_katalog" VARCHAR(80),
    "satuan_produk_katalog" VARCHAR(60),
    "harga_satuan_katalog" DECIMAL(18,2),
    "total_harga_katalog" DECIMAL(18,2),
    "nama_penyedia_katalog" VARCHAR(180),
    "status_negosiasi_katalog" VARCHAR(80),
    "harga_negosiasi_katalog" DECIMAL(18,2),
    "nomor_surat_pesanan" VARCHAR(120),
    "tanggal_surat_pesanan" VARCHAR(120),
    "status_transaksi_katalog" VARCHAR(80),
    "catatan_katalog" TEXT,
    "jadwal_mulai_rencana" VARCHAR(120),
    "jadwal_selesai_rencana" VARCHAR(120),
    "tahun_anggaran" INTEGER NOT NULL,
    "status_sirup" "RupStatus" NOT NULL DEFAULT 'BELUM_INPUT',
    "status_kak" VARCHAR(80),
    "status_hps" VARCHAR(80),
    "status_rancangan_kontrak" VARCHAR(80),
    "status_dokumen_pendukung" VARCHAR(80),
    "kekurangan_dokumen" TEXT,
    "kendala" TEXT,
    "tindak_lanjut" TEXT,
    "pic_tindak_lanjut" VARCHAR(160),
    "catatan" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rencana_umum_pengadaan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sumber_dana" (
    "id" CHAR(36) NOT NULL,
    "kode" VARCHAR(40) NOT NULL,
    "nama" VARCHAR(120) NOT NULL,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sumber_dana_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "risiko_mitigasi" (
    "id" CHAR(36) NOT NULL,
    "paket_id" CHAR(36),
    "risiko" TEXT NOT NULL,
    "level" "RisikoLevel" NOT NULL DEFAULT 'SEDANG',
    "mitigasi" TEXT NOT NULL,
    "pic" VARCHAR(160) NOT NULL,
    "deadline" DATE,
    "status" "RisikoStatus" NOT NULL DEFAULT 'PERLU_TINDAK_LANJUT',
    "catatan" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "risiko_mitigasi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "penyedia" (
    "id" CHAR(36) NOT NULL,
    "nama" VARCHAR(180) NOT NULL,
    "npwp" VARCHAR(40),
    "alamat" TEXT,
    "kontak_person" VARCHAR(120),
    "email" VARCHAR(180),
    "telepon" VARCHAR(40),
    "kategori" VARCHAR(100),
    "status" "PenyediaStatus" NOT NULL DEFAULT 'AKTIF',
    "catatan" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "penyedia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "realisasi_belanja" (
    "id" CHAR(36) NOT NULL,
    "paket_id" CHAR(36),
    "kontrak_id" CHAR(36),
    "sumber_dana" VARCHAR(120) NOT NULL,
    "tahun_anggaran" INTEGER NOT NULL,
    "nilai_pagu" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "nilai_hps" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "nilai_kontrak" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "nilai_realisasi" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "tanggal_bayar" DATE,
    "nomor_bukti" VARCHAR(100),
    "catatan" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "realisasi_belanja_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "progres_paket" (
    "id" CHAR(36) NOT NULL,
    "paket_id" CHAR(36),
    "tahap" VARCHAR(120) NOT NULL,
    "persentase" INTEGER NOT NULL DEFAULT 0,
    "status" "TimelineStatus" NOT NULL DEFAULT 'BERJALAN',
    "tanggal" DATE,
    "catatan" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "progres_paket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "serah_terima" (
    "id" CHAR(36) NOT NULL,
    "paket_id" CHAR(36),
    "kontrak_id" CHAR(36),
    "nomor_dokumen" VARCHAR(100) NOT NULL,
    "tanggal_dokumen" DATE,
    "pemeriksa" VARCHAR(160),
    "status" "TimelineStatus" NOT NULL DEFAULT 'BERJALAN',
    "catatan" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "serah_terima_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "timeline_events" (
    "id" CHAR(36) NOT NULL,
    "paket_id" CHAR(36),
    "kontrak_id" CHAR(36),
    "judul" VARCHAR(180) NOT NULL,
    "tahap" VARCHAR(120) NOT NULL,
    "unit_kerja" VARCHAR(160),
    "tanggal_mulai" DATE,
    "tanggal_selesai" DATE,
    "status" "TimelineStatus" NOT NULL DEFAULT 'RENCANA',
    "catatan" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "timeline_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_checklist" (
    "id" CHAR(36) NOT NULL,
    "paket_id" CHAR(36),
    "dokumen" VARCHAR(160) NOT NULL,
    "status" "AuditDokumenStatus" NOT NULL DEFAULT 'BELUM_ADA',
    "catatan" TEXT,
    "file_url" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "audit_checklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "klinik_konsultasi" (
    "id" CHAR(36) NOT NULL,
    "unit_kerja" VARCHAR(160) NOT NULL,
    "jenis" VARCHAR(120) NOT NULL,
    "pertanyaan" TEXT NOT NULL,
    "jawaban" TEXT,
    "status" "KlinikStatus" NOT NULL DEFAULT 'BARU',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "klinik_konsultasi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dokumen_template" (
    "id" CHAR(36) NOT NULL,
    "nama" VARCHAR(180) NOT NULL,
    "jenis" "DokumenJenis" NOT NULL DEFAULT 'DOKUMEN',
    "kategori" VARCHAR(120),
    "file_url" VARCHAR(255),
    "status" "DokumenStatus" NOT NULL DEFAULT 'AKTIF',
    "catatan" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dokumen_template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "laporan_tersimpan" (
    "id" CHAR(36) NOT NULL,
    "judul" VARCHAR(180) NOT NULL,
    "jenis" "LaporanJenis" NOT NULL,
    "tahun_anggaran" INTEGER,
    "periode" VARCHAR(80),
    "file_url" VARCHAR(255),
    "status" "LaporanStatus" NOT NULL DEFAULT 'DRAFT',
    "catatan" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "laporan_tersimpan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_name_idx" ON "users"("name");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "users"("status");

-- CreateIndex
CREATE UNIQUE INDEX "roles_code_key" ON "roles"("code");

-- CreateIndex
CREATE INDEX "user_roles_role_id_idx" ON "user_roles"("role_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_roles_user_id_role_id_key" ON "user_roles"("user_id", "role_id");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_entity_idx" ON "audit_logs"("entity");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "data_barang_kode_barang_key" ON "data_barang"("kode_barang");

-- CreateIndex
CREATE INDEX "data_barang_nama_barang_idx" ON "data_barang"("nama_barang");

-- CreateIndex
CREATE INDEX "data_barang_kategori_idx" ON "data_barang"("kategori");

-- CreateIndex
CREATE INDEX "data_barang_prioritas_idx" ON "data_barang"("prioritas");

-- CreateIndex
CREATE INDEX "data_barang_status_idx" ON "data_barang"("status");

-- CreateIndex
CREATE UNIQUE INDEX "paket_pengadaan_kode_paket_key" ON "paket_pengadaan"("kode_paket");

-- CreateIndex
CREATE INDEX "paket_pengadaan_nama_paket_idx" ON "paket_pengadaan"("nama_paket");

-- CreateIndex
CREATE INDEX "paket_pengadaan_unit_pemohon_idx" ON "paket_pengadaan"("unit_pemohon");

-- CreateIndex
CREATE INDEX "paket_pengadaan_tahun_anggaran_idx" ON "paket_pengadaan"("tahun_anggaran");

-- CreateIndex
CREATE INDEX "paket_pengadaan_kategori_idx" ON "paket_pengadaan"("kategori");

-- CreateIndex
CREATE INDEX "paket_pengadaan_metode_pengadaan_idx" ON "paket_pengadaan"("metode_pengadaan");

-- CreateIndex
CREATE INDEX "paket_pengadaan_status_paket_idx" ON "paket_pengadaan"("status_paket");

-- CreateIndex
CREATE UNIQUE INDEX "kontrak_nomor_kontrak_key" ON "kontrak"("nomor_kontrak");

-- CreateIndex
CREATE INDEX "kontrak_paket_id_idx" ON "kontrak"("paket_id");

-- CreateIndex
CREATE INDEX "kontrak_nama_paket_idx" ON "kontrak"("nama_paket");

-- CreateIndex
CREATE INDEX "kontrak_penyedia_idx" ON "kontrak"("penyedia");

-- CreateIndex
CREATE INDEX "kontrak_status_idx" ON "kontrak"("status");

-- CreateIndex
CREATE UNIQUE INDEX "rencana_umum_pengadaan_kode_rup_key" ON "rencana_umum_pengadaan"("kode_rup");

-- CreateIndex
CREATE INDEX "rencana_umum_pengadaan_nama_paket_idx" ON "rencana_umum_pengadaan"("nama_paket");

-- CreateIndex
CREATE INDEX "rencana_umum_pengadaan_unit_pengusul_idx" ON "rencana_umum_pengadaan"("unit_pengusul");

-- CreateIndex
CREATE INDEX "rencana_umum_pengadaan_program_idx" ON "rencana_umum_pengadaan"("program");

-- CreateIndex
CREATE INDEX "rencana_umum_pengadaan_kegiatan_idx" ON "rencana_umum_pengadaan"("kegiatan");

-- CreateIndex
CREATE INDEX "rencana_umum_pengadaan_sumber_dana_idx" ON "rencana_umum_pengadaan"("sumber_dana");

-- CreateIndex
CREATE INDEX "rencana_umum_pengadaan_tahun_anggaran_idx" ON "rencana_umum_pengadaan"("tahun_anggaran");

-- CreateIndex
CREATE INDEX "rencana_umum_pengadaan_metode_pengadaan_idx" ON "rencana_umum_pengadaan"("metode_pengadaan");

-- CreateIndex
CREATE INDEX "rencana_umum_pengadaan_status_sirup_idx" ON "rencana_umum_pengadaan"("status_sirup");

-- CreateIndex
CREATE INDEX "rencana_umum_pengadaan_id_rup_sirup_idx" ON "rencana_umum_pengadaan"("id_rup_sirup");

-- CreateIndex
CREATE INDEX "rencana_umum_pengadaan_status_transaksi_katalog_idx" ON "rencana_umum_pengadaan"("status_transaksi_katalog");

-- CreateIndex
CREATE UNIQUE INDEX "sumber_dana_kode_key" ON "sumber_dana"("kode");

-- CreateIndex
CREATE INDEX "sumber_dana_nama_idx" ON "sumber_dana"("nama");

-- CreateIndex
CREATE INDEX "sumber_dana_aktif_idx" ON "sumber_dana"("aktif");

-- CreateIndex
CREATE INDEX "risiko_mitigasi_paket_id_idx" ON "risiko_mitigasi"("paket_id");

-- CreateIndex
CREATE INDEX "risiko_mitigasi_level_idx" ON "risiko_mitigasi"("level");

-- CreateIndex
CREATE INDEX "risiko_mitigasi_status_idx" ON "risiko_mitigasi"("status");

-- CreateIndex
CREATE INDEX "risiko_mitigasi_deadline_idx" ON "risiko_mitigasi"("deadline");

-- CreateIndex
CREATE UNIQUE INDEX "penyedia_nama_key" ON "penyedia"("nama");

-- CreateIndex
CREATE INDEX "penyedia_nama_idx" ON "penyedia"("nama");

-- CreateIndex
CREATE INDEX "penyedia_status_idx" ON "penyedia"("status");

-- CreateIndex
CREATE INDEX "realisasi_belanja_paket_id_idx" ON "realisasi_belanja"("paket_id");

-- CreateIndex
CREATE INDEX "realisasi_belanja_kontrak_id_idx" ON "realisasi_belanja"("kontrak_id");

-- CreateIndex
CREATE INDEX "realisasi_belanja_sumber_dana_idx" ON "realisasi_belanja"("sumber_dana");

-- CreateIndex
CREATE INDEX "realisasi_belanja_tahun_anggaran_idx" ON "realisasi_belanja"("tahun_anggaran");

-- CreateIndex
CREATE INDEX "progres_paket_paket_id_idx" ON "progres_paket"("paket_id");

-- CreateIndex
CREATE INDEX "progres_paket_status_idx" ON "progres_paket"("status");

-- CreateIndex
CREATE UNIQUE INDEX "serah_terima_nomor_dokumen_key" ON "serah_terima"("nomor_dokumen");

-- CreateIndex
CREATE INDEX "serah_terima_paket_id_idx" ON "serah_terima"("paket_id");

-- CreateIndex
CREATE INDEX "serah_terima_kontrak_id_idx" ON "serah_terima"("kontrak_id");

-- CreateIndex
CREATE INDEX "serah_terima_status_idx" ON "serah_terima"("status");

-- CreateIndex
CREATE INDEX "timeline_events_paket_id_idx" ON "timeline_events"("paket_id");

-- CreateIndex
CREATE INDEX "timeline_events_kontrak_id_idx" ON "timeline_events"("kontrak_id");

-- CreateIndex
CREATE INDEX "timeline_events_status_idx" ON "timeline_events"("status");

-- CreateIndex
CREATE INDEX "audit_checklist_status_idx" ON "audit_checklist"("status");

-- CreateIndex
CREATE UNIQUE INDEX "audit_checklist_paket_id_dokumen_key" ON "audit_checklist"("paket_id", "dokumen");

-- CreateIndex
CREATE INDEX "klinik_konsultasi_unit_kerja_idx" ON "klinik_konsultasi"("unit_kerja");

-- CreateIndex
CREATE INDEX "klinik_konsultasi_jenis_idx" ON "klinik_konsultasi"("jenis");

-- CreateIndex
CREATE INDEX "klinik_konsultasi_status_idx" ON "klinik_konsultasi"("status");

-- CreateIndex
CREATE INDEX "dokumen_template_nama_idx" ON "dokumen_template"("nama");

-- CreateIndex
CREATE INDEX "dokumen_template_jenis_idx" ON "dokumen_template"("jenis");

-- CreateIndex
CREATE INDEX "dokumen_template_status_idx" ON "dokumen_template"("status");

-- CreateIndex
CREATE INDEX "laporan_tersimpan_jenis_idx" ON "laporan_tersimpan"("jenis");

-- CreateIndex
CREATE INDEX "laporan_tersimpan_tahun_anggaran_idx" ON "laporan_tersimpan"("tahun_anggaran");

-- CreateIndex
CREATE INDEX "laporan_tersimpan_status_idx" ON "laporan_tersimpan"("status");

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risiko_mitigasi" ADD CONSTRAINT "risiko_mitigasi_paket_id_fkey" FOREIGN KEY ("paket_id") REFERENCES "paket_pengadaan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "realisasi_belanja" ADD CONSTRAINT "realisasi_belanja_paket_id_fkey" FOREIGN KEY ("paket_id") REFERENCES "paket_pengadaan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "realisasi_belanja" ADD CONSTRAINT "realisasi_belanja_kontrak_id_fkey" FOREIGN KEY ("kontrak_id") REFERENCES "kontrak"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progres_paket" ADD CONSTRAINT "progres_paket_paket_id_fkey" FOREIGN KEY ("paket_id") REFERENCES "paket_pengadaan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "serah_terima" ADD CONSTRAINT "serah_terima_paket_id_fkey" FOREIGN KEY ("paket_id") REFERENCES "paket_pengadaan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "serah_terima" ADD CONSTRAINT "serah_terima_kontrak_id_fkey" FOREIGN KEY ("kontrak_id") REFERENCES "kontrak"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeline_events" ADD CONSTRAINT "timeline_events_paket_id_fkey" FOREIGN KEY ("paket_id") REFERENCES "paket_pengadaan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeline_events" ADD CONSTRAINT "timeline_events_kontrak_id_fkey" FOREIGN KEY ("kontrak_id") REFERENCES "kontrak"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_checklist" ADD CONSTRAINT "audit_checklist_paket_id_fkey" FOREIGN KEY ("paket_id") REFERENCES "paket_pengadaan"("id") ON DELETE SET NULL ON UPDATE CASCADE;
