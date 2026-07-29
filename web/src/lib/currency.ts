export function formatCurrency(value: number | string) {
  const normalizedValue =
    typeof value === "string" ? Number.parseFloat(value) : value;

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(normalizedValue) ? normalizedValue : 0);
}
