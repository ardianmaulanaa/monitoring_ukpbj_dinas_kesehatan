import type { ReactNode } from "react";
import ProtectedDashboardLayout from "@/components/dashboard/ProtectedDashboardLayout";

export const dynamic = "force-dynamic";

export default function SectionLayout({ children }: { children: ReactNode }) {
  return <ProtectedDashboardLayout>{children}</ProtectedDashboardLayout>;
}
