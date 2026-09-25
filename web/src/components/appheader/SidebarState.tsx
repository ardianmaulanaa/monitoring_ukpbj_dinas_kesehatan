"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type SidebarState = {
  // true berarti sidebar desktop tampil kecil/ikon saja.
  desktopCollapsed: boolean;
  // Dipakai tombol Menu di Sidebar untuk ubah collapsed/open.
  toggleDesktopSidebar: () => void;
  // Dipakai backdrop desktop untuk menutup drawer tanpa risiko toggle terbalik.
  closeDesktopSidebar: () => void;
};

const SidebarStateContext = createContext<SidebarState | null>(null);

export function SidebarStateProvider({ children }: { children: ReactNode }) {
  // Default true supaya konten dashboard punya ruang lebih besar saat pertama dibuka.
  const [desktopCollapsed, setDesktopCollapsed] = useState(true);

  // Context value dibagikan ke DashboardShell dan Sidebar.
  const value = useMemo(
    () => ({
      desktopCollapsed,
      toggleDesktopSidebar: () => setDesktopCollapsed((current) => !current),
      closeDesktopSidebar: () => setDesktopCollapsed(true),
    }),
    [desktopCollapsed],
  );

  return (
    <SidebarStateContext.Provider value={value}>
      {children}
    </SidebarStateContext.Provider>
  );
}

export function useSidebarState() {
  const context = useContext(SidebarStateContext);

  if (!context) {
    // Pengaman supaya hook ini hanya dipakai di dalam SidebarStateProvider.
    throw new Error("useSidebarState must be used inside SidebarStateProvider");
  }

  return context;
}

export function useOptionalSidebarState() {
  return useContext(SidebarStateContext);
}
