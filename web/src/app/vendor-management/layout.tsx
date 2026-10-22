import type { ReactNode } from "react";
import ProtectedDashboardLayout from "@/components/shell/ProtectedDashboardLayout";

export default function Layout({ children }: { children: ReactNode }) {
  return <ProtectedDashboardLayout>{children}</ProtectedDashboardLayout>;
}
