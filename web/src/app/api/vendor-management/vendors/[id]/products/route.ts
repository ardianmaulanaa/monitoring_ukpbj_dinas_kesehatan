import { Prisma } from "@prisma/client";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/response";
import { hasVendorPermission } from "@/lib/vendor-management";
import { productLinkSchema } from "@/lib/vendor-validation";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await requireCurrentUser().catch(() => null);
  if (!user) return apiError("Sesi tidak valid.", 401);
  if (!hasVendorPermission(user.roles, "product.create")) return apiError("Akses ditolak.", 403);
  const parsed = productLinkSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError("Produk yang dipilih tidak valid.", 422);
  const { id: vendorId } = await context.params;
  const [vendor, product] = await Promise.all([
    prisma.vendor.findUnique({ where: { id: vendorId }, select: { status: true } }),
    prisma.vendorProduct.findFirst({ where: { id: parsed.data.productId, archivedAt: null }, select: { id: true, vendorId: true, name: true } }),
  ]);
  if (!vendor) return apiError("Vendor tidak ditemukan.", 404);
  if (vendor.status === "ARCHIVED") return apiError("Vendor arsip harus dipulihkan sebelum menerima produk baru.", 409);
  if (!product) return apiError("Produk tidak ditemukan.", 404);
  if (product.vendorId === vendorId) return apiError("Produk sudah dimiliki vendor ini.", 409);
  try {
    await prisma.$transaction(async (tx) => {
      await tx.vendorProductVendor.create({ data: { vendorId, productId: product.id, createdById: user.id } });
      await tx.auditLog.create({ data: { userId: user.id, action: "UPDATE", entity: "VendorProduct", entityId: product.id, after: { vendorId, productName: product.name, operation: "LINK_VENDOR" } } });
    });
    return apiSuccess(null, "Produk berhasil dihubungkan dengan vendor.", { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return apiError("Produk sudah terhubung dengan vendor ini.", 409);
    return apiError("Produk gagal dihubungkan.", 500);
  }
}
