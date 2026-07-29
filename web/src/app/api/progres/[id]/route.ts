import { apiError } from "@/lib/response";

export async function GET() {
  return apiError("Data progres tidak ditemukan.", 404);
}

export async function POST() {
  return apiError(
    "Pembaruan progres menunggu implementasi model database pada Tahap 4.",
    409,
  );
}
