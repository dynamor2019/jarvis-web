#!/bin/bash

# [CodeGuard Feature Index]
# - set -e -> line 12
# - else -> line 30
# - return 1 -> line 31
# - return 0 -> line 148
# - sleep 2 -> line 192
# - exit 1 -> line 300
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

extract_host_from_url() {
    local input_url="$1"
    input_url="${input_url#http://}"
    input_url="${input_url#https://}"
    input_url="${input_url%%/*}"
    input_url="${input_url%%:*}"
    printf '%s\n' "$input_url"
}

configure_nginx_proxy() {
    local nginx_conf_path="${NGINX_CONFIG_PATH:-/etc/nginx/nginx.conf}"
    local nginx_cert_dir="${NGINX_CERT_DIR:-/etc/letsencrypt/live}"
    local default_host=""
    local primary_domain=""
    local secondary_domain=""
    local cert_file=""
    local key_file=""
    local generated_conf=""

    if [ -n "${NEXT_PUBLIC_BASE_URL:-}" ]; then
        default_host="$(extract_host_from_url "$NEXT_PUBLIC_BASE_URL")"
    fi
    primary_domain="${NGINX_PRIMARY_DOMAIN:-${default_host:-www.jarvisai.com.cn}}"
    secondary_domain="${NGINX_SECONDARY_DOMAIN:-}"
    if [ -z "$secondary_domain" ] && [ "$primary_domain" = "www.jarvisai.com.cn" ]; then
        secondary_domain="jarvisai.com.cn"
    fi

    cert_file="$nginx_cert_dir/$primary_domain/fullchain.pem"
    key_file="$nginx_cert_dir/$primary_domain/privkey.pem"

    generated_conf=$(cat <<EOF
user  www www;
worker_processes auto;
error_log  /www/server/nginx/logs/error.log;
pid        /www/server/nginx/logs/nginx.pid;

events {
    worker_connections 10240;
}

http {
    include       mime.types;
    default_type  application/octet-stream;
    sendfile      on;
    keepalive_timeout 65;

    server {
        listen 80;
        server_name $primary_domain${secondary_domain:+ $secondary_domain};

        location / {
            proxy_pass http://127.0.0.1:${PORT:-3000};
            proxy_http_version 1.1;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
            proxy_set_header Upgrade \$http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_cache_bypass \$http_upgrade;
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }
    }
EOF
)

    if [ -f "$cert_file" ] && [ -f "$key_file" ]; then
        generated_conf=$(cat <<EOF
$generated_conf

    server {
        listen 443 ssl http2;
        server_name $primary_domain${secondary_domain:+ $secondary_domain};

        ssl_certificate $cert_file;
        ssl_certificate_key $key_file;
        ssl_session_timeout 1d;
        ssl_session_cache shared:SSL:10m;
        ssl_protocols TLSv1.2 TLSv1.3;

        location / {
            proxy_pass http://127.0.0.1:${PORT:-3000};
            proxy_http_version 1.1;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
            proxy_set_header Upgrade \$http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_cache_bypass \$http_upgrade;
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }
    }
}
EOF
)
        echo "Detected SSL certificates for $primary_domain. Nginx config will include HTTPS."
    else
        generated_conf=$(cat <<EOF
$generated_conf
}
EOF
)
        echo "SSL certificates not found for $primary_domain. Nginx config will use HTTP only."
    fi

    if [ ! -d "$(dirname "$nginx_conf_path")" ]; then
        echo "Skipping Nginx config write: parent directory missing for $nginx_conf_path"
        return 0
    fi

    printf '%s\n' "$generated_conf" > "$nginx_conf_path"
    echo "Nginx config written to $nginx_conf_path"

    if ! command -v nginx >/dev/null 2>&1; then
        echo "Skipping Nginx reload: nginx command not found."
        return 0
    fi

    if ! nginx -t; then
        echo "Warning: nginx -t failed after writing $nginx_conf_path"
        return 1
    fi

    if command -v systemctl >/dev/null 2>&1; then
        systemctl restart nginx >/dev/null 2>&1 || systemctl start nginx >/dev/null 2>&1 || true
    else
        nginx -s reload >/dev/null 2>&1 || true
    fi
    echo "Nginx validation passed."
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
    TMP_ENV_FILE=""
    # Handle Windows-generated env files: UTF-16 and/or CRLF can break parsing.
    if command -v file >/dev/null 2>&1 && file -bi "$ENV_FILE" 2>/dev/null | grep -qi "charset=utf-16"; then
        if command -v iconv >/dev/null 2>&1; then
            TMP_ENV_FILE="$(mktemp)"
            if iconv -f UTF-16 -t UTF-8 "$ENV_FILE" > "$TMP_ENV_FILE" 2>/dev/null; then
                ENV_FILE="$TMP_ENV_FILE"
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
    TMP_ENV_CRLF="$(mktemp)"
    tr -d '\r' < "$ENV_FILE" > "$TMP_ENV_CRLF" 2>/dev/null || cp "$ENV_FILE" "$TMP_ENV_CRLF"
    ENV_FILE="$TMP_ENV_CRLF"
    # Parse and export environment variables
    while IFS='=' read -r key val; do
        # Skip comments and invalid keys
        [[ $key =~ ^# ]] && continue
        [[ $key =~ ^[A-Z_][A-Z0-9_]*$ ]] || continue
        export "$key=$val"
    done < "$ENV_FILE"
    [ -n "$TMP_ENV_FILE" ] && rm -f "$TMP_ENV_FILE"
    rm -f "$TMP_ENV_CRLF"
    echo "Environment variables loaded."
else
    echo "No .env file found. Proceeding with current environment."
fi

# 3. Database Initialization
# Explicitly use the user-provided absolute path for the existing database
DB_PATH="/www/wwwroot/jarvis-web/prisma/jarvis.db"

echo "================================================================"
echo "Jarvis Web Startup Script"
echo "Target Database: $DB_PATH"
echo "================================================================"

# Keep Prisma datasource stable regardless of runtime cwd.
export DATABASE_URL="file:$DB_PATH"

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

# 1. Always generate Prisma Client (safe, needed for code to run)
if [ -n "$PRISMA_CMD" ]; then
    echo "Generating Prisma Client..."
    $PRISMA_CMD generate || echo "Prisma generate warning."
fi

# 2. Check Database Existence
if [ -f "$DB_PATH" ]; then
    echo "✅ Success: Found existing database at $DB_PATH"
    echo "Database Size: $(du -h "$DB_PATH" | cut -f1)"
    
    # Sync Schema Only (Safe update)
    if [ -n "$PRISMA_CMD" ]; then
        echo "Syncing database schema (prisma db push)..."
        $PRISMA_CMD db push --accept-data-loss || echo "Schema sync warning: Check logs if app fails."
    fi
else
    echo "⚠️  WARNING: Database file NOT found at $DB_PATH"
    echo "Attempting to create a new database at this location..."
    
    # Check if directory exists
    DB_DIR=$(dirname "$DB_PATH")
    if [ ! -d "$DB_DIR" ]; then
        echo "Creating directory: $DB_DIR"
        mkdir -p "$DB_DIR" || echo "Failed to create directory. Check permissions."
    fi

    if [ -n "$PRISMA_CMD" ]; then
        echo "Pushing schema to create new DB..."
        $PRISMA_CMD db push --accept-data-loss || {
            echo "❌ CRITICAL: Failed to initialize database."
            exit 1
        }
        
        # Run Data Seeding ONLY for fresh database
        if [ -f "init-all-data.js" ]; then
            echo "Running initial data seeding..."
            node init-all-data.js || echo "Data seeding failed."
        fi
    else
        echo "❌ CRITICAL: Prisma CLI not found and DB missing. Cannot start."
        exit 1
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
            
            # Ensure database is accessible at standalone root if configured that way
            if [ -f "prisma/jarvis.db" ]; then
                cp "prisma/jarvis.db" "$STANDALONE_DIR/jarvis.db"
                echo "Database copied to standalone root for runtime access."
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

if [ -n "$SERVER_FILE" ]; then
    echo "Using standalone build: $SERVER_FILE"
    STANDALONE_DIR=$(dirname "$SERVER_FILE")
    SERVER_SCRIPT=$(basename "$SERVER_FILE")
    
    echo "Starting from $STANDALONE_DIR with script $SERVER_SCRIPT"
    
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
        mkdir -p ./logs
        (cd "$STANDALONE_DIR" && nohup node "$SERVER_SCRIPT" > ../../logs/out.log 2> ../../logs/err.log & echo $! > ../../jarvis-web.pid)
        
        # Start Backup Service
        if [ -f "$STANDALONE_DIR/backup-service.js" ]; then
            (cd "$STANDALONE_DIR" && nohup node backup-service.js > ../../logs/backup-out.log 2> ../../logs/backup-err.log & echo $! > ../../jarvis-backup.pid)
            echo ">>> Backup service started."
        fi

        echo ">>> Server started successfully without PM2!"
        echo ">>> Access logs with: tail -f ./logs/out.log"
    fi

    if [ "${SETUP_NGINX_PROXY:-1}" = "1" ]; then
        echo "Configuring Nginx reverse proxy..."
        configure_nginx_proxy || echo "Warning: Nginx proxy configuration failed."
    else
        echo "Skipping Nginx proxy configuration because SETUP_NGINX_PROXY=${SETUP_NGINX_PROXY:-0}."
    fi
else
    echo "Standalone build not found."
    exit 1
fi
