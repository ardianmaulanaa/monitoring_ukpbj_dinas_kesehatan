"use client";

type ExportExcelButtonProps = {
  columns: string[];
  rows: string[][];
  fileName?: string;
};

function escapeCsv(value: string) {
  const text = String(value ?? "");
  if (/"|\r|\n|,/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export default function ExportExcelButton({
  columns,
  rows,
  fileName = "export",
}: ExportExcelButtonProps) {
  const downloadCsv = () => {
    const csvRows = [columns.map(escapeCsv).join(",")];
    for (const row of rows) {
      csvRows.push(row.map(escapeCsv).join(","));
    }

    const csvContent = `\uFEFF${csvRows.join("\r\n")}`;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = `${fileName}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      type="button"
      onClick={downloadCsv}
      className="rounded-md border border-slate-300 bg-white px-4 py-2 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
    >
      Excel
    </button>
  );
}
