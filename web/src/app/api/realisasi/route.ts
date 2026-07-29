import { emptyListResponse } from "@/lib/empty-api";
import { apiError } from "@/lib/response";

export async function GET() {
  return emptyListResponse("Data realisasi berhasil diambil.");
}

export async function POST() {
  return apiError(
    "Penyimpanan realisasi menunggu implementasi model database pada Tahap 4.",
    409,
  );
}
