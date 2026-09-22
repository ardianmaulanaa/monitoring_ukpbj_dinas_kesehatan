"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type FilterOption = {
  value: string;
  label: string;
};

type FilterOptionsPayload = {
  years: FilterOption[];
  sourceFunds: FilterOption[];
  units: FilterOption[];
  packageStatuses: FilterOption[];
  rupStatuses: FilterOption[];
};

const emptyOptions: FilterOptionsPayload = {
  years: [],
  sourceFunds: [],
  units: [],
  packageStatuses: [],
  rupStatuses: [],
};

function isRupFilterPage(pathname: string) {
  return pathname.includes("/sirup-rup") || pathname.includes("/perencanaan");
}

export default function GlobalFilterPanel() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [options, setOptions] = useState<FilterOptionsPayload>(emptyOptions);

  useEffect(() => {
    let active = true;

    async function loadOptions() {
      const response = await fetch("/api/filter-options").catch(() => null);

      if (!active || !response?.ok) {
        return;
      }

      const payload = await response.json();
      setOptions(payload.data ?? emptyOptions);
    }

    loadOptions();

    return () => {
      active = false;
    };
  }, []);

  const paramNames = useMemo(() => {
    if (isRupFilterPage(pathname)) {
      return {
        unit: "unitPengusul",
        status: "statusSirup",
        statuses: options.rupStatuses,
      };
    }

    return {
      unit: "unitPemohon",
      status: "statusPaket",
      statuses: options.packageStatuses,
    };
  }, [options.packageStatuses, options.rupStatuses, pathname]);

  const q = searchParams.get("q") ?? "";
  const tahunAnggaran = searchParams.get("tahunAnggaran") ?? "";
  const sumberDana = searchParams.get("sumberDana") ?? "";
  const unit = searchParams.get(paramNames.unit) ?? "";
  const status = searchParams.get(paramNames.status) ?? "";

  return (
    <form action={pathname} className="space-y-3">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
        Filter
      </p>

      {q ? <input type="hidden" name="q" value={q} /> : null}

      <select
        name="tahunAnggaran"
        defaultValue={tahunAnggaran}
        className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-600 outline-none transition focus:border-[#08783f] focus:ring-2 focus:ring-emerald-100"
      >
        <option value="">Semua Tahun</option>
        {options.years.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>

      <select
        name="sumberDana"
        defaultValue={sumberDana}
        className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-600 outline-none transition focus:border-[#08783f] focus:ring-2 focus:ring-emerald-100"
      >
        <option value="">Semua Sumber Dana</option>
        {options.sourceFunds.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>

      <select
        name={paramNames.unit}
        defaultValue={unit}
        className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-600 outline-none transition focus:border-[#08783f] focus:ring-2 focus:ring-emerald-100"
      >
        <option value="">Semua Unit</option>
        {options.units.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>

      <select
        name={paramNames.status}
        defaultValue={status}
        className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-600 outline-none transition focus:border-[#08783f] focus:ring-2 focus:ring-emerald-100"
      >
        <option value="">Semua Status</option>
        {paramNames.statuses.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>

      <div className="grid grid-cols-2 gap-2 pt-1">
        <Link
          href={pathname}
          className="flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-sm font-black text-slate-500 transition hover:bg-slate-50"
        >
          Reset
        </Link>
        <button
          type="submit"
          className="h-10 rounded-lg bg-[#08783f] text-sm font-black text-white shadow-sm transition hover:bg-[#066532]"
        >
          Terapkan
        </button>
      </div>
    </form>
  );
}
