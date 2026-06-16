import { spawn } from "node:child_process";
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

const run = (command, args, name) => {
  const child = spawn(command, args, {
    stdio: "inherit",
    env: {
      ...process.env,
      ...envFromFile,
    },
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
    child.kill("SIGTERM");
  }
  process.exit(code);
};

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

run("npm", ["run", "astro:dev"], "astro");
run("npm", ["run", "dev:api"], "api");
