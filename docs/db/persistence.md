Here's our persistence stack:

* the [PostgreSQL](https://www.postgresql.org/) RDBMS
* the [Kysely](https://kysely.dev/) query builder in our TypeScript code
* we're also using Kysely for [migrations](./migrations.md)

## Running Locally

When running the stack locally you'll (probably) run a local instance of
PostgreSQL via Docker:

```shell
docker compose up --detach
```

You'll need to run [the migrations](./migrations.md) yourself.

## Transactions

We've got a transactional combinator that allows us to compose data-access
functions such that they'll participate in existing transactions:

* [withTransaction](/src/database/transaction/withTransaction.ts)

> Note that this function is deliberately unsophisticated: it suits what we need
> and we don't need support for functionality such as differing isolation levels
> _at the time of writing_.

See [the composition root](/src/environment/getEnvironment.ts) for examples of
composing transactional services.
