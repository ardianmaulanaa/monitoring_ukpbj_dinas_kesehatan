import { Prisma } from "@prisma/client";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/response";
import { createVendor, isUniqueConstraintError } from "@/lib/vendor-service";
import { hasVendorPermission } from "@/lib/vendor-management";
import { vendorCreateSchema } from "@/lib/vendor-validation";

export async function GET(request: Request) {
  const user = await requireCurrentUser().catch(() => null);
  if (!user) return apiError("Sesi tidak valid.", 401);
  if (!hasVendorPermission(user.roles, "vendor.read")) return apiError("Akses ditolak.", 403);
  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit")) || 20));
  const search = url.searchParams.get("search")?.trim();
  const status = url.searchParams.get("status") as never;
  const categoryId = url.searchParams.get("categoryId")?.trim();
  const where: Prisma.VendorWhereInput = {
    ...(search ? { OR: [
      { companyName: { contains: search, mode: "insensitive" } }, { nib: { contains: search, mode: "insensitive" } },
      { contacts: { some: { OR: [{ name: { contains: search, mode: "insensitive" } }, { email: { contains: search, mode: "insensitive" } }, { phone: { contains: search } }] } } },
    ] } : {}),
    ...(status ? { status } : {}), ...(categoryId ? { categories: { some: { categoryId } } } : {}),
  };
  const [data, total] = await Promise.all([
    prisma.vendor.findMany({ where, include: { contacts: { where: { isPrimary: true }, take: 1 }, categories: { include: { category: true } } }, orderBy: { updatedAt: "desc" }, skip: (page - 1) * limit, take: limit }),
    prisma.vendor.count({ where }),
  ]);
  return apiSuccess(data, "Data vendor berhasil diambil.", undefined, { page, limit, total, totalPages: Math.ceil(total / limit) });
}

export async function POST(request: Request) {
  const user = await requireCurrentUser().catch(() => null);
  if (!user) return apiError("Sesi tidak valid.", 401);
  if (!hasVendorPermission(user.roles, "vendor.create")) return apiError("Akses ditolak.", 403);
  const parsed = vendorCreateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError("Data vendor tidak valid.", 422, parsed.error.issues.map((issue) => ({ field: issue.path.join("."), message: issue.message })));
  try {
    return apiSuccess(await createVendor(parsed.data, user), "Vendor berhasil disimpan.", { status: 201 });
  } catch (error) {
    if (isUniqueConstraintError(error)) return apiError("NIB sudah terdaftar. Periksa potensi duplikasi vendor.", 409, [{ field: "nib", message: "NIB harus unik." }]);
    return apiError("Vendor gagal disimpan.", 500);
  }
}
