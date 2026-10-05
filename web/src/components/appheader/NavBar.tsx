"use client";

import Image from "next/image";
import Link from "next/link";
import {
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import { Bell, Filter, Menu, Search, ShieldCheck } from "lucide-react";
import { SmoothPresence } from "@/components/smooth";
import { Surface } from "@/components/ui";

type NavBarProps = {
  // title/rightLabel berasal dari halaman lewat AppHeader.
  title: string;
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
  rightLabel,
  filterPanel,
  onOpenMenu,
}: NavBarProps) {
  const [notifications, setNotifications] = useState<{
    total: number;
    items: NotificationItem[];
  }>({ total: 0, items: [] });
  const [filterOpen, setFilterOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const filterMenuRef = useRef<HTMLDivElement | null>(null);
  const notificationMenuRef = useRef<HTMLDivElement | null>(null);

  // Ambil data notifikasi untuk bagian kanan header.
  useEffect(() => {
    let active = true;

    async function loadHeaderData() {
      try {
        const notificationResponse = await fetch("/api/notifications");

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

  // Tutup dropdown overlay saat user klik di luar atau menekan Escape.
  useEffect(() => {
    if (!filterOpen && !notificationOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node;

      if (filterOpen && !filterMenuRef.current?.contains(target)) {
        setFilterOpen(false);
      }

      if (
        notificationOpen &&
        !notificationMenuRef.current?.contains(target)
      ) {
        setNotificationOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setFilterOpen(false);
        setNotificationOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [filterOpen, notificationOpen]);

  const iconButtonClass =
    "flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm transition-[background-color,border-color,box-shadow,color,transform] duration-150 ease-out hover:border-emerald-200 hover:bg-emerald-50 hover:text-[#08783f] active:scale-[0.97] focus:outline-none focus:ring-2 focus:ring-[#08783f] focus:ring-offset-2";

  function openFilter() {
    setFilterOpen((open) => !open);
    setNotificationOpen(false);
  }

  function openNotifications() {
    setNotificationOpen((open) => !open);
    setFilterOpen(false);
  }

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
          {/* Bagian kiri: tombol menu mobile, logo, dan judul halaman. */}
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <button
              type="button"
              onClick={onOpenMenu}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-emerald-100 bg-[#edf7f1] text-[#08783f] shadow-sm shadow-emerald-900/10 transition-[background-color,border-color,box-shadow,color,transform] duration-150 ease-out hover:border-emerald-200 hover:bg-[#e2f3e9] hover:text-[#066532] active:scale-[0.97] focus:outline-none focus:ring-2 focus:ring-[#08783f] focus:ring-offset-2 sm:h-11 sm:w-11"
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
                  style={{ width: "28px", height: "auto" }}
                  priority
                />
              </div>

              <div className="min-w-0">
                <h1 className="truncate text-lg font-black tracking-[-0.02em] text-slate-950 sm:text-xl">
                  {title}
                </h1>
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
                  onClick={openFilter}
                  className={`${iconButtonClass} ${
                    filterOpen ? "border-emerald-200 bg-emerald-50 text-[#08783f]" : ""
                  }`}
                  aria-expanded={filterOpen}
                  aria-haspopup="dialog"
                  aria-controls="app-filter-panel"
                  aria-label="Buka filter"
                  title="Filter"
                >
                  <Filter className="h-4 w-4" strokeWidth={2.4} />
                </button>

                <SmoothPresence show={filterOpen}>
                  {(state) => (
                    <Surface
                      id="app-filter-panel"
                      role="dialog"
                      aria-label="Filter halaman"
                      className={`app-filter-popover smooth-popover z-50 p-4 ${
                        state === "closing" ? "is-closing" : ""
                      }`}
                    >
                      {filterPanel}
                    </Surface>
                  )}
                </SmoothPresence>
              </div>
            ) : null}

            <div className="relative" ref={notificationMenuRef}>
              <button
                type="button"
                onClick={openNotifications}
                className={`${iconButtonClass} relative ${
                  notificationOpen
                    ? "border-emerald-200 bg-emerald-50 text-[#08783f]"
                    : ""
                }`}
                aria-controls="app-notification-panel"
                aria-expanded={notificationOpen}
                aria-haspopup="dialog"
                aria-label="Lihat notifikasi"
                title="Notifikasi"
              >
                <Bell className="h-4 w-4" strokeWidth={2.4} />
                {notifications.total > 0 ? (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-black leading-none text-white ring-2 ring-white">
                    {notifications.total > 99 ? "99+" : notifications.total}
                  </span>
                ) : null}
              </button>

              <SmoothPresence show={notificationOpen}>
                {(state) => (
                  <Surface
                    id="app-notification-panel"
                    role="dialog"
                    aria-label="Panel notifikasi"
                    className={`app-notification-popover smooth-popover z-50 overflow-hidden p-0 ${
                      state === "closing" ? "is-closing" : ""
                    }`}
                  >
                    <div className="border-b border-slate-100 px-4 py-3">
                      <p className="text-sm font-black text-slate-950">
                        Notifikasi
                      </p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        {notifications.total.toLocaleString("id-ID")} item perlu
                        perhatian
                      </p>
                    </div>

                    {notifications.items.length > 0 ? (
                      <div className="max-h-[320px] overflow-y-auto">
                        {notifications.items.slice(0, 5).map((item) => (
                          <Link
                            key={item.id}
                            href={item.href}
                            onClick={() => setNotificationOpen(false)}
                            className="grid gap-1 border-b border-slate-100 px-4 py-3 transition hover:bg-emerald-50/70 last:border-b-0"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <p className="min-w-0 truncate text-sm font-black text-slate-900">
                                {item.title}
                              </p>
                              <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-[#08783f]">
                                {item.count}
                              </span>
                            </div>
                            <p className="line-clamp-2 text-xs font-semibold leading-5 text-slate-500">
                              {item.description}
                            </p>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className="px-4 py-6 text-sm font-semibold text-slate-500">
                        Tidak ada notifikasi baru.
                      </div>
                    )}

                    <Link
                      href="/notifications"
                      onClick={() => setNotificationOpen(false)}
                      className="flex h-11 items-center justify-center border-t border-slate-100 text-sm font-black text-[#08783f] transition hover:bg-emerald-50"
                    >
                      Lihat semua notifikasi
                    </Link>
                  </Surface>
                )}
              </SmoothPresence>
            </div>

          </div>
        </div>
      </header>
    </>
  );
}
