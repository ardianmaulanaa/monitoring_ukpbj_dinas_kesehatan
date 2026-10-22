"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  ["/vendor-management", "Dashboard Vendor"],
  ["/vendor-management/vendors", "Direktori Penyedia"],
  ["/vendor-management/products", "Katalog Produk"],
  ["/vendor-management/presentations", "Presentasi & Trial"],
  ["/vendor-management/evaluations", "Evaluasi Kinerja"],
  ["/vendor-management/reports", "Laporan Penyedia"],
] as const;

export default function VmsNav() {
  const pathname = usePathname();
  return (
    <div className="mx-auto w-full max-w-[1500px] px-4 pt-5 sm:px-6 sm:pt-6">
      <nav
        aria-label="Navigasi cepat VMS"
        className="flex max-w-full gap-1 overflow-x-auto rounded-2xl border border-[#dee9e2] bg-white p-2 shadow-sm"
      >
        {links.map(([href, label]) => {
          const active =
            href === "/vendor-management"
              ? pathname === href
              : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`whitespace-nowrap rounded-xl px-3.5 py-2 text-sm font-bold transition ${active ? "bg-[#08783f] text-white shadow-sm" : "text-slate-600 hover:bg-emerald-50 hover:text-emerald-700"}`}
            >
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
