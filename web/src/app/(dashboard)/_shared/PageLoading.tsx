export default function PageLoading() {
  return (
    <div className="grid gap-4">
      <div className="h-28 animate-pulse rounded-2xl bg-white shadow-sm" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-28 animate-pulse rounded-2xl bg-white shadow-sm"
          />
        ))}
      </div>
      <div className="h-80 animate-pulse rounded-2xl bg-white shadow-sm" />
    </div>
  );
}
