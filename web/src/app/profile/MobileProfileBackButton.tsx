"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function MobileProfileBackButton() {
  const router = useRouter();

  function handleBack() {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push("/dashboard");
  }

  return (
    <button
      type="button"
      onClick={handleBack}
      className="mobile-profile-back inline-flex h-11 max-w-full shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black leading-none text-slate-700 shadow-sm transition hover:border-[#08783f] hover:text-[#08783f] active:scale-[0.98] lg:hidden"
    >
      <ArrowLeft className="h-4 w-4" strokeWidth={2.4} />
      Kembali
    </button>
  );
}
