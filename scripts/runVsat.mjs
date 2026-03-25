import { existsSync, readFileSync } from "node:fs";
import net from "node:net";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";

const loadEnvFile = () => {
  const envPath = path.resolve(process.cwd(), ".env");
  if (!existsSync(envPath)) return {};

  const lines = readFileSync(envPath, "utf8").split(/\r?\n/);
  const env = {};

  for (const line of lines) {
    if (!line || line.trim().startsWith("#")) continue;
    const idx = line.indexOf("=");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    if (key) env[key] = value;
  }

  return env;
};

const envFromFile = loadEnvFile();
const env = {
  ...process.env,
  ...envFromFile,
};

const DATABASE_URL =
  env.DATABASE_URL ?? "postgres://postgres:postgres@localhost:5432/vsat";
const dbUrl = new URL(DATABASE_URL);
const dbHost = dbUrl.hostname;
const dbPort = Number(dbUrl.port || "5432");
const astroPort = 4321;
const apiPort = Number(env.DEV_API_PORT ?? "3001");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isPortOpen = (host, port, timeoutMs = 1000) =>
  new Promise((resolve) => {
    const socket = net.createConnection({ host, port });

    const finish = (result) => {
      socket.removeAllListeners();
      socket.destroy();
      resolve(result);
    };

    socket.setTimeout(timeoutMs);
    socket.once("connect", () => finish(true));
    socket.once("timeout", () => finish(false));
    socket.once("error", () => finish(false));
  });

const waitForPort = async (host, port, timeoutMs) => {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (await isPortOpen(host, port, 1000)) {
      return true;
    }
    await sleep(1000);
  }

  return false;
};

const isLocalPortOpen = async (port) =>
  (await isPortOpen("127.0.0.1", port)) || (await isPortOpen("localhost", port));

const runCommand = (command, args, name) => {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    env,
  });

  if (result.status !== 0) {
    console.error(`[run-vsat] ${name} failed`);
    process.exit(result.status ?? 1);
  }
};

const startCommand = (command, args) =>
  spawn(command, args, {
    stdio: "inherit",
    env,
  });

const migrateScriptPath = path.resolve(process.cwd(), "dist/build/src/database/migrate/migrate.js");

const astroRunning = await isLocalPortOpen(astroPort);
const apiRunning = await isLocalPortOpen(apiPort);

if (astroRunning && apiRunning) {
  console.log(`[run-vsat] VSAT is already running at http://localhost:${astroPort}/`);
  process.exit(0);
}

if (astroRunning || apiRunning) {
  console.error(
    `[run-vsat] Port conflict detected: astro=${astroRunning} api=${apiRunning}. ` +
      "Stop the existing process or free ports 4321/3001 before starting VSAT.",
  );
  process.exit(1);
}

if (!(await isPortOpen(dbHost, dbPort))) {
  console.log(`[run-vsat] Starting Postgres via docker compose on ${dbHost}:${dbPort}...`);
  runCommand("docker", ["compose", "up", "-d", "db"], "docker compose up -d db");
}

console.log(`[run-vsat] Waiting for Postgres on ${dbHost}:${dbPort}...`);
if (!(await waitForPort(dbHost, dbPort, 60_000))) {
  console.error(
    `[run-vsat] Postgres did not become reachable on ${dbHost}:${dbPort} within 60s`,
  );
  process.exit(1);
}

if (!existsSync(migrateScriptPath)) {
  console.log("[run-vsat] Building server artifacts for migrations...");
  runCommand("npm", ["run", "build:server"], "npm run build:server");
}

console.log("[run-vsat] Running local database migrations...");
runCommand("npm", ["run", "db:migrate:local"], "npm run db:migrate:local");

console.log("[run-vsat] Starting VSAT dev stack...");
const child = startCommand("npm", ["run", "dev:hot"]);

child.on("exit", (code) => {
  process.exit(code ?? 0);
});
