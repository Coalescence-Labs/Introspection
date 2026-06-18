#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SIBLING="$REPO_ROOT/../organic-llm"

"$REPO_ROOT/scripts/check-organic-relay-contract.sh"
(cd "$SIBLING" && bun test lib/organic-relay)
(cd "$REPO_ROOT" && bun test lib/organic-relay)
