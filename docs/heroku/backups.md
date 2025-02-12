* [Official docs](https://devcenter.heroku.com/articles/heroku-postgres-backups)

## Process

### Export

```shell
heroku pg:backups:capture --app vsat

# this'll output a BACKUP_ID like b315

heroku pg:backups:url BACKUP_ID --app vsat

heroku pg:backups:download --app vsat
```

### Import

...
