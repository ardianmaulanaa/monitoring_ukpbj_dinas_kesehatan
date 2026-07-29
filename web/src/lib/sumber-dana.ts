import { prisma } from "@/lib/prisma";

export type SumberDanaOption = {
  kode: string;
  nama: string;
};

export async function getActiveSumberDanaOptions() {
  try {
    const rows = await prisma.$queryRaw<SumberDanaOption[]>`
      SELECT kode, nama
      FROM sumber_dana
      WHERE aktif = true
      ORDER BY nama ASC
    `;

    return rows;
  } catch {
    return [];
  }
}
