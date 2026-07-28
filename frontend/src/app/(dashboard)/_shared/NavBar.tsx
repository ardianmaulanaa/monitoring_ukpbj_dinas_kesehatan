"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Bell, LogOut, Menu, Search, ShieldCheck } from "lucide-react";

type NavBarProps = {
  title: string;
  subtitle?: string;
  rightLabel?: string;
  onOpenMenu: () => void;
};

export default function NavBar({
  title,
  subtitle,
  rightLabel,
  onOpenMenu,
}: NavBarProps) {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<{
    name: string;
    email: string;
  } | null>(null);
  const [notificationCount, setNotificationCount] = useState(8);

  useEffect(() => {
    let active = true;

    async function loadHeaderData() {
      try {
        const userResponse = await fetch("/api/auth/me");

        if (active && userResponse.ok) {
          const payload = await userResponse.json();
          setCurrentUser(payload.data?.user ?? null);
        }

        const warningResponse = await fetch("/api/warning");

        if (active && warningResponse.ok) {
          const payload = await warningResponse.json();
          setNotificationCount(payload.meta?.total ?? 8);
        }
      } catch {
        if (active) {
          setNotificationCount(8);
        }
      }
    }

    loadHeaderData();

    return () => {
      active = false;
    };
  }, []);

  const profileInitial = useMemo(() => {
    const source = currentUser?.name || currentUser?.email || "Admin";
    return source.trim().charAt(0).toUpperCase() || "A";
  }, [currentUser]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", {
      method: "POST",
    });
    router.replace("/login");
    router.refresh();
  };

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 shadow-sm">
        <div className="grid h-1.5 grid-cols-3">
          <div className="bg-[#08783f]" />
          <div className="bg-[#f5bd20]" />
          <div className="bg-[#159cc3]" />
        </div>

        <div className="flex min-h-14 items-center justify-between gap-3 overflow-hidden px-4 py-2 sm:px-6 lg:px-8">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <button
              type="button"
              onClick={onOpenMenu}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#08783f] text-white shadow-sm transition hover:bg-[#066532] lg:hidden"
              aria-label="Buka menu"
              title="Buka menu"
            >
              <Menu className="h-5 w-5" strokeWidth={2.6} />
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

            <Link
              href="/warning"
              className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-[#08783f]"
              aria-label="Lihat notifikasi"
              title="Notifikasi"
            >
              <Bell className="h-4 w-4" strokeWidth={2.4} />
              {notificationCount > 0 ? (
                <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-black leading-none text-white ring-2 ring-white">
                  {notificationCount > 99 ? "99+" : notificationCount}
                </span>
              ) : null}
            </Link>

            <Link
              href="/profile"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[#08783f] text-sm font-black text-white shadow-sm ring-1 ring-emerald-100 transition hover:bg-[#066532] focus:outline-none focus:ring-4 focus:ring-emerald-100"
              aria-label="Buka profil"
              title={currentUser?.name ?? "Profil Admin"}
            >
              {profileInitial}
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
              aria-label="Logout"
              title="Logout"
            >
              <LogOut className="h-4 w-4" strokeWidth={2.3} />
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
