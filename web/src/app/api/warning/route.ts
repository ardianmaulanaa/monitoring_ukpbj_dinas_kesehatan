import { emptyListResponse } from "@/lib/empty-api";
import { apiError } from "@/lib/response";

export async function GET() {
  return emptyListResponse("Data warning berhasil diambil.");
}

export async function POST() {
  return apiError("Warning otomatis dibuat oleh sistem pada Tahap 5.", 409);
}
