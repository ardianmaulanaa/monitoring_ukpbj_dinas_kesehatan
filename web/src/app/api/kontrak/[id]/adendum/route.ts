import { apiError } from "@/lib/response";

export async function GET() {
  return apiError("Data adendum tidak ditemukan.", 404);
}

export async function POST() {
  return apiError(
    "Penyimpanan adendum menunggu implementasi model database pada Tahap 4.",
    409,
  );
}
