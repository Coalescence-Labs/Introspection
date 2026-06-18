---
name: aetherion-release
description: Reports new Aetherion private-channel releases (private/aetherion, aetherion/v* tags, aetherion-release.json). Use when the user works on Introspection, asks about Aetherion deploys, private channel releases, or whether Aetherion is up to date.
---

# Aetherion release notifications

The private deployment channel lives on branch **`private/aetherion`**. Releases are tagged **`aetherion/vX.Y.Z`** and recorded in **`aetherion-release.json`**.

## When to run

At the **start** of an Introspection session (or when the user asks about Aetherion / private releases), check for new releases and **tell the user** if one appeared since the last time you reported.

## Check steps

1. `git fetch origin --tags` (needs network).
2. Read `aetherion-release.json` on `origin/private/aetherion`:
   ```bash
   git show origin/private/aetherion:aetherion-release.json
   ```
3. List recent Aetherion tags:
   ```bash
   git tag -l 'aetherion/v*' --sort=-v:refname | head -5
   ```
4. Compare to the last version you mentioned in this conversation. If newer, report:
   - Version and tag (e.g. `aetherion/v0.1.1`)
   - `releasedAt` and `notes` from the manifest
   - Remind that the Aetherion deploy agent should deploy that tag

## Cutting a release

Direct the user to [docs/aetherion-channel.md](../../docs/aetherion-channel.md) or run (on `private/aetherion`, clean tree):

```bash
./scripts/aetherion-release.sh patch "description"
```

## Sync with main/develop

```bash
./scripts/aetherion-sync.sh && git push origin private/aetherion
```

Or note that GitHub Actions syncs automatically on pushes to `main` and `develop`.
