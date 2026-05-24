#!/usr/bin/env bash
set -u

LOG_FILE="/root/miner_cleanup_$(date +%Y%m%d_%H%M%S).log"
QUAR_DIR="/root/miner_quarantine_$(date +%Y%m%d_%H%M%S)"
HOSTS_FILE="/etc/hosts"

BAD_IPS="
193.124.33.22
92.255.110.4
194.87.254.160
185.87.48.183
185.156.179.225
176.113.81.186
185.221.152.130
"

BAD_PATTERNS="kdevtmpfsi|kinsing|xmrig|hashvault|pool\.hashvault\.pro|193\.124\.33\.22|92\.255\.110\.4|194\.87\.254\.160|185\.87\.48\.183|185\.156\.179\.225|176\.113\.81\.186|185\.221\.152\.130"
BAD_MD5="c82bb3c68f7a033b407aa3f53827b7fd"

log() {
  printf '[%s] %s\n' "$(date '+%F %T')" "$*" | tee -a "$LOG_FILE"
}

run() {
  log "RUN: $*"
  "$@" >>"$LOG_FILE" 2>&1
}

need_root() {
  if [ "$(id -u)" -ne 0 ]; then
    echo "Please run as root: sudo bash cleanup_miner.sh"
    exit 1
  fi
}

backup_file() {
  src="$1"
  if [ -e "$src" ]; then
    mkdir -p "$QUAR_DIR/backups"
    safe_name="$(echo "$src" | sed 's#/#_#g')"
    cp -a "$src" "$QUAR_DIR/backups/${safe_name}.bak" 2>>"$LOG_FILE" || true
  fi
}

block_network() {
  log "Blocking known miner IPs and pool domain"
  if command -v iptables >/dev/null 2>&1; then
    for ip in $BAD_IPS; do
      iptables -C OUTPUT -d "$ip" -j DROP >/dev/null 2>&1 || iptables -I OUTPUT -d "$ip" -j DROP >>"$LOG_FILE" 2>&1 || true
    done
    for port in 3333 4444 5555 7777 14444; do
      iptables -C OUTPUT -p tcp --dport "$port" -j DROP >/dev/null 2>&1 || iptables -I OUTPUT -p tcp --dport "$port" -j DROP >>"$LOG_FILE" 2>&1 || true
    done
  else
    log "iptables not found, skipped local firewall rules"
  fi

  if ! grep -q 'pool.hashvault.pro' "$HOSTS_FILE" 2>/dev/null; then
    backup_file "$HOSTS_FILE"
    printf '\n0.0.0.0 pool.hashvault.pro\n' >>"$HOSTS_FILE"
  fi
}

dump_process_info() {
  pid="$1"
  log "Process detail for PID $pid"
  ps -fp "$pid" >>"$LOG_FILE" 2>&1 || true
  ls -l "/proc/$pid/exe" "/proc/$pid/cwd" >>"$LOG_FILE" 2>&1 || true
  tr '\0' ' ' <"/proc/$pid/cmdline" >>"$LOG_FILE" 2>&1 || true
  printf '\n' >>"$LOG_FILE"
}

quarantine_exe() {
  pid="$1"
  mkdir -p "$QUAR_DIR/process"
  if [ -e "/proc/$pid/exe" ]; then
    cp "/proc/$pid/exe" "$QUAR_DIR/process/pid_${pid}_exe.dump" >>"$LOG_FILE" 2>&1 || true
  fi
}

