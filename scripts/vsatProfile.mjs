import { spawnSync } from "node:child_process";
import {
  closeSync,
  existsSync,
  openSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const profilesPath = path.join(projectRoot, "data", "vsat-profiles.json");
const envPath = path.join(projectRoot, ".env");
const defaultDatabaseUrl = "postgres://postgres:postgres@localhost:5432/vsat";

const usage = `Usage:
  npm run profile:list
  npm run profile:switch -- <test|live|futon> [--no-migrate]
  npm run profile:seed:test -- [--replace]
  npm run profile:seed:futon -- [--replace]
  npm run profile:ingest:live -- [dump-path] [--replace]
  npm run profile -- counts [profile]
`;

function readProfiles() {
  return JSON.parse(readFileSync(profilesPath, "utf8")).profiles;
}

function expandHome(value) {
  if (!value) return value;
  if (value === "~") return os.homedir();
  if (value.startsWith("~/")) return path.join(os.homedir(), value.slice(2));
  return value;
}

function readDotEnv() {
  if (!existsSync(envPath)) return { lines: [], values: {} };

  const lines = readFileSync(envPath, "utf8").split(/\r?\n/);
  const values = {};

  for (const line of lines) {
    if (!line || line.trimStart().startsWith("#")) continue;
    const index = line.indexOf("=");
    if (index === -1) continue;
    values[line.slice(0, index).trim()] = line.slice(index + 1).trim();
  }

  return { lines, values };
}

function setDotEnvValue(key, value) {
  const { lines } = readDotEnv();
  let found = false;
  const nextLines = lines.map((line) => {
    if (line.startsWith(`${key}=`)) {
      found = true;
      return `${key}=${value}`;
    }
    return line;
  });

  if (!found) {
    if (nextLines.length > 0 && nextLines[nextLines.length - 1] !== "") {
      nextLines.push("");
    }
    nextLines.push(`${key}=${value}`);
  }

  while (nextLines.length > 1 && nextLines[nextLines.length - 1] === "") {
    nextLines.pop();
  }

  writeFileSync(envPath, `${nextLines.join("\n")}\n`);
}

function currentDatabaseUrl() {
  const { values } = readDotEnv();
  return process.env.DATABASE_URL ?? values.DATABASE_URL ?? defaultDatabaseUrl;
}

function databaseUrlFor(databaseName) {
  const url = new URL(currentDatabaseUrl());
  url.pathname = `/${databaseName}`;
  return url.toString();
}

function databaseNameFromUrl(databaseUrl) {
  return decodeURIComponent(new URL(databaseUrl).pathname.replace(/^\//, ""));
}

function maskedDatabaseUrl(databaseUrl) {
  const url = new URL(databaseUrl);
  const auth = url.username ? `${url.username}:***@` : "";
  return `${url.protocol}//${auth}${url.host}${url.pathname}`;
}

function requireDatabaseName(databaseName) {
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(databaseName)) {
    throw new Error(`Unsafe database name: ${databaseName}`);
  }
  return databaseName;
}

function sqlString(value) {
  return `'${value.replaceAll("'", "''")}'`;
}

function sqlIdentifier(value) {
  requireDatabaseName(value);
  return `"${value.replaceAll('"', '""')}"`;
}

function run(command, args, options = {}) {
  const {
    capture = false,
    env = {},
    inputFile = null,
    label = `${command} ${args.join(" ")}`,
  } = options;

  let fd;
  try {
    const spawnOptions = {
      cwd: projectRoot,
      env: { ...process.env, ...env },
      encoding: capture ? "utf8" : undefined,
      stdio: capture ? ["ignore", "pipe", "pipe"] : "inherit",
    };

    if (inputFile) {
      fd = openSync(inputFile, "r");
      spawnOptions.stdio = [fd, "inherit", "inherit"];
    }

    const result = spawnSync(command, args, spawnOptions);
    if (result.status !== 0) {
      if (capture && result.stderr) process.stderr.write(result.stderr);
      throw new Error(`${label} failed with exit code ${result.status ?? 1}`);
    }
    return capture ? result.stdout : "";
  } finally {
    if (fd !== undefined) closeSync(fd);
  }
}

function dockerCompose(args, options = {}) {
  return run("docker", ["compose", ...args], options);
}

function ensurePostgresContainer() {
  try {
    dockerCompose(["up", "-d", "db"], { label: "docker compose up -d db" });
  } catch (error) {
    throw new Error(
      `${error.message}. Start Docker Desktop so the local Postgres service is available.`,
    );
  }
}

function psql(args, options = {}) {
  return dockerCompose(
    ["exec", "-T", "db", "psql", "-U", "postgres", ...args],
    options,
  );
}

function pgRestore(databaseName, dumpPath) {
  dockerCompose(
    [
      "exec",
      "-T",
      "db",
      "pg_restore",
      "-U",
      "postgres",
      "--no-owner",
      "--no-acl",
      "-d",
      databaseName,
    ],
    {
      inputFile: dumpPath,
      label: `pg_restore ${path.basename(dumpPath)} into ${databaseName}`,
    },
  );
}

function databaseExists(databaseName) {
  requireDatabaseName(databaseName);
  const result = psql(
    [
      "-d",
      "postgres",
      "-tAc",
      `SELECT 1 FROM pg_database WHERE datname = ${sqlString(databaseName)}`,
    ],
    { capture: true, label: `checking database ${databaseName}` },
  );
  return result.trim() === "1";
}

function ensureDatabase(databaseName) {
  requireDatabaseName(databaseName);
  if (databaseExists(databaseName)) return;

  console.log(`[profile] Creating database ${databaseName}`);
  psql(
    ["-d", "postgres", "-c", `CREATE DATABASE ${sqlIdentifier(databaseName)}`],
    {
      label: `creating database ${databaseName}`,
    },
  );
}

function recreateDatabase(databaseName) {
  requireDatabaseName(databaseName);
  if (databaseExists(databaseName)) {
    console.log(`[profile] Dropping database ${databaseName}`);
    psql(
      [
        "-d",
        "postgres",
        "-v",
        "ON_ERROR_STOP=1",
        "-c",
        `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = ${sqlString(
          databaseName,
        )} AND pid <> pg_backend_pid()`,
      ],
      { label: `terminating connections to ${databaseName}` },
    );
    psql(
      ["-d", "postgres", "-c", `DROP DATABASE ${sqlIdentifier(databaseName)}`],
      { label: `dropping database ${databaseName}` },
    );
  }

  ensureDatabase(databaseName);
}

function runBuildServer() {
  console.log("[profile] Building server artifacts");
  run("npm", ["run", "build:server"], { label: "npm run build:server" });
}

function runMigrations(databaseUrl) {
  console.log(`[profile] Migrating ${databaseNameFromUrl(databaseUrl)}`);
  run("npm", ["run", "db:migrate:local"], {
    env: {
      DATABASE_URL: databaseUrl,
      NODE_ENV: "development",
    },
    label: `migrating ${databaseNameFromUrl(databaseUrl)}`,
  });
}

function runSeed(databaseUrl) {
  console.log(`[profile] Seeding ${databaseNameFromUrl(databaseUrl)}`);
  run("npm", ["run", "db:seed:local"], {
    env: {
      DATABASE_URL: databaseUrl,
      NODE_ENV: "development",
    },
    label: `seeding ${databaseNameFromUrl(databaseUrl)}`,
  });
}

function runGeneratedSeed(databaseUrl, sourcePath) {
  console.log(
    `[profile] Seeding ${databaseNameFromUrl(databaseUrl)} from ${sourcePath}`,
  );
  run("npm", ["run", "db:seed:profile"], {
    env: {
      DATABASE_URL: databaseUrl,
      NODE_ENV: "development",
      VSAT_PROFILE_SOURCE: sourcePath,
    },
    label: `seeding generated profile ${databaseNameFromUrl(databaseUrl)}`,
  });
}

function runImport(targetDatabaseUrl, sourceDatabaseUrl) {
  console.log(
    `[profile] Importing ${databaseNameFromUrl(
      sourceDatabaseUrl,
    )} into ${databaseNameFromUrl(targetDatabaseUrl)}`,
  );
  run("npm", ["run", "db:import"], {
    env: {
      DATABASE_URL: targetDatabaseUrl,
      DATABASE_IMPORT_URL: sourceDatabaseUrl,
      NODE_ENV: "development",
    },
    label: `importing ${databaseNameFromUrl(sourceDatabaseUrl)}`,
  });
}

function switchProfile(profileName, options = {}) {
  const profiles = readProfiles();
  const profile = profiles[profileName];
  if (!profile) throw new Error(`Unknown profile: ${profileName}`);

  const databaseUrl = databaseUrlFor(profile.database);

  ensurePostgresContainer();
  ensureDatabase(profile.database);
  if (!options.noMigrate) {
    runBuildServer();
    runMigrations(databaseUrl);
  }

  setDotEnvValue("DATABASE_URL", databaseUrl);
  console.log(
    `[profile] Active profile is now ${profileName} (${maskedDatabaseUrl(
      databaseUrl,
    )})`,
  );
  console.log("[profile] Restart any running VSAT dev process to use it.");
}

function seedProfile(profileName, options = {}) {
  const profiles = readProfiles();
  const profile = profiles[profileName];
  if (!profile) throw new Error(`Unknown profile: ${profileName}`);
  const sourceType = profile.source?.type;

  const databaseUrl = databaseUrlFor(profile.database);

  ensurePostgresContainer();
  if (options.replace) {
    recreateDatabase(profile.database);
  } else if (sourceType === "generated" && databaseExists(profile.database)) {
    throw new Error(
      `Refusing to reuse existing ${profile.database}; rerun with --replace`,
    );
  } else {
    ensureDatabase(profile.database);
  }

  runBuildServer();
  runMigrations(databaseUrl);
  if (sourceType === "development-seed") {
    runSeed(databaseUrl);
  } else if (sourceType === "generated") {
    if (!profile.source.path) {
      throw new Error(
        `${profileName} generated profile is missing source.path`,
      );
    }
    runGeneratedSeed(databaseUrl, profile.source.path);
  } else {
    throw new Error(
      `${profileName} cannot be seeded from source type ${sourceType}`,
    );
  }
  setDotEnvValue("DATABASE_URL", databaseUrl);
  console.log(`[profile] Seeded and switched to ${profileName}`);
}

function ingestProfile(profileName, dumpPath, options = {}) {
  const profiles = readProfiles();
  const profile = profiles[profileName];
  if (!profile) throw new Error(`Unknown profile: ${profileName}`);
  if (profile.source?.type !== "vsp-dump") {
    throw new Error(`${profileName} is not a VSP dump profile`);
  }

  const resolvedDumpPath = path.resolve(
    projectRoot,
    expandHome(dumpPath ?? profile.source.dumpPath),
  );
  if (!existsSync(resolvedDumpPath)) {
    throw new Error(`Dump file does not exist: ${resolvedDumpPath}`);
  }

  const sourceDatabaseName = requireDatabaseName(profile.source.database);
  const targetDatabaseUrl = databaseUrlFor(profile.database);
  const sourceDatabaseUrl = databaseUrlFor(sourceDatabaseName);

  ensurePostgresContainer();

  if (options.replace) {
    recreateDatabase(sourceDatabaseName);
    recreateDatabase(profile.database);
  } else {
    if (
      databaseExists(sourceDatabaseName) ||
      databaseExists(profile.database)
    ) {
      throw new Error(
        `Refusing to reuse existing ${sourceDatabaseName}/${profile.database}; rerun with --replace`,
      );
    }
    ensureDatabase(sourceDatabaseName);
    ensureDatabase(profile.database);
  }

  console.log(
    `[profile] Restoring ${resolvedDumpPath} into ${sourceDatabaseName}`,
  );
  pgRestore(sourceDatabaseName, resolvedDumpPath);

  runBuildServer();
  runMigrations(targetDatabaseUrl);
  runImport(targetDatabaseUrl, sourceDatabaseUrl);

  setDotEnvValue("DATABASE_URL", targetDatabaseUrl);
  console.log(`[profile] Ingested and switched to ${profileName}`);
}

function countProfile(profileName) {
  const profiles = readProfiles();
  const profile = profiles[profileName];
  if (!profile) throw new Error(`Unknown profile: ${profileName}`);

  ensurePostgresContainer();
  const databaseName = profile.database;
  if (!databaseExists(databaseName)) {
    console.log(
      `[profile] ${profileName}: database ${databaseName} is missing`,
    );
    return;
  }

  const sql = `
    SELECT 'authors' AS table_name, count(*) FROM author
    UNION ALL SELECT 'stories', count(*) FROM story
    UNION ALL SELECT 'scenes', count(*) FROM scene
    UNION ALL SELECT 'published_stories', count(*) FROM story_published
    ORDER BY table_name
  `;
  const output = psql(["-d", databaseName, "-P", "pager=off", "-c", sql], {
    capture: true,
    label: `counting ${databaseName}`,
  });
  console.log(output.trim());
}

function listProfiles() {
  const profiles = readProfiles();
  const activeDatabase = databaseNameFromUrl(currentDatabaseUrl());

  for (const [name, profile] of Object.entries(profiles)) {
    const marker = profile.database === activeDatabase ? "*" : " ";
    const source = profile.source?.type ?? "unknown";
    console.log(
      `${marker} ${name.padEnd(8)} db=${profile.database.padEnd(
        12,
      )} source=${source} - ${profile.description}`,
    );
  }
}

function hasFlag(args, flag) {
  return args.includes(flag);
}

function withoutFlags(args) {
  return args.filter((arg) => !arg.startsWith("--"));
}

async function main() {
  const [command = "list", profileName, ...rest] = process.argv.slice(2);
  const positional = withoutFlags(rest);

  if (command === "list") {
    listProfiles();
    return;
  }

  if (command === "switch") {
    if (!profileName) throw new Error(usage);
    switchProfile(profileName, { noMigrate: hasFlag(rest, "--no-migrate") });
    return;
  }

  if (command === "seed") {
    if (!profileName) throw new Error(usage);
    seedProfile(profileName, { replace: hasFlag(rest, "--replace") });
    return;
  }

  if (command === "ingest") {
    if (!profileName) throw new Error(usage);
    ingestProfile(profileName, positional[0], {
      replace: hasFlag(rest, "--replace"),
    });
    return;
  }

  if (command === "counts") {
    countProfile(profileName ?? "test");
    return;
  }

  throw new Error(usage);
}

main().catch((error) => {
  console.error(`[profile] ${error.message}`);
  process.exit(1);
});
