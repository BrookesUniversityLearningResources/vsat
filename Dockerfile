FROM node:22-slim AS build

WORKDIR /app

COPY [\
  ".env",\
  "package.json",\
  "package-lock.json",\
  "tsconfig.json",\
  "tsconfig.server.json",\
  "astro.config.mjs",\
  "start-app.sh",\
  "./"\
]

COPY ./config ./config
COPY ./public ./public
COPY ./src ./src

RUN npm ci
RUN npm run build

FROM node:22-slim AS release

WORKDIR /app

COPY --from=build app/package.json .
COPY --from=build app/start-app.sh .
COPY --from=build app/config ./config
COPY --from=build app/public ./public
COPY --from=build app/dist ./dist
COPY --from=build app/node_modules ./node_modules
COPY --from=build app/src/i18n ./src/i18n

ENV APP_NAME="@vsat/web"

EXPOSE 3000

ENTRYPOINT ["./start-app.sh"]
