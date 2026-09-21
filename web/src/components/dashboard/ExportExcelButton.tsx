"use client";

type ExportExcelButtonProps = {
  // columns dan rows dikirim dari halaman/module yang mau diexport.
  columns: string[];
  rows: string[][];
  fileName?: string;
};

function escapeCsv(value: string) {
  // Rapikan nilai CSV supaya koma, enter, dan tanda kutip tidak merusak file.
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
    // Bentuk isi CSV dari header kolom dan baris data.
    const csvRows = [columns.map(escapeCsv).join(",")];
    for (const row of rows) {
      csvRows.push(row.map(escapeCsv).join(","));
    }

    // Buat file sementara di browser, lalu klik otomatis supaya file terdownload.
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
