import { apiError } from "@/lib/response";

export async function GET() {
  return apiError("Data paket tidak ditemukan.", 404);
}

export async function POST() {
  return apiError(
    "Pembaruan paket menunggu implementasi model database pada Tahap 3.",
    409,
  );
}
