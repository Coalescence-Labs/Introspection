import { LibraryPageClient } from "@/components/library-page-client";
import { getCachedQuestions } from "@/lib/content/loader";

/** Library page: server fetches the shared question list (cached, revalidate hourly) and passes it to the client. */
export default async function LibraryPage() {
  const questions = await getCachedQuestions();
  return <LibraryPageClient questions={questions} />;
}
