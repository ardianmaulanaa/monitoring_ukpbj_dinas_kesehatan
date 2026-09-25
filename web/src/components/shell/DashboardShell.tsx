"use client";

import type { ReactNode } from "react";
import type { RoleCode } from "@prisma/client";
import Sidebar from "@/components/appheader/Sidebar";
import { SidebarStateProvider, useSidebarState } from "@/components/appheader/SidebarState";
import { PageTransition } from "@/components/ui";

type DashboardShellProps = {
  // children adalah isi halaman dashboard/module yang dibungkus layout ini.
  children: ReactNode;
  // roles berasal dari ProtectedDashboardLayout, dipakai Sidebar untuk filter menu.
  roles: RoleCode[];
};

function DashboardContent({ children, roles }: DashboardShellProps) {
  // State collapsed sidebar desktop dipakai sebagai drawer terbuka/tertutup.
  const { desktopCollapsed, toggleDesktopSidebar, closeDesktopSidebar } =
    useSidebarState();

  return (
    <div className="min-h-dvh bg-[#f4f7f5] text-slate-900">
      {/* Sidebar desktop kiri. Menu yang tampil mengikuti roles user. */}
      <Sidebar
        mode="desktop"
        collapsed={desktopCollapsed}
        onToggleDesktop={toggleDesktopSidebar}
        roles={roles}
      />
      {!desktopCollapsed ? (
        <button
          type="button"
          aria-label="Tutup sidebar"
          className="fixed inset-0 z-40 hidden cursor-default bg-slate-950/20 backdrop-blur-[1px] lg:block"
          onClick={closeDesktopSidebar}
        />
      ) : null}
      {/* Area konten full-width; sidebar desktop sekarang muncul sebagai drawer overlay. */}
      <div className="min-w-0">
        <PageTransition>{children}</PageTransition>
      </div>
    </div>
  );
}

export default function DashboardShell({
  children,
  roles,
}: DashboardShellProps) {
  return (
    // Provider ini menyimpan status buka/tutup sidebar desktop untuk semua isi dashboard.
    <SidebarStateProvider>
      <DashboardContent roles={roles}>{children}</DashboardContent>
    </SidebarStateProvider>
  );
}
