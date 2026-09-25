"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import type { RoleCode } from "@prisma/client";
import {
  AlertTriangle,
  CalendarDays,
  ClipboardList,
  FileBarChart2,
  FileCheck2,
  FolderOpen,
  LayoutDashboard,
  LogOut,
  MessageSquareText,
  PackageSearch,
  Ruler,
  Settings,
  ShieldCheck,
  ShoppingCart,
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
  const router = useRouter();
  const isDesktop = mode === "desktop";
  const drawerOpen = isDesktop ? !collapsed : open;
  // Ambil hanya menu yang boleh diakses role user saat ini.
  const visibleSections = sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => canAccessPath(item.href, roles)),
    }))
    .filter((section) => section.items.length > 0);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
    onClose?.();
    router.replace("/login");
    router.refresh();
  }

  return (
    <>
      {drawerOpen ? (
        // Overlay gelap di belakang sidebar mobile; klik area ini untuk menutup menu.
        <button
          type="button"
          aria-label="Tutup sidebar"
          className="fixed inset-0 z-40 h-[100dvh] max-h-[100dvh] cursor-default bg-slate-950/20 backdrop-blur-[1px] transition"
          onClick={isDesktop ? onToggleDesktop : onClose}
        />
      ) : null}

      <aside
        className={`app-sidebar-drawer fixed inset-y-0 left-0 z-50 flex h-dvh max-h-dvh w-[min(82vw,300px)] flex-col overflow-hidden rounded-none border-r border-slate-200 bg-white text-slate-700 shadow-2xl shadow-slate-950/20 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isDesktop
            ? `hidden lg:flex ${drawerOpen ? "translate-x-0" : "-translate-x-full"}`
            : `${drawerOpen ? "translate-x-0" : "-translate-x-full"} lg:hidden`
        }`}
      >
        {/* HEADER: judul aplikasi dan tombol buka/tutup sidebar. */}
        <div className="flex min-h-[88px] shrink-0 items-center justify-between gap-3 border-b border-slate-100 px-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md border border-emerald-100 bg-white p-2 shadow-md shadow-emerald-900/10">
              <Image
                src="/app/logo-dinkes.png"
                alt="Logo Dinkes"
                width={44}
                height={44}
                className="h-full w-full object-contain"
                priority
              />
            </div>

            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#08783f]">
                DINKES JABAR
              </p>

              <h2 className="mt-1 text-xl font-black tracking-[-0.03em] text-slate-950">
                Monitoring PBJ
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={isDesktop ? onToggleDesktop : onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#edf7f1] text-[#08783f] hover:bg-[#e2f3e9]"
            aria-label="Tutup menu"
            title="Tutup menu"
          >
            <X className="h-5 w-5" strokeWidth={2.6} />
          </button>
        </div>

        {/* HANYA BAGIAN INI YANG BOLEH SCROLL: daftar menu dari sections yang sudah difilter role. */}
        <nav
          className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain px-3 py-5"
        >
          <div className="space-y-5">
            {visibleSections.map((section) => (
              <section key={section.title}>
                <p
                  className="px-3 text-[10px] font-black uppercase tracking-[0.28em] text-slate-400"
                >
                  {section.title}
                </p>

                <div className="mt-2 space-y-1.5">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const active = isActivePath(pathname, item.href);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={onClose}
                        className={`flex min-h-10 items-center gap-3 rounded-md px-4 text-sm font-bold transition ${
                          active
                            ? "bg-[#08783f] text-white shadow-lg shadow-emerald-900/15"
                            : "text-slate-500 hover:bg-[#edf7f1] hover:text-[#08783f]"
                        }`}
                      >
                        <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={2.2} />

                        <span className="truncate">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </nav>

        <div className="shrink-0 border-t border-slate-100 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-[#edf7f1] px-4 py-3 text-sm font-black text-[#08783f] transition hover:bg-[#e2f3e9]"
          >
            <LogOut className="h-[18px] w-[18px]" strokeWidth={2.5} />
            Keluar
          </button>
        </div>
      </aside>
    </>
  );
}
