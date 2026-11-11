import { redirect } from "next/navigation";
import AppHeader from "@/components/appheader/AppHeader";
import VmsWorkspace from "@/components/vendor-management/VmsWorkspace";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasVendorPermission } from "@/lib/vendor-management";

export const dynamic = "force-dynamic";

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export default async function VmsPage() {
  const user = await getCurrentUser();
  if (!user || !hasVendorPermission(user.roles, "vendor.read"))
    redirect("/unauthorized");

  const now = new Date();
  const expiryLimit = new Date(now);
  expiryLimit.setDate(expiryLimit.getDate() + 90);
  const growthStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const [
    vendors,
    categories,
    products,
    rupCatalogProducts,
    presentations,
    evaluations,
    activities,
    expiringDocuments,
  ] = await Promise.all([
    prisma.vendor.findMany({
      where: { status: { not: "ARCHIVED" } },
      include: {
        contacts: { where: { isPrimary: true }, take: 1 },
        categories: { include: { category: true } },
        _count: { select: { products: true, procurementLinks: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 500,
    }),
    prisma.vendorCategory.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.vendorProduct.findMany({
      where: { archivedAt: null },
      include: {
        vendor: true,
        category: true,
        vendorLinks: { include: { vendor: true } },
        attachments: true,
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.rencanaUmumPengadaan.findMany({
      // Katalog VMS membaca item langsung dari sumber transaksi E-Purchasing.
      // Tidak ada copy/sinkronisasi ke VendorProduct agar data transaksi tetap
      // menjadi single source of truth dan selalu mengikuti pembaruan workflow.
      where: {
        metodePengadaan: "E_PURCHASING",
        namaProdukKatalog: { not: null },
      },
      select: {
        id: true,
        kodeRup: true,
        idRupSirup: true,
        namaPaket: true,
        metodePengadaan: true,
        namaProdukKatalog: true,
        merekTipeKatalog: true,
        spesifikasiProdukKatalog: true,
        kategoriProdukKatalog: true,
        namaPenyediaKatalog: true,
        jumlahProdukKatalog: true,
        satuanProdukKatalog: true,
        hargaSatuanKatalog: true,
        hargaPenawaranKatalog: true,
        hargaNegosiasiKatalog: true,
        linkProdukKatalog: true,
        statusTransaksiKatalog: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.vendorPresentation.findMany({
      include: {
        vendor: true,
        products: { include: { product: true } },
        technicalEvaluation: true,
      },
      orderBy: { proposedAt: "desc" },
      take: 200,
    }),
    prisma.vendorPerformanceEvaluation.findMany({
      include: {
        vendor: true,
        package: true,
        scores: { include: { criterion: true } },
        createdBy: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.vendorStatusHistory.findMany({
      include: { vendor: true, actor: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.vendorDocument.count({
      where: { archivedAt: null, expiresAt: { gte: now, lte: expiryLimit } },
    }),
  ]);

  const growthMonths = Array.from(
    { length: 6 },
    (_, index) => new Date(now.getFullYear(), now.getMonth() - 5 + index, 1),
  );
  const growthVendors = await prisma.vendor.findMany({
    where: { createdAt: { gte: growthStart } },
    select: { createdAt: true },
  });
  const growth = growthMonths.map((date) => ({
    label: date.toLocaleDateString("id-ID", {
      month: "short",
      year: "2-digit",
    }),
    value: growthVendors.filter(
      (vendor) => monthKey(vendor.createdAt) === monthKey(date),
    ).length,
  }));
  const categoryChart = categories
    .map((category) => ({
      label: category.name,
      value: vendors.filter((vendor) =>
        vendor.categories.some((item) => item.category.id === category.id),
      ).length,
    }))
    .filter((item) => item.value > 0)
    .slice(0, 10);
  const statuses = [
    "DRAFT",
    "PENDING_REVIEW",
    "NEEDS_REVISION",
    "VERIFIED_INTERNAL",
  ].map((status) => ({
    label: status.replaceAll("_", " "),
    value: vendors.filter((vendor) => vendor.status === status).length,
  }));

  return (
    <>
      <AppHeader
        title="Vendor Management System"
        subtitle="UKPBJ › Manajemen Penyedia"
        rightLabel="VMS"
      />
      <VmsWorkspace
        permissions={{
          vendorCreate: hasVendorPermission(user.roles, "vendor.create"),
          productCreate: hasVendorPermission(user.roles, "product.create"),
          reportExport: hasVendorPermission(user.roles, "vendor_report.export"),
        }}
        categories={categories}
        kpis={{
          total: vendors.length,
          verified: vendors.filter((v) => v.status === "VERIFIED_INTERNAL")
            .length,
          pending: vendors.filter((v) => v.status === "PENDING_REVIEW").length,
          expiring: expiringDocuments,
        }}
        charts={{ growth, categories: categoryChart, statuses }}
        vendors={vendors.map((v) => ({
          id: v.id,
          companyName: v.companyName,
          businessEntityType: v.businessEntityType,
          nib: v.nib,
          status: v.status,
          updatedAt: v.updatedAt.toISOString(),
          contact: v.contacts[0]?.name ?? null,
          categories: v.categories.map((x) => x.category),
          productCount: v._count.products,
          procurementCount: v._count.procurementLinks,
        }))}
        products={[
          ...products.map((p) => ({
            id: p.id,
            name: p.name,
            brand: p.brand,
            model: p.model,
            specification: p.specification,
            indicativePrice: p.indicativePrice?.toString() ?? null,
            currency: p.currency,
            category: p.category,
            vendors: [
              p.vendor,
              ...p.vendorLinks.map((link) => link.vendor),
            ].map(({ id, companyName }) => ({ id, companyName })),
            attachments: p.attachments.map(
              ({ id, type, originalName, mimeType }) => ({
                id,
                type,
                originalName,
                mimeType,
              }),
            ),
            procurementMethods: [],
            packageHistories: [],
            source: "VENDOR_PRODUCT" as const,
            updatedAt: p.updatedAt.toISOString(),
          })),
          ...rupCatalogProducts
            .filter((p) => p.namaProdukKatalog?.trim())
            .map((p) => ({
            id: `rup:${p.id}`,
            name: p.namaProdukKatalog!.trim(),
            brand: p.merekTipeKatalog,
            model: null,
            specification:
              p.spesifikasiProdukKatalog ??
              "Spesifikasi produk belum dilengkapi pada workflow E-Purchasing.",
            // Harga pada RUP adalah harga tayang/transaksi, bukan harga indikatif master.
            indicativePrice: null,
            currency: "IDR",
            category: p.kategoriProdukKatalog
              ? {
                  id: `rup-category:${p.kategoriProdukKatalog}`,
                  name: p.kategoriProdukKatalog,
                }
              : null,
            vendors: p.namaPenyediaKatalog?.trim()
              ? [
                  {
                    id: `rup-vendor:${p.namaPenyediaKatalog.trim()}`,
                    companyName: p.namaPenyediaKatalog.trim(),
                  },
                ]
              : [],
            attachments: [],
            procurementMethods: [p.metodePengadaan],
            packageHistories: [
              {
                id: p.id,
                packageName: p.namaPaket,
                method: p.metodePengadaan,
                rupCode: p.idRupSirup ?? p.kodeRup,
                quantity: p.jumlahProdukKatalog,
                unit: p.satuanProdukKatalog,
                listedUnitPrice: p.hargaSatuanKatalog?.toString() ?? null,
                offeredPrice: p.hargaPenawaranKatalog?.toString() ?? null,
                transactionPrice: p.hargaNegosiasiKatalog?.toString() ?? null,
                status: p.statusTransaksiKatalog,
                productUrl: p.linkProdukKatalog,
              },
            ],
            source: "RUP_E_PURCHASING" as const,
            updatedAt: p.updatedAt.toISOString(),
          })),
        ]}
        presentations={presentations.map((p) => ({
          id: p.id,
          title: p.title,
          type: p.type,
          vendor: p.vendor.companyName,
          location: p.location,
          proposedAt: p.proposedAt.toISOString(),
          scheduledAt: p.scheduledAt?.toISOString() ?? null,
          status: p.status,
          products: p.products.map((x) => x.product.name),
          result: p.technicalEvaluation?.result ?? null,
        }))}
        evaluations={evaluations.map((e) => ({
          id: e.id,
          vendor: e.vendor.companyName,
          package: e.package?.namaPaket ?? null,
          period: e.period,
          status: e.status,
          evaluator: e.createdBy.name,
          createdAt: e.createdAt.toISOString(),
          summary: e.summary,
          criteria: e.scores.map((s) => ({
            name: s.criterion.name,
            score: s.score.toString(),
            notes: s.notes,
          })),
        }))}
        activities={activities.map((a) => ({
          id: a.id,
          vendor: a.vendor.companyName,
          actor: a.actor.name,
          status: a.toStatus,
          at: a.createdAt.toISOString(),
        }))}
      />
    </>
  );
}
