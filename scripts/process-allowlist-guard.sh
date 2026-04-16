#!/usr/bin/env bash
set -euo pipefail

# Strict process allowlist guard for jarvis-web deployments.
# ENFORCE=0: log only, ENFORCE=1: kill non-allowlisted processes.

ENFORCE="${ENFORCE:-1}"
SCAN_INTERVAL="${SCAN_INTERVAL:-15}"
LOG_DIR="${LOG_DIR:-/www/wwwroot/jarvis-web/logs}"
LOG_FILE="${LOG_FILE:-${LOG_DIR}/process-allowlist-guard.log}"

mkdir -p "${LOG_DIR}"
touch "${LOG_FILE}"

log_line() {
  printf '%s %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*" >> "${LOG_FILE}"
}

ALLOW_CMD_PATTERNS=(
  "^\\[$" # kernel thread marker fallback guard
  "jarvis-web"
  "next-server"
  "next dev"
  "node .*jarvis-web"
  "pm2"
  "PM2"
  "bt-panel"
  "/www/server/panel"
  "BT-Panel"
  "nginx"
  "mysqld"
  "redis-server"
  "systemd"
  "systemd-journald"
  "systemd-logind"
  "systemd-resolved"
  "dbus-daemon"
  "rsyslogd"
  "cron"
  "crond"
  "sshd"
  "pure-ftpd"
  "php-fpm"
  "dockerd"
  "containerd"
  "containerd-shim"
  "python .*codeguard"
)

is_whitelisted_cmd() {
  local cmdline="$1"
  for pattern in "${ALLOW_CMD_PATTERNS[@]}"; do
    if [[ "${cmdline}" =~ ${pattern} ]]; then
      return 0
    fi
  done
  return 1
}

safe_to_skip_pid() {
  local pid="$1"
  [[ -z "${pid}" ]] && return 0
  [[ "${pid}" == "1" ]] && return 0
  [[ "${pid}" == "$$" ]] && return 0
  [[ "${pid}" == "${PPID:-0}" ]] && return 0
  local parent_pid
  parent_pid="$(awk '{print $4}' "/proc/${pid}/stat" 2>/dev/null || true)"
  [[ "${parent_pid}" == "$$" ]] && return 0
  return 1
}

scan_once() {
  local killed_count=0
  local found_count=0

  while IFS= read -r pid; do
    [[ -d "/proc/${pid}" ]] || continue
    safe_to_skip_pid "${pid}" && continue

    local cmdline comm
    cmdline="$(tr '\0' ' ' < "/proc/${pid}/cmdline" 2>/dev/null || true)"
    comm="$(cat "/proc/${pid}/comm" 2>/dev/null || true)"

    # Kernel threads or inaccessible cmdline: keep.
    if [[ -z "${cmdline}" ]]; then
      continue
    fi

    found_count=$((found_count + 1))
    if is_whitelisted_cmd "${cmdline}"; then
      continue
    fi

    log_line "[BLOCK] pid=${pid} comm='${comm}' cmd='${cmdline}'"
    if [[ "${ENFORCE}" == "1" ]]; then
      kill -9 "${pid}" 2>/dev/null || true
      killed_count=$((killed_count + 1))
    fi
  done < <(ls /proc | grep -E '^[0-9]+$')

  log_line "[SCAN] scanned=${found_count} killed=${killed_count} enforce=${ENFORCE}"
}

log_line "[START] process allowlist guard started enforce=${ENFORCE} interval=${SCAN_INTERVAL}s"
while true; do
  scan_once
  sleep "${SCAN_INTERVAL}"
done
