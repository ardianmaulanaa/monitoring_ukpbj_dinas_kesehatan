import { emptyListResponse } from "@/lib/empty-api";
import { apiError } from "@/lib/response";

export async function GET() {
  return emptyListResponse("Riwayat sinkronisasi berhasil diambil.");
}

export async function POST() {
  return apiError(
    "Sinkronisasi menunggu integrasi sumber data pada Tahap 5.",
    409,
  );
}
