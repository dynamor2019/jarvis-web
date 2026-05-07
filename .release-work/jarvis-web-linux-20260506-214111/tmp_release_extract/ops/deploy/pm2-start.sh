#!/bin/bash

# [CodeGuard Feature Index]
# - set -e -> line 13
# - else -> line 31
# - return 1 -> line 32
# - sleep 2 -> line 52
# - esac -> line 107
# - exit 1 -> line 174
# - done -> line 209
# [/CodeGuard Feature Index]

set -e

# Jarvis Web - PM2 Start Script
# This script uses PM2 to manage the Jarvis Web server process.
# PM2 provides process monitoring, auto-restart, and log management.
# Example:
#   chmod +x pm2-start.sh
#   ./pm2-start.sh
# Fix line endings if needed: sed -i 's/\r$//' pm2-start.sh

echo ">>> Starting Jarvis Web Setup with PM2..."

# Function to check if port 3000 is in use
check_port() {
    if command -v lsof >/dev/null 2>&1; then
        lsof -i :3000 -t >/dev/null 2>&1
        return $?
    elif command -v netstat >/dev/null 2>&1; then
        netstat -tuln | grep -q ":3000 "
        return $?
    elif command -v ss >/dev/null 2>&1; then
        ss -tuln | grep -q ":3000 "
        return $?
    else
        return 1
    fi
}

print_recent_logs() {
    echo "---------------- PM2 logs (pm2 logs jarvis-web --lines 80) ----------------"
    pm2 logs jarvis-web --lines 80 2>/dev/null || true
}

wait_for_health() {
    local attempts="${1:-30}"
    local delay="${2:-1}"
    local url="http://127.0.0.1:${PORT}/api/health"
    local i

    for i in $(seq 1 "$attempts"); do
        if ! pm2 describe jarvis-web >/dev/null 2>&1; then
            echo "CRITICAL: PM2 process jarvis-web not found."
            return 1
        fi

        if curl -fsS --max-time 3 "$url" >/dev/null 2>&1; then
            echo "Health check ready on attempt ${i}: $url"
            return 0
        fi

        echo "Waiting for health check (${i}/${attempts})..."
        sleep "$delay"
    done

    echo "CRITICAL: Health check did not become ready in time: $url"
    return 1
}

# 1. Install PM2 if not present
if ! command -v pm2 >/dev/null 2>&1; then
    echo "Installing PM2 globally..."
    if command -v npm >/dev/null 2>&1; then
        npm install -g pm2
    else
        echo "CRITICAL: npm not found. Cannot install PM2."
        exit 1
    fi
fi

# 2. Clean up existing processes
echo "Cleaning up..."

# Stop PM2 process if exists
pm2 delete jarvis-web >/dev/null 2>&1 || true

# Kill port 3000
if check_port; then
    echo "Port 3000 is in use. Killing..."
    if command -v fuser >/dev/null 2>&1; then
        fuser -k 3000/tcp >/dev/null 2>&1 || true
    fi
    if command -v lsof >/dev/null 2>&1; then
        pid=$(lsof -t -i:3000)
        [ -n "$pid" ] && kill -9 $pid >/dev/null 2>&1 || true
    fi
    # Fallback for minimal Linux images without lsof/fuser.
    pkill -f "node .*server.js" >/dev/null 2>&1 || true
    sleep 2
fi

# 3. Load environment variables (Moved up for DB Init)
echo "Loading environment variables..."
ENV_FILE=""
# Prefer standalone dir env files if present, otherwise project root
if [ -f ".next_build/standalone/jarvis-web/.env.production" ]; then
    ENV_FILE=".next_build/standalone/jarvis-web/.env.production"
elif [ -f ".next/standalone/jarvis-web/.env.production" ]; then
    ENV_FILE=".next/standalone/jarvis-web/.env.production"
elif [ -f ".env.production" ]; then
    ENV_FILE=".env.production"
elif [ -f ".next/standalone/jarvis-web/.env" ]; then
    ENV_FILE=".next/standalone/jarvis-web/.env"
elif [ -f ".env" ]; then
    ENV_FILE=".env"
