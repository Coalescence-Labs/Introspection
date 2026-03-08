/** Loading UI for /library: skeleton that mirrors the library layout (back link, title, filter pills, card placeholders). */
export default function LibraryLoading() {
  return (
    <main className="mx-auto min-h-screen max-w-4xl px-6 py-16 sm:py-20">
      <div className="mb-12">
        <div className="mb-8 h-5 w-28 animate-pulse rounded bg-muted/60" />
        <div className="h-10 w-64 animate-pulse rounded bg-muted/60" />
        <div className="mt-3 h-5 w-80 animate-pulse rounded bg-muted/60" />
      </div>

      <div className="mb-12 flex flex-wrap gap-2">
        <div className="h-10 w-14 animate-pulse rounded-full bg-muted/60" />
        <div className="h-10 w-36 animate-pulse rounded-full bg-muted/60" />
        <div className="h-10 w-40 animate-pulse rounded-full bg-muted/60" />
        <div className="h-10 w-44 animate-pulse rounded-full bg-muted/60" />
      </div>

      <div className="space-y-4">
        <div className="h-24 animate-pulse rounded-xl border bg-muted/40" />
        <div className="h-24 animate-pulse rounded-xl border bg-muted/40" />
        <div className="h-24 animate-pulse rounded-xl border bg-muted/40" />
      </div>
    </main>
  );
}
