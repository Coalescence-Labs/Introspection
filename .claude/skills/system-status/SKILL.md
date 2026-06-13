---
name: system-status
description: Health rollup for the Introspection daily-question system on Aetherion. Checks the systemd timer, last run markers, recent service logs, Supabase config, and whether today's question + generation run succeeded. Use when asked "is the daily generator working?", "did today's question run?", "check introspection status", or to debug a missed/failed daily run.
---

# Introspection system status

Reports the health of the daily-question pipeline that runs on this Pi
(Aetherion). Run the checks below and summarize: is the timer scheduled, did the
most recent run succeed, and is today's question set?

## How to run

Two layers — run both, then summarize.

### 1. System layer (systemd, markers, logs)

```bash
bash .claude/skills/system-status/check.sh
```

This prints:
- timer state + next scheduled fire (`systemctl`)
- `/var/lib/introspection/last_attempt` and `last_success` markers
- the last service exit result and recent `journalctl` lines
- presence (not values) of required env keys in `.env.local`

### 2. Data layer (Supabase: today's run + question)

```bash
bun run .claude/skills/system-status/today.ts
```

This reads Supabase and prints today's `generation_runs` row (status) and the
currently-set daily question id. Requires `SUPABASE_URL` /
`SUPABASE_SERVICE_ROLE_KEY` in the environment (Bun auto-loads `.env.local`).

## Interpreting results

- **Healthy:** timer `active (waiting)`, a next-fire time exists, `last_success`
  is from the most recent scheduled day, today's `generation_runs.status` is
  `success`, and a today question id is set.
- **Timer inactive / not found:** units aren't installed or enabled. Reinstall:
  `sudo bash pipeline/systemd/install.sh` (see `pipeline/README.md`).
- **`last_attempt` newer than `last_success`:** the run started but failed.
  Inspect `journalctl -u introspection-daily.service -n 200` and the
  `generation_runs.notes` for the error.
- **Run row missing for today but the timer already fired:** check logs; the
  service may have errored before recording the run, or env keys are missing.
- **Env key missing:** the service loads `.env.local`; a missing
  `SUPABASE_SERVICE_ROLE_KEY` or provider key will fail generation.

## Manual trigger

To force a run now (outside the schedule):

```bash
sudo systemctl start introspection-daily.service
journalctl -u introspection-daily.service -f
```

Or run the generator directly (uses your shell env): `bun run pipeline/run-daily.ts`.
