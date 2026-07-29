import { emptyObjectResponse } from "@/lib/empty-api";

export async function GET() {
  return emptyObjectResponse(
    {
      paket: [],
      kontrak: [],
      progres: [],
      realisasi: [],
      summary: {
        totalPaket: 0,
        totalKontrak: 0,
        totalProgres: 0,
        totalRealisasi: "0",
      },
    },
    "Data laporan berhasil diambil.",
  );
}
