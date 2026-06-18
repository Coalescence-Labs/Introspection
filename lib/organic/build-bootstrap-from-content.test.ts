import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "bun:test";

import { buildBootstrapPayloadFromContent } from "./build-bootstrap-from-content";
import { OrganicHandoffContentSchema } from "@/lib/organic-relay/schemas";

describe("buildBootstrapPayloadFromContent", () => {
  test("maps organic handoff content to bootstrap payload", () => {
    const content = OrganicHandoffContentSchema.parse(
      JSON.parse(
        readFileSync(
          join(import.meta.dir, "../organic-relay/fixtures/organic-handoff-v1.json"),
          "utf8",
        ),
      ),
    );

    const payload = buildBootstrapPayloadFromContent(content, {
      exp: 2000000000,
      nonce: "golden-nonce-v1-test",
    });

    expect(payload.nonce).toBe("golden-nonce-v1-test");
    expect(payload.systemInstructions).toBe(content.systemInstructions);
  });
});
