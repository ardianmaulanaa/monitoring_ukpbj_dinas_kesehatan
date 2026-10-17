"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Download, RotateCcw } from "lucide-react";
import type { DashboardData } from "@/lib/dashboard-data";

type Props = {
  filters: DashboardData["filters"];
  options: DashboardData["filterOptions"];
};

export default function DashboardFilters({ filters, options }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  const selectClass =
    "h-11 min-w-0 rounded-lg border border-[#dee9e2] bg-white px-3 text-xs font-semibold text-[#253d34] outline-none transition hover:border-[#bfe5cf] focus:border-[#087f4f] focus:ring-2 focus:ring-[#087f4f]/15";

  return (
    <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-[minmax(130px,.7fr)_minmax(170px,1fr)] lg:grid-cols-[150px_190px_minmax(220px,1fr)_auto_auto]">
      <select aria-label="Tahun anggaran" className={selectClass} value={filters.tahunAnggaran} onChange={(event) => update("tahunAnggaran", event.target.value)}>
        {options.years.map((year) => <option key={year} value={year}>TA {year}</option>)}
      </select>
      <select aria-label="Sumber dana" className={selectClass} value={filters.sumberDana ?? ""} onChange={(event) => update("sumberDana", event.target.value)}>
        <option value="">Semua Sumber Dana</option>
        {options.sources.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
      </select>
      <select aria-label="Unit kerja" className={`${selectClass} col-span-2 sm:col-span-1`} value={filters.unit ?? ""} onChange={(event) => update("unit", event.target.value)}>
        <option value="">Semua Unit Kerja</option>
        {options.units.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
      </select>
      <button type="button" onClick={() => router.replace(pathname)} className="flex h-11 items-center justify-center gap-2 rounded-lg border border-[#dee9e2] bg-white px-4 text-xs font-bold text-[#64796f] transition hover:border-[#bfe5cf] hover:bg-[#f0f7f3] hover:text-[#087f4f]" title="Reset filter">
        <RotateCcw className="h-3.5 w-3.5" /> Reset
      </button>
      <a href="/laporan" className="flex h-11 items-center justify-center gap-2 rounded-lg bg-[#087f4f] px-4 text-xs font-bold text-white transition hover:bg-[#066b42]">
        <Download className="h-3.5 w-3.5" /> Unduh Laporan
      </a>
    </div>
  );
}
