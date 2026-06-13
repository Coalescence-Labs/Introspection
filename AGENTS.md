# AGENTS.md — Introspection operating manual

Canonical guide for any agent or contributor working in Introspection. If this
conflicts with a stray comment or assumption, **this wins**. Keep it current.

`CLAUDE.md` is the thin entry point (Bun conventions); this file is the map.

---

## 1. What Introspection is (one paragraph)

A Next.js app that surfaces a daily AI-conversation **reflection question**.
Users read the day's question, pick an LLM, copy an optimized prompt, and paste
it into their own chat tool — they never call an LLM from the app. Questions live
in **Supabase** (with local `content/*.ts` as fallback). A server-side
**editorial pipeline** generates, validates, and seeds questions, and runs daily
on this Pi via a systemd timer.

## 2. Runtime & conventions

- **Runtime: Bun** everywhere — `bun install`, `bun run dev`, `bun test`,
  `bunx`. Never npm/yarn/node/ts-node. Bun auto-loads `.env` (no `dotenv`).
- **Linter/formatter: Biome** (not ESLint/Prettier): `bun run lint`,
  `bun run lint:fix`, `bun run format`.
- **Language:** TypeScript, strict. Match surrounding code — comment density and
  naming should be indistinguishable from neighboring files. No narration comments.
- **Tests:** `bun run test` (Playwright e2e), `bun run test:unit`
  (`bun test lib pipeline`).
- **Commits/PRs:** branch off `main` before committing; only commit/push when asked.

## 3. Repository map

```
introspection/
  CLAUDE.md                 # thin agent entry point (Bun rules)
  AGENTS.md                 # this file
  README.md / DEPLOYMENT.md / DESIGN.md / SECURITY.md
  app/                      # Next.js App Router: / (welcome), /today, /library
  lib/
    content/                # loader (Supabase + local fallback), rotation, Zod schema
    prompt/                 # prompt engine, per-LLM templates, open-in-chat URLs
  content/
    questions.ts            # local fallback question set (Supabase is primary)
  pipeline/                 # server-side editorial pipeline (see pipeline/README.md)
    run-daily.ts            # daily runner (entry point for the systemd service)
    lib/                    # generation, llm, supabase queries, schema
    config/generation.ts    # generation config (network on/off, models, caps)
    providers/              # LLMProvider implementations
    schemas/                # judge + generation Zod schemas
    systemd/                # unit files + install.sh  ← scheduled execution
  .claude/skills/
    system-status/          # health rollup: timer, last run, Supabase, today's Q
```

Keep this map current as directories are added.

## 4. Content & data model

- **Two content modes:** Mode A (template-generated prompts at runtime) and
  Mode B (AI-generated variants stored in content).
- **Storage:** Supabase is primary. When `NEXT_PUBLIC_SUPABASE_URL` +
  `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are set, the loader reads from Supabase;
  otherwise it falls back to `content/questions.ts`. The Supabase client is
  **server-only** (loader / Server Components).
- **Generation run tracking:** the pipeline records each daily run in a Supabase
  `generation_runs` table (`recordRunStart` / `recordRunResult` /
  `getRunByDate`). This is the source of truth for "did today's run succeed?"

## 5. The daily pipeline

- Entry point: `pipeline/run-daily.ts` — generates one question for a date,
  inserts it, and sets it as the day's question. With
  `generationConfig.networkEnabled` it uses the generator + judge network
  (`runDailyNetwork`); otherwise `generateDailyQuestion`.
- Scheduled via systemd on this Pi (daily at 02:00). Full setup, install script,
  and operating commands live in **`pipeline/README.md`**.
- Env keys (in `.env.local` on the Pi): `SUPABASE_URL` /
  `SUPABASE_SERVICE_ROLE_KEY` (writes), `NEXT_PUBLIC_SUPABASE_*` (app reads),
  plus the LLM provider keys. Keys never reach the client.

## 6. Non-negotiables

1. **Bun, not Node.** Every command and script. See `CLAUDE.md`.
2. **Never expose API keys or the service-role key to the client.** Generation is
   server-side only.
3. **Validate before seeding.** Run `bun run pipeline:validate` before
   `pipeline:seed`; content must pass the Zod schema.
4. **Design polish is part of done.** Organic-futuristic-modernism — calm,
   powerful, intentional. See `DESIGN.md`.
5. **Don't invent answers to open questions — flag them.**

## 7. Quick commands

```bash
bun run dev                  # local dev server
bun run lint:fix             # Biome check + write
bun run test:unit            # unit tests (lib + pipeline)
bun run pipeline:validate    # validate all questions (Zod)
bun run pipeline:seed        # seed Supabase
bun run pipeline:questions   # interactive question shell
```
