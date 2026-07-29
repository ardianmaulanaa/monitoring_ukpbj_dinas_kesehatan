import { emptyListResponse } from "@/lib/empty-api";
import { apiError } from "@/lib/response";

export async function GET() {
  return emptyListResponse("Data instansi berhasil diambil.");
}

export async function POST() {
  return apiError(
    "Penyimpanan instansi menunggu implementasi model database pada Tahap 2.",
    409,
  );
}
