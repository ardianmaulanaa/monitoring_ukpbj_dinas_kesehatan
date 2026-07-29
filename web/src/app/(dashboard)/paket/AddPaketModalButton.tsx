"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import ModalShell from "@/app/(dashboard)/_shared/ModalShell";
import PaketForm from "@/app/(dashboard)/paket/tambah/PaketForm";

type AddPaketModalButtonProps = {
  buttonLabel?: string;
  modalTitle?: string;
  eyebrow?: string;
};

export default function AddPaketModalButton({
  buttonLabel = "Tambah paket",
  modalTitle = "Tambah Paket",
  eyebrow = "Paket Pengadaan",
}: AddPaketModalButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const close = useCallback(() => setIsOpen(false), []);

  function handleSaved() {
    setIsOpen(false);
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#08783f] px-4 text-sm font-black text-white shadow-sm transition hover:bg-[#066532]"
      >
        <Plus className="h-5 w-5" strokeWidth={2.3} />
        {buttonLabel}
      </button>

      <ModalShell
        isOpen={isOpen}
        onClose={close}
        eyebrow={eyebrow}
        title={modalTitle}
      >
        <PaketForm variant="modal" onCancel={close} onSaved={handleSaved} />
      </ModalShell>
    </>
  );
}
