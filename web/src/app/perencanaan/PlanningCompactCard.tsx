import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

type Field = { label: string; value?: ReactNode };

type Props = {
  icon: LucideIcon;
  title: string;
  codeLabel: string;
  unit: string | null;
  total: ReactNode;
  status: string;
  statusClassName?: string;
  metadata: Field[];
  actions: ReactNode;
};

function FieldBlock({ label, value }: Field) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-semibold uppercase tracking-[0.04em] text-slate-400">
        {label}
      </p>
      <div className="mt-1 min-w-0 break-words [overflow-wrap:anywhere] text-sm font-semibold leading-5 text-slate-800">
        {value || "-"}
      </div>
    </div>
  );
}

export default function PlanningCompactCard({
  icon: Icon,
  title,
  codeLabel,
  unit,
  total,
  status,
  statusClassName = "bg-slate-100 text-slate-600",
  metadata,
  actions,
}: Props) {
  return (
    <article className="w-full max-w-full min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-emerald-200 hover:shadow-md sm:p-5">
      <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)_minmax(150px,.7fr)_minmax(140px,.65fr)]">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-[#08783f] ring-1 ring-emerald-100">
            <Icon className="h-5 w-5" strokeWidth={2.4} />
          </span>
          <div className="min-w-0">
            <p className="break-words [overflow-wrap:anywhere] text-[11px] font-semibold uppercase tracking-[0.04em] text-slate-400">
              Kode Usulan: {codeLabel || "-"}
            </p>
            <h3 className="mt-1 line-clamp-2 break-words text-[15px] font-semibold leading-5 text-[#16227c]" title={title || "-"}>
              {title || "-"}
            </h3>
          </div>
        </div>
        <FieldBlock label="Unit Pengusul" value={unit || "-"} />
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.04em] text-slate-400">Total Estimasi</p>
          <p className="mt-1 break-words text-[15px] font-bold tabular-nums text-slate-900">{total || "-"}</p>
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.04em] text-slate-400">Status Perencanaan</p>
          <span className={`mt-1 inline-flex max-w-full rounded-full px-3 py-1 text-xs font-semibold ${statusClassName}`}>
            <span className="break-words [overflow-wrap:anywhere]">{status}</span>
          </span>
        </div>
      </div>

      <div className="mt-4 flex min-w-0 flex-col gap-4 border-t border-slate-100 pt-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="grid min-w-0 flex-1 grid-cols-2 gap-x-5 gap-y-3 sm:grid-cols-4">
          {metadata.map((field) => <FieldBlock key={field.label} {...field} />)}
        </div>
        <div className="min-w-0 shrink-0 [&>div]:flex [&>div]:flex-wrap [&>div]:gap-2 xl:[&>div]:justify-end [&_a]:min-h-10 [&_button]:min-h-10">
          {actions}
        </div>
      </div>
    </article>
  );
}
