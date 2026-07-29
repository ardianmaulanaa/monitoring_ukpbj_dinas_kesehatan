import { emptyListResponse } from "@/lib/empty-api";

export async function GET() {
  return emptyListResponse("Laporan kontrak berhasil diambil.");
}
