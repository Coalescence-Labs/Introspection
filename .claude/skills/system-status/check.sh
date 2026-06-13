#!/usr/bin/env bash
#
# check.sh — system-layer health for the Introspection daily generator.
# Read-only: inspects systemd, run markers, recent logs, and env-key presence.
#
set -uo pipefail

SERVICE="introspection-daily.service"
TIMER="introspection-daily.timer"
MARKER_DIR="/var/lib/introspection"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
ENV_FILE="${REPO_ROOT}/.env.local"

rule() { printf '\n=== %s ===\n' "$1"; }

rule "Timer"
if systemctl list-unit-files "${TIMER}" >/dev/null 2>&1; then
  systemctl status "${TIMER}" --no-pager 2>/dev/null | sed -n '1,5p'
  echo
  systemctl list-timers "${TIMER}" --no-pager 2>/dev/null
else
  echo "NOT INSTALLED — run: sudo bash pipeline/systemd/install.sh"
fi

rule "Last service result"
systemctl show "${SERVICE}" -p Result -p ExecMainStatus -p ActiveState 2>/dev/null \
  || echo "(service unit not found)"

rule "Run markers"
for m in last_attempt last_success; do
  if [[ -f "${MARKER_DIR}/${m}" ]]; then
    printf '%-13s %s\n' "${m}:" "$(cat "${MARKER_DIR}/${m}")"
  else
    printf '%-13s (missing)\n' "${m}:"
  fi
done

rule "Recent logs (last 20 lines)"
journalctl -u "${SERVICE}" -n 20 --no-pager 2>/dev/null \
  || echo "(no journal access or no logs yet)"

rule "Env keys in .env.local (presence only)"
if [[ -f "${ENV_FILE}" ]]; then
  for key in SUPABASE_URL SUPABASE_SERVICE_ROLE_KEY \
             NEXT_PUBLIC_SUPABASE_URL NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY \
             ANTHROPIC_API_KEY; do
    if grep -qE "^${key}=.+" "${ENV_FILE}"; then
      printf '%-40s set\n' "${key}"
    else
      printf '%-40s MISSING\n' "${key}"
    fi
  done
else
  echo "${ENV_FILE} not found"
fi
