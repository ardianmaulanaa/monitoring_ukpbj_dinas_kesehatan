import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/response";
import { hasVendorPermission } from "@/lib/vendor-management";
import { isUniqueConstraintError, updateVendor } from "@/lib/vendor-service";
import { vendorUpdateSchema } from "@/lib/vendor-validation";

export async function GET(
  _: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await requireCurrentUser().catch(() => null);
  if (!user) return apiError("Sesi tidak valid.", 401);
  if (!hasVendorPermission(user.roles, "vendor.read"))
    return apiError("Akses ditolak.", 403);
  const { id } = await context.params;
  const vendor = await prisma.vendor.findUnique({
    where: { id },
    include: {
      contacts: true,
      documents: {
        where: { archivedAt: null },
        orderBy: { createdAt: "desc" },
      },
      categories: { include: { category: true } },
      products: { where: { archivedAt: null }, include: { category: true } },
      productOfferings: {
        where: { product: { archivedAt: null } },
        include: { product: { include: { category: true, vendor: { select: { companyName: true } } } } },
      },
      presentations: {
        include: { technicalEvaluation: true },
        orderBy: { proposedAt: "desc" },
      },
      procurementLinks: {
        include: { package: true },
        orderBy: { createdAt: "desc" },
      },
      evaluations: {
        include: { package: true, scores: { include: { criterion: true } } },
        orderBy: { createdAt: "desc" },
      },
      statusHistory: {
        include: { actor: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  const responseVendor = vendor ? {
    ...vendor,
    products: [
      ...vendor.products.map((product) => ({ ...product, relationship: "OWNER" as const })),
      ...vendor.productOfferings.map(({ product }) => ({ ...product, relationship: "OFFERING" as const })),
    ],
    productOfferings: undefined,
  } : null;
  return responseVendor
    ? apiSuccess({
        vendor: responseVendor,
        permissions: {
          canUpdate: hasVendorPermission(user.roles, "vendor.update"),
          canArchive: hasVendorPermission(user.roles, "vendor.archive"),
          canCreateProduct: hasVendorPermission(user.roles, "product.create"),
        },
      })
    : apiError("Vendor tidak ditemukan.", 404);
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await requireCurrentUser().catch(() => null);
  if (!user) return apiError("Sesi tidak valid.", 401);
  if (!hasVendorPermission(user.roles, "vendor.update"))
    return apiError("Akses ditolak.", 403);
  const parsed = vendorUpdateSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success)
    return apiError(
      "Data vendor tidak valid.",
      422,
      parsed.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    );
  const { id } = await context.params;
  try {
    return apiSuccess(
      await updateVendor(id, parsed.data, user),
      "Perubahan vendor berhasil disimpan.",
    );
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_FOUND")
      return apiError("Vendor tidak ditemukan.", 404);
    if (error instanceof Error && error.message === "ARCHIVED")
      return apiError("Vendor yang telah diarsipkan tidak dapat diubah.", 409);
    if (isUniqueConstraintError(error))
      return apiError("NIB sudah digunakan vendor lain.", 409, [
        { field: "nib", message: "NIB harus unik." },
      ]);
    return apiError("Perubahan vendor gagal disimpan.", 500);
  }
}
