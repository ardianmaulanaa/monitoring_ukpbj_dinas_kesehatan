-- CreateEnum
CREATE TYPE "VendorProfileStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'NEEDS_REVISION', 'VERIFIED_INTERNAL', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "VendorPresentationType" AS ENUM ('PRESENTATION', 'DEMO', 'TRIAL', 'TECHNICAL_TEST');

-- CreateEnum
CREATE TYPE "VendorPresentationStatus" AS ENUM ('SUBMITTED', 'SCHEDULED', 'RESCHEDULE_REQUESTED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "VendorTechnicalResult" AS ENUM ('SESUAI_DENGAN_CATATAN', 'SESUAI', 'BELUM_SESUAI', 'PERLU_UJI_LANJUT');

-- CreateEnum
CREATE TYPE "VendorEvaluationStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'FINAL', 'CORRECTED');

-- CreateTable
CREATE TABLE "vendor_categories" (
    "id" CHAR(36) NOT NULL,
    "code" VARCHAR(60) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendor_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendors" (
    "id" CHAR(36) NOT NULL,
    "company_name" VARCHAR(180) NOT NULL,
    "business_entity_type" VARCHAR(80) NOT NULL,
    "nib" VARCHAR(40) NOT NULL,
    "nib_normalized" VARCHAR(40) NOT NULL,
    "npwp" VARCHAR(40),
    "npwp_normalized" VARCHAR(40),
    "address" TEXT NOT NULL,
    "province" VARCHAR(120) NOT NULL,
    "city" VARCHAR(120) NOT NULL,
    "website" VARCHAR(255),
    "business_description" TEXT,
    "status" "VendorProfileStatus" NOT NULL DEFAULT 'DRAFT',
    "revision_note" TEXT,
    "verified_at" TIMESTAMP(3),
    "verified_by_id" CHAR(36),
    "archived_at" TIMESTAMP(3),
    "created_by_id" CHAR(36) NOT NULL,
    "updated_by_id" CHAR(36) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_contacts" (
    "id" CHAR(36) NOT NULL,
    "vendor_id" CHAR(36) NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "position" VARCHAR(120) NOT NULL,
    "phone" VARCHAR(40) NOT NULL,
    "email" VARCHAR(180) NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendor_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_documents" (
    "id" CHAR(36) NOT NULL,
    "vendor_id" CHAR(36) NOT NULL,
    "type" VARCHAR(80) NOT NULL,
    "number" VARCHAR(100),
    "issued_at" DATE,
    "expires_at" DATE,
    "description" TEXT,
    "original_name" VARCHAR(255) NOT NULL,
    "storage_key" VARCHAR(255) NOT NULL,
    "mime_type" VARCHAR(120) NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "archived_at" TIMESTAMP(3),
    "uploaded_by_id" CHAR(36) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendor_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_category_assignments" (
    "id" CHAR(36) NOT NULL,
    "vendor_id" CHAR(36) NOT NULL,
    "category_id" CHAR(36) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vendor_category_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_products" (
    "id" CHAR(36) NOT NULL,
    "vendor_id" CHAR(36) NOT NULL,
    "category_id" CHAR(36),
    "name" VARCHAR(180) NOT NULL,
    "brand" VARCHAR(120),
    "model" VARCHAR(120),
    "description" TEXT,
    "specification" TEXT NOT NULL,
    "unit" VARCHAR(40) NOT NULL,
    "indicative_price" DECIMAL(18,2),
    "currency" VARCHAR(3) NOT NULL DEFAULT 'IDR',
    "offer_valid_until" DATE,
    "warranty" TEXT,
    "after_sales" TEXT,
    "archived_at" TIMESTAMP(3),
    "created_by_id" CHAR(36) NOT NULL,
    "updated_by_id" CHAR(36) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendor_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_product_attachments" (
    "id" CHAR(36) NOT NULL,
    "product_id" CHAR(36) NOT NULL,
    "type" VARCHAR(60) NOT NULL,
    "original_name" VARCHAR(255) NOT NULL,
    "storage_key" VARCHAR(255) NOT NULL,
    "mime_type" VARCHAR(120) NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vendor_product_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_presentations" (
    "id" CHAR(36) NOT NULL,
    "vendor_id" CHAR(36) NOT NULL,
    "type" "VendorPresentationType" NOT NULL,
    "title" VARCHAR(180) NOT NULL,
    "purpose" TEXT NOT NULL,
    "proposed_at" TIMESTAMP(3) NOT NULL,
    "scheduled_at" TIMESTAMP(3),
    "location" VARCHAR(180) NOT NULL,
    "agenda" TEXT,
    "notes" TEXT,
    "requester_unit" VARCHAR(160),
    "involved_team" TEXT,
    "participants" TEXT,
    "status" "VendorPresentationStatus" NOT NULL DEFAULT 'SUBMITTED',
    "schedule_change_reason" TEXT,
    "created_by_id" CHAR(36) NOT NULL,
    "updated_by_id" CHAR(36) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendor_presentations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_presentation_products" (
    "id" CHAR(36) NOT NULL,
    "presentation_id" CHAR(36) NOT NULL,
    "product_id" CHAR(36) NOT NULL,

    CONSTRAINT "vendor_presentation_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_technical_evaluations" (
    "id" CHAR(36) NOT NULL,
    "presentation_id" CHAR(36) NOT NULL,
    "specification_match" TEXT NOT NULL,
    "demonstration_result" TEXT NOT NULL,
    "function_test_result" TEXT,
    "strengths_limits" TEXT,
    "safety_notes" TEXT,
    "conclusion" TEXT NOT NULL,
    "follow_up" TEXT,
    "result" "VendorTechnicalResult" NOT NULL,
    "evaluator_id" CHAR(36) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendor_technical_evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_procurement_links" (
    "id" CHAR(36) NOT NULL,
    "vendor_id" CHAR(36) NOT NULL,
    "package_id" CHAR(36) NOT NULL,
    "role" VARCHAR(80) NOT NULL DEFAULT 'CONTRACTED_VENDOR',
    "source_module" VARCHAR(80) NOT NULL,
    "notes" TEXT,
    "created_by_id" CHAR(36) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vendor_procurement_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_performance_criteria" (
    "id" CHAR(36) NOT NULL,
    "code" VARCHAR(60) NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "description" TEXT,
    "weight" DECIMAL(5,2) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendor_performance_criteria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_performance_evaluations" (
    "id" CHAR(36) NOT NULL,
    "vendor_id" CHAR(36) NOT NULL,
    "package_id" CHAR(36),
    "status" "VendorEvaluationStatus" NOT NULL DEFAULT 'DRAFT',
    "period" VARCHAR(80),
    "summary" TEXT,
    "correction_note" TEXT,
    "created_by_id" CHAR(36) NOT NULL,
    "finalized_by_id" CHAR(36),
    "finalized_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendor_performance_evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_performance_scores" (
    "id" CHAR(36) NOT NULL,
    "evaluation_id" CHAR(36) NOT NULL,
    "criterion_id" CHAR(36) NOT NULL,
    "score" DECIMAL(5,2) NOT NULL,
    "notes" TEXT,

    CONSTRAINT "vendor_performance_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_status_history" (
    "id" CHAR(36) NOT NULL,
    "vendor_id" CHAR(36) NOT NULL,
    "actor_id" CHAR(36) NOT NULL,
    "from_status" "VendorProfileStatus",
    "to_status" "VendorProfileStatus" NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vendor_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "vendor_categories_code_key" ON "vendor_categories"("code");

-- CreateIndex
CREATE UNIQUE INDEX "vendor_categories_name_key" ON "vendor_categories"("name");

-- CreateIndex
CREATE INDEX "vendor_categories_active_idx" ON "vendor_categories"("active");

-- CreateIndex
CREATE UNIQUE INDEX "vendors_nib_normalized_key" ON "vendors"("nib_normalized");

-- CreateIndex
CREATE INDEX "vendors_company_name_idx" ON "vendors"("company_name");

-- CreateIndex
CREATE INDEX "vendors_npwp_normalized_idx" ON "vendors"("npwp_normalized");

-- CreateIndex
CREATE INDEX "vendors_status_idx" ON "vendors"("status");

-- CreateIndex
CREATE INDEX "vendors_updated_at_idx" ON "vendors"("updated_at");

-- CreateIndex
CREATE INDEX "vendor_contacts_vendor_id_idx" ON "vendor_contacts"("vendor_id");

-- CreateIndex
CREATE INDEX "vendor_contacts_email_idx" ON "vendor_contacts"("email");

-- CreateIndex
CREATE UNIQUE INDEX "vendor_documents_storage_key_key" ON "vendor_documents"("storage_key");

-- CreateIndex
CREATE INDEX "vendor_documents_vendor_id_idx" ON "vendor_documents"("vendor_id");

-- CreateIndex
CREATE INDEX "vendor_documents_type_idx" ON "vendor_documents"("type");

-- CreateIndex
CREATE INDEX "vendor_documents_expires_at_idx" ON "vendor_documents"("expires_at");

-- CreateIndex
CREATE INDEX "vendor_category_assignments_category_id_idx" ON "vendor_category_assignments"("category_id");

-- CreateIndex
CREATE UNIQUE INDEX "vendor_category_assignments_vendor_id_category_id_key" ON "vendor_category_assignments"("vendor_id", "category_id");

-- CreateIndex
CREATE INDEX "vendor_products_vendor_id_idx" ON "vendor_products"("vendor_id");

-- CreateIndex
CREATE INDEX "vendor_products_category_id_idx" ON "vendor_products"("category_id");

-- CreateIndex
CREATE INDEX "vendor_products_name_idx" ON "vendor_products"("name");

-- CreateIndex
CREATE UNIQUE INDEX "vendor_product_attachments_storage_key_key" ON "vendor_product_attachments"("storage_key");

-- CreateIndex
CREATE INDEX "vendor_product_attachments_product_id_idx" ON "vendor_product_attachments"("product_id");

-- CreateIndex
CREATE INDEX "vendor_presentations_vendor_id_idx" ON "vendor_presentations"("vendor_id");

-- CreateIndex
CREATE INDEX "vendor_presentations_status_idx" ON "vendor_presentations"("status");

-- CreateIndex
CREATE INDEX "vendor_presentations_scheduled_at_idx" ON "vendor_presentations"("scheduled_at");

-- CreateIndex
CREATE INDEX "vendor_presentation_products_product_id_idx" ON "vendor_presentation_products"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "vendor_presentation_products_presentation_id_product_id_key" ON "vendor_presentation_products"("presentation_id", "product_id");

-- CreateIndex
CREATE UNIQUE INDEX "vendor_technical_evaluations_presentation_id_key" ON "vendor_technical_evaluations"("presentation_id");

-- CreateIndex
CREATE INDEX "vendor_technical_evaluations_result_idx" ON "vendor_technical_evaluations"("result");

-- CreateIndex
CREATE INDEX "vendor_procurement_links_package_id_idx" ON "vendor_procurement_links"("package_id");

-- CreateIndex
CREATE UNIQUE INDEX "vendor_procurement_links_vendor_id_package_id_role_key" ON "vendor_procurement_links"("vendor_id", "package_id", "role");

-- CreateIndex
CREATE UNIQUE INDEX "vendor_performance_criteria_code_key" ON "vendor_performance_criteria"("code");

-- CreateIndex
CREATE INDEX "vendor_performance_criteria_active_idx" ON "vendor_performance_criteria"("active");

-- CreateIndex
CREATE INDEX "vendor_performance_evaluations_vendor_id_idx" ON "vendor_performance_evaluations"("vendor_id");

-- CreateIndex
CREATE INDEX "vendor_performance_evaluations_package_id_idx" ON "vendor_performance_evaluations"("package_id");

-- CreateIndex
CREATE INDEX "vendor_performance_evaluations_status_idx" ON "vendor_performance_evaluations"("status");

-- CreateIndex
CREATE INDEX "vendor_performance_scores_criterion_id_idx" ON "vendor_performance_scores"("criterion_id");

-- CreateIndex
CREATE UNIQUE INDEX "vendor_performance_scores_evaluation_id_criterion_id_key" ON "vendor_performance_scores"("evaluation_id", "criterion_id");

-- CreateIndex
CREATE INDEX "vendor_status_history_vendor_id_idx" ON "vendor_status_history"("vendor_id");

-- CreateIndex
CREATE INDEX "vendor_status_history_actor_id_idx" ON "vendor_status_history"("actor_id");

-- CreateIndex
CREATE INDEX "vendor_status_history_created_at_idx" ON "vendor_status_history"("created_at");

-- AddForeignKey
ALTER TABLE "vendor_contacts" ADD CONSTRAINT "vendor_contacts_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_documents" ADD CONSTRAINT "vendor_documents_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_category_assignments" ADD CONSTRAINT "vendor_category_assignments_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_category_assignments" ADD CONSTRAINT "vendor_category_assignments_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "vendor_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_products" ADD CONSTRAINT "vendor_products_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_products" ADD CONSTRAINT "vendor_products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "vendor_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_product_attachments" ADD CONSTRAINT "vendor_product_attachments_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "vendor_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_presentations" ADD CONSTRAINT "vendor_presentations_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_presentation_products" ADD CONSTRAINT "vendor_presentation_products_presentation_id_fkey" FOREIGN KEY ("presentation_id") REFERENCES "vendor_presentations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_presentation_products" ADD CONSTRAINT "vendor_presentation_products_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "vendor_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_technical_evaluations" ADD CONSTRAINT "vendor_technical_evaluations_presentation_id_fkey" FOREIGN KEY ("presentation_id") REFERENCES "vendor_presentations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_procurement_links" ADD CONSTRAINT "vendor_procurement_links_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_procurement_links" ADD CONSTRAINT "vendor_procurement_links_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "paket_pengadaan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_performance_evaluations" ADD CONSTRAINT "vendor_performance_evaluations_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_performance_evaluations" ADD CONSTRAINT "vendor_performance_evaluations_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "paket_pengadaan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_performance_evaluations" ADD CONSTRAINT "vendor_performance_evaluations_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_performance_evaluations" ADD CONSTRAINT "vendor_performance_evaluations_finalized_by_id_fkey" FOREIGN KEY ("finalized_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_performance_scores" ADD CONSTRAINT "vendor_performance_scores_evaluation_id_fkey" FOREIGN KEY ("evaluation_id") REFERENCES "vendor_performance_evaluations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_performance_scores" ADD CONSTRAINT "vendor_performance_scores_criterion_id_fkey" FOREIGN KEY ("criterion_id") REFERENCES "vendor_performance_criteria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_status_history" ADD CONSTRAINT "vendor_status_history_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_status_history" ADD CONSTRAINT "vendor_status_history_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Seed configurable reference data. Stable IDs keep this migration deterministic.
INSERT INTO "vendor_categories" ("id", "code", "name", "updated_at") VALUES
('10000000-0000-4000-8000-000000000001', 'ALAT_LAB', 'Alat Laboratorium', CURRENT_TIMESTAMP),
('10000000-0000-4000-8000-000000000002', 'ALAT_KESEHATAN', 'Alat Kesehatan', CURRENT_TIMESTAMP),
('10000000-0000-4000-8000-000000000003', 'REAGEN', 'Reagen', CURRENT_TIMESTAMP),
('10000000-0000-4000-8000-000000000004', 'BMHP', 'Bahan Medis Habis Pakai (BMHP)', CURRENT_TIMESTAMP),
('10000000-0000-4000-8000-000000000005', 'ALAT_KALIBRASI', 'Alat Kalibrasi', CURRENT_TIMESTAMP),
('10000000-0000-4000-8000-000000000006', 'PERALATAN_IT', 'Peralatan IT', CURRENT_TIMESTAMP),
('10000000-0000-4000-8000-000000000007', 'JASA_KALIBRASI', 'Jasa Kalibrasi', CURRENT_TIMESTAMP),
('10000000-0000-4000-8000-000000000008', 'JASA_PEMELIHARAAN', 'Jasa Pemeliharaan', CURRENT_TIMESTAMP),
('10000000-0000-4000-8000-000000000009', 'JASA_LAINNYA', 'Jasa Lainnya', CURRENT_TIMESTAMP);

INSERT INTO "vendor_performance_criteria" ("id", "code", "name", "weight", "updated_at") VALUES
('20000000-0000-4000-8000-000000000001', 'MUTU', 'Kesesuaian mutu barang/jasa', 20, CURRENT_TIMESTAMP),
('20000000-0000-4000-8000-000000000002', 'WAKTU', 'Ketepatan waktu pelaksanaan', 20, CURRENT_TIMESTAMP),
('20000000-0000-4000-8000-000000000003', 'SPESIFIKASI', 'Kesesuaian spesifikasi', 20, CURRENT_TIMESTAMP),
('20000000-0000-4000-8000-000000000004', 'LAYANAN', 'Respons layanan teknis', 15, CURRENT_TIMESTAMP),
('20000000-0000-4000-8000-000000000005', 'GARANSI', 'Pemenuhan kewajiban garansi', 15, CURRENT_TIMESTAMP),
('20000000-0000-4000-8000-000000000006', 'SERAH_TERIMA', 'Kelengkapan dokumen serah terima', 10, CURRENT_TIMESTAMP);
