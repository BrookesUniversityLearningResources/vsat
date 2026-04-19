You can seed your (local) database with some stories by running this script:

```shell
npm run build && npm run db:seed:local
```

> This assumes the (local) database is up and running and
> [migrations](./migrations.md) have been applied.

For profile-aware local data, use the profile scripts instead:

```shell
npm run profile:seed:test -- --replace
npm run profile:ingest:live -- --replace
npm run profile:switch -- live
```

See [database profiles](./profiles.md) for details.
