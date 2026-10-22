import { requireCurrentUser } from "@/lib/auth";
import { apiError, apiSuccess } from "@/lib/response";
import { hasVendorPermission } from "@/lib/vendor-management";
import { transitionVendor } from "@/lib/vendor-service";
import { vendorStatusSchema } from "@/lib/vendor-validation";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await requireCurrentUser().catch(() => null);
  if (!user) return apiError("Sesi tidak valid.", 401);
  const parsed = vendorStatusSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError("Perubahan status tidak valid.", 422, parsed.error.issues.map((issue) => ({ field: issue.path.join("."), message: issue.message })));
  const permission = parsed.data.status === "PENDING_REVIEW" ? "vendor.update" : parsed.data.status === "ARCHIVED" || parsed.data.status === "DRAFT" ? "vendor.archive" : "vendor.verify";
  if (!hasVendorPermission(user.roles, permission)) return apiError("Akses ditolak.", 403);
  const { id } = await context.params;
  try { return apiSuccess(await transitionVendor(id, parsed.data.status, parsed.data.note || undefined, user), "Status vendor berhasil diperbarui."); }
  catch (error) {
    if (error instanceof Error && error.message === "NOT_FOUND") return apiError("Vendor tidak ditemukan.", 404);
    if (error instanceof Error && error.message === "INVALID_TRANSITION") return apiError("Transisi status tidak diizinkan.", 409);
    return apiError("Status vendor gagal diperbarui.", 500);
  }
}
