"use client";

import type { ReactNode } from "react";
import type { RoleCode } from "@prisma/client";
import Sidebar from "./Sidebar";
import { SidebarStateProvider, useSidebarState } from "./SidebarState";

type DashboardShellProps = {
  children: ReactNode;
  roles: RoleCode[];
};

function DashboardContent({ children, roles }: DashboardShellProps) {
  const { desktopCollapsed, toggleDesktopSidebar } = useSidebarState();

  return (
    <div className="min-h-dvh bg-[#f4f7f5] text-slate-900">
      <Sidebar
        mode="desktop"
        collapsed={desktopCollapsed}
        onToggleDesktop={toggleDesktopSidebar}
        roles={roles}
      />
      <div className="min-w-0 lg:pl-[76px]">
        {children}
      </div>
    </div>
  );
}

export default function DashboardShell({ children, roles }: DashboardShellProps) {
  return (
    <SidebarStateProvider>
      <DashboardContent roles={roles}>{children}</DashboardContent>
    </SidebarStateProvider>
  );
}
