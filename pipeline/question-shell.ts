/**
 * Interactive question shell: generate questions with manual approve/deny/retry, persist to Supabase.
 * Usage: bun run pipeline/question-shell.ts (or bun run pipeline:questions)
 *
 * Commands:
 *   g         - generate 1 question
 *   g <n>     - generate n questions (e.g. g 5), max 20
 *   c         - add/append or replace context (append / replace / clear)
 *   v         - view current context
 *   m         - switch model (numbered list)
 *   q / exit  - quit
 */

import * as readline from "node:readline";
import { GatewayModelId } from "ai";
import { generateQuestions, type GenerateQuestionsOutput } from "./lib/llm";
import { getLibraryQuestions, insertGeneratedQuestions } from "./lib/supabase/queries";
import type { LLMGeneratedDailyQuestion } from "./lib/schema";

const LIBRARY_CONTEXT_LIMIT = 50;
const MAX_GENERATE = 20;

const ALLOWED_MODELS: { label: string; id: GatewayModelId }[] = [
  { label: "gpt-5.2", id: "openai/gpt-5.2" as GatewayModelId },
  { label: "opus-4.6", id: "anthropic/claude-opus-4.6" as GatewayModelId },
  { label: "sonnet-4.6", id: "anthropic/claude-sonnet-4.6" as GatewayModelId },
  { label: "Gemini 3 Pro", id: "google/gemini-3-pro" as GatewayModelId },
  { label: "Kimi K2.5", id: "moonshotai/kimi-k2.5" as GatewayModelId },
];

function printBanner(): void {
  console.log(`
  Question Shell — generate, review, and persist questions to Supabase
  -----------------------------------------------------------------
  Commands:
    g           Generate 1 question
    g <number>  Generate that many questions (e.g. g 5, max ${MAX_GENERATE})
    c           Add/replace/clear context for the LLM
    v           View current context
    m           Switch model (numbered list)
    q / exit    Quit
  -----------------------------------------------------------------
`);
}

function prompt(rl: readline.Interface, question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => resolve((answer ?? "").trim()));
  });
}

async function buildContext(additionalContext: string): Promise<string> {
  let library: Awaited<ReturnType<typeof getLibraryQuestions>> = [];
  try {
    library = await getLibraryQuestions({ limit: LIBRARY_CONTEXT_LIMIT });
  } catch (err) {
    console.warn("Failed to load library for context, continuing with empty:", err);
  }
  let context = "";
  if (library.length > 0) {
    context = "Existing questions in the library (do not duplicate):\n";
    context += library.map((q) => `- ${q.simple_text}`).join("\n");
  }
  if (additionalContext) {
    if (context) context += "\n\n";
    context += "Additional context:\n" + additionalContext;
  }
  return context;
}

async function runApprovalUX(
  rl: readline.Interface,
  batch: LLMGeneratedDailyQuestion[]
): Promise<{
  approved: LLMGeneratedDailyQuestion[];
  denied: LLMGeneratedDailyQuestion[];
  retryCount: number;
}> {
  const approved: LLMGeneratedDailyQuestion[] = [];
  const denied: LLMGeneratedDailyQuestion[] = [];
  let retryCount = 0;

  for (let i = 0; i < batch.length; i++) {
    const q = batch[i];
    const num = i + 1;
    console.log(`\n  [${num}/${batch.length}] ${q.simple_text} [${q.category}]`);
    const answer = await prompt(rl, "  [y/n/r] (approve / deny / retry): ");
    const lower = answer.toLowerCase();
    if (lower === "a y" || lower === "ay") {
      batch.slice(i).forEach((x) => approved.push(x));
      console.log("  → Approved all remaining.");
      break;
    }
    if (lower === "a n" || lower === "an") {
      batch.slice(i).forEach((x) => denied.push(x));
      console.log("  → Denied all remaining.");
      break;
    }
    if (lower === "y" || lower === "yes") {
      approved.push(q);
      console.log("  → Approved.");
    } else if (lower === "n" || lower === "no") {
      denied.push(q);
      console.log("  → Denied.");
    } else if (lower === "r" || lower === "retry") {
      retryCount += 1;
      console.log("  → Retry (will regenerate).");
    } else {
      console.log("  → Skipped (use y/n/r).");
    }
  }

  return { approved, denied, retryCount };
}

