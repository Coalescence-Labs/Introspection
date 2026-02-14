import { test, expect, mock } from "bun:test";
import type { PostgrestError } from "@supabase/supabase-js";

type SupabaseResponse = { data: unknown; error: PostgrestError | null };

// Queue of responses: each Supabase call consumes the next. Tests push one or more.
const responseQueue: SupabaseResponse[] = [];

function consume(): SupabaseResponse {
  const out = responseQueue.shift();
  if (out !== undefined) return out;
  return { data: null, error: null };
}

function makeChain() {
  const then = (onFulfilled: (v: SupabaseResponse) => void) => {
    queueMicrotask(() => onFulfilled(consume()));
    return { then, catch: () => ({ then }) };
  };
  return { then, catch: () => ({ then }) };
}

const from = (_table: string) => ({
  select: (..._args: string[]) => ({
    eq: (_col: string, _val: unknown) => {
      const chain = makeChain();
      return Object.assign(chain, {
        maybeSingle: () => Promise.resolve(consume()),
      });
    },
    order: (_col: string, _opts?: { ascending: boolean }) => ({
      limit: (_n: number) => makeChain(),
    }),
  }),
  insert: (_row: Record<string, unknown>) => {
    const chain = makeChain();
    return Object.assign(chain, {
      select: (_cols: string) => ({
        single: () => Promise.resolve(consume()),
      }),
    });
  },
  upsert: (_row: Record<string, unknown>, _opts?: { onConflict?: string }) => makeChain(),
  eq: (_col: string, _val: unknown) => ({
    maybeSingle: () => Promise.resolve(consume()),
  }),
});

const supabaseWorker = { from };

mock.module("./supabase-worker", () => ({
  supabaseWorker,
}));

const {
  hasRunForDate,
  recordRunStart,
  recordRunResult,
  getRecentDailyQuestions,
  insertGeneratedQuestion,
  setDailyQuestion,
} = await import("./queries");

test("hasRunForDate returns true when data has rows", async () => {
  responseQueue.length = 0;
  responseQueue.push({ data: [{ id: "run-1" }], error: null });
  const result = await hasRunForDate("2025-02-14");
  expect(result).toBe(true);
});

test("hasRunForDate returns false when data is empty", async () => {
  responseQueue.length = 0;
  responseQueue.push({ data: [], error: null });
  const result = await hasRunForDate("2025-02-14");
  expect(result).toBe(false);
});

test("hasRunForDate throws when Supabase returns error", async () => {
  responseQueue.length = 0;
  responseQueue.push({
    data: null,
    error: { message: "db error", details: "", hint: "", code: "500" } as PostgrestError,
  });
  await expect(hasRunForDate("2025-02-14")).rejects.toMatchObject({
    message: "db error",
  });
});

test("recordRunStart returns a UUID", async () => {
  responseQueue.length = 0;
  responseQueue.push({ data: null, error: null });
  const runId = await recordRunStart("2025-02-14");
  expect(runId).toMatch(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  );
});

test("recordRunStart throws when Supabase returns error", async () => {
  responseQueue.length = 0;
  responseQueue.push({
    data: null,
    error: { message: "unique violation", details: "", hint: "", code: "23505" } as PostgrestError,
  });
  await expect(recordRunStart("2025-02-14")).rejects.toMatchObject({
    message: "unique violation",
  });
});

test("recordRunResult resolves when no error", async () => {
  responseQueue.length = 0;
  responseQueue.push({ data: null, error: null });
  await expect(
    recordRunResult({
      runId: "run-123",
      status: "success",
      model: "gpt-4",
    })
  ).resolves.toBeUndefined();
});

test("recordRunResult throws when Supabase returns error", async () => {
  responseQueue.length = 0;
  responseQueue.push({
    data: null,
    error: { message: "upsert failed", details: "", hint: "", code: "500" } as PostgrestError,
  });
  await expect(
    recordRunResult({ runId: "run-123", status: "error", model: "gpt-4" })
  ).rejects.toMatchObject({ message: "upsert failed" });
});

test("getRecentDailyQuestions returns empty array when no data", async () => {
  responseQueue.length = 0;
  responseQueue.push({ data: [], error: null });
  const result = await getRecentDailyQuestions({ limit: 5 });
  expect(result).toEqual([]);
});

