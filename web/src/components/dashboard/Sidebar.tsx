"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { RoleCode } from "@prisma/client";
import {
  AlertTriangle,
  CalendarDays,
  ClipboardList,
  FileBarChart2,
  FileCheck2,
  FolderOpen,
  LayoutDashboard,
  Menu,
  MessageSquareText,
  PackageSearch,
  Ruler,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Truck,
  WalletCards,
  X,
  type LucideIcon,
} from "lucide-react";
import { canAccessPath } from "@/lib/access-control";

type SidebarProps = {
  // Props open/onClose dipakai untuk sidebar mobile.
  open?: boolean;
  onClose?: () => void;
  // mode menentukan sidebar dipakai sebagai drawer mobile atau menu desktop.
  mode?: "mobile" | "desktop";
  // collapsed/onToggleDesktop dipakai untuk buka-tutup sidebar desktop.
  collapsed?: boolean;
  onToggleDesktop?: () => void;
  // roles berasal dari ProtectedDashboardLayout/AppHeader untuk filter menu.
  roles?: RoleCode[];
};

type NavigationItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

type NavigationSection = {
  title: string;
  items: NavigationItem[];
};

const sections: NavigationSection[] = [
  // Daftar menu sidebar. Hak akses tiap menu disaring lewat canAccessPath().
  {
    title: "Utama",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/sirup-rup", label: "SIRUP / RUP", icon: ClipboardList },
      { href: "/perencanaan", label: "Perencanaan", icon: Ruler },
    ],
  },
  {
    title: "Pengadaan",
    items: [
      { href: "/katalog-v6-v5", label: "Katalog V6/V5", icon: ShoppingCart },
      {
        href: "/tender-non-tender",
        label: "Tender & Non Tender",
        icon: PackageSearch,
      },
      { href: "/kontrak-sp", label: "Kontrak & SP", icon: FileCheck2 },
      { href: "/realisasi-belanja", label: "Realisasi Belanja", icon: WalletCards },
    ],
  },
  {
    title: "Monitoring",
    items: [
      {
        href: "/risiko-mitigasi",
        label: "Risiko & Mitigasi",
        icon: AlertTriangle,
      },
      { href: "/audit-readiness", label: "Audit Readiness", icon: ShieldCheck },
      { href: "/timeline", label: "Timeline", icon: CalendarDays },
    ],
  },
  {
    title: "Pendukung",
    items: [
      { href: "/vendor-pasar", label: "Vendor & Pasar", icon: Truck },
      {
        href: "/klinik-ukpbj",
        label: "Klinik UKPBJ",
        icon: MessageSquareText,
      },
      { href: "/dokumen-template", label: "Dokumen & Template", icon: FolderOpen },
      { href: "/laporan", label: "Laporan", icon: FileBarChart2 },
      { href: "/pengaturan", label: "Pengaturan", icon: Settings },
    ],
  },
];

function isActivePath(pathname: string, href: string) {
  // Menentukan menu mana yang sedang aktif berdasarkan URL saat ini.
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }

  if (href === "/risiko-mitigasi") {
    return pathname === "/risiko-mitigasi" || pathname.startsWith("/risiko-mitigasi/");
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Sidebar({
  open = false,
  onClose,
  mode = "mobile",
  collapsed = false,
  onToggleDesktop,
  roles = [],
}: SidebarProps) {
  const pathname = usePathname();
  const isDesktop = mode === "desktop";
  // Ambil hanya menu yang boleh diakses role user saat ini.
  const visibleSections = sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => canAccessPath(item.href, roles)),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <>
      {!isDesktop ? (
        // Overlay gelap di belakang sidebar mobile; klik area ini untuk menutup menu.
        <div
          className={`fixed inset-0 z-40 h-[100dvh] max-h-[100dvh] bg-slate-950/30 transition lg:hidden ${
            open ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
          onClick={onClose}
          aria-hidden="true"
        />
      ) : null}

      <aside
        className={`inset-y-0 left-0 z-50 flex-col border-r border-slate-200 bg-white text-slate-700 transition-all duration-300 ${
          isDesktop
            ? `fixed top-0 hidden h-dvh overflow-hidden lg:flex ${
                collapsed
                  ? "w-[76px]"
                  : "w-[260px] shadow-2xl shadow-slate-950/10"
              }`
            : `fixed flex h-dvh max-h-dvh w-[300px] overflow-hidden lg:hidden ${
                open ? "translate-x-0" : "-translate-x-full"
              }`
        }`}
      >
        {/* GARIS WARNA */}
        <div className="grid h-1.5 shrink-0 grid-cols-3">
          <div className="bg-[#08783f]" />
          <div className="bg-[#f5bd20]" />
          <div className="bg-[#159cc3]" />
        </div>

        {/* HEADER: judul aplikasi dan tombol buka/tutup sidebar. */}
        <div
          className={`flex min-h-[96px] shrink-0 items-center border-b border-slate-100 ${
            collapsed && isDesktop
              ? "justify-center px-3"
              : "justify-between px-5"
          }`}
        >
          <div className={`min-w-0 ${collapsed && isDesktop ? "hidden" : ""}`}>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#08783f]">
              Dinkes Jabar
            </p>

            <h2 className="mt-2 text-xl font-black tracking-[-0.03em] text-slate-950">
              Monitoring PBJ
            </h2>
          </div>

          {isDesktop ? (
            <button
              type="button"
              onClick={onToggleDesktop}
              className="hidden h-10 w-10 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-[#08783f] lg:flex"
              aria-label={collapsed ? "Buka sidebar" : "Tutup sidebar"}
              title={collapsed ? "Buka sidebar" : "Tutup sidebar"}
            >
              <Menu className="h-5 w-5" strokeWidth={2.4} />
            </button>
          ) : null}

          {!isDesktop ? (
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-[#08783f]"
              aria-label="Tutup menu"
              title="Tutup menu"
            >
              <X className="h-5 w-5" strokeWidth={2.4} />
            </button>
          ) : null}
        </div>

        {/* HANYA BAGIAN INI YANG BOLEH SCROLL: daftar menu dari sections yang sudah difilter role. */}
        <nav
          className={`min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain py-4 ${
            collapsed && isDesktop ? "px-2" : "px-3"
          } ${isDesktop ? "" : "pb-[max(2rem,env(safe-area-inset-bottom))]"}`}
        >
          <div className="space-y-4">
            {visibleSections.map((section) => (
              <section key={section.title}>
                <p
                  className={`px-3 pb-1 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400 ${
                    collapsed && isDesktop ? "sr-only" : ""
                  }`}
                >
                  {section.title}
                </p>

                <div className="mt-2 space-y-1">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const active = isActivePath(pathname, item.href);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={onClose}
                        title={collapsed && isDesktop ? item.label : undefined}
                        className={`flex min-h-10 items-center rounded-lg border-l-[3px] text-sm font-bold transition ${
                          collapsed && isDesktop
                            ? "justify-center gap-0 px-2"
                            : "gap-3 px-3"
                        } ${
                          active
                            ? "border-[#08783f] bg-[#08783f] text-white shadow-[0_10px_22px_rgba(8,120,63,0.18)]"
                            : "border-transparent text-slate-600 hover:border-[#08783f]/25 hover:bg-[#f4f7f5] hover:text-[#08783f]"
                        }`}
                      >
                        <Icon className="h-5 w-5 shrink-0" strokeWidth={2.2} />

                        <span
                          className={`truncate ${
                            collapsed && isDesktop ? "sr-only" : ""
                          }`}
                        >
                          {item.label}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </nav>
      </aside>
    </>
  );
}
