import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";

const variantClass: Record<ButtonVariant, string> = {
  primary:
    "border-transparent bg-[#08783f] text-white shadow-sm hover:bg-[#066532]",
  secondary:
    "border-slate-200 bg-white text-slate-600 shadow-sm hover:border-emerald-200 hover:bg-emerald-50 hover:text-[#08783f]",
  ghost:
    "border-transparent bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-800",
};

const baseClass =
  "inline-flex h-10 items-center justify-center gap-2 rounded-lg border px-4 text-sm font-black transition focus:outline-none focus:ring-2 focus:ring-[#08783f] focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-55";

type NativeButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: ButtonVariant;
};

type LinkButtonProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  children: ReactNode;
  href: string;
  variant?: ButtonVariant;
};

export function Button({
  children,
  className = "",
  variant = "primary",
  ...props
}: NativeButtonProps) {
  return (
    <button
      className={`${baseClass} ${variantClass[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function LinkButton({
  children,
  className = "",
  href,
  variant = "secondary",
  ...props
}: LinkButtonProps) {
  return (
    <Link
      href={href}
      className={`${baseClass} ${variantClass[variant]} ${className}`}
      {...props}
    >
      {children}
    </Link>
  );
}
