import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import DashboardShell from "./_shared/DashboardShell";

type DashboardLayoutProps = {
  children: ReactNode;
};

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return <DashboardShell roles={user.roles}>{children}</DashboardShell>;
}
