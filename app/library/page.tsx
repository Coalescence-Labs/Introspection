import { LibraryPageClient } from "@/components/library-page-client";
import { getCachedQuestions } from "@/lib/content/loader";

/** Question library page. Uses shared cached question list (revalidate hourly). */
export default async function LibraryPage() {
  const questions = await getCachedQuestions();
  return <LibraryPageClient questions={questions} />;
}
