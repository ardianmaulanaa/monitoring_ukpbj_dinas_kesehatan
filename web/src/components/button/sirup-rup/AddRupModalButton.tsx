"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import ModalShell from "@/components/modal/ModalShell";
import RupForm from "@/app/sirup-rup/tambah/rup-form";

type SumberDanaOption = {
  kode: string;
  nama: string;
};

type AddRupModalButtonProps = {
  defaultKodeUsulan?: string | null;
  defaultUnitPengusul?: string | null;
  sumberDanaOptions: SumberDanaOption[];
  label?: string;
  mode?: "rup" | "planning";
};

export default function AddRupModalButton({
  defaultKodeUsulan,
  defaultUnitPengusul,
  sumberDanaOptions,
  label = "Tambah RUP",
  mode = "rup",
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
        eyebrow={mode === "planning" ? "Perencanaan" : "SIRUP / RUP"}
        title={label}
        maxWidthClassName={mode === "planning" ? "max-w-6xl" : undefined}
      >
        <RupForm
          defaultKodeUsulan={defaultKodeUsulan}
          defaultUnitPengusul={defaultUnitPengusul}
          sumberDanaOptions={sumberDanaOptions}
          mode={mode}
          variant="modal"
          onCancel={close}
          onSaved={handleSaved}
        />
      </ModalShell>
    </>
  );
}
