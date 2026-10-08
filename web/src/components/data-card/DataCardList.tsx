import type { CSSProperties, ReactNode } from "react";

type DataCardListProps = {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
};

type DataCardRowProps = {
  icon?: ReactNode;
  children: ReactNode;
  actions?: ReactNode;
  columns?: string;
  className?: string;
  /**
   * Lebar minimum card pada list yang memiliki banyak kolom.
   * Contoh SIRUP/RUP: "2300px".
   * Card akan memiliki background/border sampai ujung action dan
   * parent list dapat menggesernya secara horizontal.
   */
  minWidth?: string;
};

type DataCardFieldProps = {
  label: string;
  children: ReactNode;
  className?: string;
  valueClassName?: string;
};

type DataCardTextProps = {
  children: ReactNode;
  className?: string;
  title?: string | null;
};

const defaultColumns =
  "56px minmax(104px,0.72fr) minmax(220px,1.55fr) repeat(5,minmax(104px,0.72fr)) minmax(136px,auto)";

export function DataCardList({
  title,
  subtitle,
  icon,
  action,
  children,
}: DataCardListProps) {
  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-2">
          {icon ? (
            <span className="mt-0.5 shrink-0 text-[#08783f]">{icon}</span>
          ) : null}

          <div className="min-w-0">
            <h2 className="truncate text-lg font-black text-[#16227c]">
              {title}
            </h2>

            {subtitle ? (
              <p className="mt-1 text-sm font-semibold text-slate-500">
                {subtitle}
              </p>
            ) : null}
          </div>
        </div>

        {action ? <div className="shrink-0">{action}</div> : null}
      </div>

      {/* Hanya area data yang digeser. Header/judul tetap diam. */}
      <div className="w-full max-w-full overflow-x-auto overflow-y-hidden overscroll-x-contain [scrollbar-color:#94a3b8_transparent] [scrollbar-gutter:stable] [scrollbar-width:thin]">
        <div className="min-w-full space-y-3 bg-slate-50/50 p-4 sm:p-5">
          {children}
        </div>
      </div>
    </section>
  );
}

export function DataCardRow({
  icon,
  children,
  actions,
  columns = defaultColumns,
  className = "",
  minWidth,
}: DataCardRowProps) {
  const gridStyle = {
    "--data-card-columns": columns,
  } as CSSProperties;

  /*
   * Ini bagian penting perbaikannya:
   * article/card-nya sendiri ikut memiliki lebar penuh sesuai grid.
   * Jadi background, border, rounded corner, dan shadow tidak berhenti
   * sebelum kolom Status/Action.
   */
  const rowStyle: CSSProperties = minWidth
    ? {
        width: `max(100%, ${minWidth})`,
        minWidth,
        maxWidth: "none",
      }
    : {
        width: "100%",
      };

  return (
    <article
      style={rowStyle}
      className={`group rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition duration-200 hover:border-emerald-200 hover:shadow-md hover:shadow-slate-900/10 sm:p-5 ${className}`}
    >
      <div
        className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:[grid-template-columns:var(--data-card-columns)] xl:items-center xl:gap-5"
        style={gridStyle}
      >
        {icon ? (
          <div className="flex min-w-0 items-center gap-3 sm:col-span-2 lg:col-span-4 xl:col-span-1">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-[#08783f] ring-1 ring-emerald-100">
              {icon}
            </span>
          </div>
        ) : null}

        {children}

        {actions ? (
          <div className="flex min-w-0 sm:col-span-2 lg:col-span-4 xl:col-span-1 xl:justify-end">
            <div className="flex min-w-max flex-nowrap items-center justify-end gap-2 whitespace-nowrap">
              {actions}
            </div>
          </div>
        ) : null}
      </div>
    </article>
  );
}

export function DataCardField({
  label,
  children,
  className = "",
  valueClassName = "",
}: DataCardFieldProps) {
  return (
    <div className={`min-w-0 overflow-hidden ${className}`}>
      <p className="min-w-0 whitespace-nowrap text-[11px] font-black uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <div
        className={`mt-1 min-w-0 overflow-hidden text-sm font-bold text-slate-600 ${valueClassName}`}
      >
        {children}
      </div>
    </div>
  );
}

export function DataCardTextLong({
  children,
  className = "",
  title,
}: DataCardTextProps) {
  return (
    <span
      className={`block min-w-0 break-words leading-5 line-clamp-2 ${className}`}
      title={title ?? undefined}
    >
      {children}
    </span>
  );
}

export function DataCardTextShort({
  children,
  className = "",
  title,
}: DataCardTextProps) {
  return (
    <span
      className={`block min-w-0 truncate whitespace-nowrap ${className}`}
      title={title ?? undefined}
    >
      {children}
    </span>
  );
}

export function DataCardCurrency({
  children,
  className = "",
  title,
}: DataCardTextProps) {
  return (
    <span
      className={`block min-w-0 whitespace-nowrap tabular-nums ${className}`}
      title={title ?? undefined}
    >
      {children}
    </span>
  );
}

export function DataCardBadge({
  children,
  className = "",
  title,
}: DataCardTextProps) {
  return (
    <span
      className={`inline-flex max-w-full shrink-0 whitespace-nowrap rounded-full px-3 py-1 text-xs font-black ${className}`}
      title={title ?? undefined}
    >
      <span className="min-w-0 truncate">{children}</span>
    </span>
  );
}

export function DataCardEmpty({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[180px] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white px-4 text-center text-sm font-semibold text-slate-400">
      {children}
    </div>
  );
}
