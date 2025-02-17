This is a monolithic application codebase comprising:

* an [Express](https://expressjs.com/) web server
  * API routes used by the frontend are hosted here
* [Astro](https://astro.build/) is used as Express middleware
  * Astro takes care of the frontend pages
* [React](https://react.dev/) is used for some client-side interactivity

# The Astro Stuff

* The web app's pages are located under [/src/pages](/src/pages)
* [Here's the central composition root](/src/environment//getEnvironment.ts) where most of the server-side is plugged together
  * The database (pool)
  * Internationalization (I18N) support
  * Trnsactional services and repositories

# The Express Server

* [Here's the Express (app) server](/src/createApp.ts) where all the API routes are plugged together
  * It pulls services from [the composition root too](/src/environment//getEnvironment.ts)
* The Astro stuff [is bundled as middleware](/src/server/createServer.ts) inside the Express server

# Configuration

[Here's the configuration](/config) which also consumes
[environment variables](https://github.com/node-config/node-config/wiki/Environment-Variables#custom-environment-variables).

> The environment variables are almost certainly defined in a [`.env`](/.env)
> file at the root of the project. (It's not under version control.)
>
> If you're going to contribute (code to) the project then ask
> [someone on the team](https://github.com/BrookesUniversityLearningResources/vsat/graphs/contributors)
> for the values.

[The configuration is strongly-typed](/src/environment/config.ts) and will
fail-fast early at runtime if required configuration is missing or malformed.
