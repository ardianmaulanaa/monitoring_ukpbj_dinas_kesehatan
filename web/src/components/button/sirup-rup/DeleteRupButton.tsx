"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

type DeleteRupButtonProps = {
  id: string;
  namaPaket: string;
};

export default function DeleteRupButton({ id, namaPaket }: DeleteRupButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    const confirmed = window.confirm(
      `Hapus usulan perencanaan "${namaPaket}"? Data yang sudah dihapus tidak bisa dikembalikan.`,
    );

    if (!confirmed) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/rup?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.message || "Usulan perencanaan gagal dihapus.");
      }

      router.refresh();
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : "Usulan perencanaan gagal dihapus.",
      );
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isDeleting}
      className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-3 text-sm font-black text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
      aria-label={`Hapus ${namaPaket}`}
      title={`Hapus ${namaPaket}`}
    >
      <Trash2 className="h-4 w-4" strokeWidth={2.4} />
      {isDeleting ? "Menghapus" : "Hapus"}
    </button>
  );
}
