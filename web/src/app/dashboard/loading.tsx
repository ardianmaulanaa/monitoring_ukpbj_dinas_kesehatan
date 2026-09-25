export default function DashboardLoading() {
  return (
    <main className="min-h-screen bg-[#f4f7f5] px-4 py-5 sm:px-6 lg:px-8">
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 12 }).map((_, index) => (
          <div
            key={index}
            className="h-32 animate-pulse rounded-lg border border-slate-100 bg-white shadow-sm"
          />
        ))}
      </section>
      <section className="mt-6 grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="h-96 animate-pulse rounded-lg border border-slate-200 bg-white shadow-sm" />
        <div className="h-96 animate-pulse rounded-lg border border-slate-200 bg-white shadow-sm" />
      </section>
    </main>
  );
}