fi
if [ -n "$ENV_FILE" ]; then
    echo "Using env file: $ENV_FILE"
    ENV_LOAD_FILE="$ENV_FILE"
    TMP_ENV_FILE=""
    # Handle Windows-generated env files: UTF-16 and/or CRLF can break `source`.
    if command -v file >/dev/null 2>&1 && file -bi "$ENV_FILE" 2>/dev/null | grep -qi "charset=utf-16"; then
        if command -v iconv >/dev/null 2>&1; then
            TMP_ENV_FILE="$(mktemp)"
            if iconv -f UTF-16 -t UTF-8 "$ENV_FILE" > "$TMP_ENV_FILE" 2>/dev/null; then
                ENV_LOAD_FILE="$TMP_ENV_FILE"
                echo "Converted UTF-16 env file to UTF-8."
            else
                rm -f "$TMP_ENV_FILE"
                TMP_ENV_FILE=""
                echo "Warning: Failed to convert UTF-16 env file. Trying original file."
            fi
        else
            echo "Warning: iconv not found. Cannot auto-convert UTF-16 env file."
        fi
    fi
    if [ -n "$TMP_ENV_FILE" ]; then
        TMP_ENV_CRLF="$(mktemp)"
        tr -d '\r' < "$ENV_LOAD_FILE" > "$TMP_ENV_CRLF" 2>/dev/null || cp "$ENV_LOAD_FILE" "$TMP_ENV_CRLF"
        mv "$TMP_ENV_CRLF" "$ENV_LOAD_FILE"
    else
        TMP_ENV_FILE="$(mktemp)"
        tr -d '\r' < "$ENV_LOAD_FILE" > "$TMP_ENV_FILE" 2>/dev/null || cp "$ENV_LOAD_FILE" "$TMP_ENV_FILE"
        ENV_LOAD_FILE="$TMP_ENV_FILE"
    fi
    LOADED_ENV_COUNT=0
    while IFS= read -r line || [ -n "$line" ]; do
        # Strip UTF-8 BOM and leading spaces.
        line="${line#$'\xEF\xBB\xBF'}"
        line="${line#"${line%%[![:space:]]*}"}"
        [ -z "$line" ] && continue
        case "$line" in
            \#*) continue ;;
        esac
        # Accept "KEY=VALUE" or "export KEY=VALUE", with optional spaces around "=".
        if [[ "$line" =~ ^(export[[:space:]]+)?([A-Za-z_][A-Za-z0-9_]*)[[:space:]]*=(.*)$ ]]; then
            key="${BASH_REMATCH[2]}"
            val="${BASH_REMATCH[3]}"
            export "$key=$val"
            LOADED_ENV_COUNT=$((LOADED_ENV_COUNT + 1))
        fi
    done < "$ENV_LOAD_FILE"
    [ -n "$TMP_ENV_FILE" ] && rm -f "$TMP_ENV_FILE"
    echo "Environment variables loaded. ($LOADED_ENV_COUNT vars)"
    if [ "$LOADED_ENV_COUNT" -eq 0 ]; then
        echo "Warning: No valid KEY=VALUE pairs found in $ENV_FILE."
    fi
else
    echo "No .env file found. Proceeding with current environment."
fi

