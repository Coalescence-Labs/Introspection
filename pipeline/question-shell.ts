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
 *   n [date] [count] - run network (generator → judges → rank), count 1–50; optionally persist to library
 *   q / exit  - quit
 */

import { mkdir, writeFile } from "node:fs/promises";
import * as readline from "node:readline";
import { dirname, join } from "node:path";
import type { GatewayModelId } from "ai";
import {
  runDailyNetwork,
  type CandidateWithScores,
  type NetworkRunMetrics,
  type PartialNetworkResult,
  type RunDailyNetworkResult,
} from "./lib/generation";
import { type GenerateQuestionsOutput, generateQuestions, getCurrentDateString, validateDateString } from "./lib/llm";
import type { LLMGeneratedDailyQuestion } from "./lib/schema";
import { getLibraryQuestions, insertGeneratedQuestions } from "./lib/supabase/queries";

const OUTPUT_DIR = join(import.meta.dir, "output");

/** Build recap payload and write a timestamped JSON file under pipeline/output/. */
async function writeRecapFile(
  date: string,
  requestedCount: number | undefined,
  result: RunDailyNetworkResult
): Promise<string | null> {
  const savedAt = new Date().toISOString();
  const questions =
    result.ok ? result.allCandidates.map((c) => c.question) : result.partial?.questions ?? [];
  if (questions.length === 0) return null;

  const payload: Record<string, unknown> = {
    savedAt,
    date,
    requestedCount: requestedCount ?? null,
    actualCount: questions.length,
    questions: questions.map((q, i) => ({ questionIndex: i, category: q.category, simple_text: q.simple_text })),
    judges:
      result.ok
        ? result.judgeOutputs
        : {
            ...(result.partial?.novelty && { novelty: result.partial.novelty }),
            ...(result.partial?.clarity && { clarity: result.partial.clarity }),
            ...(result.partial?.tone && { tone: result.partial.tone }),
          },
  };

  if (result.ok) {
    payload.rankedCandidates = result.allCandidates.map((c) => ({
      questionIndex: c.questionIndex,
      combinedScore: c.combinedScore,
      novelty: c.novelty,
      clarity: c.clarity,
      tone: c.tone,
      question: c.question,
    }));
    payload.winner = result.dailyQuestion;
    payload.aboveBenchmarkIndices = result.aboveBenchmarkIndices;
    payload.metrics = result.metrics;
  } else {
    payload.partial = true;
  }

  const safeTimestamp = savedAt.replace(/:/g, "-");
  const path = join(OUTPUT_DIR, `network-recap-${safeTimestamp}.json`);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(payload, null, 2), "utf8");
  return path;
}

const LIBRARY_CONTEXT_LIMIT = 50;
const MAX_GENERATE = 20;
const MAX_NETWORK_COUNT = 50;

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
    n [date] [count]  Run network (count 1–50); optionally persist to library
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
  const action = await prompt(rl, "  Append (a) / Replace (r) / Clear (c)? [a/r/c]: ");
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

/** Print each candidate with full text and scores in a monospaced block format. */
function printNetworkSuccess(candidates: CandidateWithScores[]): void {
  for (let i = 0; i < candidates.length; i++) {
    const c = candidates[i];
    const label = i === 0 ? "Candidate 1 (winner)" : `Candidate ${i + 1}`;
    console.log(`\n  --- ${label} ---`);
    console.log(`  ${c.question.simple_text}`);
    console.log(
      `  combined:  ${c.combinedScore.toFixed(2).padStart(5)}   novelty: ${c.novelty}   clarity: ${c.clarity}   tone: ${c.tone}`
    );
  }
  console.log("");
}

/** Print metrics at a glance: total tokens, total latency, and per-call breakdown. */
function printNetworkMetrics(metrics: NetworkRunMetrics): void {
  const totalTok = metrics.totalTokens;
  const totalTokStr = totalTok >= 1000 ? `${(totalTok / 1000).toFixed(1)}k` : String(totalTok);
  const latencySec = (metrics.totalLatencyMs / 1000).toFixed(1);
  console.log(
    `  Metrics: ${totalTokStr} tokens (${metrics.totalPromptTokens} in / ${metrics.totalCompletionTokens} out), ${latencySec}s latency`
  );
  const parts = metrics.calls.map((c) => {
    const tok = c.totalTokens ?? (c.promptTokens ?? 0) + (c.completionTokens ?? 0);
    const tokStr = tok >= 1000 ? `${(tok / 1000).toFixed(1)}k` : String(tok);
    const lat = c.latencyMs != null ? `${(c.latencyMs / 1000).toFixed(1)}s` : "?";
    return `${c.operation} ${tokStr} ${lat}`;
  });
  console.log(`  Per call: ${parts.join("  |  ")}`);
}

