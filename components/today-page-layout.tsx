import { ThemeToggle } from "@/components/theme-toggle";
import { TodayPageShell } from "@/components/today-page-client";

interface TodayPageLayoutProps {
  /** Display date for the header (e.g. "March 7"); computed on the server after connection(). */
  todayLabel: string;
  /** Typically the Suspense boundary that wraps TodayQuestionContent (hero + question block). */
  children: React.ReactNode;
}

/**
 * Server-rendered layout for the Today page: main wrapper, client island (TodayPageShell with
 * section, controls, prompt preview), and footer with theme toggle. Keeps the client boundary
 * small and leaves static structure on the server.
 */
export function TodayPageLayout({ todayLabel, children }: TodayPageLayoutProps) {
  return (
    <main className="mx-auto max-w-5xl px-6 flex flex-col gap-20">
      <TodayPageShell todayLabel={todayLabel}>{children}</TodayPageShell>
      <footer className="pb-16 text-center text-xs text-muted-foreground">
        <div className="mb-4 flex justify-center">
          <ThemeToggle tabIndex={0} aria-label="Toggle theme" />
        </div>
        <p>Introspection - Reflect on your AI conversations</p>
      </footer>
    </main>
  );
}
