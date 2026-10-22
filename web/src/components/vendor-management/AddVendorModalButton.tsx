"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Plus } from "lucide-react";
import ModalShell from "@/components/modal/ModalShell";
import VendorForm from "@/components/vendor-management/VendorForm";

export default function AddVendorModalButton({ categories }: { categories: { id: string; name: string }[] }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [success, setSuccess] = useState("");

  const close = useCallback(() => {
    if (isDirty && !window.confirm("Data yang belum disimpan akan hilang. Tutup formulir?")) return;
    setIsOpen(false);
    setIsDirty(false);
  }, [isDirty]);

  function handleSaved() {
    setIsDirty(false);
    setIsOpen(false);
    setSuccess("Vendor berhasil disimpan sebagai draft.");
    router.refresh();
    window.setTimeout(() => setSuccess(""), 4000);
  }

  return (
    <>
      <button type="button" onClick={() => setIsOpen(true)} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#08783f] px-4 text-sm font-black text-white transition hover:bg-[#066532]">
        <Plus className="h-4 w-4" strokeWidth={2.5} /> Tambah Vendor
      </button>
      <ModalShell isOpen={isOpen} onClose={close} eyebrow="Manajemen Penyedia" title="Tambah Vendor" maxWidthClassName="max-w-5xl">
        <p className="mb-5 text-sm text-slate-600">Lengkapi informasi perusahaan dan kontak penyedia.</p>
        <VendorForm categories={categories} onCancel={close} onDirtyChange={setIsDirty} onSaved={handleSaved} />
      </ModalShell>
      {success && <div role="status" className="toast-alert fixed right-4 top-5 z-[1100] flex max-w-sm items-center gap-3 rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm font-bold text-emerald-800 shadow-xl"><CheckCircle2 className="h-5 w-5" />{success}</div>}
    </>
  );
}
