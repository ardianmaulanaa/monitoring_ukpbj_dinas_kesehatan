import { emptyListResponse } from "@/lib/empty-api";
import { apiError } from "@/lib/response";

export async function GET() {
  return emptyListResponse("Audit log berhasil diambil.");
}

export async function POST() {
  return apiError("Audit log hanya dibuat oleh aksi sistem.", 409);
}