# 4. Database Initialization
# Resolve DB path from DATABASE_URL when using sqlite, fallback to jarvis.db.
DB_PATH=""
if [ -n "${DATABASE_URL:-}" ] && [[ "$DATABASE_URL" == file:* ]]; then
    DB_FILE="${DATABASE_URL#file:}"
    if [[ "$DB_FILE" == ./* ]]; then
        DB_PATH="$(pwd)/${DB_FILE#./}"
    elif [[ "$DB_FILE" == /* ]]; then
        DB_PATH="$DB_FILE"
    else
        DB_PATH="$(pwd)/$DB_FILE"
    fi
fi
if [ -z "$DB_PATH" ]; then
    DB_PATH="$(pwd)/prisma/jarvis.db"
fi
# Keep Prisma datasource stable regardless of runtime cwd.
export DATABASE_URL="file:$DB_PATH"

echo "================================================================"
echo "Jarvis Web Startup Script (PM2)"
echo "Target Database: $DB_PATH"
echo "================================================================"

if [ -f "$DB_PATH" ] && [ -s "$DB_PATH" ]; then
    echo "Success: Found existing database at $DB_PATH"
    echo "Database Size: $(du -h "$DB_PATH" | cut -f1)"
else
    if [ -f "$DB_PATH" ] && [ ! -s "$DB_PATH" ]; then
        echo "WARNING: Database file exists but is empty (0 bytes): $DB_PATH"
    else
        echo "WARNING: Database file NOT found at $DB_PATH"
    fi
    echo "Attempting to recover database at this location..."
    
    # Check if directory exists
    DB_DIR=$(dirname "$DB_PATH")
    if [ ! -d "$DB_DIR" ]; then
        echo "Creating directory: $DB_DIR"
        mkdir -p "$DB_DIR"
    fi

    DB_RECOVERED=0
    for candidate in "./prisma/jarvis.db" "./prisma/dev.db" "./jarvis.db"; do
        if [ -f "$candidate" ] && [ -s "$candidate" ]; then
            if [ "$(readlink -f "$candidate" 2>/dev/null)" != "$(readlink -f "$DB_PATH" 2>/dev/null)" ]; then
                cp "$candidate" "$DB_PATH"
                echo "Recovered database from $candidate -> $DB_PATH"
            else
                echo "Recovery source equals target; skip copy: $candidate"
            fi
            DB_RECOVERED=1
            break
        fi
    done

    if [ "$DB_RECOVERED" -eq 0 ]; then
        if [ -f "./prisma/jarvis.db" ] && [ -s "./prisma/jarvis.db" ]; then
            cp "./prisma/jarvis.db" "$DB_PATH"
            echo "Copied packaged prisma/jarvis.db to $DB_PATH"
        elif [ -f "./prisma/dev.db" ] && [ -s "./prisma/dev.db" ]; then
            cp "./prisma/dev.db" "$DB_PATH"
            echo "Copied packaged prisma/dev.db to $DB_PATH"
        elif [ -f "./jarvis.db" ] && [ -s "./jarvis.db" ]; then
            cp "./jarvis.db" "$DB_PATH"
            echo "Copied packaged jarvis.db to $DB_PATH"
        else
            echo "CRITICAL: No packaged database found."
            exit 1
        fi
    fi
fi

echo "================================================================"
echo "Database configuration complete."
echo "Starting Next.js Server with PM2..."
echo "================================================================"

# Runtime should not load build-time config files from stale deploys.
for runtime_config in next.config.ts next.config.js next.config.mjs; do
    if [ -f "$runtime_config" ]; then
        mv "$runtime_config" "${runtime_config}.runtime-disabled"
        echo "Disabled runtime config file: $runtime_config"
    fi
done

SERVER_FILE="server.js"
if [ ! -f "$SERVER_FILE" ]; then
    echo "CRITICAL: server.js not found in current directory: $(pwd)/$SERVER_FILE"
    exit 1
fi

MISSING_MANIFESTS=""
for mf in BUILD_ID routes-manifest.json prerender-manifest.json; do
    if [ ! -f ".next_build/$mf" ]; then
        MISSING_MANIFESTS="$MISSING_MANIFESTS $mf"
    fi
done
if [ -n "$MISSING_MANIFESTS" ]; then
    echo "CRITICAL: Missing Next.js production manifests in .next_build:$MISSING_MANIFESTS"
    echo "Please deploy a complete build package before starting."
    exit 1
fi

if [ ! -d ".next_build/static" ]; then
    echo "CRITICAL: Missing .next_build/static"
    exit 1
fi

export NODE_ENV="${NODE_ENV:-production}"
export HOSTNAME="${HOSTNAME:-0.0.0.0}"
export PORT="${PORT:-3000}"
export DATABASE_URL="${DATABASE_URL:-file:$(pwd)/prisma/jarvis.db}"

echo "Starting server with PM2..."
pm2 start "$SERVER_FILE" --name jarvis-web --env production

sleep 3

if ! pm2 describe jarvis-web >/dev/null 2>&1; then
    echo "CRITICAL: PM2 process jarvis-web failed to start."
    print_recent_logs
    exit 1
fi

if ! check_port; then
    echo "CRITICAL: Port ${PORT} is not listening after startup."
    print_recent_logs
    exit 1
fi

if ! wait_for_health 30 1; then
    print_recent_logs
    exit 1
fi

echo ">>> Server started successfully with PM2."
echo ">>> PM2 Process: jarvis-web"
echo ">>> READY"
echo ">>> Health check: curl -i http://127.0.0.1:${PORT}/api/health"
echo ">>> View logs: pm2 logs jarvis-web"
echo ">>> Monitor: pm2 monit"
echo ">>> Stop: pm2 stop jarvis-web"