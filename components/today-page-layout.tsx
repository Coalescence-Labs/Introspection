import { ThemeToggle } from "@/components/theme-toggle";
import { TodayPageShell } from "@/components/today-page-client";

interface TodayPageLayoutProps {
  todayLabel: string;
  children: React.ReactNode;
}

/** Server-rendered shell: main, footer. Client island (TodayPageShell) wraps section, controls, and prompt preview. */
export function TodayPageLayout({ todayLabel, children }: TodayPageLayoutProps) {
  return (
    <main className="mx-auto max-w-5xl px-6 flex flex-col gap-20">
      <TodayPageShell todayLabel={todayLabel}>{children}</TodayPageShell>
      <footer className="pb-16 text-center text-xs text-muted-foreground">
        <div className="mb-4 flex justify-center">
          <ThemeToggle tabIndex={0} />
        </div>
        <p>Introspection - Reflect on your AI conversations</p>
      </footer>
    </main>
  );
}
