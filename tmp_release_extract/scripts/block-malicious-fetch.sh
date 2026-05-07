#!/usr/bin/env bash

set -euo pipefail

BLOCK_IP="80.64.16.241"
BLOCK_HOST_PATTERN="80\\.64\\.16\\.241|re\\.sh|wget -q -O -|curl .+\\| bash|/bin/sh -c"

require_root() {
  if [ "${EUID:-$(id -u)}" -ne 0 ]; then
    echo "This script must be run as root."
    exit 1
  fi
}

backup_file() {
  local target="$1"
  if [ -f "$target" ]; then
    cp -a "$target" "${target}.bak.$(date +%Y%m%d-%H%M%S)"
  fi
}

append_hosts_block() {
  if ! grep -Eq "^[[:space:]]*127\\.0\\.0\\.1[[:space:]]+${BLOCK_IP}$|^[[:space:]]*0\\.0\\.0\\.0[[:space:]]+${BLOCK_IP}$" /etc/hosts; then
    echo "0.0.0.0 ${BLOCK_IP}" >> /etc/hosts
  fi
}

block_with_iptables() {
  if ! command -v iptables >/dev/null 2>&1; then
    return
  fi

  iptables -C OUTPUT -d "${BLOCK_IP}" -j REJECT >/dev/null 2>&1 || \
    iptables -I OUTPUT -d "${BLOCK_IP}" -j REJECT
  iptables -C INPUT -s "${BLOCK_IP}" -j DROP >/dev/null 2>&1 || \
    iptables -I INPUT -s "${BLOCK_IP}" -j DROP
}

block_with_nft() {
  if ! command -v nft >/dev/null 2>&1; then
    return
  fi

  nft list table inet jarvis_guard >/dev/null 2>&1 || nft add table inet jarvis_guard
  nft list chain inet jarvis_guard output >/dev/null 2>&1 || \
    nft add chain inet jarvis_guard output "{ type filter hook output priority 0; }"
  nft list chain inet jarvis_guard input >/dev/null 2>&1 || \
    nft add chain inet jarvis_guard input "{ type filter hook input priority 0; }"

  nft list chain inet jarvis_guard output | grep -q "${BLOCK_IP}" || \
    nft add rule inet jarvis_guard output ip daddr "${BLOCK_IP}" reject
  nft list chain inet jarvis_guard input | grep -q "${BLOCK_IP}" || \
    nft add rule inet jarvis_guard input ip saddr "${BLOCK_IP}" drop
}

sanitize_file() {
  local target="$1"
  [ -f "$target" ] || return 0

  if grep -Eq "${BLOCK_HOST_PATTERN}" "$target"; then
    backup_file "$target"
    sed -i '/80\.64\.16\.241/d;/re\.sh/d;/wget -q -O -/d;/curl .*| bash/d;/\/bin\/sh -c/d' "$target"
  fi
}

sanitize_crontabs() {
  local cron_dir
  for cron_dir in /var/spool/cron /var/spool/cron/crontabs; do
    if [ -d "$cron_dir" ]; then
      find "$cron_dir" -type f 2>/dev/null | while read -r cron_file; do
        sanitize_file "$cron_file"
      done
    fi
  done
}

sanitize_systemd() {
  local unit_dir
  for unit_dir in /etc/systemd/system /usr/lib/systemd/system /lib/systemd/system; do
    if [ -d "$unit_dir" ]; then
      find "$unit_dir" -maxdepth 2 -type f \( -name "*.service" -o -name "*.timer" \) 2>/dev/null | while read -r unit_file; do
        sanitize_file "$unit_file"
      done
    fi
  done
  command -v systemctl >/dev/null 2>&1 && systemctl daemon-reload || true
}

sanitize_shell_profiles() {
  local profile_file
  for profile_file in \
    /etc/rc.local \
    /etc/profile \
    /etc/bash.bashrc \
    /root/.bashrc \
    /root/.profile \
    /root/.bash_profile; do
    sanitize_file "$profile_file"
  done
}

kill_matching_processes() {
  pkill -f "${BLOCK_IP}" >/dev/null 2>&1 || true
  pkill -f "re\\.sh" >/dev/null 2>&1 || true
  pkill -f "wget -q -O -" >/dev/null 2>&1 || true
}

main() {
  require_root

  backup_file /etc/hosts
  append_hosts_block

  block_with_iptables
  block_with_nft

  sanitize_crontabs
  sanitize_systemd
  sanitize_shell_profiles
  kill_matching_processes

  echo "Blocked traffic to ${BLOCK_IP} and cleaned common persistence locations."
  echo "Recommended follow-up:"
  echo "  1. systemctl list-units --type=service | grep -Ei 'unknown|wget|curl|bash'"
  echo "  2. crontab -l"
  echo "  3. grep -RIn '80\\.64\\.16\\.241\\|re\\.sh' /etc /root /home 2>/dev/null"
}

main "$@"
