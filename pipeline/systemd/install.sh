#!/usr/bin/env bash
#
# install.sh — install (or reinstall) the Introspection daily-question systemd units.
#
# Copies introspection-daily.{service,timer} into /etc/systemd/system, reloads
# the systemd manager, and enables + starts the timer. Safe to re-run after
# editing the unit files in this directory — it overwrites and reloads.
#
# Usage:
#   sudo bash pipeline/systemd/install.sh           # install / reinstall
#   sudo bash pipeline/systemd/install.sh --status  # show timer + last run, no changes
#   sudo bash pipeline/systemd/install.sh --uninstall
#
set -euo pipefail

UNIT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SYSTEMD_DIR="/etc/systemd/system"
UNITS=(introspection-daily.service introspection-daily.timer)
TIMER="introspection-daily.timer"

require_root() {
  if [[ "${EUID}" -ne 0 ]]; then
    echo "error: must run as root (use: sudo bash $0)" >&2
    exit 1
  fi
}

show_status() {
  systemctl status "${TIMER}" --no-pager || true
  echo
  echo "Next run:"
  systemctl list-timers "${TIMER}" --no-pager || true
  echo
  if [[ -f /var/lib/introspection/last_success ]]; then
    echo "Last success marker: $(cat /var/lib/introspection/last_success)"
  fi
  if [[ -f /var/lib/introspection/last_attempt ]]; then
    echo "Last attempt marker: $(cat /var/lib/introspection/last_attempt)"
  fi
}

uninstall() {
  require_root
  systemctl disable --now "${TIMER}" 2>/dev/null || true
  for unit in "${UNITS[@]}"; do
    rm -f "${SYSTEMD_DIR}/${unit}"
  done
  systemctl daemon-reload
  echo "Uninstalled ${UNITS[*]}."
}

install() {
  require_root
  for unit in "${UNITS[@]}"; do
    install -m 0644 "${UNIT_DIR}/${unit}" "${SYSTEMD_DIR}/${unit}"
    echo "Installed ${unit} -> ${SYSTEMD_DIR}/${unit}"
  done
  systemctl daemon-reload
  systemctl enable --now "${TIMER}"
  echo
  echo "Done. The timer is enabled and active."
  echo
  show_status
}

case "${1:-}" in
  --status)    show_status ;;
  --uninstall) uninstall ;;
  "")          install ;;
  *) echo "usage: sudo bash $0 [--status|--uninstall]" >&2; exit 2 ;;
esac
