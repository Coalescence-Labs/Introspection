# Generator Prompt Chunks

This directory contains the system prompt pieces used by the pipeline question generators.

## Layout

- `chunks.ts`: shared chunk text plus prompt-specific chunks.
- `prompt.ts`: composes and exports `DAILY_GENERATOR_PROMPT` and `EXPANSIVE_GENERATOR_PROMPT`.
- `index.ts`: barrel export for the chunk constants and composed prompts.

## Naming

- Shared chunks have no suffix, for example `TONE`.
- Chunks used by only one prompt end in `_DAILY` or `_EXPANSIVE`.

## Consumers

- `DAILY_GENERATOR_PROMPT`: used by the daily generator and dry-run flow.
- `EXPANSIVE_GENERATOR_PROMPT`: used by `question-shell` and `run-bulk-questions`.
