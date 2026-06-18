/**
 * One-off Organic LLM handoff network runner.
 * Usage:
 *   bun run pipeline:organic-handoff -- --text "Your question"
 *   bun run pipeline:organic-handoff -- --from-recap pipeline/output/network-recap-....json
 *   bun run pipeline:organic-handoff -- --question-id <id> [--count 3]
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { runOrganicHandoffNetwork } from "./lib/generation/organic-handoff-network";
import { buildOrganicHandoffRecap } from "./lib/organic-handoff/export-recap";
import { getLibraryQuestions } from "./lib/supabase/queries";

function parseArgs(argv: string[]) {
  const out: {
    text?: string;
    questionId?: string;
    fromRecap?: string;
    count?: number;
  } = {};

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--text" && argv[i + 1]) out.text = argv[++i];
    else if (arg === "--question-id" && argv[i + 1]) out.questionId = argv[++i];
    else if (arg === "--from-recap" && argv[i + 1]) out.fromRecap = argv[++i];
    else if (arg === "--count" && argv[i + 1]) out.count = Number.parseInt(argv[++i], 10);
  }

  return out;
}

async function resolveSourceQuestion(args: ReturnType<typeof parseArgs>) {
  if (args.text) {
    return { simple_text: args.text, category: "reflection" as const };
  }

  if (args.fromRecap) {
    const raw = await readFile(args.fromRecap, "utf8");
    const recap = JSON.parse(raw) as {
      winner?: { simple_text: string; category?: string; id?: string };
      rankedCandidates?: { question: { simple_text: string; category?: string } }[];
    };

    const winner = recap.winner ?? recap.rankedCandidates?.[0]?.question;

    if (!winner) {
      throw new Error("Could not resolve winner from recap file");
    }

    return {
      id: recap.winner?.id,
      simple_text: winner.simple_text,
      category: winner.category,
    };
  }

  if (args.questionId) {
    const library = await getLibraryQuestions({ limit: 500 });
    const found = library.find((q) => q.id === args.questionId);

    if (!found) {
      throw new Error(`Question id not found: ${args.questionId}`);
    }

    return { id: found.id, simple_text: found.simple_text, category: found.category };
  }

  throw new Error("Provide --text, --from-recap, or --question-id");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const sourceQuestion = await resolveSourceQuestion(args);

  const result = await runOrganicHandoffNetwork({
    question: sourceQuestion,
    candidateCount: args.count,
    runId: "organic-handoff-once",
  });

  if (!result.ok) {
    console.error("Organic handoff network failed:", result.error.message);
    process.exit(1);
  }

  const recap = buildOrganicHandoffRecap({
    sourceQuestion,
    winner: result.winner,
    allCandidates: result.allCandidates,
  });

  const safeTs = recap.generatedAt.replace(/[:.]/g, "-");
  const outPath = join(import.meta.dir, "output", `organic-handoff-recap-${safeTs}.json`);

  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, JSON.stringify(recap, null, 2), "utf8");

  console.log("Winner title:", result.winner.title);
  console.log("Recap written to", outPath);

  if (recap.handoffUrl) {
    console.log("Handoff URL:", recap.handoffUrl);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