async function runNetworkAndMaybePersist(
  rl: readline.Interface,
  date: string,
  questionCount?: number
): Promise<void> {
  const countDesc =
    questionCount != null ? ` (${questionCount} question${questionCount === 1 ? "" : "s"})` : "";
  console.log(`  Running network for date ${date}${countDesc}...`);
  const result = await runDailyNetwork({ date, questionCount });

  try {
    const recapPath = await writeRecapFile(date, questionCount, result);
    if (recapPath) console.log("  Recap written to", recapPath);
  } catch (err) {
    console.warn("  Failed to write recap:", err);
  }

  if (!result.ok) {
    console.error("  Network failed:", result.error.message, result.error.type ?? "");
    if (result.partial && result.partial.questions.length > 0) {
      console.log("  (Partial result has questions but was not saved; use run-network-once.ts with persist for that.)");
    }
    return;
  }

  printNetworkSuccess(result.allCandidates);
  printNetworkMetrics(result.metrics);

  const answer = await prompt(
    rl,
    "  Save to library? Enter indices (e.g. 1 3), 'winner', 'all', or Enter to skip: "
  );
  const raw = answer.toLowerCase().trim();
  if (raw === "") {
    console.log("  Skipped.");
    return;
  }

  let toSave: LLMGeneratedDailyQuestion[] = [];
  if (raw === "winner") {
    toSave = [result.allCandidates[0].question];
  } else if (raw === "all") {
    toSave = result.allCandidates.map((c) => c.question);
  } else {
    const indices = raw.split(/\s+/).map((s) => parseInt(s, 10));
    for (const oneBased of indices) {
      if (oneBased >= 1 && oneBased <= result.allCandidates.length) {
        toSave.push(result.allCandidates[oneBased - 1].question);
      }
    }
  }

  if (toSave.length === 0) {
    console.log("  No valid selection; skipped.");
    return;
  }

  try {
    const ids = await insertGeneratedQuestions({
      questions: toSave.map((q) => ({
        category: q.category,
        simple_text: q.simple_text,
        tags: [],
        cadence: "daily",
      })),
    });
    console.log(`  Saved to library: ${ids.length} question(s). IDs: ${ids.join(", ")}`);
  } catch (err) {
    console.error("  Supabase insert failed:", err);
  }
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
        const count = countArg
          ? Math.min(MAX_GENERATE, Math.max(1, parseInt(countArg, 10) || 1))
          : 1;
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

      if (cmd === "n") {
        const arg1 = parts[1];
        const arg2 = parts[2];
        let date: string;
        let questionCount: number | undefined;
        if (arg1 == null) {
          date = getCurrentDateString();
        } else if (arg2 != null) {
          date = arg1;
          const n = parseInt(arg2, 10);
          if (!validateDateString(date)) {
            console.log("  Invalid date format, use YYYY-MM-DD");
            loop();
            return;
          }
          if (!Number.isFinite(n) || n < 1 || n > MAX_NETWORK_COUNT) {
            console.log(`  Invalid count; use 1–${MAX_NETWORK_COUNT}`);
            loop();
            return;
          }
          questionCount = n;
        } else if (validateDateString(arg1)) {
          date = arg1;
        } else {
          const n = parseInt(arg1, 10);
          if (Number.isFinite(n) && n >= 1 && n <= MAX_NETWORK_COUNT) {
            date = getCurrentDateString();
            questionCount = n;
          } else {
            console.log(`  Invalid date or count; use YYYY-MM-DD or 1–${MAX_NETWORK_COUNT}`);
            loop();
            return;
          }
        }
        await runNetworkAndMaybePersist(rl, date, questionCount);
        loop();
        return;
      }

      console.log("  Unknown command. Use g, g <n>, n [date] [count], c, v, m, or q/exit.");
      loop();
    });
  };

  loop();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
