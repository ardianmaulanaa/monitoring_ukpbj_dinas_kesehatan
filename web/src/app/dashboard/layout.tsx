import type { ReactNode } from "react";
import ProtectedDashboardLayout from "@/components/shell/ProtectedDashboardLayout";

export const dynamic = "force-dynamic";
export const preferredRegion = "sin1";
export const runtime = "nodejs";

export default function SectionLayout({ children }: { children: ReactNode }) {
  return <ProtectedDashboardLayout>{children}</ProtectedDashboardLayout>;
}
