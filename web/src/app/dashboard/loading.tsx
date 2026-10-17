export default function DashboardLoading() {
  return (
    <main className="min-h-screen bg-[#f6f9f7] px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
      <div className="mb-5 h-[420px] animate-pulse rounded-2xl border border-[#dee9e2] bg-white" />
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="h-40 animate-pulse rounded-2xl border border-[#dee9e2] bg-white"
          />
        ))}
      </section>
      <section className="mt-8 grid gap-4 xl:grid-cols-2 2xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-80 animate-pulse rounded-2xl border border-[#dee9e2] bg-white" />
        ))}
      </section>
    </main>
  );
}
