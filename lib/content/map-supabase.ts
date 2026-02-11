import type { LLMType, MappedQuestion, PromptVariantRow, QuestionRow } from "./schema";

/**
 * Map Supabase questions + prompt_variants rows to Question-shaped objects.
 * Joins in memory by question_id; snake_case to camelCase.
 */
export function mapQuestionsWithVariants(
  questionRows: QuestionRow[],
  variantRows: PromptVariantRow[]
): MappedQuestion[] {
  const variantsByQuestionId = new Map<
    string,
    Partial<Record<LLMType, { title: string; fullPrompt: string }>>
  >();

  for (const row of variantRows) {
    let map = variantsByQuestionId.get(row.question_id);
    if (!map) {
      map = {};
      variantsByQuestionId.set(row.question_id, map);
    }
    map[row.llm] = {
      title: row.title,
      fullPrompt: row.full_prompt,
    };
  }

  return questionRows.map((q) => {
    const variants = variantsByQuestionId.get(q.id);
    const hasVariants = variants && Object.keys(variants).length > 0;

    return {
      id: q.id,
      category: q.category,
      simpleText: q.simple_text,
      tags: q.tags ?? undefined,
      cadence: q.cadence ?? undefined,
      ...(hasVariants ? { variants } : {}),
    };
  });
}
