"use client";

import type { ReactNode } from "react";
import Sidebar from "./Sidebar";
import { SidebarStateProvider, useSidebarState } from "./SidebarState";

type DashboardShellProps = {
  children: ReactNode;
};

function DashboardContent({ children }: DashboardShellProps) {
  const { desktopCollapsed, toggleDesktopSidebar } = useSidebarState();

  return (
    <div className="min-h-dvh bg-[#f4f7f5] text-slate-900">
      <Sidebar
        mode="desktop"
        collapsed={desktopCollapsed}
        onToggleDesktop={toggleDesktopSidebar}
      />
      <div className="min-w-0 lg:pl-[76px]">
        {children}
      </div>
    </div>
  );
}

export default function DashboardShell({ children }: DashboardShellProps) {
  return (
    <SidebarStateProvider>
      <DashboardContent>{children}</DashboardContent>
    </SidebarStateProvider>
  );
}
