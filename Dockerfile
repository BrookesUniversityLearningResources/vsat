FROM node:22-slim as build

WORKDIR /app

COPY [\
  ".env",\
  "package.json",\
  "package-lock.json",\
  "tsconfig.json",\
  "tsconfig.server.json",\
  "astro.config.mjs",\
  "./"\
]

COPY ./config ./config
COPY ./public ./public
COPY ./src ./src

RUN npm ci
RUN npm run build

FROM node:22-slim as release

WORKDIR /app

RUN yarn set version stable

COPY [\
  ".env",\
  "package.json",\
  "package-lock.json",\
  "tsconfig.json",\
  "tsconfig.server.json",\
  "astro.config.mjs",\
  "./"\
]

COPY ./config ./config
COPY ./public ./public
COPY ./dist ./dist
COPY ./node_modules ./node_modules
COPY ./src/i18n ./src/i18n

ENV APP_NAME="@vsat/web"

EXPOSE 3000

ENTRYPOINT ["npm", "start"]
