import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

type SirupRupCompactCardProps = {
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

export default function SirupRupCompactCard({
  icon: Icon,
  title,
  codeLabel,
  sourceFund,
  sourceFundClassName = "bg-slate-100 text-slate-600",
  status,
  statusClassName = "bg-slate-100 text-slate-600",
  rows,
  actions,
}: SirupRupCompactCardProps) {
  const visibleRows = rows.filter(
    (row) => !row.hideWhenEmpty || hasValue(row.value),
  );
  const primaryRow = visibleRows[0];
  const unitRow = visibleRows[1];
  const metadataRows = visibleRows.slice(2);

  return (
    <article className="w-full max-w-full min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-emerald-200 hover:shadow-md sm:p-5">
      <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)_minmax(150px,.7fr)_minmax(140px,.65fr)]">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-[#08783f] ring-1 ring-emerald-100">
            <Icon className="h-5 w-5" strokeWidth={2.4} />
          </span>

          <div className="min-w-0 flex-1">
            <h3
              className="line-clamp-2 min-w-0 break-words text-[15px] font-black leading-5 text-[#16227c]"
              title={title || "-"}
            >
              {title || "-"}
            </h3>
            <p
              className="mt-1 min-w-0 break-words [overflow-wrap:anywhere] text-xs font-semibold uppercase tracking-[0.04em] text-slate-400"
              title={codeLabel || "-"}
            >
              {codeLabel || "-"}
            </p>
          </div>
        </div>

        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.04em] text-slate-400">{unitRow?.label || "Unit Pengusul"}</p>
          <p className="mt-1 line-clamp-2 break-words [overflow-wrap:anywhere] text-sm font-semibold leading-5 text-slate-800">{unitRow?.value || "-"}</p>
        </div>
        <div className="min-w-0">
          {primaryRow ? (
            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">{primaryRow.label}</p>
              <p className="mt-1 break-words text-[15px] font-black tabular-nums text-slate-900">{primaryRow.value || "-"}</p>
            </div>
          ) : null}
        </div>
        <div className="flex min-w-0 flex-col items-start gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.04em] text-slate-400">Status SIRUP</p>
          <span
            className={`inline-flex max-w-full rounded-full px-3 py-1 text-xs font-semibold ${statusClassName}`}
            title={status}
          >
            <span className="break-words [overflow-wrap:anywhere]">{status}</span>
          </span>
        </div>
      </div>

      <div className="mt-4 flex min-w-0 flex-col gap-3 border-t border-slate-100 pt-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="grid min-w-0 flex-1 grid-cols-2 gap-x-5 gap-y-3 sm:grid-cols-4">
          {sourceFund ? (
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.04em] text-slate-400">Sumber Dana</p>
          <span
            className={`mt-1 inline-flex max-w-full rounded-full px-3 py-1 text-xs font-semibold ${sourceFundClassName}`}
            title={sourceFund}
          >
            <span className="break-words [overflow-wrap:anywhere]">{sourceFund}</span>
          </span>
          </div>
          ) : null}
          {metadataRows.map((row) => (
          <div
            key={row.label}
            className="min-w-0"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.04em] text-slate-400">
              {row.label}
            </p>
            <p className="mt-1 line-clamp-2 min-w-0 break-words [overflow-wrap:anywhere] text-sm font-semibold leading-5 text-slate-800">
              {row.value || "-"}
            </p>
          </div>
          ))}
        </div>

        <div className="min-w-0 shrink-0 [&>div]:flex [&>div]:flex-wrap [&>div]:justify-start [&>div]:gap-2 xl:[&>div]:justify-end [&_a]:min-h-10 [&_button]:min-h-10">
          {actions}
        </div>
      </div>
    </article>
  );
}
