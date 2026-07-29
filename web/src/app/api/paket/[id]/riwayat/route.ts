import { emptyListResponse } from "@/lib/empty-api";

export async function GET() {
  return emptyListResponse("Riwayat paket berhasil diambil.");
}
