# Pipeline Config

This directory holds hand-edited runtime configuration for the server-side pipeline.

## Files

- `generation.ts`: the main settings file for daily question generation and the planned multi-LLM network.

## Editing workflow

- Edit `generation.ts` directly when you want to tune behavior.
- Keep values simple and explicit so the file stays easy to scan.
- The config object is validated by the Zod schema in `../schemas/generation-config.ts`.

## Current settings

- `networkEnabled`: master switch for the future multi-LLM daily generation flow.
- `postAboveBenchmarkToLibrary`: when `true`, future daily runs can persist non-winning questions that still clear the score threshold.
- `minAcceptableScore`: the minimum combined score used to determine whether a generated question clears the benchmark.
- `generatorQuestionCount`: how many candidate questions the generator should produce.
- `models`: model IDs for the generator and the novelty, clarity, and tone judges.
- `scoring`: weights used when combining the judge scores into a single ranking.

## Validation

- `pipeline/schemas/generation-config.ts` defines the Zod schema for the settings file.
- Invalid values fail fast when `generation.ts` is loaded.
