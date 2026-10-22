import type { ReactNode } from "react";
import VmsNav from "@/components/vendor-management/VmsNav";

export function VmsPage({ children }: { children: ReactNode }) {
  return (
    <>
      <VmsNav />
      <main className="mx-auto w-full max-w-[1500px] p-4 pt-5 sm:p-6">
        {children}
      </main>
    </>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-[#dee9e2] bg-white p-5 shadow-sm ${className}`}
    >
      {children}
    </section>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "VERIFIED_INTERNAL" ||
    status === "FINAL" ||
    status === "COMPLETED"
      ? "bg-emerald-100 text-emerald-800"
      : status === "NEEDS_REVISION" || status === "CANCELLED"
        ? "bg-rose-100 text-rose-800"
        : status === "PENDING_REVIEW" ||
            status === "SCHEDULED" ||
            status === "IN_REVIEW"
          ? "bg-amber-100 text-amber-800"
          : "bg-slate-100 text-slate-700";
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-black ${tone}`}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}

export function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 px-5 py-10 text-center text-sm text-slate-500">
      {text}
    </div>
  );
}
