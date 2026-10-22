import AppHeader from "@/components/appheader/AppHeader";
import { prisma } from "@/lib/prisma";
import { Card, VmsPage } from "../../_components";
import VendorForm from "@/components/vendor-management/VendorForm";

export const dynamic = "force-dynamic";
export default async function Page() {
  const categories = await prisma.vendorCategory.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
  return (
    <>
      <AppHeader
        title="Tambah Vendor"
        subtitle="VMS › Direktorat Penyedia"
        rightLabel="Draft"
      />
      <VmsPage>
        <Card>
          <p className="mb-5 text-sm text-slate-500">
            Data disimpan sebagai draft. Setelah lengkap, kirim untuk verifikasi
            internal dari halaman detail.
          </p>
          <VendorForm categories={categories} />
        </Card>
      </VmsPage>
    </>
  );
}
