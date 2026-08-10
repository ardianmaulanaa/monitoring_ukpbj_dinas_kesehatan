"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

type ModalShellProps = {
  children: React.ReactNode;
  eyebrow: string;
  isOpen: boolean;
  maxWidthClassName?: string;
  onClose: () => void;
  title: string;
};

export default function ModalShell({
  children,
  eyebrow,
  isOpen,
  maxWidthClassName = "max-w-5xl",
  onClose,
  title,
}: ModalShellProps) {
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex h-[100dvh] items-center justify-center overflow-hidden bg-slate-950/40 px-3 py-4 sm:px-6 sm:py-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <button
        type="button"
        aria-label="Tutup popup"
        className="fixed inset-0 cursor-default"
        onClick={onClose}
      />

      <div
        className={`relative flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-1.5rem)] min-w-0 max-w-[calc(100vw-1.5rem)] ${maxWidthClassName} flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl sm:max-h-[calc(100dvh-3rem)] sm:w-full sm:max-w-[calc(100vw-3rem)]`}
      >
        <div className="flex shrink-0 items-center justify-between gap-4 rounded-t-2xl border-b border-slate-200 bg-white px-5 py-4">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#08783f]">
              {eyebrow}
            </p>
            <h2
              id="modal-title"
              className="mt-1 text-lg font-black text-slate-950"
            >
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950"
            aria-label="Tutup"
          >
            <X className="h-5 w-5" strokeWidth={2.4} />
          </button>
        </div>

        <div className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain p-4 sm:p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
