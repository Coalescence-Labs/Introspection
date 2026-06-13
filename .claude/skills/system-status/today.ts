/**
 * today.ts — data-layer status for the Introspection daily generator.
 * Reads Supabase and prints today's generation run + the currently-set daily question.
 * Usage: bun run .claude/skills/system-status/today.ts [YYYY-MM-DD]
 * Bun auto-loads .env.local; requires SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
 */

import { getRunByDate } from "../../../pipeline/lib/supabase/queries";
import { supabaseWorker } from "../../../pipeline/lib/supabase/supabase-worker";

// Inlined to keep the status check lightweight (avoid importing the generation graph).
function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}

const arg = process.argv[2];
if (arg && !/^\d{4}-\d{2}-\d{2}$/.test(arg)) {
  console.error(`Invalid date "${arg}" — expected YYYY-MM-DD.`);
  process.exit(2);
}
const date = arg ?? todayString();

async function main() {
  console.log(`Date: ${date}\n`);

  // Today's generation run
  const run = await getRunByDate(date);
  if (!run) {
    console.log("generation_runs: NO ROW for this date (run did not record).");
  } else {
    console.log("generation_runs:");
    console.log(`  status:  ${run.status}`);
    console.log(`  model:   ${run.model}`);
    console.log(`  created: ${run.created_at}`);
    if (run.notes) console.log(`  notes:   ${run.notes.split("\n")[0]}`);
  }

  // Currently-set daily question (singleton today_config row)
  const { data, error } = await supabaseWorker
    .from("today_config")
    .select("today_question_id")
    .eq("id", 1)
    .maybeSingle();

  console.log();
  if (error) {
    console.log(`today_config: ERROR — ${error.message}`);
  } else if (!data?.today_question_id) {
    console.log("today_config: no question set.");
  } else {
    console.log(`today_config: question id = ${data.today_question_id}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("status check failed:", err);
    process.exit(1);
  });
