"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ArrowRight } from "lucide-react";

const introStorageKey = "monitoring-ukpbj-intro-seen";

export default function IntroPageClient() {
  const router = useRouter();

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (window.sessionStorage.getItem(introStorageKey) === "true") {
      router.replace("/login");
      return;
    }

    const redirectDelay = prefersReducedMotion ? 600 : 2600;
    const redirectTimer = window.setTimeout(() => {
      window.sessionStorage.setItem(introStorageKey, "true");
      router.replace("/login");
    }, redirectDelay);

    return () => window.clearTimeout(redirectTimer);
  }, [router]);

  const enterWebsite = () => {
    window.sessionStorage.setItem(introStorageKey, "true");
    router.replace("/login");
  };

  return (
    <main
      className="intro-shell fixed inset-0 flex h-[100dvh] items-center justify-center overflow-hidden bg-[#f3f8f4] px-5 text-[#16372b]"
    >
      <div className="absolute inset-x-0 top-0 grid h-1.5 grid-cols-3">
        <div className="bg-[#08783f]" />
        <div className="bg-[#f5bd20]" />
        <div className="bg-[#159cc3]" />
      </div>

      <div className="intro-pattern absolute inset-0" />

      <section className="intro-panel relative z-10 flex w-full max-w-[620px] flex-col items-center text-center">
        <div className="intro-logo-wrap flex h-36 w-36 items-center justify-center rounded-[2rem] bg-white p-5 shadow-[0_24px_70px_rgba(8,120,63,0.18)] ring-1 ring-[#08783f]/10 sm:h-44 sm:w-44 sm:p-6">
          <Image
            src="/app/logo-dinkes.png"
            alt="Logo Dinas Kesehatan Jawa Barat"
            width={160}
            height={160}
            priority
            className="h-full w-full object-contain"
          />
        </div>

        <p className="intro-kicker mt-8 text-[11px] font-black uppercase tracking-[0.22em] text-[#08783f] sm:text-xs">
          Pemerintah Provinsi Jawa Barat
        </p>

        <h1 className="intro-title mt-3 max-w-[13ch] text-4xl font-black leading-[0.98] text-slate-950 sm:text-6xl">
          Dinas Kesehatan
        </h1>

        <p className="intro-copy mt-5 w-full max-w-[18rem] text-sm font-semibold leading-6 text-slate-600 sm:max-w-md sm:text-base sm:leading-7">
          Sistem Monitoring UKPBJ Dinas Kesehatan
        </p>

        <div className="intro-progress mt-8 h-1.5 w-52 overflow-hidden rounded-full bg-white shadow-inner ring-1 ring-[#08783f]/10">
          <span className="block h-full rounded-full bg-[#08783f]" />
        </div>

        <button
          type="button"
          onClick={enterWebsite}
          className="intro-action mt-8 inline-flex h-11 items-center gap-2 rounded-xl bg-[#08783f] px-5 text-sm font-black text-white shadow-[0_16px_34px_rgba(8,120,63,0.22)] hover:bg-[#066d38]"
        >
          Masuk
          <ArrowRight className="h-4 w-4" strokeWidth={2.6} />
        </button>
      </section>
    </main>
  );
}
