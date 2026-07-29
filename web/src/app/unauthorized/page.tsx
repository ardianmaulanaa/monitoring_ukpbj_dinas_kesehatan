import EmptyState from "@/app/(dashboard)/_shared/EmptyState";

export default function Page() {
  return (
    <main className="min-h-dvh bg-[#f4f7f5] px-4 py-10 text-slate-950 sm:px-6 lg:px-8">
      <section className="mx-auto w-full max-w-3xl">
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#08783f]">
            Akses ditolak
          </p>
          <h1 className="mt-2 text-2xl font-black tracking-[-0.04em] text-slate-950">
            Unauthorized
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Akun Anda belum memiliki izin untuk membuka halaman ini.
          </p>
        </div>

        <EmptyState
          title="Tidak memiliki izin"
          description="Hubungi administrator LPSE untuk memastikan role dan hak akses akun sudah sesuai."
        />
      </section>
    </main>
  );
}
