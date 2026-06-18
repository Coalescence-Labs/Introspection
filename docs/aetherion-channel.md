# Aetherion private channel

Unreleased Introspection work ships on **`private/aetherion`**, deployed only on Aetherion (local Raspberry Pi). This branch is **not** merged to `develop` or `main` until you choose to promote it.

## Branch roles

| Branch | Role |
|--------|------|
| `main` | Public production releases (`v*`) |
| `develop` | Next public release integration |
| `private/aetherion` | Private feature channel for Aetherion only |

`private/aetherion` stays current by **merging** `origin/main` and `origin/develop` regularly (automated on GitHub when either branch updates).

## Releases

Public releases use tags like `v0.9.1`. The Aetherion channel uses a separate tag namespace:

```
aetherion/v0.1.0
aetherion/v0.1.1
aetherion/v0.2.0
```

**Canonical manifest:** [`aetherion-release.json`](../aetherion-release.json) at the branch tip — version, tag, timestamp, and notes. The Pi deploy agent should compare this file (or the latest `aetherion/v*` tag) to decide whether to redeploy.

### Cut a release

On `private/aetherion`, with a clean working tree:

```bash
./scripts/aetherion-release.sh patch "Short description of what changed"
# or: minor | major
```

This bumps `aetherion-release.json`, commits, tags `aetherion/vX.Y.Z`, and pushes branch + tag. GitHub creates a **GitHub Release** for the tag (watch the repo or enable release notifications).

### Sync with main and develop

```bash
./scripts/aetherion-sync.sh
git push origin private/aetherion
```

Or rely on the **Aetherion sync** GitHub Action (runs on pushes to `main` and `develop`).

## Aetherion deploy agent

The Pi agent should:

1. `git fetch origin --tags`
2. Read `aetherion-release.json` on `origin/private/aetherion` (or resolve latest `aetherion/v*` tag)
3. If version differs from the last deployed release, checkout that tag (or branch tip if deploying HEAD), then:

```bash
bun install --frozen-lockfile
bun run build
# restart your local service (systemd, pm2, etc.)
```

Store the last deployed version locally (e.g. `~/.introspection-aetherion-version`).

## Feature workflow

1. Work on `private/aetherion` (or a short-lived `feature/*` branch merged back into it).
2. Run `./scripts/aetherion-sync.sh` when you want upstream fixes from `main` / `develop`.
3. When ready for Aetherion to pick up changes, run `./scripts/aetherion-release.sh`.

## Notifications

- **GitHub:** Watch the repo → Custom → Releases (for `aetherion/v*` GitHub Releases).
- **Cursor:** Agents use the [aetherion-release skill](../.cursor/skills/aetherion-release/SKILL.md) to report new releases when you work in this repo.
