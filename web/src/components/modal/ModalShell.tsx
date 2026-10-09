"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

type ModalShellProps = {
  // children adalah isi modal, misalnya form tambah atau detail data.
  children: React.ReactNode;
  // eyebrow/title dikirim dari komponen pemakai untuk judul bagian atas modal.
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
  const [animationState, setAnimationState] = useState<"opening" | "open" | "closing">("opening");
  const closeTimeoutRef = useRef<number | null>(null);

  const requestClose = useCallback(() => {
    if (closeTimeoutRef.current !== null) return;

    setAnimationState("closing");
    closeTimeoutRef.current = window.setTimeout(() => {
      closeTimeoutRef.current = null;
      onClose();
    }, 190);
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const frame = requestAnimationFrame(() => {
      setAnimationState("open");
    });

    return () => {
      cancelAnimationFrame(frame);
      if (closeTimeoutRef.current !== null) {
        window.clearTimeout(closeTimeoutRef.current);
        closeTimeoutRef.current = null;
      }
    };
  }, [isOpen]);

  // Saat modal terbuka, body dikunci dan tombol Escape bisa menutup modal.
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") requestClose();
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, requestClose]);

  // Portal membuat modal dirender langsung ke document.body agar berada di atas semua layout.
  const portalTarget =
    typeof document === "undefined" ? null : document.body;

  if (!isOpen || !portalTarget) return null;

  const isVisible = animationState === "open";
  const motionClass = isVisible
    ? "opacity-100"
    : "opacity-0 motion-safe:scale-[0.98] motion-safe:translate-y-2";

  return createPortal(
    <div
      className={`fixed inset-0 z-[1000] flex h-[100dvh] items-center justify-center overflow-hidden bg-slate-950/25 px-3 py-4 transition-opacity duration-200 ease-out motion-reduce:transition-none sm:px-6 sm:py-6 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Area backdrop: klik luar panel untuk menutup modal. */}
      <button
        type="button"
        aria-label="Tutup popup"
        className="fixed inset-0 cursor-default !transform-none"
        onClick={requestClose}
      />

      <div
        className={`relative flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-1.5rem)] min-w-0 max-w-[calc(100vw-1.5rem)] ${maxWidthClassName} ${motionClass} flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl transition-[opacity,transform] duration-200 ease-out motion-reduce:transform-none motion-reduce:transition-opacity sm:max-h-[calc(100dvh-3rem)] sm:w-full sm:max-w-[calc(100vw-3rem)]`}
      >
        {/* Header modal: label kecil, judul, dan tombol close. */}
        <div className="flex shrink-0 items-center justify-between gap-4 rounded-t-2xl border-b border-slate-200 bg-white px-5 py-4">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.04em] text-[#08783f]">
              {eyebrow}
            </p>
            <h2
              id="modal-title"
              className="mt-1 text-lg font-bold tracking-tight text-slate-950"
            >
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={requestClose}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950"
            aria-label="Tutup"
          >
            <X className="h-5 w-5" strokeWidth={2.4} />
          </button>
        </div>

        {/* Isi modal dari children, bisa scroll kalau kontennya panjang. */}
        <div className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain p-4 sm:p-6">
          {children}
        </div>
      </div>
    </div>,
    portalTarget,
  );
}
