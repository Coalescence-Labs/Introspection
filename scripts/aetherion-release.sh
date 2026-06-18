#!/usr/bin/env bash
# Cut a new Aetherion private-channel release on private/aetherion.
# Usage: ./scripts/aetherion-release.sh [patch|minor|major] "Release notes"
set -euo pipefail

BUMP="${1:-patch}"
NOTES="${2:-}"
BRANCH="private/aetherion"
MANIFEST="aetherion-release.json"
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

if [[ -z "$NOTES" ]]; then
  echo "Usage: $0 [patch|minor|major] \"Release notes\"" >&2
  exit 1
fi

current="$(git branch --show-current)"
if [[ "$current" != "$BRANCH" ]]; then
  echo "Switch to $BRANCH first (current: $current)" >&2
  exit 1
fi

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Working tree is dirty. Commit or stash before releasing." >&2
  exit 1
fi

current_version="$(bun -e "console.log(JSON.parse(await Bun.file('$MANIFEST').text()).version)")"
IFS='.' read -r major minor patch <<< "$current_version"

case "$BUMP" in
  major) major=$((major + 1)); minor=0; patch=0 ;;
  minor) minor=$((minor + 1)); patch=0 ;;
  patch) patch=$((patch + 1)) ;;
  *)
    echo "Bump must be patch, minor, or major" >&2
    exit 1
    ;;
esac

new_version="${major}.${minor}.${patch}"
tag="aetherion/v${new_version}"
released_at="$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")"

bun -e "
const notes = process.argv[1];
const manifest = {
  channel: 'aetherion',
  branch: 'private/aetherion',
  version: '$new_version',
  tag: '$tag',
  releasedAt: '$released_at',
  notes,
};
await Bun.write('$MANIFEST', JSON.stringify(manifest, null, 2) + '\n');
" "$NOTES"

git add "$MANIFEST"
git commit -m "chore(aetherion): release $tag"
git tag -a "$tag" -m "$NOTES"
git push origin "$BRANCH"
git push origin "$tag"

echo "Released $tag"
echo "Manifest: $MANIFEST"
