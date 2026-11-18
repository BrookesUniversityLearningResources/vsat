import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const processes = [];

const loadEnvFile = () => {
  const envPath = path.resolve(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) return {};
  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
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

const isWindows = process.platform === "win32";

// Under `npm run`, npm_execpath points at npm-cli.js, so we can run npm with
// the current Node binary and no shell on every OS. When this script is run
// directly, fall back to `npm` on PATH; on Windows that's npm.cmd, which
// Node only spawns via a shell.
const npmCommand = (args) => {
  const npmExecPath = process.env.npm_execpath;
  if (npmExecPath && /\.[cm]?js$/.test(npmExecPath)) {
    return { command: process.execPath, args: [npmExecPath, ...args], shell: false };
  }
  return { command: "npm", args, shell: isWindows };
};

const runNpm = (npmArgs, name) => {
  const { command, args, shell } = npmCommand(npmArgs);
  const child = spawn(command, args, {
    stdio: "inherit",
    shell,
    env: {
      ...process.env,
      ...envFromFile,
    },
  });
  child.on("error", (error) => {
    console.error(`[dev-hot] failed to start ${name}: ${error.message}`);
    shutdown(1);
  });
  child.on("exit", (code) => {
    if (code && code !== 0) {
      console.error(`[dev-hot] ${name} exited with code ${code}`);
      shutdown(code);
    }
  });
  processes.push(child);
};

const shutdown = (code = 0) => {
  for (const child of processes) {
    if (child.exitCode !== null || child.signalCode !== null || !child.pid) continue;
    if (isWindows) {
      // child.kill only ends npm itself on Windows; take the whole tree down.
      spawnSync("taskkill", ["/pid", String(child.pid), "/T", "/F"], { stdio: "ignore" });
    } else {
      child.kill("SIGTERM");
    }
  }
  process.exit(code);
};

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

runNpm(["run", "astro:dev"], "astro");
runNpm(["run", "dev:api"], "api");
