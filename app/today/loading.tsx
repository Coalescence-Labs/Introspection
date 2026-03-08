/**
 * Segment loading UI for `/today`. Mirrors the route shell so the header area
 * appears immediately while the async route layout resolves request-bound data.
 */
export default function TodayLoading() {
  return (
    <main className="mx-auto max-w-5xl px-6 flex flex-col gap-20">
      <section className="flex flex-col py-16 sm:py-20" style={{ height: "100dvh" }}>
        <div className="mb-16 sm:mb-20 flex items-center justify-between">
          <div className="text-xs text-muted-foreground">Daily Question</div>
        </div>
        <div className="mb-16 sm:mb-20 flex-1 flex flex-col items-center justify-center min-h-[200px]">
          <div className="text-muted-foreground animate-pulse">Loading today’s question…</div>
        </div>
      </section>
    </main>
  );
}
