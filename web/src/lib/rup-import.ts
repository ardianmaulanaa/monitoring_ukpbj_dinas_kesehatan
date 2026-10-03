import { Prisma } from "@prisma/client";
import * as XLSX from "xlsx";

export type RupImportInput = {
  kodeRup: string;
  namaPaket: string;
  kegiatan: string | null;
  sumberDana: string;
  lokasiPaket: string | null;
  metodePengadaan: "TENDER" | "NON_TENDER" | "E_PURCHASING" | "PENGADAAN_LANGSUNG" | "SWAKELOLA";
  pagu: number;
};

export type RupImportPreviewRow = RupImportInput & {
  rowNumber: number;
  status: "valid" | "invalid" | "duplicate";
  errors: string[];
};

const METHOD_MAP: Array<[RegExp, RupImportInput["metodePengadaan"]]> = [
  [/e[\s-]?purchasing|e[\s-]?catalog|e[\s-]?katalog/i, "E_PURCHASING"],
  [/pengadaan\s+langsung/i, "PENGADAAN_LANGSUNG"],
  [/non[\s-]?tender/i, "NON_TENDER"],
  [/swakelola/i, "SWAKELOLA"],
  [/tender/i, "TENDER"],
];

const SOURCE_FUND_PATTERN =
  /\b(APBD|APBN|BLUD|DAK|DBHCHT|BOS|HIBAH|DAU|DAU-SG|BANKEU)\b/i;

type PdfParseModule = {
  PDFParse: new (options: { data: Buffer }) => {
    getText: () => Promise<{ text: string }>;
    destroy: () => Promise<void>;
  };
};

function cleanText(value: unknown) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function parseCurrency(value: unknown) {
  const raw = cleanText(value);
  if (!raw) return 0;

  const normalized = raw
    .replace(/[^\d,.-]/g, "")
    .replace(/\.(?=\d{3}(\D|$))/g, "")
    .replace(",", ".");
  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeMethod(value: unknown): RupImportInput["metodePengadaan"] {
  const raw = cleanText(value);
  const match = METHOD_MAP.find(([pattern]) => pattern.test(raw));

  return match?.[1] ?? "E_PURCHASING";
}

function normalizeHeader(value: unknown) {
  return cleanText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function pickValue(row: Record<string, unknown>, aliases: string[]) {
  const normalizedAliases = aliases.map(normalizeHeader);
  const entry = Object.entries(row).find(([key]) =>
    normalizedAliases.includes(normalizeHeader(key)),
  );

  return entry?.[1];
}

function validateRows(rows: RupImportInput[], existingKodeRup = new Set<string>()) {
  const seen = new Set<string>();

  return rows.map<RupImportPreviewRow>((row, index) => {
    const errors: string[] = [];
    const kodeRup = cleanText(row.kodeRup);

    if (!kodeRup) errors.push("Kode RUP kosong.");
    if (!cleanText(row.namaPaket)) errors.push("Nama Paket kosong.");
    if (!cleanText(row.sumberDana)) errors.push("Sumber Dana kosong.");
    if (!row.pagu || row.pagu < 0) errors.push("Pagu tidak valid.");
    if (seen.has(kodeRup)) errors.push("Kode RUP duplikat di file.");

    seen.add(kodeRup);

    const status =
      errors.length > 0
        ? "invalid"
        : existingKodeRup.has(kodeRup)
          ? "duplicate"
          : "valid";

    return {
      ...row,
      rowNumber: index + 1,
      status,
      errors,
    };
  });
}

function parseExcel(buffer: Buffer) {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = firstSheetName ? workbook.Sheets[firstSheetName] : null;

  if (!worksheet) return [];

  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
    defval: "",
  });

  return rawRows
    .map<RupImportInput | null>((row) => {
      const kodeRup = cleanText(pickValue(row, ["Kode RUP", "KodeRUP"]));
      const namaPaket = cleanText(pickValue(row, ["Nama Paket", "NamaPaket"]));
      const sumberDana = cleanText(pickValue(row, ["Sumber Dana", "SumberDana"]));
      const pagu = parseCurrency(pickValue(row, ["Pagu"]));

      if (!kodeRup && !namaPaket && !sumberDana && !pagu) return null;

      return {
        kodeRup,
        namaPaket,
        kegiatan: cleanText(pickValue(row, ["Kegiatan"])) || null,
        sumberDana,
        lokasiPaket: cleanText(pickValue(row, ["Lokasi", "Lokasi Paket"])) || null,
        metodePengadaan: normalizeMethod(
          pickValue(row, ["Pemilihan Penyedia", "Metode Pengadaan", "Metode"]),
        ),
        pagu,
      };
    })
    .filter((row): row is RupImportInput => Boolean(row));
}

