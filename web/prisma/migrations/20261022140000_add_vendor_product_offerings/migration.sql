CREATE TABLE "vendor_product_vendors" (
    "id" CHAR(36) NOT NULL,
    "vendor_id" CHAR(36) NOT NULL,
    "product_id" CHAR(36) NOT NULL,
    "created_by_id" CHAR(36) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vendor_product_vendors_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "vendor_product_vendors_vendor_id_fkey"
      FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "vendor_product_vendors_product_id_fkey"
      FOREIGN KEY ("product_id") REFERENCES "vendor_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "vendor_product_vendors_vendor_id_product_id_key"
  ON "vendor_product_vendors"("vendor_id", "product_id");
CREATE INDEX "vendor_product_vendors_vendor_id_idx"
  ON "vendor_product_vendors"("vendor_id");
CREATE INDEX "vendor_product_vendors_product_id_idx"
  ON "vendor_product_vendors"("product_id");
