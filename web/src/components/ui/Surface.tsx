import type { HTMLAttributes, ReactNode } from "react";

type SurfaceProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

export function Surface({ children, className = "", ...props }: SurfaceProps) {
  return (
    <div
      className={`rounded-xl border border-slate-200 bg-white shadow-lg shadow-slate-900/10 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
