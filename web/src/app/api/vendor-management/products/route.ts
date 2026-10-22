import { Prisma } from "@prisma/client";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/response";
import { hasVendorPermission } from "@/lib/vendor-management";
import { productCreateSchema } from "@/lib/vendor-validation";

export async function GET(request: Request) {
  const user = await requireCurrentUser().catch(() => null);
  if (!user) return apiError("Sesi tidak valid.", 401);
  if (!hasVendorPermission(user.roles, "product.read")) return apiError("Akses ditolak.", 403);
  const params = new URL(request.url).searchParams;
  const query = params.get("search")?.trim();
  const categoryId = params.get("categoryId")?.trim();
  const vendorId = params.get("excludeVendorId")?.trim();
  const data = await prisma.vendorProduct.findMany({
    where: {
      archivedAt: null,
      ...(categoryId ? { categoryId } : {}),
      ...(vendorId ? { vendorId: { not: vendorId }, vendorLinks: { none: { vendorId } } } : {}),
      ...(query ? { OR: [
        { name: { contains: query, mode: "insensitive" } },
        { brand: { contains: query, mode: "insensitive" } },
        { model: { contains: query, mode: "insensitive" } },
        { category: { name: { contains: query, mode: "insensitive" } } },
      ] } : {}),
    },
    include: { vendor: true, category: true },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });
  return apiSuccess(data);
}

export async function POST(request: Request) {
  const user = await requireCurrentUser().catch(() => null);
  if (!user) return apiError("Sesi tidak valid.", 401);
  if (!hasVendorPermission(user.roles, "product.create")) return apiError("Akses ditolak.", 403);
  const parsed = productCreateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError("Data produk tidak valid.", 422, parsed.error.issues.map((issue) => ({ field: issue.path.join("."), message: issue.message })));
  const { indicativePrice, categoryId, brand, model, description, warranty, afterSales, ...data } = parsed.data;
  const vendor = await prisma.vendor.findUnique({ where: { id: data.vendorId }, select: { status: true } });
  if (!vendor) return apiError("Vendor tidak ditemukan.", 404);
  if (vendor.status === "ARCHIVED") return apiError("Vendor arsip harus dipulihkan sebelum menerima produk baru.", 409);
  const product = await prisma.$transaction(async (tx) => {
    const created = await tx.vendorProduct.create({ data: { ...data, categoryId: categoryId || null, brand: brand || null, model: model || null, description: description || null, warranty: warranty || null, afterSales: afterSales || null, indicativePrice: indicativePrice === undefined ? null : new Prisma.Decimal(indicativePrice), createdById: user.id, updatedById: user.id } });
    await tx.auditLog.create({ data: { userId: user.id, action: "CREATE", entity: "VendorProduct", entityId: created.id, after: { vendorId: created.vendorId, name: created.name } } });
    return created;
  });
  return apiSuccess(product, "Produk berhasil disimpan.", { status: 201 });
}
