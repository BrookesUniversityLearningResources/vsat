We're using [Kysely](https://kysely.dev/docs/migrations) for our migrations.

The migrations are found in this folder:

* [src/database/migrate/migrations/](./src/database/migrate/migrations/)

## Running Migrations

```shell
npm run build && npm run db:migrate:local
```

## Creating A New Migration

Create a new file in the `src/database/migrate/migrations/` folder.

This file must adhere to the following naming convention:

```
YYYYMMDDHHMM-someDescriptiveName.ts
```

```shell
touch ./src/database/migrate/migrations/$(date +%F%H-%M | tr -d '-' | tr -d ':')-RENAME.ts
```

See [the docs](https://kysely.dev/docs/migrations#migration-files) and the
existing migrations for examples of what to write.
