import { apiError } from "@/lib/response";

export async function GET() {
  return apiError("Data serah terima tidak ditemukan.", 404);
}
