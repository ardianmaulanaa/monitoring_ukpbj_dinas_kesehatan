"use client";

import type { RoleCode } from "@prisma/client";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useOptionalSidebarState } from "./SidebarState";
import GlobalFilterPanel from "./GlobalFilterPanel";
import NavBar from "./NavBar";
import Sidebar from "./Sidebar";

type AppHeaderProps = {
  // Data title/subtitle dikirim dari halaman yang memakai AppHeader, misalnya app/dashboard/page.tsx.
  title: string;
  subtitle?: string;
  rightLabel?: string;
  filterPanel?: ReactNode;
};

export default function AppHeader({
  title,
  subtitle,
  rightLabel,
  filterPanel,
}: AppHeaderProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [roles, setRoles] = useState<RoleCode[]>([]);
  const sidebarState = useOptionalSidebarState();

  // Ambil role user dari API auth supaya menu mobile bisa disaring sesuai hak akses.
  useEffect(() => {
    let active = true;

    async function loadRoles() {
      const response = await fetch("/api/auth/me").catch(() => null);

      if (!active || !response?.ok) {
        return;
      }

      const payload = await response.json();
      setRoles(payload.data?.user?.roles ?? []);
    }

    loadRoles();

    return () => {
      active = false;
    };
  }, []);

  // Saat sidebar mobile terbuka, body dikunci supaya halaman belakang tidak ikut scroll.
  useEffect(() => {
    if (!sidebarOpen) {
      return;
    }

    const scrollY = window.scrollY;
    const previousBodyPosition = document.body.style.position;
    const previousBodyTop = document.body.style.top;
    const previousBodyWidth = document.body.style.width;
    const previousBodyOverflow = document.body.style.overflow;

    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.position = previousBodyPosition;
      document.body.style.top = previousBodyTop;
      document.body.style.width = previousBodyWidth;
      document.body.style.overflow = previousBodyOverflow;
      window.scrollTo(0, scrollY);
    };
  }, [sidebarOpen]);

  // Sidebar mode mobile ada di appheader, karena tombol ☰ mode mobile dia ada di appheader
  return (
    <>
      {/* Sidebar mode mobile muncul saat tombol menu di NavBar ditekan. */}
      <Sidebar
        mode="mobile"
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        roles={roles}
      />
      {/* NavBar adalah header atas: logo, judul halaman, notifikasi, dan profil. */}
      <NavBar
        title={title}
        subtitle={subtitle}
        rightLabel={rightLabel}
        filterPanel={filterPanel ?? <GlobalFilterPanel />}
        onOpenMenu={() => {
          if (
            sidebarState &&
            window.matchMedia("(min-width: 1024px)").matches
          ) {
            sidebarState.toggleDesktopSidebar();
            return;
          }

          setSidebarOpen(true);
        }}
      />
    </>
  );
}
