import { prisma } from "@/lib/prisma";
import {
  getPlanningCompleteness,
  type CompletionResult,
  type PlanningCompletenessInput,
} from "@/lib/workflow-completeness";

export type UsulanCompletenessResult = CompletionResult & {
  data: PlanningCompletenessInput & {
    id: string;
    kodeRup: string;
  };
};

export async function validateUsulanCompleteness(
  usulanId: string,
): Promise<UsulanCompletenessResult | null> {
  const data = await prisma.rencanaUmumPengadaan.findUnique({
    where: { id: usulanId },
    select: {
      caraPengadaan: true,
      id: true,
      jadwalMulaiRencana: true,
      jadwalPemilihan: true,
      jadwalSelesaiRencana: true,
      jumlahKebutuhan: true,
      justifikasi: true,
      kegiatan: true,
      kodeRekening: true,
      kodeRup: true,
      kontakPenanggungJawab: true,
      metodePengadaan: true,
      namaPaket: true,
      pagu: true,
      ppkPptk: true,
      prioritas: true,
      program: true,
      satuanKebutuhan: true,
      spesifikasiAwal: true,
      statusDokumenPendukung: true,
      statusHps: true,
      statusKak: true,
      subKegiatan: true,
      sumberDana: true,
      tahunAnggaran: true,
      unitBidang: true,
      unitPengusul: true,
      uraianKebutuhan: true,
    },
  });

  if (!data) return null;

  return {
    ...getPlanningCompleteness(data),
    data,
  };
}
