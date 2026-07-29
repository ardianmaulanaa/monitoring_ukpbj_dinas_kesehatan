import { emptyListResponse } from "@/lib/empty-api";
import { apiError } from "@/lib/response";

export async function GET() {
  return emptyListResponse("Data satuan kerja berhasil diambil.");
}

export async function POST() {
  return apiError(
    "Penyimpanan satuan kerja menunggu implementasi model database pada Tahap 2.",
    409,
  );
}
