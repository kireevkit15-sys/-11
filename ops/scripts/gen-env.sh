#!/bin/sh
# Generate ops/.env on the production server without embedding secrets in git.
# Usage:
#   POSTGRES_PASSWORD='...' BOT_TOKEN='...' ROP_CHAT_ID='...' sh ops/scripts/gen-env.sh

set -eu

: "${POSTGRES_PASSWORD:?POSTGRES_PASSWORD is required}"
: "${BOT_TOKEN:?BOT_TOKEN is required}"
: "${ROP_CHAT_ID:?ROP_CHAT_ID is required}"

ENV_PATH="${ENV_PATH:-/opt/diva/ops/.env}"
POSTGRES_USER="${POSTGRES_USER:-diva}"
POSTGRES_DB="${POSTGRES_DB:-diva}"
DOMAIN="${DOMAIN:-diva-start-up.ru}"
ADMIN_DOMAIN="${ADMIN_DOMAIN:-admin.diva-start-up.ru}"
ACME_EMAIL="${ACME_EMAIL:-diva.consulting.b@gmail.com}"
SITE_URL="${NEXT_PUBLIC_SITE_URL:-https://${DOMAIN}}"
WEB_BASE_URL="${WEB_BASE_URL:-https://${DOMAIN}}"
REVALIDATE_SECRET="${REVALIDATE_SECRET:-$(openssl rand -hex 32)}"

umask 077
cat > "$ENV_PATH" << EOF
POSTGRES_USER=${POSTGRES_USER}
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
POSTGRES_DB=${POSTGRES_DB}
DATABASE_URL=postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
NEXT_PUBLIC_SITE_URL=${SITE_URL}
ADMIN_SESSION_SECRET=$(openssl rand -hex 32)
BOT_TOKEN=${BOT_TOKEN}
ROP_CHAT_ID=${ROP_CHAT_ID}
WEB_BASE_URL=${WEB_BASE_URL}
REVALIDATE_SECRET=${REVALIDATE_SECRET}
DOMAIN=${DOMAIN}
ADMIN_DOMAIN=${ADMIN_DOMAIN}
ACME_EMAIL=${ACME_EMAIL}
EOF

echo "Created $ENV_PATH"
