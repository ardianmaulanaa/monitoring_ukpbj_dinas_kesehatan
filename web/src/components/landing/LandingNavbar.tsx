"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";

const navigationItems = [
  { label: "Beranda", href: "#beranda" },
  { label: "Tentang Sistem", href: "#tentang-sistem" },
  { label: "Alur Pengadaan", href: "#alur-pengadaan" },
  { label: "Fitur", href: "#fitur" },
];

export function LandingNavbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const updateScrolled = () => setScrolled(window.scrollY > 8);

    updateScrolled();
    window.addEventListener("scroll", updateScrolled, { passive: true });

    return () => window.removeEventListener("scroll", updateScrolled);
  }, []);

  const scrollToSection = (href: string) => {
    setOpen(false);

    const id = href.replace("#", "");
    const target = document.getElementById(id);

    if (!target) return;

    target.scrollIntoView({ behavior: "smooth", block: "start" });
    target.focus({ preventScroll: true });
  };

  return (
    <header
      className={`sticky top-0 z-50 bg-white transition-[box-shadow,border-color,background-color] duration-200 ${
        scrolled
          ? "border-b border-slate-200 shadow-[0_14px_35px_rgba(15,23,42,0.07)]"
          : "border-b border-emerald-900/5"
      }`}
    >
      <nav
        className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:h-20 lg:px-8"
        aria-label="Navigasi utama"
      >
        <Link href="/" aria-label="Beranda SIMUKPBJ">
          <BrandLogo />
        </Link>

        <div className="hidden items-center gap-8 lg:flex">
          {navigationItems.map((item) => (
            <button
              key={item.href}
              type="button"
              onClick={() => scrollToSection(item.href)}
              className="rounded-full px-1 py-2 text-sm font-bold text-slate-600 transition hover:text-[#08783f] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#08783f] focus-visible:ring-offset-2"
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <Link
            href="/login"
            className="inline-flex h-11 items-center justify-center rounded-full bg-[#08783f] px-5 text-sm font-black text-white shadow-[0_16px_34px_rgba(8,120,63,0.2)] transition duration-200 hover:bg-[#066532] hover:scale-[1.01] active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#08783f] focus-visible:ring-offset-2"
          >
            Login
          </Link>
        </div>

        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm lg:hidden"
          onClick={() => setOpen((current) => !current)}
          aria-expanded={open}
          aria-controls="landing-mobile-menu"
          aria-label={open ? "Tutup menu" : "Buka menu"}
        >
          {open ? (
            <X className="h-5 w-5" strokeWidth={2.4} />
          ) : (
            <Menu className="h-5 w-5" strokeWidth={2.4} />
          )}
        </button>
      </nav>

      {open ? (
        <div
          id="landing-mobile-menu"
          className="border-t border-slate-100 bg-white px-4 pb-5 pt-3 shadow-xl shadow-slate-950/5 lg:hidden"
        >
          <div className="mx-auto flex max-w-7xl flex-col gap-1">
            {navigationItems.map((item) => (
              <button
                key={item.href}
                type="button"
                onClick={() => scrollToSection(item.href)}
                className="rounded-2xl px-4 py-3 text-left text-sm font-black text-slate-700 hover:bg-emerald-50 hover:text-[#08783f] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#08783f]"
              >
                {item.label}
              </button>
            ))}

            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="mt-2 inline-flex h-12 items-center justify-center rounded-full bg-[#08783f] px-5 text-sm font-black text-white"
            >
              Masuk Sistem
            </Link>
          </div>
        </div>
      ) : null}

      <div className="grid h-1.5 grid-cols-3" aria-hidden="true">
        <div className="bg-[#08783f]" />
        <div className="bg-[#f5bd20]" />
        <div className="bg-[#159cc3]" />
      </div>
    </header>
  );
}
