import { LibraryPageClient } from "@/components/library-page-client";
import { loadQuestions } from "@/lib/content/loader";

export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  const questions = await loadQuestions();
  return <LibraryPageClient questions={questions} />;
}
