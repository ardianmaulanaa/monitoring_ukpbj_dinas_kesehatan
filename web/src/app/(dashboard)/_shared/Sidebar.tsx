"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { RoleCode } from "@prisma/client";
import {
  AlertTriangle,
  Archive,
  BarChart3,
  Building2,
  CalendarDays,
  ClipboardList,
  Database,
  FileBarChart2,
  FileCheck2,
  FileText,
  FolderOpen,
  Handshake,
  LayoutDashboard,
  Menu,
  MessageSquareText,
  PackageSearch,
  Ruler,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Truck,
  UsersRound,
  WalletCards,
  X,
  type LucideIcon,
} from "lucide-react";
import { canAccessPath } from "@/lib/access-control";

type SidebarProps = {
  open?: boolean;
  onClose?: () => void;
  mode?: "mobile" | "desktop";
  collapsed?: boolean;
  onToggleDesktop?: () => void;
  roles?: RoleCode[];
};

type NavigationItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
};

type NavigationSection = {
  title: string;
  items: NavigationItem[];
};

const sections: NavigationSection[] = [
  {
    title: "Utama",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/rup", label: "SIRUP / RUP", icon: ClipboardList, badge: "3" },
      { href: "/pengadaan/perencanaan", label: "Perencanaan", icon: Ruler },
    ],
  },
  {
    title: "Pengadaan",
    items: [
      { href: "/katalog", label: "Katalog V6/V5", icon: ShoppingCart },
      {
        href: "/pengadaan/pemilihan",
        label: "Tender & Non Tender",
        icon: PackageSearch,
      },
      { href: "/paket", label: "Paket Pengadaan", icon: ClipboardList },
      { href: "/data-barang", label: "Data Barang", icon: Database },
      { href: "/kontrak", label: "Kontrak & SP", icon: FileCheck2, badge: "2" },
      { href: "/progres", label: "Progres", icon: BarChart3 },
      { href: "/serah-terima", label: "Serah Terima", icon: Handshake },
      { href: "/realisasi", label: "Realisasi Belanja", icon: WalletCards },
    ],
  },
  {
    title: "Monitoring",
    items: [
      {
        href: "/warning",
        label: "Risiko & Mitigasi",
        icon: AlertTriangle,
        badge: "5",
      },
      { href: "/audit", label: "Audit Readiness", icon: ShieldCheck },
      { href: "/timeline", label: "Timeline", icon: CalendarDays },
    ],
  },
  {
    title: "Pendukung",
    items: [
      { href: "/penyedia", label: "Vendor & Pasar", icon: Truck },
      {
        href: "/klinik",
        label: "Klinik UKPBJ",
        icon: MessageSquareText,
        badge: "1",
      },
      { href: "/dokumen", label: "Dokumen & Template", icon: FolderOpen },
      { href: "/laporan", label: "Laporan", icon: FileBarChart2 },
      { href: "/master/instansi", label: "Master Data", icon: Building2 },
      { href: "/pengaturan", label: "Pengaturan", icon: Settings },
      { href: "/admin/users", label: "Users", icon: UsersRound },
      { href: "/admin/roles", label: "Roles", icon: ShieldCheck },
      { href: "/admin/audit-log", label: "Audit Log", icon: Archive },
      { href: "/profile", label: "Profile", icon: FileText },
    ],
  },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }

  if (href === "/warning") {
    return pathname === "/warning" || pathname.startsWith("/warning/");
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
  const visibleSections = sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => canAccessPath(item.href, roles)),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <>
      {!isDesktop ? (
        <div
          className={`fixed inset-0 z-40 bg-slate-950/30 transition lg:hidden ${
            open ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
          onClick={onClose}
          aria-hidden="true"
        />
      ) : null}

      <aside
        className={`inset-y-0 left-0 z-50 flex-col border-r border-slate-200 bg-white text-slate-700 transition-all duration-300 ${
          isDesktop
            ? `fixed top-0 hidden h-dvh lg:flex ${
                collapsed
                  ? "w-[76px]"
                  : "w-[260px] shadow-2xl shadow-slate-950/10"
              }`
            : `fixed flex w-[300px] lg:hidden ${open ? "translate-x-0" : "-translate-x-full"}`
        }`}
      >
        <div className="grid h-1.5 grid-cols-3">
          <div className="bg-[#08783f]" />
          <div className="bg-[#f5bd20]" />
          <div className="bg-[#159cc3]" />
        </div>

        <div
          className={`flex min-h-[96px] items-center border-b border-slate-100 ${
            collapsed && isDesktop ? "justify-center px-3" : "justify-between px-5"
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

          <button
            type="button"
            onClick={onClose}
            className={`h-10 w-10 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-[#08783f] ${
              isDesktop ? "hidden" : "flex"
            }`}
            aria-label="Tutup menu"
            title="Tutup menu"
          >
            <X className="h-5 w-5" strokeWidth={2.4} />
          </button>
        </div>

        <nav className={`min-h-0 flex-1 overflow-y-auto py-4 ${collapsed && isDesktop ? "px-2" : "px-3"}`}>
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
                        <Icon
                          className="h-5 w-5 shrink-0"
                          strokeWidth={2.2}
                        />
                        <span
                          className={`truncate ${collapsed && isDesktop ? "sr-only" : ""}`}
                        >
                          {item.label}
                        </span>
                        {item.badge && !(collapsed && isDesktop) ? (
                          <span
                            className={`ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-black ${
                              active
                                ? "bg-white text-[#08783f]"
                                : "bg-red-500 text-white"
                            }`}
                          >
                            {item.badge}
                          </span>
                        ) : null}
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
