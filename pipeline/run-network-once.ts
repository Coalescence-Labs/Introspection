/**
 * Optional: one-off script to run the generation network (Part 4) without run-daily.
 * Persists generated questions and successful judge results to pipeline/output/network-partial.json
 * so nothing is lost on failure.
 *
 * Usage: bun run pipeline/run-network-once.ts [YYYY-MM-DD]
 * Requires: AI gateway env (e.g. AI_GATEWAY_API_KEY), optional INTROSPECTION_LLM_LOG_PATH.
 */

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import {
  runDailyNetwork,
  type PartialNetworkResult,
  type RunDailyNetworkPersist,
} from "./lib/generation";
import { getCurrentDateString, validateDateString } from "./lib/llm";

const PARTIAL_OUTPUT_PATH = join(import.meta.dir, "output", "network-partial.json");

async function writePartial(data: PartialNetworkResult): Promise<void> {
  try {
    await mkdir(dirname(PARTIAL_OUTPUT_PATH), { recursive: true });
    await writeFile(
      PARTIAL_OUTPUT_PATH,
      JSON.stringify(
        { ...data, savedAt: new Date().toISOString() },
        null,
        2
      ),
      "utf8"
    );
  } catch (err) {
    console.warn("Failed to write partial result:", err);
  }
}

let accumulated: PartialNetworkResult = { questions: [] };

const persistAccum: RunDailyNetworkPersist = {
  onQuestionsGenerated(questions) {
    accumulated = { questions };
    return writePartial(accumulated);
  },
  onJudgeComplete(dimension, result) {
    accumulated = { ...accumulated, [dimension]: result };
    return writePartial(accumulated);
  },
};

const date = process.argv[2] ?? getCurrentDateString();
if (!validateDateString(date)) {
  console.error("Invalid date format, use YYYY-MM-DD");
  process.exit(1);
}

runDailyNetwork({ date, persist: persistAccum })
  .then((result) => {
    if (result.ok) {
      console.log("Winner:", result.dailyQuestion.simple_text);
      console.log(
        "All candidates (ranked):",
        result.allCandidates.map((c) => c.combinedScore)
      );
      console.log("Above benchmark indices:", result.aboveBenchmarkIndices);
    } else {
      console.error("Network failed:", result.error.message, result.error.type);
      if (result.partial) {
        writePartial(result.partial).then(() =>
          console.log("Partial result saved to", PARTIAL_OUTPUT_PATH)
        );
      }
      process.exit(1);
    }
  })
  .catch((err) => {
    console.error(err);
    if (accumulated.questions.length > 0) {
      writePartial(accumulated).then(() =>
        console.log("Partial result saved to", PARTIAL_OUTPUT_PATH)
      );
    }
    process.exit(1);
  });
