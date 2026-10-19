"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Button, Select } from "@/components/ui";
import {
  KATEGORI_BARANG_BELUM_DIKATEGORIKAN,
  KATEGORI_BARANG_OPTIONS,
} from "@/lib/kategori-barang";

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
  proposalStatuses: FilterOption[];
};

const emptyOptions: FilterOptionsPayload = {
  years: [],
  sourceFunds: [],
  units: [],
  packageStatuses: [],
  rupStatuses: [],
  proposalStatuses: [],
};

function supportsKategoriBarang(pathname: string) {
  return ["/perencanaan", "/verifikasi", "/sirup-rup", "/e-purchasing"].some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
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
    if (pathname.includes("/verifikasi")) {
      return {
        unit: "unit",
        status: "status",
        statuses: options.proposalStatuses,
      };
    }

    if (
      pathname.includes("/sirup-rup") ||
      pathname.includes("/perencanaan") ||
      pathname.includes("/e-purchasing")
    ) {
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
  }, [
    options.packageStatuses,
    options.proposalStatuses,
    options.rupStatuses,
    pathname,
  ]);

  const q = searchParams.get("q") ?? "";
  const tahunAnggaran = searchParams.get("tahunAnggaran") ?? "";
  const sumberDana = searchParams.get("sumberDana") ?? "";
  const unit = searchParams.get(paramNames.unit) ?? "";
  const status = searchParams.get(paramNames.status) ?? "";
  const kategoriBarang = searchParams.get("kategoriBarang") ?? "";

  return (
    <form action={pathname} className="app-filter-form space-y-3">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
          Filter
        </p>
        <p className="mt-1 text-xs font-semibold text-slate-500">
          Berlaku untuk halaman aktif.
        </p>
      </div>

      {q ? <input type="hidden" name="q" value={q} /> : null}

      <Select
        label="TA"
        name="tahunAnggaran"
        defaultValue={tahunAnggaran}
      >
        <option value="">Semua Tahun</option>
        {options.years.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </Select>

      <Select
        label="Sumber Dana"
        name="sumberDana"
        defaultValue={sumberDana}
      >
        <option value="">Semua Sumber Dana</option>
        {options.sourceFunds.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </Select>

      <Select
        label="Unit"
        name={paramNames.unit}
        defaultValue={unit}
      >
        <option value="">Semua Unit</option>
        {options.units.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </Select>

      {supportsKategoriBarang(pathname) ? (
        <Select
          label="Kategori Barang"
          name="kategoriBarang"
          defaultValue={kategoriBarang}
        >
          <option value="">Semua Kategori</option>
          {KATEGORI_BARANG_OPTIONS.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
          <option value={KATEGORI_BARANG_BELUM_DIKATEGORIKAN}>
            Belum Dikategorikan
          </option>
        </Select>
      ) : null}

      <Select
        label="Status"
        name={paramNames.status}
        defaultValue={status}
      >
        <option value="">Semua Status</option>
        {paramNames.statuses.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </Select>

      <div className="grid grid-cols-2 gap-2 pt-1">
        <Link
          href={pathname}
          className="flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-sm font-black text-slate-500 transition hover:bg-slate-50"
        >
          Reset
        </Link>
        <Button
          type="submit"
          className="px-3"
        >
          Terapkan
        </Button>
      </div>
    </form>
  );
}
