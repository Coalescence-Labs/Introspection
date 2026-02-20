# Introspection

A simple tool to help you gain deeper insights from your AI conversations.

## Overview

Introspection provides thoughtfully crafted questions designed to help you reflect on and extract value from your past AI chat conversations. Rather than letting valuable insights fade away, use these prompts to uncover patterns, ideas, and actionable next steps from your AI interactions.

## The Problem

We have countless conversations with AI assistants, exploring ideas, solving problems, and brainstorming. But how often do we step back and ask:
- What patterns emerge from my conversations?
- What's the most interesting idea I've explored?
- What should I focus on next?
- How can I apply what I've learned?

Introspection makes this reflection effortless.

## How It Works

1. **Choose Your Focus** — Select from curated introspection questions (today’s question or browse the library).
2. **Select Your LLM** — Pick which AI assistant you’ll use (Claude, ChatGPT, Gemini, Perplexity).
3. **Copy & Ask** — Get an optimized prompt tailored for that LLM, ready to paste into your conversation.

## Key Features

- **Today’s question** — A single question per day; optional override via Supabase for editorial control.
- **Question library** — Browse and use any question from the full set.
- **LLM-optimized prompts** — Per-LLM phrasing and instructions; template-based or editorial variants from the pipeline.
- **Speech-friendly option** — TTS-optimized prompt variant (natural pauses, minimal markdown) for voice playback.
- **Copy to clipboard** — One click to copy the full prompt.

## Use Cases

- **Daily reflection** — Check in with your AI conversation history each day.
- **Career development** — Identify actionable insights for professional growth.
- **Idea mining** — Surface creative concepts from past brainstorming sessions.
- **Learning optimization** — Discover knowledge gaps and learning opportunities.
- **Pattern recognition** — Understand your thinking patterns and interests over time.

## Getting Started

**Requirements:** [Bun](https://bun.sh) (recommended) or Node.js 18+.

```bash
git clone <repo-url>
cd introspection
bun install
bun run dev
```

Open [http://localhost:3000](http://localhost:3000). The app works with **local content only** by default (no env vars required).

### Optional: Supabase

To load questions and “today” config from Supabase instead of local files, set:

- `SUPABASE_URL` (or `NEXT_PUBLIC_SUPABASE_URL`)
- `SUPABASE_PUBLISHABLE_KEY` (or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`)

Use the **anon** key only; RLS should allow **SELECT** for the app. See `.env.example` and [DEPLOYMENT.md](./DEPLOYMENT.md).

### Scripts

| Command | Description |
|--------|-------------|
| `bun run dev` | Start dev server |
| `bun run build` | Production build |
| `bun run start` | Start production server |
| `bun run lint` | Run Biome linter |
| `bun run test` | Playwright tests |
| `bun run pipeline:validate` | Validate content |
| `bun run pipeline:seed` | Seed Supabase (requires service role key) |

## Noteworthy aspects

- **Next.js 16** (App Router), **React 19**, TypeScript. **Bun** for install/run/scripts.
- **Cache Components** (`use cache`): shared question list cached for 1 hour; daily question cached per calendar day so 8pm→7am gets the right day. See [Next.js caching](https://nextjs.org/docs/app/api-reference/directives/use-cache).
- **Optional Supabase** — Read-only from the app (anon key). Content can live in `content/*.ts` or in Supabase; pipeline/seed use the service role and are **not** exposed to the web.
- **Pipeline** — CLI scripts for validating content, seeding Supabase, and (with API keys) generating daily questions. Run locally or from a secure cron; see `pipeline/` and DEPLOYMENT.md.
- **Security** — `/__preview` is dev-only (proxy + server redirect in production). RLS and env usage are documented in [SECURITY.md](./SECURITY.md).
- **Accessibility** — Keyboard shortcuts (arrow keys for LLM), theme toggle, semantic markup.

## Deployment

Designed for [Vercel](https://vercel.com) with zero config. See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for steps, env vars, and production checklist.

## Roadmap

- [x] Core question library
- [x] LLM-specific prompt optimization
- [x] Speech-friendly response option
- [x] Web-based interface
- [x] Daily question rotation (with optional Supabase override)
- [x] Mobile-friendly design
- [ ] Custom question creation
- [ ] Browser extension support

## Contributing

Ideas, feedback, and contributions are welcome.

## License

Apache-2.0. See [LICENSE](./LICENSE).

---

**Introspection** — Because your AI conversations are worth revisiting.
