import type { SelectHTMLAttributes } from "react";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
};

export function Select({ className = "", label, ...props }: SelectProps) {
  return (
    <label className="block">
      {label ? (
        <span className="mb-1.5 block text-xs font-black uppercase tracking-[0.12em] text-slate-400">
          {label}
        </span>
      ) : null}
      <select
        className={`h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-600 outline-none transition focus:border-[#08783f] focus:ring-2 focus:ring-emerald-100 ${className}`}
        {...props}
      />
    </label>
  );
}
