#!/usr/bin/env bash
# Diva — PostgreSQL backup.
# Dumps the running `postgres` container to ./backups/diva-YYYY-MM-DD-HH-MM.sql.gz
# and prunes everything older than the most recent 14 dumps.
# Intended to be invoked from the ops/ directory (e.g. via `make backup` or cron).

set -euo pipefail

# Resolve script dir, then move one level up (ops/) so paths are stable
# regardless of where the script is invoked from.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OPS_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${OPS_DIR}"

# Load env (POSTGRES_USER / POSTGRES_DB / container name overrides).
if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

: "${POSTGRES_USER:?POSTGRES_USER not set (check ops/.env)}"
: "${POSTGRES_DB:?POSTGRES_DB not set (check ops/.env)}"

# Container name — defaults to the prod container, override via env if needed.
CONTAINER="${PG_CONTAINER:-diva-pg}"
BACKUP_DIR="${OPS_DIR}/backups"
RETENTION="${BACKUP_RETENTION:-14}"

mkdir -p "${BACKUP_DIR}"

TIMESTAMP="$(date +%Y-%m-%d-%H-%M)"
OUTFILE="${BACKUP_DIR}/diva-${TIMESTAMP}.sql.gz"

echo "[backup] dumping ${CONTAINER} (${POSTGRES_DB}) -> ${OUTFILE}"
docker exec -i "${CONTAINER}" pg_dump -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" \
  | gzip -9 > "${OUTFILE}"

echo "[backup] pruning, keeping last ${RETENTION}"
# List newest first, skip the first ${RETENTION}, delete the rest.
ls -1t "${BACKUP_DIR}"/diva-*.sql.gz 2>/dev/null \
  | tail -n +"$((RETENTION + 1))" \
  | xargs -r rm -f --

echo "[backup] done"
