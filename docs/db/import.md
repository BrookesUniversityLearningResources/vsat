# Importing The VSP Stories Into VSAT

## Backup

Backup the existing VSP database on Heroku:

```shell
$ heroku login
$ heroku pg:backups:capture --app ancient-sierra-54813

Backing up DATABASE to b32... done
```

> `ancient-sierra-54813` is the name of [the VSP app on Heroku](https://dashboard.heroku.com/apps/ancient-sierra-54813/).

Take the backup ID—in this example it's `b32`—and generate a download URL:

```shell
$ heroku pg:backups:url b32 --app ancient-sierra-54813

https://jqtsj.s3.amazonaws.com/d865195...
```

Open that URL in your browser—or `curl` it—and save the DB backup to your local
filesystem:

```shell
$ curl https://jqtsj.s3.amazonaws.com/d865195... > ./vsp.backup
```

## Importing to a local DB

[Restore the backup](https://www.postgresql.org/docs/current/app-pgrestore.html)
into a locally running instance of Postgres.

At this point you should have two databases locally:

* an _empty_ instance of the `vsat` DB running locally
* the populated-from-backup instance of the `vsp` DB running locally

Run the `db:import` script to import the data from `vsp` to `vsat`.

```shell
$ npm run db:import
```

## Importing to another Heroku DB

Ensure that your `NODE_ENV` environment variable is set to `development`:

```shell
$ export NODE_ENV=development
```

Edit the existing [development configuration](/config/development.json) and set
the `database.import.connectionString` field to the URL of the Postgres instance
you want to import _from_.

This URL can be either a locally-running instance of a restored-from-backup VSP
DB—[see above](#importing-to-a-local-db)—or you can use the URL of the
Heroku-based VSP DB running: you can source the necessary values from the
[Config Vars](https://dashboard.heroku.com/apps/ancient-sierra-54813/settings)
of the `ancient-sierra-54813` app on Heroku.

In either case it'll look something like this:

```json
{
  "database": {
    "import": {
      "connectionString": "postgres://postgres:postgres@localhost:5432/tonk"
    }
  }
}
```

The DB that you want to import _into_ will be the usual DB: it's URL is derived
from the `DATABASE_URL` environment variable: it's probably set in your `.env`
file. You'll want to source the necessary values from the
[Config Vars](https://dashboard.heroku.com/apps/vsat/settings) of the `vsat` app
on Heroku.

Run the following to import the data from one DB to the other:

```shell
$ npm run build:server && npm run db:migrate:local && npm run db:import
```
