import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight, type LucideIcon } from "lucide-react";

type ProcurementCompactCardProps = {
  icon: LucideIcon;
  title: string;
  codeLabel: string;
  sourceFund?: string | null;
  sourceFundClassName?: string;
  status: string;
  statusClassName?: string;
  rows: Array<{
    label: string;
    value?: ReactNode;
    hideWhenEmpty?: boolean;
  }>;
  actions: ReactNode;
};

function hasValue(value: ReactNode) {
  return value !== null && value !== undefined && value !== "" && value !== "-";
}

export default function ProcurementCompactCard({
  icon: Icon,
  title,
  codeLabel,
  sourceFund,
  sourceFundClassName = "bg-slate-100 text-slate-600",
  status,
  statusClassName = "bg-slate-100 text-slate-600",
  rows,
  actions,
}: ProcurementCompactCardProps) {
  const visibleRows = rows.filter(
    (row) => !row.hideWhenEmpty || hasValue(row.value),
  );

  return (
    <article className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex min-w-0 items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-[#08783f] ring-1 ring-emerald-100">
          <Icon className="h-5 w-5" strokeWidth={2.4} />
        </span>

        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 min-w-0 break-words text-base font-black leading-5 text-[#16227c]">
            {title || "-"}
          </h3>
          <p className="mt-1 truncate text-xs font-black uppercase tracking-wide text-slate-400">
            {codeLabel || "-"}
          </p>
        </div>
      </div>

      <div className="mt-4 flex min-w-0 flex-wrap gap-2">
        {sourceFund ? (
          <span
            className={`inline-flex max-w-full rounded-full px-3 py-1 text-xs font-black ${sourceFundClassName}`}
            title={sourceFund}
          >
            <span className="truncate">{sourceFund}</span>
          </span>
        ) : null}
        <span
          className={`inline-flex max-w-full rounded-full px-3 py-1 text-xs font-black ${statusClassName}`}
          title={status}
        >
          <span className="truncate">{status}</span>
        </span>
      </div>

      <div className="mt-4 space-y-2">
        {visibleRows.map((row) => (
          <div
            key={row.label}
            className="flex min-w-0 items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2.5"
          >
            <span className="shrink-0 text-[11px] font-black uppercase tracking-wide text-slate-400">
              {row.label}
            </span>
            <span className="line-clamp-2 min-w-0 break-words text-right text-sm font-black leading-5 text-slate-800">
              {row.value || "-"}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4 [&_a]:min-h-11 [&_a]:w-full [&_button]:min-h-11 [&_button]:w-full">
        {actions}
      </div>
    </article>
  );
}

export function CompactManageLink({
  href,
  children = "Kelola Proses",
}: {
  href: string;
  children?: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#08783f] px-4 text-sm font-black text-white shadow-sm transition hover:bg-[#066b38] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#08783f] focus-visible:ring-offset-2 active:scale-[0.98]"
    >
      {children}
      <ArrowUpRight className="h-4 w-4" strokeWidth={2.5} />
    </Link>
  );
}
