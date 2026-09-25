"use client";

import Image from "next/image";
import Link from "next/link";
import {
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Bell, Filter, Menu, Search, ShieldCheck } from "lucide-react";
import { SmoothPresence } from "@/components/smooth";
import { Surface } from "@/components/ui";

type NavBarProps = {
  // title/subtitle/rightLabel berasal dari halaman lewat AppHeader.
  title: string;
  subtitle?: string;
  rightLabel?: string;
  filterPanel?: ReactNode;
  // Fungsi ini membuka Sidebar mobile dari AppHeader.
  onOpenMenu: () => void;
};

type NotificationItem = {
  id: string;
  title: string;
  description: string;
  href: string;
  count: number;
  tone: "info" | "warning" | "danger";
};

export default function NavBar({
  title,
  subtitle,
  rightLabel,
  filterPanel,
  onOpenMenu,
}: NavBarProps) {
  const [currentUser, setCurrentUser] = useState<{
    name: string;
    email: string;
  } | null>(null);
  const [notifications, setNotifications] = useState<{
    total: number;
    items: NotificationItem[];
  }>({ total: 0, items: [] });
  const [filterOpen, setFilterOpen] = useState(false);
  const filterMenuRef = useRef<HTMLDivElement | null>(null);

  // Ambil data user dan notifikasi dari API untuk bagian kanan header.
  useEffect(() => {
    let active = true;

    async function loadHeaderData() {
      try {
        const [userResponse, notificationResponse] = await Promise.all([
          fetch("/api/auth/me"),
          fetch("/api/notifications"),
        ]);

        if (active && userResponse.ok) {
          const payload = await userResponse.json();
          setCurrentUser(payload.data?.user ?? null);
        }

        if (active && notificationResponse.ok) {
          const payload = await notificationResponse.json();
          setNotifications({
            total: payload.data?.total ?? 0,
            items: payload.data?.items ?? [],
          });
        }
      } catch {
        // Header stays usable even when secondary endpoints are temporarily unavailable.
      }
    }

    loadHeaderData();

    return () => {
      active = false;
    };
  }, []);

  // Tutup dropdown filter saat user klik di luar atau menekan Escape.
  useEffect(() => {
    if (!filterOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (!filterMenuRef.current?.contains(event.target as Node)) {
        setFilterOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setFilterOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [filterOpen]);

  // Huruf avatar diambil dari nama user, fallback ke email, lalu Admin.
  const profileInitial = useMemo(() => {
    const source = currentUser?.name || currentUser?.email || "Admin";
    return source.trim().charAt(0).toUpperCase() || "A";
  }, [currentUser]);

  return (
    <>
      <header className="app-header-static sticky top-0 z-30 border-b border-slate-200 bg-white/95 shadow-sm">
        {/* Garis warna identitas aplikasi di paling atas header. */}
        <div className="grid h-1.5 grid-cols-3">
          <div className="bg-[#08783f]" />
          <div className="bg-[#f5bd20]" />
          <div className="bg-[#159cc3]" />
        </div>

        <div className="flex min-h-14 items-center justify-between gap-3 overflow-visible px-4 py-2 sm:px-6 lg:px-8">
          {/* Bagian kiri: tombol menu mobile, logo, judul, dan subtitle halaman. */}
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <button
              type="button"
              onClick={onOpenMenu}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-emerald-100 bg-[#edf7f1] text-[#08783f] shadow-sm shadow-emerald-900/10 hover:border-emerald-200 hover:bg-[#e2f3e9] hover:text-[#066532] sm:h-11 sm:w-11"
              aria-label="Buka menu"
              title="Buka menu"
            >
              <Menu className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2.8} />
            </button>

            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white p-1.5 shadow-sm">
                <Image
                  src="/app/logo-dinkes.png"
                  alt="Logo Dinkes"
                  width={28}
                  height={28}
                  className="h-7 w-7 object-contain"
                  priority
                />
              </div>

              <div className="min-w-0">
                <h1 className="truncate text-lg font-black tracking-[-0.02em] text-slate-950 sm:text-xl">
                  {title}
                </h1>
                {subtitle ? (
                  <p className="line-clamp-1 text-xs font-semibold text-slate-400 sm:text-sm">
                    {subtitle}
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          {/* Bagian kanan: pencarian desktop besar, label akses, notifikasi, dan avatar profil. */}
          <div className="flex shrink-0 items-center gap-2">
            <label className="hidden h-10 w-[240px] items-center gap-2 rounded-full border border-slate-300 bg-slate-50 px-4 text-sm text-slate-400 2xl:flex">
              <Search className="h-4 w-4" />
              <input
                className="min-w-0 flex-1 bg-transparent font-semibold outline-none placeholder:text-slate-400"
                placeholder="Cari paket pengadaan..."
              />
            </label>

            {rightLabel ? (
              <div className="hidden items-center gap-3 rounded-2xl border border-slate-200 bg-[#f4f7f5] px-4 py-2.5 2xl:flex">
                <ShieldCheck className="h-5 w-5 text-[#08783f]" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                    Akses
                  </p>
                  <p className="text-xs font-black text-slate-700">
                    {rightLabel}
                  </p>
                </div>
              </div>
            ) : null}

            {filterPanel ? (
              <div className="relative" ref={filterMenuRef}>
                <button
                  type="button"
                  onClick={() => setFilterOpen((open) => !open)}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-[#08783f] focus:outline-none focus:ring-2 focus:ring-[#08783f] focus:ring-offset-2"
                  aria-expanded={filterOpen}
                  aria-haspopup="dialog"
                  aria-label="Buka filter"
                  title="Filter"
                >
                  <Filter className="h-4 w-4" strokeWidth={2.4} />
                </button>

                <SmoothPresence show={filterOpen}>
                  {(state) => (
                    <Surface
                      role="dialog"
                      aria-label="Filter halaman"
                      className={`smooth-popover absolute right-0 top-12 z-50 w-[min(22rem,calc(100vw-2rem))] p-4 ${
                        state === "closing" ? "is-closing" : ""
                      }`}
                    >
                      {filterPanel}
                    </Surface>
                  )}
                </SmoothPresence>
              </div>
            ) : null}

            <div className="relative">
              <Link
                href="/notifications"
                className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-[#08783f]"
                aria-label="Lihat notifikasi"
                title="Notifikasi"
              >
                <Bell className="h-4 w-4" strokeWidth={2.4} />
                {notifications.total > 0 ? (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-black leading-none text-white ring-2 ring-white">
                    {notifications.total > 99 ? "99+" : notifications.total}
                  </span>
                ) : null}
              </Link>
            </div>

            <Link
              href="/profile"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[#08783f] text-sm font-black text-white shadow-sm ring-1 ring-emerald-100 transition hover:bg-[#066532] focus:outline-none focus:ring-2 focus:ring-[#08783f] focus:ring-offset-2"
              aria-label="Profil pengguna"
              title={currentUser?.name ?? "Admin"}
            >
              {profileInitial}
            </Link>
          </div>
        </div>
      </header>
    </>
  );
}
