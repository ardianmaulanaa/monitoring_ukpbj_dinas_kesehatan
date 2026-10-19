export const KATEGORI_BARANG_OPTIONS = [
  { value: "BMHP", label: "BMHP" },
  { value: "BAHAN_KIMIA", label: "Bahan Kimia" },
  { value: "REAGEN", label: "Reagen" },
  { value: "ATK", label: "ATK" },
] as const;

export type KategoriBarang = (typeof KATEGORI_BARANG_OPTIONS)[number]["value"];

export const KATEGORI_BARANG_BELUM_DIKATEGORIKAN = "BELUM_DIKATEGORIKAN";

export function kategoriBarangFilter(value?: string | null) {
  if (value === KATEGORI_BARANG_BELUM_DIKATEGORIKAN) {
    return {
      jenisBelanja: { equals: "Barang", mode: "insensitive" as const },
      kategoriBarang: null,
    };
  }

  if (KATEGORI_BARANG_OPTIONS.some((option) => option.value === value)) {
    return {
      jenisBelanja: { equals: "Barang", mode: "insensitive" as const },
      kategoriBarang: value,
    };
  }

  return undefined;
}

export function kategoriBarangLabel(value?: string | null) {
  if (!value) return "Belum dikategorikan";
  return KATEGORI_BARANG_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

export function normalizeKategoriBarang(jenisBelanja?: string | null, value?: string | null) {
  if (jenisBelanja?.trim().toLowerCase() !== "barang") return null;
  const normalized = value?.trim() ?? "";
  return KATEGORI_BARANG_OPTIONS.some((option) => option.value === normalized)
    ? (normalized as KategoriBarang)
    : null;
}
