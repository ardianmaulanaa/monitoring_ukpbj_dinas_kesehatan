import { getNotificationSummary } from "@/lib/notifications";
import { apiSuccess } from "@/lib/response";

export async function GET() {
  return apiSuccess(
    await getNotificationSummary(),
    "Notifikasi berhasil diambil.",
  );
}
