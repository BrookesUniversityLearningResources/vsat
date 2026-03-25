#!/usr/bin/env bash

set -e

node ./dist/build/database/migrate/migrate.js
node ./dist/build/main.js
