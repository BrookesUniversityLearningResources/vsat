#!/usr/bin/env bash
# seed-live-demo.sh
#
# Mass-publish stories that were published in the VSP source dump,
# then seed the demo anthologies (pilots + interpretive links).
#
# Prerequisite: `npm run profile:ingest:live -- --replace` has been
# run, so vsp_live and vsat_live both exist with the dump's content.
#
# Set DB_CONTAINER if your Postgres container is not named "DB".

set -euo pipefail

DB_CONTAINER="${DB_CONTAINER:-DB}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if ! docker ps --format '{{.Names}}' | grep -qx "$DB_CONTAINER"; then
  echo "Postgres container '$DB_CONTAINER' is not running. Set DB_CONTAINER=<name> if it has a different name." >&2
  exit 1
fi

echo "[seed-live-demo] Mass-publishing from vsp_live → vsat_live"
docker exec "$DB_CONTAINER" bash -c "
  pg_dump -U postgres -d vsp_live -t story_published --data-only --column-inserts \
  | psql -U postgres -d vsat_live -v ON_ERROR_STOP=1
"

echo "[seed-live-demo] Applying $SCRIPT_DIR/live-demo-anthologies.sql to vsat_live"
docker exec -i "$DB_CONTAINER" psql -U postgres -d vsat_live -v ON_ERROR_STOP=1 \
  < "$SCRIPT_DIR/live-demo-anthologies.sql"

echo "[seed-live-demo] Done."
