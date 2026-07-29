import { emptyListResponse } from "@/lib/empty-api";
import { apiError } from "@/lib/response";

export async function GET() {
  return emptyListResponse("Data serah terima berhasil diambil.");
}

export async function POST() {
  return apiError(
    "Penyimpanan serah terima menunggu implementasi model database pada Tahap 4.",
    409,
  );
}