function splitPdfRows(text: string) {
  const lines = text
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trim());
  const rowStartIndexes = lines.reduce<number[]>((indexes, line, index) => {
    if (!/^\d+$/.test(line)) return indexes;

    const nextLines = lines.slice(index + 1, index + 10).join(" ");
    if (/\b\d{7,}\b/.test(nextLines)) indexes.push(index);

    return indexes;
  }, []);

  return rowStartIndexes.map((startIndex, index) => {
    const endIndex = rowStartIndexes[index + 1] ?? lines.length;

    return lines.slice(startIndex, endIndex).join("\n").trim();
  });
}

function parsePdfRow(chunk: string): RupImportInput | null {
  const lines = chunk
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const withoutNumber = lines.slice(1).join("\n");
  const codeMatch = withoutNumber.match(/\b\d{7,}\b/);

  if (!codeMatch || codeMatch.index === undefined) return null;

  const kegiatan = cleanText(withoutNumber.slice(0, codeMatch.index));
  const kodeRup = codeMatch[0];
  const afterCode = withoutNumber.slice(codeMatch.index + kodeRup.length);
  const methodMatch = METHOD_MAP.map(([pattern, method]) => {
    const match = afterCode.match(pattern);

    return match && match.index !== undefined ? { match, method } : null;
  }).find((match) => Boolean(match));
  const metodePengadaan = methodMatch?.method ?? "E_PURCHASING";
  const paguMatch = methodMatch
    ? afterCode
        .slice((methodMatch.match.index ?? 0) + methodMatch.match[0].length)
        .match(/(\d{1,3}(?:\.\d{3})+|\d+)(?:,\d+)?/)
    : afterCode.match(/(\d{1,3}(?:\.\d{3})+|\d+)(?:,\d+)?\s*$/);
  const pagu = parseCurrency(paguMatch?.[0] ?? "");
  const beforeMethod = methodMatch
    ? afterCode.slice(0, methodMatch.match.index).trim()
    : afterCode.trim();
  const sourceMatch = beforeMethod.match(SOURCE_FUND_PATTERN);

  if (!sourceMatch || sourceMatch.index === undefined) {
    return {
      kodeRup,
      namaPaket: cleanText(beforeMethod),
      kegiatan: kegiatan || null,
      sumberDana: "",
      lokasiPaket: null,
      metodePengadaan,
      pagu,
    };
  }

  const namaPaket = cleanText(beforeMethod.slice(0, sourceMatch.index));
  const sumberDana = sourceMatch[1].toUpperCase();
  const afterSource = beforeMethod.slice(sourceMatch.index + sourceMatch[0].length);
  const lokasiPaket = cleanText(afterSource.split(/Volume:|TKDN:/i)[0]) || null;

  return {
    kodeRup,
    namaPaket,
    kegiatan: kegiatan || null,
    sumberDana,
    lokasiPaket,
    metodePengadaan,
    pagu,
  };
}

function loadPdfParse() {
  const requirePdfParse = eval("require") as (moduleName: string) => PdfParseModule;

  return requirePdfParse("pdf-parse").PDFParse;
}

export async function parseRupImportFile(file: File) {
  const buffer = Buffer.from(await file.arrayBuffer());
  const filename = file.name.toLowerCase();

  if (filename.endsWith(".xlsx") || filename.endsWith(".xls")) {
    return parseExcel(buffer);
  }

  if (filename.endsWith(".pdf") || file.type === "application/pdf") {
    const PDFParse = loadPdfParse();
    const parser = new PDFParse({ data: buffer });
    const parsed = await parser.getText();
    await parser.destroy();

    return splitPdfRows(parsed.text)
      .map(parsePdfRow)
      .filter((row): row is RupImportInput => Boolean(row));
  }

  throw new Error("Format file tidak didukung. Upload PDF SiRUP LKPP atau Excel RUP.");
}

export function buildRupPreview(
  rows: RupImportInput[],
  existingKodeRup = new Set<string>(),
) {
  return validateRows(rows, existingKodeRup);
}

export function toRupCreateManyData(
  rows: RupImportInput[],
  tahunAnggaran: number,
  unitPengusul: string,
) {
  return rows.map((row) => ({
    kodeRup: row.kodeRup,
    namaPaket: row.namaPaket,
    kegiatan: row.kegiatan,
    sumberDana: row.sumberDana,
    lokasiPaket: row.lokasiPaket,
    metodePengadaan: row.metodePengadaan,
    pagu: new Prisma.Decimal(row.pagu),
    tahunAnggaran,
    unitPengusul,
    statusSirup: "SUDAH_TAYANG" as const,
  }));
}
