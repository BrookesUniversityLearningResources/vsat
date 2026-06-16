Create a file `.env` at the root of the project:

```shell
touch .env
```

> ⚠️ Do not add this file to Git because it contains values that should not be
> shared publicly.
>
> Note that this file is explicitly ignored by Git in
> [the `.gitignore` file](./gitignore).

Populate it with the following environment variables:
```
NODE_ENV=development
PORT=3000
DATABASE_URL=
CLOUDINARY_URL=
MAGIC_SECRET_KEY=
MAGIC_PUBLISHABLE_KEY=
NODE_V8_COVERAGE=./coverage
```

Optional (development only):

```
DEV_AUTH_BYPASS=1
DEV_AUTH_BYPASS_ALLOWED_HOSTS=vsat-dev-a59e8b7d8397.herokuapp.com
DEV_AUTH_BYPASS_EMAIL=dev@localhost
DEV_AUTH_BYPASS_NAME=Dev User
DEV_DISABLE_COEP=1
DEV_DISABLE_OVERLAY=1
DEV_API_PORT=3001
STEWARD_EMAILS=steward@example.com,second@example.com
DEV_STEWARD_TOGGLE=1
```

`DEV_AUTH_BYPASS` applies to local development hosts (`localhost`,
`127.0.0.1`, `::1`, or `*.localhost`) when `NODE_ENV=development`. It can also
be enabled for specific non-local hosts by setting the comma-separated
`DEV_AUTH_BYPASS_ALLOWED_HOSTS` list; use this only for temporary QA
environments.

> You'll need to ask
> [someone on the team](https://github.com/BrookesUniversityLearningResources/vsat/graphs/contributors)
> for the values.
