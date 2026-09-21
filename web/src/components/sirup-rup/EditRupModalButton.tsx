"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import ModalShell from "@/components/dashboard/ModalShell";
import RupForm from "@/app/sirup-rup/tambah/rup-form";

type SumberDanaOption = {
  kode: string;
  nama: string;
};

type EditRupModalButtonProps = {
  initialData: Record<string, string | number | null | undefined>;
  sumberDanaOptions: SumberDanaOption[];
  label?: string;
  mode?: "rup" | "planning";
};

export default function EditRupModalButton({
  initialData,
  sumberDanaOptions,
  label = "Edit",
  mode = "planning",
}: EditRupModalButtonProps) {
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
        className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-blue-200 bg-white px-3 text-sm font-black text-blue-700 transition hover:bg-blue-50"
      >
        <Pencil className="h-4 w-4" strokeWidth={2.4} />
        {label}
      </button>

      <ModalShell
        isOpen={isOpen}
        onClose={close}
        eyebrow={mode === "planning" ? "Perencanaan" : "SIRUP / RUP"}
        title={label}
        maxWidthClassName="max-w-5xl"
      >
        <RupForm
          sumberDanaOptions={sumberDanaOptions}
          mode={mode}
          variant="modal"
          initialData={initialData}
          submitLabel="Simpan Perubahan"
          onCancel={close}
          onSaved={handleSaved}
        />
      </ModalShell>
    </>
  );
}
