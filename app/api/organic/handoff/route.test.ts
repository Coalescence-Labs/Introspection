import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, test } from "bun:test";

import { POST } from "./route";

const FIXTURES = join(import.meta.dir, "../../../../lib/organic-relay/fixtures");
const TEST_SECRET = Buffer.alloc(32, 7).toString("base64");

const prevSecret = process.env.INTROSPECTION_ORGANIC_SHARED_SECRET;
const prevUrl = process.env.ORGANIC_BASE_URL;

beforeEach(() => {
  process.env.INTROSPECTION_ORGANIC_SHARED_SECRET = TEST_SECRET;
  process.env.ORGANIC_BASE_URL = "http://localhost:3000";
});

afterEach(() => {
  if (prevSecret !== undefined) process.env.INTROSPECTION_ORGANIC_SHARED_SECRET = prevSecret;
  else delete process.env.INTROSPECTION_ORGANIC_SHARED_SECRET;
  if (prevUrl !== undefined) process.env.ORGANIC_BASE_URL = prevUrl;
  else delete process.env.ORGANIC_BASE_URL;
});

describe("POST /api/organic/handoff", () => {
  test("503 when not configured", async () => {
    delete process.env.INTROSPECTION_ORGANIC_SHARED_SECRET;
    const res = await POST(
      new Request("http://localhost/api/organic/handoff", {
        method: "POST",
        body: JSON.stringify({}),
      }),
    );
    expect(res.status).toBe(503);
  });

  test("400 on invalid body", async () => {
    const res = await POST(
      new Request("http://localhost/api/organic/handoff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId: "x" }),
      }),
    );
    expect(res.status).toBe(400);
  });

  test("200 with handoff url for valid fixture", async () => {
    const body = readFileSync(join(FIXTURES, "handoff-v1.json"), "utf8");
    const res = await POST(
      new Request("http://localhost/api/organic/handoff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      }),
    );

    expect(res.status).toBe(200);
    const data = (await res.json()) as { url: string };
    expect(data.url).toStartWith("http://localhost:3000/introspection/start?p=intro%3Av1%3A");
  });
});
