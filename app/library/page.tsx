import { LibraryPageClient } from "@/components/library-page-client";
import { loadQuestions } from "@/lib/content/loader";

export default async function LibraryPage() {
  const questions = await loadQuestions();
  return <LibraryPageClient questions={questions} />;
}
