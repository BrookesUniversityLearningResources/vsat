# Importing The VSP Stories Into VSAT

> These docs are only relevant while VSP is live and VSAT isn't. Once VSAT is
> live and the data have been imported then this document becomes irrelevant.

Backup the existing VSP database on Heroku:

```shell
$ heroku login
$ heroku pg:backups:capture --app ancient-sierra-54813

Backing up DATABASE to b32... done
```

> `ancient-sierra-54813` is the name of [the VSP app on Heroku](https://dashboard.heroku.com/apps/ancient-sierra-54813/).

Take the backup ID—in this example `b32`—and generate a download URL:

```shell
$ heroku pg:backups:url b32 --app ancient-sierra-54813

https://jqtsj.s3.amazonaws.com/d865195...
```

Open that URL in your browser and save the DB backup to somewhere meaningful on
your local filesystem:

```shell
$ curl https://jqtsj.s3.amazonaws.com/d865195... > ./vsp.backup
```

[Restore the backup](https://www.postgresql.org/docs/current/app-pgrestore.html)
into a locally running instance of Postgres.

At this point you should have two databases:

* an _empty_ instance of the `vsat` DB running locally
* the populated-from-backup instance of the `vsp` DB running locally

Run the `db:import` script to import the data from `vsp` to `vsat`.

```shell
$ npm run db:import
```
