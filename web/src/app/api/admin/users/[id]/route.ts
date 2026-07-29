import { apiError } from "@/lib/response";

export async function GET() {
  return apiError("Data pengguna tidak ditemukan.", 404);
}

export async function POST() {
  return apiError(
    "Pembaruan pengguna menunggu implementasi manajemen user pada Tahap 5.",
    409,
  );
}
