import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import DashboardShell from "@/components/dashboard/DashboardShell";

type ProtectedDashboardLayoutProps = {
  children: ReactNode;
};

export const dynamic = "force-dynamic";

export default async function ProtectedDashboardLayout({
  children,
}: ProtectedDashboardLayoutProps) {
  // Ambil user login dari server. Sumbernya lib/auth, bukan dari komponen client.
  const user = await getCurrentUser();

  if (!user) {
    // Kalau belum login, semua halaman dashboard diarahkan ke login.
    redirect("/login");
  }

  // Kalau sudah login, halaman dibungkus DashboardShell dan role dikirim ke Sidebar.
  return <DashboardShell roles={user.roles}>{children}</DashboardShell>;
}
