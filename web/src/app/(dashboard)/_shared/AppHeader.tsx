"use client";

import type { RoleCode } from "@prisma/client";
import { useEffect, useState } from "react";
import NavBar from "./NavBar";
import Sidebar from "./Sidebar";

type AppHeaderProps = {
  title: string;
  subtitle?: string;
  rightLabel?: string;
};

export default function AppHeader({
  title,
  subtitle,
  rightLabel,
}: AppHeaderProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [roles, setRoles] = useState<RoleCode[]>([]);

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

  return (
    <>
      <Sidebar
        mode="mobile"
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        roles={roles}
      />
      <NavBar
        title={title}
        subtitle={subtitle}
        rightLabel={rightLabel}
        onOpenMenu={() => setSidebarOpen(true)}
      />
    </>
  );
}
