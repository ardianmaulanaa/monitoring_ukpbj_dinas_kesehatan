import AppHeader from "@/components/appheader/AppHeader";
import { prisma } from "@/lib/prisma";
import { Card, EmptyState, StatusBadge, VmsPage } from "./_components";

export const dynamic = "force-dynamic";

export default async function Page() {
  const now = new Date(); const next90 = new Date(now); next90.setDate(next90.getDate() + 90);
  const [total, verified, pending, products, upcoming, procurement, expiring, activities] = await Promise.all([
    prisma.vendor.count({ where: { status: { not: "ARCHIVED" } } }), prisma.vendor.count({ where: { status: "VERIFIED_INTERNAL" } }),
    prisma.vendor.count({ where: { status: "PENDING_REVIEW" } }), prisma.vendorProduct.count({ where: { archivedAt: null } }),
    prisma.vendorPresentation.count({ where: { status: "SCHEDULED", scheduledAt: { gte: now } } }), prisma.vendor.count({ where: { procurementLinks: { some: {} } } }),
    prisma.vendorDocument.count({ where: { archivedAt: null, expiresAt: { gte: now, lte: next90 } } }),
    prisma.vendorStatusHistory.findMany({ include: { vendor: true, actor: { select: { name: true } } }, orderBy: { createdAt: "desc" }, take: 8 }),
  ]);
  const kpis = [["Total Vendor", total], ["Terverifikasi Internal", verified], ["Menunggu Verifikasi", pending], ["Dokumen ≤90 Hari", expiring], ["Produk Terdata", products], ["Presentasi Mendatang", upcoming], ["Vendor dengan Paket", procurement]] as const;
  return <><AppHeader title="Dashboard Vendor" subtitle="UKPBJ › Manajemen Penyedia" rightLabel="VMS"/><VmsPage>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{kpis.map(([label,value]) => <Card key={label}><p className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p><p className="mt-3 text-3xl font-black text-[#08783f]">{value.toLocaleString("id-ID")}</p></Card>)}</div>
    <Card className="mt-5"><h2 className="mb-4 text-lg font-black">Aktivitas terbaru</h2>{activities.length ? <div className="space-y-3">{activities.map((item) => <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3"><div><p className="font-bold">{item.vendor.companyName}</p><p className="text-xs text-slate-500">{item.actor.name} · {item.createdAt.toLocaleString("id-ID")}</p></div><StatusBadge status={item.toStatus}/></div>)}</div> : <EmptyState text="Belum ada aktivitas vendor."/>}</Card>
  </VmsPage></>;
}
