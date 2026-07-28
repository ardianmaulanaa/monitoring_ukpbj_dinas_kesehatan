import type { ReactNode } from "react";
import DashboardShell from "./_shared/DashboardShell";

type DashboardLayoutProps = {
  children: ReactNode;
};

export const dynamic = "force-dynamic";

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return <DashboardShell>{children}</DashboardShell>;
}
