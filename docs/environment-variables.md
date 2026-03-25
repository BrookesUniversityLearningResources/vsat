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
DEV_DISABLE_COEP=1
DEV_DISABLE_OVERLAY=1
DEV_API_PORT=3001
```

> You'll need to ask
> [someone on the team](https://github.com/BrookesUniversityLearningResources/vsat/graphs/contributors)
> for the values.
