import { getDashboardData } from "@/lib/dashboard-data";
import { apiSuccess } from "@/lib/response";

export const preferredRegion = "sin1";
export const runtime = "nodejs";

export async function GET() {
  const data = await getDashboardData();

  return apiSuccess(data, "Ringkasan dashboard berhasil diambil.");
}
