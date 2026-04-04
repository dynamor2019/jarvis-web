#!/bin/bash

# [CodeGuard Feature Index]
# - set -e -> line 13
# - else -> line 31
# - return 1 -> line 32
# - sleep 2 -> line 56
# - esac -> line 111
# - exit 1 -> line 194
# - done -> line 332
# [/CodeGuard Feature Index]

set -e

# Jarvis Web - Start Script
# Fix line endings if needed: sed -i 's/\r$//' start.sh

echo ">>> Starting Jarvis Web Setup..."

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

# 1. Clean up existing processes
echo "Cleaning up..."

# Stop PM2 process if exists
if command -v pm2 >/dev/null 2>&1; then
    pm2 delete jarvis-web >/dev/null 2>&1 || true
elif [ -f "./node_modules/.bin/pm2" ]; then
    ./node_modules/.bin/pm2 delete jarvis-web >/dev/null 2>&1 || true
fi

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

# 2. Load environment variables (Moved up for DB Init)
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

# 3. Database Initialization
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
echo "Jarvis Web Startup Script"
echo "Target Database: $DB_PATH"
echo "================================================================"

# Always try to find prisma CLI for generate/push
PRISMA_CMD=""
if [ -f "./node_modules/prisma/build/index.js" ]; then
    # Use direct node script to avoid OS-specific bin issues
    PRISMA_CMD="node ./node_modules/prisma/build/index.js"
elif [ -f "./node_modules/.bin/prisma" ]; then
    PRISMA_CMD="./node_modules/.bin/prisma"
elif command -v prisma >/dev/null 2>&1; then
    PRISMA_CMD="prisma"
fi
if [ -n "$PRISMA_CMD" ] && [ ! -d "./node_modules/@prisma/engines" ]; then
    echo "Prisma engines not found in package. Skipping prisma CLI steps."
    PRISMA_CMD=""
fi
if [ -n "$PRISMA_CMD" ]; then
    if ! node -e "require('@prisma/engines'); require('@prisma/debug')" >/dev/null 2>&1; then
        echo "Prisma CLI runtime deps are incomplete. Skipping prisma CLI steps."
        PRISMA_CMD=""
    fi
fi
PRISMA_CAN_GENERATE=1
if [ -n "$PRISMA_CMD" ] && [ ! -f "./node_modules/@prisma/client/generator-build/index.js" ]; then
    echo "Prisma client generator is not packaged. Skipping prisma generate in runtime."
    PRISMA_CAN_GENERATE=0
fi

# Runtime safety switch: do not mutate schema by default.
# Set APPLY_PRISMA_DB_PUSH=1 only when you explicitly want runtime schema sync.
APPLY_PRISMA_DB_PUSH="${APPLY_PRISMA_DB_PUSH:-0}"

# 1. Always generate Prisma Client (safe, needed for code to run)
if [ -n "$PRISMA_CMD" ] && [ "$PRISMA_CAN_GENERATE" -eq 1 ]; then
    echo "Generating Prisma Client..."
    $PRISMA_CMD generate || echo "Prisma generate warning."
fi

# 2. Check Database Existence
if [ -f "$DB_PATH" ] && [ -s "$DB_PATH" ]; then
    echo "✅ Success: Found existing database at $DB_PATH"
    echo "Database Size: $(du -h "$DB_PATH" | cut -f1)"
    
    # Sync Schema Only (Safe update)
    if [ -n "$PRISMA_CMD" ] && [ "$APPLY_PRISMA_DB_PUSH" = "1" ]; then
        echo "Syncing database schema (prisma db push --skip-generate)..."
        $PRISMA_CMD db push --accept-data-loss --skip-generate || echo "Schema sync warning: Check logs if app fails."
    else
        echo "Skipping runtime prisma db push (APPLY_PRISMA_DB_PUSH=$APPLY_PRISMA_DB_PUSH)."
    fi
