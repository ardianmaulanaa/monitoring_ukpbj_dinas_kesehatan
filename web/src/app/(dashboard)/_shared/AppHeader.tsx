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
