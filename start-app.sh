#!/usr/bin/env bash

set -e

node ./dist/build/src/database/migrate/migrate.js
node .
