import { LibraryPageClient } from "@/components/library-page-client";
import { getCachedQuestions } from "@/lib/content/loader";

export default async function LibraryPage() {
  const questions = await getCachedQuestions();
  return <LibraryPageClient questions={questions} />;
}