test("getRecentDailyQuestions returns parsed questions when data has rows", async () => {
  responseQueue.length = 0;
  responseQueue.push({
    data: [
      {
        question_id: "q1",
        featured_date: "2025-02-14",
        questions: {
          id: "q1",
          category: "reflection",
          simple_text: "What did you learn?",
          tags: ["learning"],
          cadence: "daily",
        },
      },
    ],
    error: null,
  });
  const result = await getRecentDailyQuestions({ limit: 10 });
  expect(result).toHaveLength(1);
  expect(result[0].questionId).toBe("q1");
  expect(result[0].featuredDate).toBe("2025-02-14");
  expect(result[0].question.simple_text).toBe("What did you learn?");
});

test("getRecentDailyQuestions filters out items without questions", async () => {
  responseQueue.length = 0;
  responseQueue.push({
    data: [
      { question_id: "q1", featured_date: "2025-02-14", questions: null },
      {
        question_id: "q2",
        featured_date: "2025-02-13",
        questions: {
          id: "q2",
          category: "career",
          simple_text: "What went well?",
          tags: [],
          cadence: "daily",
        },
      },
    ],
    error: null,
  });
  const result = await getRecentDailyQuestions({});
  expect(result).toHaveLength(1);
  expect(result[0].questionId).toBe("q2");
});

test("getRecentDailyQuestions throws when Supabase returns error", async () => {
  responseQueue.length = 0;
  responseQueue.push({
    data: null,
    error: { message: "select failed", details: "", hint: "", code: "500" } as PostgrestError,
  });
  await expect(getRecentDailyQuestions({ limit: 5 })).rejects.toMatchObject({
    message: "select failed",
  });
});

test("insertGeneratedQuestion returns id when insert succeeds", async () => {
  responseQueue.length = 0;
  responseQueue.push({ data: { id: "new-question-id" }, error: null });
  const id = await insertGeneratedQuestion({
    question: {
      category: "reflection",
      simple_text: "What are you grateful for?",
      tags: ["gratitude"],
      cadence: "daily",
    },
  });
  expect(id).toBe("new-question-id");
});

test("insertGeneratedQuestion returns null when data has no id", async () => {
  responseQueue.length = 0;
  responseQueue.push({ data: {}, error: null });
  const id = await insertGeneratedQuestion({
    question: {
      category: "reflection",
      simple_text: "What are you grateful for?",
      tags: null,
      cadence: null,
    },
  });
  expect(id).toBeNull();
});

test("insertGeneratedQuestion throws when Supabase returns error", async () => {
  responseQueue.length = 0;
  responseQueue.push({
    data: null,
    error: { message: "insert failed", details: "", hint: "", code: "500" } as PostgrestError,
  });
  await expect(
    insertGeneratedQuestion({
      question: {
        category: "reflection",
        simple_text: "What are you grateful for?",
        tags: null,
        cadence: null,
      },
    })
  ).rejects.toMatchObject({ message: "insert failed" });
});

test("setDailyQuestion returns false when already set and not forcing", async () => {
  responseQueue.length = 0;
  responseQueue.push({
    data: { id: 1, today_question_id: "existing-id" },
    error: null,
  });
  const changed = await setDailyQuestion({ questionId: "existing-id", force: false });
  expect(changed).toBe(false);
});

test("setDailyQuestion returns true when value differs and upsert succeeds", async () => {
  responseQueue.length = 0;
  responseQueue.push({ data: { id: 1, today_question_id: "old-id" }, error: null });
  responseQueue.push({ data: null, error: null });
  const changed = await setDailyQuestion({ questionId: "new-id", force: false });
  expect(changed).toBe(true);
});

test("setDailyQuestion returns true when force is true even if same id", async () => {
  responseQueue.length = 0;
  responseQueue.push({ data: { id: 1, today_question_id: "same-id" }, error: null });
  responseQueue.push({ data: null, error: null });
  const changed = await setDailyQuestion({ questionId: "same-id", force: true });
  expect(changed).toBe(true);
});

test("setDailyQuestion throws when read fails", async () => {
  responseQueue.length = 0;
  responseQueue.push({
    data: null,
    error: { message: "read failed", details: "", hint: "", code: "500" } as PostgrestError,
  });
  await expect(setDailyQuestion({ questionId: "any-id" })).rejects.toMatchObject({
    message: "read failed",
  });
});

test("setDailyQuestion throws when upsert fails", async () => {
  responseQueue.length = 0;
  responseQueue.push({ data: { id: 1, today_question_id: "other" }, error: null });
  responseQueue.push({
    data: null,
    error: { message: "upsert failed", details: "", hint: "", code: "500" } as PostgrestError,
  });
  await expect(setDailyQuestion({ questionId: "new-id" })).rejects.toMatchObject({
    message: "upsert failed",
  });
});
