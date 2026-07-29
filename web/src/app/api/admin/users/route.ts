import { emptyListResponse } from "@/lib/empty-api";
import { apiError } from "@/lib/response";

export async function GET() {
  return emptyListResponse("Data pengguna berhasil diambil.");
}

export async function POST() {
  return apiError(
    "Pembuatan pengguna menunggu implementasi manajemen user pada Tahap 5.",
    409,
  );
}
