#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SIBLING="$REPO_ROOT/../organic-llm/lib/organic-relay"

if [[ ! -d "$SIBLING" ]]; then
  echo "Sibling organic-llm lib/organic-relay not found at $SIBLING" >&2
  exit 1
fi

diff -qr "$REPO_ROOT/lib/organic-relay" "$SIBLING"
