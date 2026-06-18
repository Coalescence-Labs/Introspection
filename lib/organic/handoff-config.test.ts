import { afterEach, describe, expect, test } from "bun:test";

import { getOrganicBaseUrl, isOrganicHandoffEnabled } from "./handoff-config";

const prevSecret = process.env.INTROSPECTION_ORGANIC_SHARED_SECRET;
const prevUrl = process.env.ORGANIC_BASE_URL;

afterEach(() => {
  if (prevSecret !== undefined) process.env.INTROSPECTION_ORGANIC_SHARED_SECRET = prevSecret;
  else delete process.env.INTROSPECTION_ORGANIC_SHARED_SECRET;
  if (prevUrl !== undefined) process.env.ORGANIC_BASE_URL = prevUrl;
  else delete process.env.ORGANIC_BASE_URL;
});

describe("handoff-config", () => {
  test("isOrganicHandoffEnabled false when env missing", () => {
    delete process.env.INTROSPECTION_ORGANIC_SHARED_SECRET;
    delete process.env.ORGANIC_BASE_URL;
    expect(isOrganicHandoffEnabled()).toBe(false);

    process.env.INTROSPECTION_ORGANIC_SHARED_SECRET = "x";
    expect(isOrganicHandoffEnabled()).toBe(false);
  });

  test("getOrganicBaseUrl strips trailing slash", () => {
    process.env.INTROSPECTION_ORGANIC_SHARED_SECRET = "secret";
    process.env.ORGANIC_BASE_URL = "http://localhost:3000/";
    expect(getOrganicBaseUrl()).toBe("http://localhost:3000");
  });

  test("getOrganicBaseUrl throws when unset", () => {
    delete process.env.ORGANIC_BASE_URL;
    expect(() => getOrganicBaseUrl()).toThrow("ORGANIC_BASE_URL");
  });
});
