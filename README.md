# Virtual Storytelling Application Toolkit • VSAT

Note that you'll need some:

* [software](./docs/software.md)
* [environment variables](./docs/environment-variables.md)

```shell
$ git clone https://github.com/BrookesUniversityLearningResources/vsat.git
$ cd vsat
$ nvm use 24
$ npm install
$ docker compose up --detach db
$ npm run dev
```

[Open the home page.](http://localhost:3000/)

Local data profiles are available for seeded test data, imported live data, and
future generated datasets:

```shell
$ npm run profile:list
$ npm run profile:switch -- test
$ npm run profile:ingest:live -- --replace
$ npm run profile:seed:futon -- --replace
```

See [database profiles](./docs/db/profiles.md).
