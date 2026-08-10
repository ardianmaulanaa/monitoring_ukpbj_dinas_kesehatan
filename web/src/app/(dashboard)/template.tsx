import type { ReactNode } from "react";

type DashboardTemplateProps = {
  children: ReactNode;
};

export default function DashboardTemplate({ children }: DashboardTemplateProps) {
  return <div className="page-transition">{children}</div>;
}
