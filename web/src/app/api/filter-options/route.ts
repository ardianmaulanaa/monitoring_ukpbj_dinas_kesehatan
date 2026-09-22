import { KontrakStatus, PaketStatus, RupStatus } from "@prisma/client";
import { apiSuccess } from "@/lib/response";
import { prisma } from "@/lib/prisma";
import { getActiveSumberDanaOptions } from "@/lib/sumber-dana";

function humanize(value: string) {
  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function uniqueOptions(values: Array<string | number | null | undefined>) {
  return Array.from(
    new Set(
      values
        .filter((value): value is string | number => value !== null && value !== undefined)
        .map((value) => String(value)),
    ),
  ).map((value) => ({ value, label: value }));
}

export async function GET() {
  const [paketYears, rupYears, sourceFunds, paketUnits, rupUnits, paketStatuses] =
    await Promise.all([
      prisma.paketPengadaan.findMany({
        distinct: ["tahunAnggaran"],
        orderBy: { tahunAnggaran: "desc" },
        select: { tahunAnggaran: true },
      }),
      prisma.rencanaUmumPengadaan.findMany({
        distinct: ["tahunAnggaran"],
        orderBy: { tahunAnggaran: "desc" },
        select: { tahunAnggaran: true },
      }),
      getActiveSumberDanaOptions(),
      prisma.paketPengadaan.findMany({
        distinct: ["unitPemohon"],
        orderBy: { unitPemohon: "asc" },
        select: { unitPemohon: true },
      }),
      prisma.rencanaUmumPengadaan.findMany({
        distinct: ["unitPengusul"],
        orderBy: { unitPengusul: "asc" },
        select: { unitPengusul: true },
      }),
      prisma.paketPengadaan.findMany({
        distinct: ["statusPaket"],
        orderBy: { statusPaket: "asc" },
        select: { statusPaket: true },
      }),
    ]);

  const years = uniqueOptions([
    ...paketYears.map((item) => item.tahunAnggaran),
    ...rupYears.map((item) => item.tahunAnggaran),
  ]).map((item) => ({ value: item.value, label: `TA ${item.label}` }));

  const units = uniqueOptions([
    ...paketUnits.map((item) => item.unitPemohon),
    ...rupUnits.map((item) => item.unitPengusul),
  ]);

  const packageStatuses = uniqueOptions([
    ...paketStatuses.map((item) => item.statusPaket),
    ...Object.values(KontrakStatus),
    ...Object.values(PaketStatus),
  ]).map((item) => ({ value: item.value, label: humanize(item.label) }));

  const rupStatuses = Object.values(RupStatus).map((value) => ({
    value,
    label: humanize(value),
  }));

  return apiSuccess(
    {
      years,
      sourceFunds: sourceFunds.map((item) => ({
        value: item.kode,
        label: item.nama,
      })),
      units,
      packageStatuses,
      rupStatuses,
    },
    "Opsi filter berhasil diambil.",
  );
}
