# contrib/

Supplementary scripts and SQL snippets that are not part of the core
VSAT runtime. Currently here:

- `seed-live-demo.sh` — orchestrator that runs the mass-publish step
  (copy `story_published` from `vsp_live` to `vsat_live`) and then
  applies `live-demo-anthologies.sql` to seed the two demo pilots
  ("Cities & Public Space", "Lived Experience") and their interpretive
  links.
- `live-demo-anthologies.sql` — pilot rows, pilot_story memberships,
  story_link rows, and link_vote rows for the demo. Designed to be
  rerun after `TRUNCATE`-ing the four affected tables.

These exist because the legacy VSP dump format predates VSAT's
`story.published` boolean. The VSP-to-VSAT importer therefore can't
infer which stories were published, so we mass-publish from
`vsp_live.story_published` after `profile:ingest:live` has run.

## Usage on a fresh deployment

```bash
# 1. Ingest the dump (creates vsp_live and vsat_live, runs migrations
#    and the VSP→VSAT importer).
npm run profile:ingest:live -- --replace

# 2. Mass-publish from vsp_live and seed the demo anthologies.
./contrib/seed-live-demo.sh

# 3. Switch the active profile and serve.
npm run profile:switch -- live
npm run run:vsat
```

The script assumes the Postgres container is named `DB`. If yours is
different (e.g. `vsat-db-1`), set `DB_CONTAINER` in the environment:

```bash
DB_CONTAINER=vsat-db-1 ./contrib/seed-live-demo.sh
```