else
    if [ -f "$DB_PATH" ] && [ ! -s "$DB_PATH" ]; then
        echo "⚠️  WARNING: Database file exists but is empty (0 bytes): $DB_PATH"
    else
        echo "⚠️  WARNING: Database file NOT found at $DB_PATH"
    fi
    echo "Attempting to recover/create database at this location..."
    
    # Check if directory exists
    DB_DIR=$(dirname "$DB_PATH")
    if [ ! -d "$DB_DIR" ]; then
        echo "Creating directory: $DB_DIR"
        mkdir -p "$DB_DIR" || echo "Failed to create directory. Check permissions."
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

    if [ "$DB_RECOVERED" -eq 0 ] && [ -n "$PRISMA_CMD" ] && [ "$APPLY_PRISMA_DB_PUSH" = "1" ]; then
        echo "Pushing schema to create new DB..."
        $PRISMA_CMD db push --accept-data-loss --skip-generate || {
            echo "❌ CRITICAL: Failed to initialize database."
            exit 1
        }
        
        # Run Data Seeding ONLY for fresh database
        if [ -f "init-all-data.js" ]; then
            echo "Running initial data seeding..."
            node init-all-data.js || echo "Data seeding failed."
        fi
    elif [ "$DB_RECOVERED" -eq 0 ]; then
        # Fallback: use packaged database when prisma CLI is unavailable in runtime package.
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
            echo "❌ CRITICAL: Prisma CLI unavailable and no packaged database found."
            exit 1
        fi
    fi
fi

echo "================================================================"
echo "Database configuration complete."
echo "Starting Next.js Server..."
echo "================================================================"

# 4. Determine Start Command

# Find the standalone server file
SERVER_FILE=""
if [ -f "server.js" ]; then
    SERVER_FILE="server.js"
elif [ -f ".next/standalone/jarvis-web/server.js" ]; then
    SERVER_FILE=".next/standalone/jarvis-web/server.js"
elif [ -f ".next/standalone/server.js" ]; then
    SERVER_FILE=".next/standalone/server.js"
elif [ -f "standalone/jarvis-web/server.js" ]; then
    SERVER_FILE="standalone/jarvis-web/server.js"
elif [ -f "standalone/server.js" ]; then
    SERVER_FILE="standalone/server.js"
fi

PM2_CMD=""
if command -v pm2 >/dev/null 2>&1; then
    PM2_CMD="pm2"
elif [ -f "./node_modules/.bin/pm2" ]; then
    PM2_CMD="./node_modules/.bin/pm2"
fi

# 5. Prepare Standalone Environment (Fix for 404 on static assets)
echo "Preparing standalone environment..."
if [ ! -e ".next" ] && [ -d ".next_build" ]; then
    ln -s .next_build .next 2>/dev/null || true
fi
if [ ! -d ".next" ] && [ -d ".next_build" ]; then
    mkdir -p .next
    echo "Created .next directory as fallback."
fi
if [ -d ".next_build" ] && [ -d ".next" ]; then
    for mf in BUILD_ID routes-manifest.json prerender-manifest.json; do
        if [ -f ".next_build/$mf" ] && [ ! -f ".next/$mf" ]; then
            cp ".next_build/$mf" ".next/$mf"
        fi
    done
    if [ -d ".next_build/static" ] && [ ! -d ".next/static" ]; then
        mkdir -p ".next/static"
        cp -R ".next_build/static/"* ".next/static/" 2>/dev/null || true
    fi
