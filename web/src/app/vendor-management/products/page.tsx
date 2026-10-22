import AppHeader from "@/components/appheader/AppHeader";
import ProductCatalog from "@/components/vendor-management/ProductCatalog";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasVendorPermission } from "@/lib/vendor-management";
import { VmsPage } from "../_components";

export const dynamic = "force-dynamic";

export default async function Page() {
  const user = await getCurrentUser();
  const [products, categories, vendors] = await Promise.all([
    prisma.vendorProduct.findMany({ where: { archivedAt: null }, include: { vendor: true, category: true, vendorLinks: { include: { vendor: true } } }, orderBy: { updatedAt: "desc" }, take: 500 }),
    prisma.vendorCategory.findMany({ where: { active: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.vendor.findMany({ where: { status: { not: "ARCHIVED" } }, orderBy: { companyName: "asc" }, select: { id: true, companyName: true } }),
  ]);
  const catalog = products.map((product) => ({
    id: product.id,
    name: product.name,
    brand: product.brand,
    model: product.model,
    specification: product.specification,
    indicativePrice: product.indicativePrice?.toString() ?? null,
    currency: product.currency,
    category: product.category,
    vendors: [product.vendor, ...product.vendorLinks.map((link) => link.vendor)].map(({ id, companyName }) => ({ id, companyName })),
  }));
  return <><AppHeader title="Katalog Produk" subtitle="VMS › Produk Vendor" rightLabel={`${catalog.length} produk`}/><VmsPage><ProductCatalog products={catalog} categories={categories} vendors={vendors} canCreate={Boolean(user && hasVendorPermission(user.roles, "product.create"))}/></VmsPage></>;
}
