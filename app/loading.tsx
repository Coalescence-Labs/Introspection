/** Global loading UI shown during route transitions (e.g. navigation) while the new route loads. */
export default function AppLoading() {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center px-6 text-center">
      <div className="mb-4 h-10 w-10 animate-pulse rounded-full bg-muted" />
      <p className="text-sm text-muted-foreground">Loading...</p>
    </main>
  );
}