fi
if [ -n "$SERVER_FILE" ]; then
    STANDALONE_DIR=$(dirname "$SERVER_FILE")
    
    # If running from standalone root (server.js is in current dir), skip copy if assets exist
    if [ "$STANDALONE_DIR" = "." ] && [ -d ".next/static" ] && [ -d "public" ]; then
        echo "Running in standalone root with assets present. Skipping copy."
    else
        DEST_STATIC="$STANDALONE_DIR/.next/static"
        DEST_PUBLIC="$STANDALONE_DIR/public"
        mkdir -p "$DEST_STATIC"
        mkdir -p "$DEST_PUBLIC"
        
        SRC_STATIC=""
        if [ -d ".next_build/static" ]; then
            SRC_STATIC=".next_build/static"
        elif [ -d ".next/static" ]; then
            SRC_STATIC=".next/static"
        elif [ -d "static" ]; then
            SRC_STATIC="static"
        fi
        
        if [ -n "$SRC_STATIC" ] && [ ! "$SRC_STATIC" -ef "$DEST_STATIC" ]; then
            if command -v rsync >/dev/null 2>&1; then
                rsync -a "$SRC_STATIC"/ "$DEST_STATIC"/
            else
                cp -R "$SRC_STATIC"/* "$DEST_STATIC"/ 2>/dev/null || true
            fi
        fi
        
        if [ -d "public" ] && [ ! "public" -ef "$DEST_PUBLIC" ]; then
            if command -v rsync >/dev/null 2>&1; then
                rsync -a public/ "$DEST_PUBLIC"/
            else
                cp -R public/* "$DEST_PUBLIC"/ 2>/dev/null || true
            fi
        fi
        
        # Copy Prisma directory and database
        if [ -d "prisma" ]; then
             mkdir -p "$STANDALONE_DIR/prisma"
             if command -v rsync >/dev/null 2>&1; then
                rsync -a prisma/ "$STANDALONE_DIR/prisma/"
            else
                cp -R prisma/* "$STANDALONE_DIR/prisma/" 2>/dev/null || true
            fi
            echo "Prisma files copied to $STANDALONE_DIR/prisma"
            
            # Keep runtime database inside prisma/ to avoid root-level clutter.
            if [ -f "jarvis.db" ]; then
                cp "jarvis.db" "$STANDALONE_DIR/prisma/jarvis.db"
                echo "Database copied to standalone prisma/ for runtime access."
            elif [ -f "prisma/jarvis.db" ]; then
                cp "prisma/jarvis.db" "$STANDALONE_DIR/prisma/jarvis.db"
                echo "Database copied from prisma/ to standalone prisma/ for runtime access."
            fi

            if [ -f "backup-service.js" ]; then
                cp "backup-service.js" "$STANDALONE_DIR/backup-service.js"
                echo "Backup service script copied to $STANDALONE_DIR"
            fi
        fi
        
        echo "Static assets and database prepared for standalone directory: $STANDALONE_DIR"
    fi
fi

# 6. Start Server with PM2
echo "Starting server with PM2..."

# 5.5 Validate required Next.js production manifests.
# Do not fabricate manifests/BUILD_ID from dev output; this can cause runtime crashes.
if [ -d ".next_build" ]; then
    for mf in BUILD_ID routes-manifest.json prerender-manifest.json; do
        if [ ! -f ".next_build/$mf" ] && [ -f ".next/$mf" ]; then
            cp ".next/$mf" ".next_build/$mf"
            echo "Recovered .next_build/$mf from .next/$mf"
        fi
    done
    MISSING_MANIFESTS=""
    for mf in BUILD_ID routes-manifest.json prerender-manifest.json; do
        if [ ! -f ".next_build/$mf" ]; then
            MISSING_MANIFESTS="$MISSING_MANIFESTS $mf"
        fi
    done
    if [ -n "$MISSING_MANIFESTS" ]; then
        echo "CRITICAL: Missing Next.js production manifests in .next_build:$MISSING_MANIFESTS"
        echo "Please deploy a complete build package (contains .next_build with BUILD_ID and manifest files)."
        exit 1
    fi
fi

SIMPLE_START_MODE="${SIMPLE_START_MODE:-1}"

if [ -n "$SERVER_FILE" ]; then
    echo "Using standalone build: $SERVER_FILE"
    STANDALONE_DIR=$(dirname "$SERVER_FILE")
    SERVER_SCRIPT=$(basename "$SERVER_FILE")
    
    echo "Starting from $STANDALONE_DIR with script $SERVER_SCRIPT"

    if [ "$SIMPLE_START_MODE" = "1" ]; then
        echo "Using simple direct-start mode."
        mkdir -p ./logs
        export NODE_ENV="${NODE_ENV:-production}"
        export HOSTNAME="${HOSTNAME:-0.0.0.0}"
        export PORT="${PORT:-3000}"
        export DATABASE_URL="${DATABASE_URL:-file:$(pwd)/prisma/jarvis.db}"

        if [ -L ".next" ] || [ -d ".next" ]; then
            rm -rf ".next"
        fi
        if [ -d ".next_build" ]; then
            ln -s ".next_build" ".next" 2>/dev/null || cp -R ".next_build" ".next"
        fi

        nohup env NODE_ENV="$NODE_ENV" HOSTNAME="$HOSTNAME" PORT="$PORT" DATABASE_URL="$DATABASE_URL" \
            node "$SERVER_SCRIPT" > ./logs/out.log 2> ./logs/err.log &
        echo $! > ./jarvis-web.pid
        sleep 3

        WEB_PID=$(cat ./jarvis-web.pid 2>/dev/null || true)
        if [ -z "$WEB_PID" ] || ! kill -0 "$WEB_PID" >/dev/null 2>&1; then
            echo "CRITICAL: Node process exited during simple direct-start."
            echo "Check logs at ./logs/out.log and ./logs/err.log"
            exit 1
        fi
        if ! check_port; then
            echo "CRITICAL: Port 3000 is still not listening after direct-start."
            echo "Check logs at ./logs/out.log and ./logs/err.log"
            exit 1
        fi

        echo ">>> Server started successfully in simple direct-start mode."
        echo ">>> Access logs with: tail -f ./logs/out.log"
        exit 0
    fi
    
    if [ -n "$PM2_CMD" ]; then
        $PM2_CMD start "$SERVER_SCRIPT" \
            --name jarvis-web \
            --cwd "$STANDALONE_DIR" \
            --output ./logs/out.log \
            --error ./logs/err.log \
            --merge-logs \
            --env PORT="${PORT:-3000}" \
            --env HOSTNAME="${HOSTNAME:-0.0.0.0}" \
            --env NODE_ENV=production \
            --env SMTP_HOST="${SMTP_HOST:-}" \
            --env SMTP_PORT="${SMTP_PORT:-}" \
            --env SMTP_SECURE="${SMTP_SECURE:-}" \
            --env SMTP_USER="${SMTP_USER:-}" \
            --env SMTP_PASS="${SMTP_PASS:-}" \
            --env SMTP_FROM="${SMTP_FROM:-}" \
            --env SMTP_FROM_NAME="${SMTP_FROM_NAME:-}" \
            --env MAIL_DEBUG="${MAIL_DEBUG:-0}"

        # Start Backup Service
        if [ -f "$STANDALONE_DIR/backup-service.js" ]; then
            $PM2_CMD delete jarvis-backup >/dev/null 2>&1 || true
            $PM2_CMD start backup-service.js \
                --name jarvis-backup \
                --cwd "$STANDALONE_DIR" \
                --output ./logs/backup-out.log \
                --error ./logs/backup-err.log
        fi

        $PM2_CMD save
        echo ">>> Server started successfully!"
        echo ">>> Access logs with: $PM2_CMD logs jarvis-web"
    else
        LOG_DIR="./logs"
        PID_DIR="."
        if [ "$STANDALONE_DIR" != "." ]; then
            LOG_DIR="../../logs"
            PID_DIR="../.."
        fi

        mkdir -p "$LOG_DIR"
        (cd "$STANDALONE_DIR" && nohup node "$SERVER_SCRIPT" > "$LOG_DIR/out.log" 2> "$LOG_DIR/err.log" & echo $! > "$PID_DIR/jarvis-web.pid")
        if [ ! -f "$PID_DIR/jarvis-web.pid" ]; then
            echo "CRITICAL: Failed to create jarvis-web.pid. Server did not start."
            exit 1
        fi
        WEB_PID=$(cat "$PID_DIR/jarvis-web.pid" 2>/dev/null || true)
        if [ -z "$WEB_PID" ] || ! kill -0 "$WEB_PID" >/dev/null 2>&1; then
            echo "CRITICAL: Node process is not running after startup attempt."
            echo "Check logs at $LOG_DIR/err.log"
            exit 1
        fi
        
        # Start Backup Service
        if [ -f "$STANDALONE_DIR/backup-service.js" ]; then
            (cd "$STANDALONE_DIR" && nohup node backup-service.js > "$LOG_DIR/backup-out.log" 2> "$LOG_DIR/backup-err.log" & echo $! > "$PID_DIR/jarvis-backup.pid")
            echo ">>> Backup service started."
        fi

        echo ">>> Server started successfully without PM2!"
        echo ">>> Access logs with: tail -f ./logs/out.log"
    fi
else
    echo "Standalone build not found."
    exit 1
fi
