"use client";

import type { RoleCode } from "@prisma/client";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import GlobalFilterPanel from "./GlobalFilterPanel";
import NavBar from "./NavBar";
import Sidebar from "./Sidebar";

type AppHeaderProps = {
  // Subtitle tetap diterima untuk kompatibilitas lama, tetapi header baru hanya merender title.
  title: string;
  subtitle?: string;
  rightLabel?: string;
  filterPanel?: ReactNode;
};

export default function AppHeader(props: AppHeaderProps) {
  const { title, rightLabel, filterPanel } = props;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [roles, setRoles] = useState<RoleCode[]>([]);
  const pathname = usePathname();
  const previousPathnameRef = useRef(pathname);

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

  // Tutup drawer mobile setiap route berganti supaya backdrop dan scroll-lock selalu bersih.
  useEffect(() => {
    if (previousPathnameRef.current === pathname) {
      return;
    }

    previousPathnameRef.current = pathname;
    setSidebarOpen(false);
  }, [pathname]);

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
        rightLabel={rightLabel}
        filterPanel={filterPanel ?? <GlobalFilterPanel />}
        onOpenMenu={() => setSidebarOpen(true)}
      />
    </>
  );
}
