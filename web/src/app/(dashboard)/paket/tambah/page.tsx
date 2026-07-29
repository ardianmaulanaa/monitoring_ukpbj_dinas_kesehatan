"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import AppHeader from "@/app/(dashboard)/_shared/AppHeader";
import PaketForm from "./PaketForm";

export default function Page() {
  const router = useRouter();

  return (
    <>
      <AppHeader
        title="Tambah Paket"
        subtitle="Input data level paket pengadaan sebelum rincian barang dan kontrak."
        rightLabel="Paket Pengadaan"
      />

      <main className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-4 flex items-center justify-between gap-3">
          <Link
            href="/paket"
            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-black text-slate-700 shadow-sm transition hover:border-[#08783f] hover:text-[#08783f]"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={2.4} />
            Kembali
          </Link>
        </div>

        <PaketForm
          onCancel={() => router.push("/paket")}
          onSaved={() => {
            router.push("/paket");
            router.refresh();
          }}
        />
      </main>
    </>
  );
}
