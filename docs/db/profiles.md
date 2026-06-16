# Database Profiles

Local VSAT profiles are separate Postgres databases in the same Docker Postgres
service. Switching profiles updates `DATABASE_URL` in `.env`; restart any
running VSAT dev process after switching.

The profile tool expects Docker Desktop to be running. It uses the Postgres
container for `psql` and `pg_restore`, so those tools do not need to be installed
on the host.

Profiles are defined in [`data/vsat-profiles.json`](/data/vsat-profiles.json):

* `test` uses the existing `vsat` database and the development seed script.
* `live` uses `vsat_live`, imported from a restored VSP dump.
* `futon` uses `vsat_futon`, generated from `data/futon-profile.json`.

List profiles:

```shell
npm run profile:list
```

Switch the active profile:

```shell
npm run profile:switch -- test
npm run profile:switch -- live
npm run profile:switch -- futon
```

Rebuild the test profile from the development seed:

```shell
npm run profile:seed:test -- --replace
```

Build the FUTON profile from generated profile JSON:

```shell
npm run profile:seed:futon -- --replace
```

Ingest the live profile from the configured dump path:

```shell
npm run profile:ingest:live -- --replace
```

Pass a different dump path when needed:

```shell
npm run profile:ingest:live -- ~/Downloads/another.dump --replace
```

Check profile row counts:

```shell
npm run profile -- counts live
```

The live ingest restores the VSP dump into a source database (`vsp_live`), runs
VSAT migrations against the target database (`vsat_live`), then runs the existing
VSP-to-VSAT importer.

The FUTON seed reads `data/futon-profile.json`, maps its stable refs to database
IDs, saves draft stories/scenes, creates VSATLATARIUM links, applies generated
votes, and switches `DATABASE_URL` to `vsat_futon`.
