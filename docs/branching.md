# Introspection Branching Strategy

This document describes the branch structure, development workflow, commit conventions, and branch protection used for the Introspection project.

The goal is to balance rapid solo development with a clean production history, safe releases, and future contributor readiness.

---

## Branch Structure

```
main
└── develop
    ├── feature/
    ├── fix/
    └── experiment/
```

---

## Branch Roles

### `main`

The **production branch**.

`main` represents stable, deployable versions of the application.

- Always deployable
- Contains only finalized releases
- Protected from direct pushes
- Updated via Pull Request from `develop`
- Tagged with release versions (e.g. `v0.1.0`, `v0.2.0`, `v1.0.0`)

---

### `develop`

The **integration branch for the upcoming release**.

All completed work intended for the next version is merged into `develop`. It is the **source of truth for the next release candidate**.

- Integration of new features and fixes
- Testing combined changes
- Clear diff target for release automation (`main`…`develop`)

---

### `feature/<name>`

Used for implementing new functionality.

**Examples:** `feature/daily-question-generator`, `feature/prompt-template-system`, `feature/reflection-history-view`, `feature/ai-insight-clustering`

**Workflow:**

1. Branch from `develop`
2. Implement feature
3. Open PR → `develop`

---

### `fix/<name>`

Used for bug fixes.

**Examples:** `fix/clipboard-copy-ios`, `fix/memory-query-timeout`, `fix/question-generation-error`

**Workflow:**

1. Branch from `develop`
2. Implement fix
3. Open PR → `develop`

---

### `experiment/<name>`

Used for prototypes and exploratory ideas. These branches may evolve into features, be refactored before merging, or be abandoned.

**Examples:** `experiment/semantic-insight-graph`, `experiment/voice-reflection-mode`, `experiment/ai-personality-analysis`

---

### `private/aetherion`

**Private deployment channel** for unreleased work on Aetherion (local Raspberry Pi). Not merged to `develop` or `main` until promoted.

- Tagged releases: `aetherion/vX.Y.Z` (separate from public `v*` tags)
- Manifest: `aetherion-release.json`
- Synced with `main` and `develop` via `./scripts/aetherion-sync.sh` and GitHub Actions

See [docs/aetherion-channel.md](./aetherion-channel.md).

---

## Development Workflow

### 1. Sync `develop`

```bash
git checkout develop
git pull origin develop
```

### 2. Create a working branch

```bash
git checkout -b feature/daily-question-generator
```

### 3. Implement changes

```bash
git add .
git commit -m "feat: add daily question generator"
```

### 4. Push branch

```bash
git push origin feature/daily-question-generator
```

### 5. Open Pull Request

Merge into `develop`:

- `feature/*` → `develop`
- `fix/*` → `develop`
- `experiment/*` → `develop` (optional)

---

## Commit Message Guidelines

Two styles are used in this repo; conventional commits are preferred for consistency with tooling and changelogs.

### Conventional (preferred)

**Format:** `type(scope): short description` — scope is optional.

**Examples from this repo:**

- `feat(today): show shell instantly with Suspense for question only`
- `feat: add Supabase read-only integration`
- `refactor(pipeline): centralize llm call metrics`
- `refactor(pipeline): add generation config and judge schemas`
- `chore(deps): bump dev and prod dependencies`
- `chore: bump version to 0.9.0 and update dependencies`
- `perf(today): faster question hero render`

| Type       | Purpose                |
| ---------- | ---------------------- |
| `feat`     | New feature            |
| `fix`      | Bug fix                |
| `refactor` | Code restructuring     |
| `perf`     | Performance improvement |
| `docs`     | Documentation          |
| `chore`    | Maintenance, deps, version bumps |

### Simple imperative

Plain imperative sentences are also used when that’s clearer:

- `Add tests` / `Add pipeline for daily question generation`
- `Update .gitignore` / `Update welcome content, styles, and app pages`
- `Fix question hero height to stay static regardless of text length`
- `Bump version to 0.6.5` / `Bump app version`
- `Remove unused resources/Satoshi_Complete font pack`
- `README: update Architecture, add Design Principles`
- `Pipeline: bulk question generation, library queries, simple_text max 120ch`

Use lowercase after the type in conventional form; otherwise imperative is fine.

---

## Branch Protection

The `main` branch should be protected with:

- Require pull request before merging
- Require status checks to pass
- Require branch to be up to date
- Require at least one approval
- Prevent force pushes
- Prevent direct pushes
