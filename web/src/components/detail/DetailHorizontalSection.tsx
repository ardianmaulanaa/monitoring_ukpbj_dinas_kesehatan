"use client";

import type { ReactNode } from "react";
import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type SummaryItem = {
  label: string;
  value?: ReactNode;
};

type DetailModalHeaderProps = {
  action?: ReactNode;
  badge?: ReactNode;
  code: ReactNode;
  items: SummaryItem[];
  title: ReactNode;
};

type DetailHorizontalSectionProps = {
  children: ReactNode;
  hint?: string;
};

type DetailInfoCardProps = {
  children: ReactNode;
  title: string;
};

type DetailSectionProps = {
  children: ReactNode;
  title: string;
};

type DetailFieldProps = {
  className?: string;
  label: string;
  value?: ReactNode;
  valueClassName?: string;
};

export function detailValue(value?: ReactNode) {
  return value === null || value === undefined || value === "" ? "-" : value;
}

export function DetailStatusBadge({
  children,
  className = "bg-blue-50 text-blue-700 ring-blue-200",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex w-fit shrink-0 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${className}`}
    >
      {children}
    </span>
  );
}

export function DetailModalHeader({
  action,
  badge,
  code,
  items,
  title,
}: DetailModalHeaderProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.04em] text-[#08783f]">
            {detailValue(code)}
          </p>
          <h3 className="mt-2 max-w-4xl break-words text-xl font-bold leading-snug tracking-tight text-[#16227c]">
            {detailValue(title)}
          </h3>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {badge}
          {action}
        </div>
      </div>

      <dl className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {items.map((item) => (
          <div key={item.label} className="min-w-0 rounded-xl bg-slate-50 px-3 py-2.5">
            <dt className="text-[10px] font-semibold uppercase tracking-[0.04em] text-slate-400">
              {item.label}
            </dt>
            <dd className="mt-1 break-words text-sm font-bold leading-5 text-slate-700">
              {detailValue(item.value)}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function DetailHorizontalSection({
  children,
  hint = "Geser ke kanan untuk melihat detail lengkap",
}: DetailHorizontalSectionProps) {
  const stripRef = useRef<HTMLDivElement | null>(null);

  function scrollByCard(direction: "prev" | "next") {
    const element = stripRef.current;
    if (!element) return;

    const amount = Math.min(element.clientWidth * 0.85, 440);
    element.scrollBy({
      behavior: "smooth",
      left: direction === "next" ? amount : -amount,
    });
  }

  return (
    <section className="min-w-0">
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-bold text-slate-500">{hint}</p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => scrollByCard("prev")}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-[#08783f]"
            aria-label="Geser detail ke kiri"
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={2.4} />
          </button>
          <button
            type="button"
            onClick={() => scrollByCard("next")}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-[#08783f]"
            aria-label="Geser detail ke kanan"
          >
            <ChevronRight className="h-4 w-4" strokeWidth={2.4} />
          </button>
        </div>
      </div>

      <div
        ref={stripRef}
        className="flex min-w-0 snap-x snap-mandatory gap-4 overflow-x-auto overflow-y-hidden scroll-smooth pb-3 [-webkit-overflow-scrolling:touch]"
      >
        {children}
      </div>
    </section>
  );
}

export function DetailInfoCard({ children, title }: DetailInfoCardProps) {
  return (
    <article className="min-h-full w-[min(84vw,400px)] shrink-0 snap-start rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:w-[360px] lg:w-[400px]">
      <h4 className="text-xs font-semibold uppercase tracking-[0.04em] text-[#08783f]">
        {title}
      </h4>
      <dl className="mt-4 grid gap-3">{children}</dl>
    </article>
  );
}

export function DetailSection({ children, title }: DetailSectionProps) {
  return (
    <section className="min-w-0">
      <h4 className="text-xs font-semibold uppercase tracking-[0.04em] text-[#08783f]">
        {title}
      </h4>
      <dl className="mt-3 grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {children}
      </dl>
    </section>
  );
}

export function DetailField({
  className = "",
  label,
  value,
  valueClassName = "",
}: DetailFieldProps) {
  return (
    <div
      className={`min-w-0 rounded-lg border border-slate-200 bg-slate-50 p-3 ${className}`}
    >
      <dt className="text-xs font-semibold uppercase tracking-[0.04em] text-slate-500">
        {label}
      </dt>
      <dd
        className={`mt-2 whitespace-pre-wrap break-words text-sm font-semibold leading-6 text-slate-800 ${valueClassName}`}
      >
        {detailValue(value)}
      </dd>
    </div>
  );
}
