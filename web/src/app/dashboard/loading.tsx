export default function DashboardLoading() {
  return (
    <main className="min-h-screen bg-[#f4f7f5] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mb-5 h-16 animate-pulse rounded-lg border border-slate-200 bg-white shadow-sm" />
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-24 animate-pulse rounded-lg border border-slate-100 bg-white shadow-sm"
          />
        ))}
      </section>
      <section className="mt-5 grid gap-5 xl:grid-cols-[2fr_1fr]">
        <div className="h-96 animate-pulse rounded-lg border border-slate-200 bg-white shadow-sm" />
        <div className="h-96 animate-pulse rounded-lg border border-slate-200 bg-white shadow-sm" />
      </section>
      <section className="mt-5 grid gap-5 xl:grid-cols-3">
        <div className="h-80 animate-pulse rounded-lg border border-slate-200 bg-white shadow-sm" />
        <div className="h-80 animate-pulse rounded-lg border border-slate-200 bg-white shadow-sm" />
        <div className="h-80 animate-pulse rounded-lg border border-slate-200 bg-white shadow-sm" />
      </section>
    </main>
  );
}
