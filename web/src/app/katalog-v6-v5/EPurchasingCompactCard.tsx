import Link from "next/link";
import { ArrowUpRight, Eye, ShoppingCart } from "lucide-react";

type EPurchasingCompactCardProps = {
  code: string;
  title: string;
  unit: string;
  budget: string;
  status: string;
  statusClassName: string;
  provider: string;
  finalPrice: string;
  stage: string;
  detailHref: string;
  processHref: string;
};

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-semibold uppercase tracking-[0.05em] text-slate-400">
        {label}
      </dt>
      <dd
        className="mt-1 min-w-0 break-words text-[13px] font-semibold leading-5 text-slate-700 [overflow-wrap:anywhere]"
        title={value}
      >
        {value || "-"}
      </dd>
    </div>
  );
}

export default function EPurchasingCompactCard({
  code,
  title,
  unit,
  budget,
  status,
  statusClassName,
  provider,
  finalPrice,
  stage,
  detailHref,
  processHref,
}: EPurchasingCompactCardProps) {
  return (
    <article className="w-full max-w-full min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5">
      <div className="grid min-w-0 grid-cols-1 gap-4 border-b border-slate-100 pb-4 md:grid-cols-[minmax(0,1fr)_minmax(150px,0.28fr)_minmax(150px,0.28fr)] md:items-start">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-[#08783f] ring-1 ring-emerald-100">
            <ShoppingCart className="h-5 w-5" strokeWidth={2.4} />
          </span>
          <div className="min-w-0">
            <p className="min-w-0 break-words font-mono text-[11px] font-bold uppercase tracking-[0.05em] text-slate-400 [overflow-wrap:anywhere]">
              Kode RUP: {code || "-"}
            </p>
            <h3 className="mt-1 line-clamp-2 min-w-0 break-words text-[15px] font-semibold leading-5 text-[#16227c]" title={title}>
              {title || "-"}
            </h3>
            <p className="mt-1 min-w-0 break-words text-xs font-medium leading-5 text-slate-500 [overflow-wrap:anywhere]" title={unit}>
              Unit: {unit || "-"}
            </p>
          </div>
        </div>

        <Field label="Pagu" value={budget} />
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-slate-400">Status</p>
          <span className={`mt-1 inline-flex max-w-full whitespace-normal break-words rounded-full px-3 py-1 text-left text-xs font-semibold leading-4 [overflow-wrap:anywhere] ${statusClassName}`} title={status}>
            {status || "-"}
          </span>
        </div>
      </div>

      <div className="mt-4 grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(140px,0.55fr)_minmax(130px,0.45fr)_auto] lg:items-start">
        <Field label="Penyedia" value={provider} />
        <Field label="Harga Final" value={finalPrice} />
        <Field label="Tahap" value={stage} />
        <div className="flex min-w-0 flex-wrap gap-2 sm:col-span-2 lg:col-span-1 lg:justify-end">
          <Link href={detailHref} aria-label={`Detail E-Purchasing untuk ${title}`} className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-white px-4 text-sm font-semibold text-[#08783f] transition hover:bg-emerald-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#08783f] focus-visible:ring-offset-2 sm:flex-none">
            <Eye className="h-4 w-4" strokeWidth={2.4} />
            Detail
          </Link>
          <Link href={processHref} aria-label={`Proses E-Purchasing untuk ${title}`} className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-[#08783f] px-4 text-center text-sm font-semibold text-white transition hover:bg-[#066b38] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#08783f] focus-visible:ring-offset-2 sm:flex-none">
            Proses E-Purchasing
            <ArrowUpRight className="h-4 w-4 shrink-0" strokeWidth={2.5} />
          </Link>
        </div>
      </div>
    </article>
  );
}
