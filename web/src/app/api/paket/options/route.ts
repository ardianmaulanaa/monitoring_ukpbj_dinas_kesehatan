import { emptyObjectResponse } from "@/lib/empty-api";

export async function GET() {
  return emptyObjectResponse(
    {
      instansi: [],
      satuanKerja: [],
      tahunAnggaran: [],
      sumberDana: [],
      ppk: [],
    },
    "Opsi paket berhasil diambil.",
  );
}
