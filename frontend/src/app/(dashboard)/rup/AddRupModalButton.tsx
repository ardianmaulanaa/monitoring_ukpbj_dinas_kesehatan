"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import ModalShell from "@/app/(dashboard)/_shared/ModalShell";
import RupForm from "./tambah/rup-form";

type SumberDanaOption = {
  kode: string;
  nama: string;
};

type AddRupModalButtonProps = {
  sumberDanaOptions: SumberDanaOption[];
  label?: string;
};

export default function AddRupModalButton({
  sumberDanaOptions,
  label = "Tambah RUP",
}: AddRupModalButtonProps) {
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
        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#08783f] px-4 text-sm font-black text-white transition hover:bg-[#066532]"
      >
        <Plus className="h-4 w-4" strokeWidth={2.5} />
        {label}
      </button>

      <ModalShell
        isOpen={isOpen}
        onClose={close}
        eyebrow="SIRUP / RUP"
        title={label}
      >
        <RupForm
          sumberDanaOptions={sumberDanaOptions}
          variant="modal"
          onCancel={close}
          onSaved={handleSaved}
        />
      </ModalShell>
    </>
  );
}
