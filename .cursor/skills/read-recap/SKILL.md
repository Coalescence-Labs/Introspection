---
name: read-recap
description: Reads a network recap JSON file (from pipeline/output/) and outputs it as a human-readable, beautifully formatted Markdown report. Use when the user asks to read a recap, show recap, format recap, view recap, or "read the [most recent] recap".
---

# Read Network Recap

Read the specified recap JSON file (or the most recent one in `pipeline/output/`) and output a single, beautifully formatted Markdown report. Recap files are produced by the question shell's network command (`n [date] [count]`) and are named `network-recap-<ISO-timestamp>.json` (e.g. `network-recap-2025-03-09T14-30-00.000Z.json`).

## Resolving the file

- **User provides a path** — Use that path. If it is relative, resolve from the workspace root (e.g. `pipeline/output/network-recap-2025-03-09T14-30-00.000Z.json`).
- **No path given** — List files in `pipeline/output/` matching `network-recap-*.json`. Sort by filename descending (later timestamps sort later). Use the first file as the most recent. If the directory is missing or no files match, say so and do not proceed.

Read the file with the Read tool, parse the JSON, then format as below.

## Recap JSON shape (reference)

- `savedAt` (ISO string), `date`, `requestedCount` (number or null), `actualCount`
- `questions`: array of `{ questionIndex, category, simple_text }`
- `judges`: object with optional `novelty`, `clarity`, `tone`; each has `scores`: array of `{ questionIndex, score, rationale? }`
- On full success only: `rankedCandidates` (array of `{ questionIndex, combinedScore, novelty, clarity, tone, question }`), `winner` (question object), `aboveBenchmarkIndices`, `metrics` (e.g. `totalTokens`, `totalLatencyMs`, `calls`)
- `partial`: `true` if the run failed but partial data was saved

## Output format (Markdown)

Produce one cohesive Markdown document. Use clear headings, tables for tabular data, and blockquotes or callouts for the winner and metrics. Keep the tone neutral and scannable.

1. **Title and run info**
   - One top-level heading, e.g. `# Network Recap — <date>`
   - A short paragraph or list: **Saved at** (savedAt), **Date** (date), **Requested count** / **Actual count**, and if `partial === true` a note: *This run did not complete; partial data only.*

2. **Questions**
   - Heading: `## Questions`
   - Table with columns: **#** | **Category** | **Question**
   - One row per item in `questions`, using `questionIndex`, `category`, `simple_text`.

3. **Judge feedback**
   - Heading: `## Judge feedback`
   - For each present dimension (`novelty`, `clarity`, `tone`), a subheading (e.g. `### Novelty`) and a table: **#** | **Score** | **Rationale**
   - Use question index, score, and rationale (or "—" if missing). Order rows by question index.

4. **Ranking and winner** (only if `rankedCandidates` and `winner` exist)
   - Heading: `## Ranking`
   - Table: **Rank** | **#** | **Combined** | **N** | **C** | **T** | **Question** (N/C/T = novelty/clarity/tone scores).
   - Then a short callout for the winner, e.g. blockquote or bold: **Winner:** "<winner.simple_text>" [category].

5. **Above benchmark** (only if `aboveBenchmarkIndices` exists and is non-empty)
   - One line: e.g. `Question indices above benchmark: 2, 4, 7`

6. **Metrics** (only if `metrics` exists)
   - Heading: `## Metrics`
   - Total tokens, total latency (e.g. in ms or seconds), and a brief per-call line (e.g. generator + judge-novelty + judge-clarity + judge-tone with token/latency if present).

Use consistent spacing and table alignment. Do not emit raw JSON unless the user asks for it.
