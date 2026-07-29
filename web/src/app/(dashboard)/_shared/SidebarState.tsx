"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type SidebarState = {
  desktopCollapsed: boolean;
  toggleDesktopSidebar: () => void;
};

const SidebarStateContext = createContext<SidebarState | null>(null);

export function SidebarStateProvider({ children }: { children: ReactNode }) {
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);

  const value = useMemo(
    () => ({
      desktopCollapsed,
      toggleDesktopSidebar: () => setDesktopCollapsed((current) => !current),
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
    throw new Error("useSidebarState must be used inside SidebarStateProvider");
  }

  return context;
}