async function runGenerateAndApproval(
  rl: readline.Interface,
  currentModel: GatewayModelId,
  additionalContext: string,
  count: number
): Promise<{ approvedTexts: string[]; deniedTexts: string[] }> {
  const allApprovedTexts: string[] = [];
  const allDeniedTexts: string[] = [];

  console.log(`  Generating ${count} question(s)...`);
  const context = await buildContext(additionalContext);
  let result: GenerateQuestionsOutput | null = null;
  try {
    result = await generateQuestions({
      context,
      count,
      model: currentModel,
      runId: "question-shell",
    });
  } catch (err) {
    console.error("  Generate failed:", err);
    return { approvedTexts: [], deniedTexts: [] };
  }

  if (!result?.ok) {
    console.error("  Failed to generate questions:", JSON.stringify(result?.error, null, 2));
    return { approvedTexts: [], deniedTexts: [] };
  }

  let batch = result.data;
  let round = 0;
  const maxRetryRounds = 1;

  while (true) {
    round += 1;
    console.log("\n  --- Generated questions ---");
    const { approved, denied, retryCount } = await runApprovalUX(rl, batch);

    for (const q of approved) allApprovedTexts.push(q.simple_text);
    for (const q of denied) allDeniedTexts.push(q.simple_text);

    if (approved.length > 0) {
      try {
        const ids = await insertGeneratedQuestions({
          questions: approved.map((q) => ({
            category: q.category,
            simple_text: q.simple_text,
            tags: [],
            cadence: "daily",
          })),
        });
        console.log(`\n  Saved to Supabase: ${ids.length} question(s). IDs: ${ids.join(", ")}`);
      } catch (err) {
        console.error("  Supabase insert failed:", err);
      }
    }

    if (retryCount === 0 || round > maxRetryRounds) break;

    console.log(`  Regenerating ${retryCount} question(s) for retry...`);
    const retryResult = await generateQuestions({
      context,
      count: retryCount,
      model: currentModel,
      runId: "question-shell-retry",
    });
    if (!retryResult?.ok) {
      console.error("  Retry generation failed:", retryResult?.error);
      break;
    }
    batch = retryResult.data;
  }

  return { approvedTexts: allApprovedTexts, deniedTexts: allDeniedTexts };
}

function printCurrentContext(context: string): void {
  if (!context) {
    console.log("  (no context set)");
    return;
  }
  console.log("  --- current context ---");
  for (const line of context.split("\n")) console.log("  " + line);
  console.log("  --- end ---");
}

async function runContextMode(rl: readline.Interface, additionalContext: string): Promise<string> {
  printCurrentContext(additionalContext);
  const action = await prompt(
    rl,
    "  Append (a) / Replace (r) / Clear (c)? [a/r/c]: "
  );
  const choice = action.toLowerCase().trim();
  if (choice === "c" || choice === "clear") {
    console.log("  Context cleared.");
    return "";
  }
  if (choice === "r" || choice === "replace") {
    console.log("  Enter new context (empty line to finish):");
    const lines: string[] = [];
    while (true) {
      const line = await prompt(rl, "  > ");
      if (line === "") break;
      lines.push(line);
    }
    return lines.join("\n");
  }
  // default: append
  console.log("  Enter lines to append (empty line to finish):");
  const lines: string[] = [];
  while (true) {
    const line = await prompt(rl, "  > ");
    if (line === "") break;
    lines.push(line);
  }
  const newBlock = lines.join("\n");
  if (!newBlock) return additionalContext;
  return additionalContext ? additionalContext + "\n" + newBlock : newBlock;
}

async function runModelSelection(
  rl: readline.Interface,
  currentModel: GatewayModelId
): Promise<GatewayModelId> {
  console.log("  Select model (1–5):");
  ALLOWED_MODELS.forEach((m, i) => console.log(`    ${i + 1}. ${m.label} (${m.id})`));
  const raw = await prompt(rl, "  Number: ");
  const idx = parseInt(raw, 10);
  if (idx >= 1 && idx <= ALLOWED_MODELS.length) {
    return ALLOWED_MODELS[idx - 1].id;
  }
  console.log("  Invalid choice; keeping current model.");
  return currentModel;
}

async function main(): Promise<void> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  let currentModel: GatewayModelId = ALLOWED_MODELS[0].id;
  let additionalContext = "";

  printBanner();

  const loop = (): void => {
    rl.question("> ", async (line) => {
      const input = (line ?? "").trim();
      const parts = input.split(/\s+/);
      const cmd = parts[0]?.toLowerCase();

      if (!cmd || cmd === "q" || cmd === "exit") {
        rl.close();
        process.exit(0);
        return;
      }

      if (cmd === "g") {
        const countArg = parts[1];
        const count = countArg ? Math.min(MAX_GENERATE, Math.max(1, parseInt(countArg, 10) || 1)) : 1;
        const { approvedTexts, deniedTexts } = await runGenerateAndApproval(
          rl,
          currentModel,
          additionalContext,
          count
        );
        const contextBlocks: string[] = [];
        if (approvedTexts.length > 0) {
          contextBlocks.push(
            "Approved (already in library):\n" + approvedTexts.map((t) => `- ${t}`).join("\n")
          );
        }
        if (deniedTexts.length > 0) {
          contextBlocks.push(
            "Denied (avoid similar):\n" + deniedTexts.map((t) => `- ${t}`).join("\n")
          );
        }
        if (contextBlocks.length > 0) {
          additionalContext = additionalContext
            ? additionalContext + "\n\n" + contextBlocks.join("\n\n")
            : contextBlocks.join("\n\n");
          console.log("  Context updated with this round's approved/denied questions.");
        }
        loop();
        return;
      }

      if (cmd === "c") {
        additionalContext = await runContextMode(rl, additionalContext);
        console.log("  Context updated.");
        loop();
        return;
      }

      if (cmd === "v") {
        printCurrentContext(additionalContext);
        loop();
        return;
      }

      if (cmd === "m") {
        const chosen = await runModelSelection(rl, currentModel);
        currentModel = chosen;
        console.log("  Model set to:", currentModel);
        loop();
        return;
      }

      console.log("  Unknown command. Use g, g <n>, c, v, m, or q/exit.");
      loop();
    });
  };

  loop();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