kill_bad_processes() {
  log "Finding and killing suspicious miner processes"

  for pid in 92517 $(pgrep -f "$BAD_PATTERNS" 2>/dev/null || true); do
    [ -n "$pid" ] || continue
    [ -d "/proc/$pid" ] || continue
    [ "$pid" = "$$" ] && continue
    dump_process_info "$pid"
    quarantine_exe "$pid"
    kill -9 "$pid" >>"$LOG_FILE" 2>&1 || true
  done

  for proc in /proc/[0-9]*; do
    [ -e "$proc/exe" ] || continue
    pid="${proc#/proc/}"
    exe="$(readlink "$proc/exe" 2>/dev/null || true)"
    cmd="$(tr '\0' ' ' <"$proc/cmdline" 2>/dev/null || true)"
    case "$exe $cmd" in
      *deleted*|*/tmp/*|*/var/tmp/*|*/dev/shm/*|*kdevtmpfsi*|*kinsing*|*xmrig*|*hashvault*)
        [ "$pid" = "$$" ] && continue
        dump_process_info "$pid"
        quarantine_exe "$pid"
        kill -9 "$pid" >>"$LOG_FILE" 2>&1 || true
        ;;
    esac
  done
}

remove_file() {
  target="$1"
  [ -e "$target" ] || return 0
  mkdir -p "$QUAR_DIR/files"
  safe_name="$(echo "$target" | sed 's#/#_#g')"
  cp -a "$target" "$QUAR_DIR/files/$safe_name" >>"$LOG_FILE" 2>&1 || true
  rm -rf "$target" >>"$LOG_FILE" 2>&1 || true
  log "Removed suspicious file: $target"
}

clean_known_files() {
  log "Removing known miner files from temporary directories"
  for dir in /tmp /var/tmp /dev/shm; do
    remove_file "$dir/kdevtmpfsi"
    remove_file "$dir/kinsing"
    remove_file "$dir/xmrig"
    remove_file "$dir/config.json"
  done
}

clean_cron() {
  log "Cleaning suspicious cron entries"
  mkdir -p "$QUAR_DIR/cron"

  crontab -l >"$QUAR_DIR/cron/root.cron.before" 2>/dev/null || true
  if [ -s "$QUAR_DIR/cron/root.cron.before" ]; then
    grep -Ev "$BAD_PATTERNS|curl|wget|base64|/tmp/|/var/tmp/|/dev/shm/" "$QUAR_DIR/cron/root.cron.before" >"$QUAR_DIR/cron/root.cron.after" || true
    crontab "$QUAR_DIR/cron/root.cron.after" >>"$LOG_FILE" 2>&1 || true
  fi

  for file in /var/spool/cron/* /var/spool/cron/crontabs/* /etc/cron.d/*; do
    [ -f "$file" ] || continue
    if grep -E "$BAD_PATTERNS|/tmp/|/var/tmp/|/dev/shm/" "$file" >/dev/null 2>&1; then
      backup_file "$file"
      sed -i '/kdevtmpfsi\|kinsing\|xmrig\|hashvault\|pool\.hashvault\.pro\|193\.124\.33\.22\|92\.255\.110\.4\|194\.87\.254\.160\|185\.87\.48\.183\|185\.156\.179\.225\|176\.113\.81\.186\|185\.221\.152\.130\|\/tmp\/\|\/var\/tmp\/\|\/dev\/shm\//d' "$file" >>"$LOG_FILE" 2>&1 || true
    fi
  done
}

clean_systemd() {
  log "Disabling suspicious systemd services"
  [ -d /etc/systemd/system ] || return 0

  grep -RIlE "$BAD_PATTERNS|/tmp/|/var/tmp/|/dev/shm/" /etc/systemd/system /lib/systemd/system 2>/dev/null | while read -r unit; do
    [ -f "$unit" ] || continue
    backup_file "$unit"
    service_name="$(basename "$unit")"
    systemctl stop "$service_name" >>"$LOG_FILE" 2>&1 || true
    systemctl disable "$service_name" >>"$LOG_FILE" 2>&1 || true
    mkdir -p "$QUAR_DIR/systemd"
    cp -a "$unit" "$QUAR_DIR/systemd/$service_name" >>"$LOG_FILE" 2>&1 || true
    rm -f "$unit" >>"$LOG_FILE" 2>&1 || true
    log "Disabled and removed suspicious unit: $unit"
  done

  systemctl daemon-reload >>"$LOG_FILE" 2>&1 || true
}

clean_startup_files() {
  log "Cleaning suspicious startup script lines"
  for file in /etc/rc.local /etc/profile /etc/bashrc /root/.bashrc /root/.profile; do
    [ -f "$file" ] || continue
    if grep -E "$BAD_PATTERNS|/tmp/|/var/tmp/|/dev/shm/" "$file" >/dev/null 2>&1; then
      backup_file "$file"
      sed -i '/kdevtmpfsi\|kinsing\|xmrig\|hashvault\|pool\.hashvault\.pro\|193\.124\.33\.22\|92\.255\.110\.4\|194\.87\.254\.160\|185\.87\.48\.183\|185\.156\.179\.225\|176\.113\.81\.186\|185\.221\.152\.130\|\/tmp\/\|\/var\/tmp\/\|\/dev\/shm\//d' "$file" >>"$LOG_FILE" 2>&1 || true
    fi
  done
}

find_md5_match() {
  log "Searching for known malicious MD5 in common writable paths"
  for dir in /tmp /var/tmp /dev/shm /root; do
    [ -d "$dir" ] || continue
    find "$dir" -type f -size -50M -exec md5sum {} \; 2>/dev/null | while read -r md5 path; do
      if [ "$md5" = "$BAD_MD5" ]; then
        remove_file "$path"
      fi
    done
  done
}

write_report() {
  log "Writing final status"
  {
    echo
    echo "===== ACTIVE CONNECTIONS TO KNOWN MINER HOSTS ====="
    ss -antp 2>/dev/null | grep -E "$BAD_PATTERNS" || true
    echo
    echo "===== DELETED EXECUTABLE PROCESSES ====="
    ls -l /proc/*/exe 2>/dev/null | grep deleted || true
    echo
    echo "===== SUSPICIOUS TMP FILES ====="
    find /tmp /var/tmp /dev/shm -maxdepth 2 -type f -ls 2>/dev/null || true
  } >>"$LOG_FILE"
}

main() {
  need_root
  mkdir -p "$QUAR_DIR"
  touch "$LOG_FILE"
  chmod 600 "$LOG_FILE"

  log "Miner cleanup started"
  log "Log file: $LOG_FILE"
  log "Quarantine directory: $QUAR_DIR"

  block_network
  kill_bad_processes
  clean_known_files
  clean_cron
  clean_systemd
  clean_startup_files
  find_md5_match
  write_report

  log "Done. Reboot the server, then check Aliyun alert again."
  log "If alert returns, rebuild from a clean image is safer than repeated cleanup."
}

main "$@"
