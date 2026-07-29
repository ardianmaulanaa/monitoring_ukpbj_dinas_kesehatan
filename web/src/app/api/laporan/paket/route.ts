import { emptyListResponse } from "@/lib/empty-api";

export async function GET() {
  return emptyListResponse("Laporan paket berhasil diambil.");
}
