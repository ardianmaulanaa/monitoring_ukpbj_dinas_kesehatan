import { apiError } from "@/lib/response";

export async function GET() {
  return apiError("Data warning tidak ditemukan.", 404);
}

export async function POST() {
  return apiError(
    "Tindak lanjut warning menunggu implementasi model database pada Tahap 5.",
    409,
  );
}
