import { describe, expect, test } from "bun:test";
import type { LLMType } from "@/lib/content/schema";
import type { OpenInMenuDestinationId } from "@/lib/prompt/open-in-chat-urls";
import { type ParsedTodayPrefs, parseTodayPrefsStoredJson } from "@/lib/today-local-prefs";

function p(
  selectedLLM: LLMType,
  manualOpenInDestination: OpenInMenuDestinationId | null,
  speechFriendly: boolean
): ParsedTodayPrefs {
  return { selectedLLM, manualOpenInDestination, speechFriendly };
}

describe("parseTodayPrefsStoredJson", () => {
  const cases: { name: string; input: string; expected: ParsedTodayPrefs | null }[] = [
    // A — happy paths / normalization
    { name: "minimal claude", input: '{"l":"claude"}', expected: p("claude", null, false) },
    { name: "chatgpt alone", input: '{"l":"chatgpt"}', expected: p("chatgpt", null, false) },
    { name: "gemini alone", input: '{"l":"gemini"}', expected: p("gemini", null, false) },
    {
      name: "perplexity alone",
      input: '{"l":"perplexity"}',
      expected: p("perplexity", null, false),
    },
    {
      name: "open-in chatgpt destination",
      input: '{"l":"chatgpt","o":"chatgpt"}',
      expected: p("chatgpt", "chatgpt", false),
    },
    {
      name: "open-in claude destination",
      input: '{"l":"chatgpt","o":"claude"}',
      expected: p("chatgpt", "claude", false),
    },
    { name: "open-in t3", input: '{"l":"chatgpt","o":"t3"}', expected: p("chatgpt", "t3", false) },
    {
      name: "open-in scira",
      input: '{"l":"chatgpt","o":"scira"}',
      expected: p("chatgpt", "scira", false),
    },
    {
      name: "open-in perplexity destination",
      input: '{"l":"chatgpt","o":"perplexity"}',
      expected: p("chatgpt", "perplexity", false),
    },
    {
      name: "open-in cursor",
      input: '{"l":"chatgpt","o":"cursor"}',
      expected: p("chatgpt", "cursor", false),
    },
    {
      name: "full combo",
      input: '{"l":"perplexity","o":"cursor","s":true}',
      expected: p("perplexity", "cursor", true),
    },
    {
      name: "schema version tolerated",
      input: '{"v":1,"l":"gemini","o":"perplexity"}',
      expected: p("gemini", "perplexity", false),
    },
    {
      name: "explicit o null",
      input: '{"l":"claude","o":null}',
      expected: p("claude", null, false),
    },
    {
      name: "explicit s false",
      input: '{"l":"chatgpt","s":false}',
      expected: p("chatgpt", null, false),
    },
    {
      name: "unknown keys stripped",
      input: '{"l":"claude","junk":1,"x":{"y":2}}',
      expected: p("claude", null, false),
    },
    {
      name: "v zero tolerated",
      input: '{"v":0,"l":"claude"}',
      expected: p("claude", null, false),
    },
    {
      name: "v large int tolerated",
      input: '{"v":999,"l":"claude"}',
      expected: p("claude", null, false),
    },
    // B — JSON / shape rejection
    { name: "empty object", input: "{}", expected: null },
    { name: "missing l with o", input: '{"o":"cursor"}', expected: null },
    { name: "missing l with s", input: '{"s":true}', expected: null },
    { name: "json null root", input: "null", expected: null },
    { name: "array root", input: "[]", expected: null },
    { name: "string root", input: '"claude"', expected: null },
    { name: "number root", input: "42", expected: null },
    { name: "boolean root", input: "true", expected: null },
    { name: "malformed json", input: "not-json-at-all", expected: null },
    { name: "trailing comma invalid", input: '{"l":"claude",}', expected: null },
    { name: "empty string", input: "", expected: null },
    { name: "whitespace only", input: "   \n\t  ", expected: null },
    // C — enum / type rejection
    { name: "invalid l", input: '{"l":"gpt-5"}', expected: null },
    { name: "invalid l empty string", input: '{"l":""}', expected: null },
    { name: "invalid l wrong case", input: '{"l":"CLAUDE"}', expected: null },
    { name: "invalid o slack", input: '{"l":"claude","o":"slack"}', expected: null },
    { name: "legacy o v0 rejected", input: '{"l":"claude","o":"v0"}', expected: null },
    { name: "legacy o gemini rejected", input: '{"l":"claude","o":"gemini"}', expected: null },
    { name: "invalid o empty", input: '{"l":"claude","o":""}', expected: null },
    { name: "l wrong type number", input: '{"l":1}', expected: null },
    { name: "l wrong type array", input: '{"l":["claude"]}', expected: null },
    { name: "o wrong type number", input: '{"l":"claude","o":1}', expected: null },
    { name: "s wrong type string", input: '{"l":"claude","s":"true"}', expected: null },
    { name: "s wrong type number", input: '{"l":"claude","s":1}', expected: null },
    { name: "s null", input: '{"l":"claude","s":null}', expected: null },
    // D — version typing
    { name: "v string rejected", input: '{"v":"1","l":"claude"}', expected: null },
    // E — prototype pollution string still parses l
    {
      name: "proto key with valid l",
      input: '{"__proto__":{"x":1},"l":"claude"}',
      expected: p("claude", null, false),
    },
  ];

  for (const { name, input, expected } of cases) {
    test(name, () => {
      expect(parseTodayPrefsStoredJson(input)).toEqual(expected);
    });
  }
});
