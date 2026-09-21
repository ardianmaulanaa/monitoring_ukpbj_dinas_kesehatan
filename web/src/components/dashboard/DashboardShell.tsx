"use client";

import type { ReactNode } from "react";
import type { RoleCode } from "@prisma/client";
import Sidebar from "./Sidebar";
import { SidebarStateProvider, useSidebarState } from "./SidebarState";

type DashboardShellProps = {
  // children adalah isi halaman dashboard/module yang dibungkus layout ini.
  children: ReactNode;
  // roles berasal dari ProtectedDashboardLayout, dipakai Sidebar untuk filter menu.
  roles: RoleCode[];
};

function DashboardContent({ children, roles }: DashboardShellProps) {
  // State collapsed sidebar desktop disimpan di SidebarStateProvider.
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
          className="fixed inset-0 z-40 hidden cursor-default bg-slate-950/25 lg:block"
          onClick={closeDesktopSidebar}
        />
      ) : null}
      {/* Area konten halaman tetap di posisi sidebar kecil; sidebar terbuka sebagai drawer overlay. */}
      <div className="min-w-0 transition-[padding] duration-300 lg:pl-[76px]">
        {children}
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
