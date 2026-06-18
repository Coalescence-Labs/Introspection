#!/usr/bin/env bash
# Merge latest origin/main and origin/develop into private/aetherion.
# Run locally or via .github/workflows/aetherion-sync.yml.
set -euo pipefail

BRANCH="private/aetherion"
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

git fetch origin main develop

current="$(git branch --show-current)"
if [[ "$current" != "$BRANCH" ]]; then
  git checkout "$BRANCH"
fi

git merge origin/main --no-edit -m "chore(aetherion): sync origin/main"
git merge origin/develop --no-edit -m "chore(aetherion): sync origin/develop"

echo "Synced $BRANCH with origin/main and origin/develop."
echo "Push with: git push origin $BRANCH"
