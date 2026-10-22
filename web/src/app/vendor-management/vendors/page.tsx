import Link from "next/link";
import AppHeader from "@/components/appheader/AppHeader";
import { prisma } from "@/lib/prisma";
import { maskTaxId } from "@/lib/vendor-management";
import { Card, EmptyState, StatusBadge, VmsPage } from "../_components";
import AddVendorModalButton from "@/components/vendor-management/AddVendorModalButton";
import VendorDirectoryTable from "@/components/vendor-management/VendorDirectoryTable";

export const dynamic = "force-dynamic";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const search = params.search?.trim();
  const page = Math.max(1, Number(params.page) || 1);
  const take = 20;
  const where = {
    ...(search
      ? {
          OR: [
            { companyName: { contains: search, mode: "insensitive" as const } },
            { nib: { contains: search, mode: "insensitive" as const } },
            {
              contacts: {
                some: {
                  name: { contains: search, mode: "insensitive" as const },
                },
              },
            },
          ],
        }
      : {}),
    ...(params.status ? { status: params.status as never } : {}),
  };
  const [vendors, total, categories] = await Promise.all([
    prisma.vendor.findMany({
      where,
      include: {
        contacts: { where: { isPrimary: true }, take: 1 },
        categories: { include: { category: true } },
      },
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * take,
      take,
    }),
    prisma.vendor.count({ where }),
    prisma.vendorCategory.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);
  return (
    <>
      <AppHeader
        title="Direktorat Penyedia"
        subtitle="UKPBJ › Manajemen Penyedia"
        rightLabel={`${total} vendor`}
      />
      <VmsPage>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <form className="flex flex-1 flex-wrap gap-2">
            <input
              name="search"
              defaultValue={search}
              placeholder="Cari nama, NIB, atau PIC…"
              className="min-w-64 flex-1 rounded-xl border border-slate-300 px-4 py-2"
            />
            <select
              name="status"
              defaultValue={params.status}
              className="rounded-xl border border-slate-300 px-3 py-2"
            >
              <option value="">Semua status</option>
              {[
                "DRAFT",
                "PENDING_REVIEW",
                "NEEDS_REVISION",
                "VERIFIED_INTERNAL",
                "ARCHIVED",
              ].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
            <button className="rounded-xl bg-slate-800 px-4 py-2 font-bold text-white">
              Terapkan
            </button>
          </form>
          <AddVendorModalButton categories={categories} />
        </div>
        <VendorDirectoryTable categories={categories}>
          <Card className="overflow-x-auto p-0">
            {vendors.length ? (
              <table className="min-w-[900px] w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                  <tr>
                    {[
                      "Vendor",
                      "NIB",
                      "PIC",
                      "Kategori",
                      "Status",
                      "Diperbarui",
                      "Aksi",
                    ].map((x) => (
                      <th className="px-4 py-3" key={x}>
                        {x}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {vendors.map((v) => (
                    <tr key={v.id} className="border-t border-slate-100">
                      <td className="px-4 py-4 font-bold">
                        {v.companyName}
                        <div className="text-xs font-normal text-slate-400">
                          NPWP {maskTaxId(v.npwp)}
                        </div>
                      </td>
                      <td className="px-4 py-4">{v.nib}</td>
                      <td className="px-4 py-4">
                        {v.contacts[0]?.name ?? "-"}
                      </td>
                      <td className="px-4 py-4">
                        {v.categories.map((x) => x.category.name).join(", ") ||
                          "-"}
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={v.status} />
                      </td>
                      <td className="px-4 py-4">
                        {v.updatedAt.toLocaleDateString("id-ID")}
                      </td>
                      <td className="px-4 py-4">
                        <button
                          type="button"
                          data-vendor-detail={v.id}
                          className="font-bold text-emerald-700"
                        >
                          Detail
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-5">
                <EmptyState text="Belum ada vendor sesuai filter." />
              </div>
            )}
          </Card>
        </VendorDirectoryTable>
        <div className="mt-4 flex justify-end gap-2 text-sm">
          <span>
            Halaman {page} / {Math.max(1, Math.ceil(total / take))}
          </span>
          {page > 1 && (
            <Link
              href={`?page=${page - 1}`}
              className="font-bold text-emerald-700"
            >
              Sebelumnya
            </Link>
          )}
          {page * take < total && (
            <Link
              href={`?page=${page + 1}`}
              className="font-bold text-emerald-700"
            >
              Berikutnya
            </Link>
          )}
        </div>
      </VmsPage>
    </>
  );
}
