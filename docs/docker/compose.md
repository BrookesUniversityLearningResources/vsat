You can stand up the entire stack for VSAT like so:

```shell
docker compose -f docker-compose.vsat.yml up
```

This'll stand up:

* Postgres
* [Dozzle](https://dozzle.dev/) for logging: [UI](http://localhost:8080)
* VSAT: [UI](http://localhost:3000)
