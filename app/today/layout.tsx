import { connection } from "next/server";
import { ThemeToggle } from "@/components/theme-toggle";
import { TodayPageShell } from "@/components/today-page-client";
import { getTodayLabel } from "@/lib/utils";

interface TodayLayoutProps {
  children: React.ReactNode;
}

/**
 * Route layout for `/today`: computes the request-bound date label on the server,
 * renders the shared page shell, and leaves the question content to the page.
 */
export default async function TodayLayout({ children }: TodayLayoutProps) {
  await connection();
  const todayLabel = getTodayLabel();

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
