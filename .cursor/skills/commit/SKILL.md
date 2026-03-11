---
name: commit
description: Generate commit messages and perform git commits following Introspection conventions. Use when the user asks to commit, stage and commit, write a commit message, or "commit your work".
---

# Introspection Commit Skill

When committing in this repo, follow the guidelines in [docs/branching.md](../../docs/branching.md). Use this skill to choose messages and scope what gets committed.

## Workflow

1. **Check status** — `git status` to see modified/untracked files.
2. **Stage only relevant files** — If the user asked to commit specific work, stage only those files. Do not stage unrelated changes (e.g. other feature work or stray tests unless the user included them).
3. **Propose or use a message** — Prefer conventional format; use simple imperative when it fits better.
4. **Commit** — Run `git add` (for chosen paths) then `git commit -m "message"`. Request `git_write` when running git commands that modify state.

## Message format (quick reference)

**Conventional (preferred):** `type(scope): short description` — lowercase after colon.

| Type       | Use for                    |
| ---------- | -------------------------- |
| `feat`     | New feature                |
| `fix`      | Bug fix                    |
| `refactor` | Code restructuring         |
| `perf`     | Performance improvement    |
| `docs`     | Documentation              |
| `chore`    | Maintenance, deps, version |

**Examples:** `feat(today): show shell with Suspense`, `refactor(pipeline): centralize llm metrics`, `chore(deps): bump dependencies`, `docs: add branching and release process`.

**Simple imperative** is also acceptable: `Update .gitignore`, `Bump version to 0.9.0`.

## Scoping

Infer scope from changed paths when it helps: `(pipeline)`, `(today)`, `(home)`, `(deps)`.

## After committing

Confirm the commit hash and message. If the user only asked to commit (not push), do not run `git push` unless they ask.
