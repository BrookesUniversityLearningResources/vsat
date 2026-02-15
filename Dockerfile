FROM node:24-alpine AS build

WORKDIR /app

COPY [\
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

RUN npm ci --ignore-scripts && \
    npm cache clean --force && \
    npm run build && \
    npm prune --production

FROM node:24-alpine AS release

WORKDIR /app

COPY --from=build app/start-app.sh .
COPY --from=build app/config ./config
COPY --from=build app/public ./public
COPY --from=build app/dist ./dist
COPY --from=build app/node_modules ./node_modules
COPY --from=build app/src/i18n ./src/i18n

RUN addgroup -g 10001 -S vsat && \
    adduser -S vsat -u 10001 && \
    chown -R vsat:vsat /app
USER vsat

ENV APP_NAME="@vsat/web"

EXPOSE 3000

ENTRYPOINT ["./start-app.sh"]
