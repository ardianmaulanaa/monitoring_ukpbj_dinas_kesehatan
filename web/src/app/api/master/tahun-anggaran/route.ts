import { emptyListResponse } from "@/lib/empty-api";
import { apiError } from "@/lib/response";

export async function GET() {
  return emptyListResponse("Data tahun anggaran berhasil diambil.");
}

export async function POST() {
  return apiError(
    "Penyimpanan tahun anggaran menunggu implementasi model database pada Tahap 2.",
    409,
  );
}
