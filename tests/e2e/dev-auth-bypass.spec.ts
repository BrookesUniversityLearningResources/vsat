import { type ChildProcess, spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import { expect, test } from "@playwright/test";

type DevServers = {
  stop: () => Promise<void>;
};

const astroUrl = "http://localhost:4321";
const apiUrl = "http://localhost:3001";

test.describe.configure({ mode: "serial" });

test("DEV_AUTH_BYPASS=1 opens protected author pages without Magic login", async ({
  page,
}) => {
  const servers = await startDevServers({ DEV_AUTH_BYPASS: "1" });

  try {
    await page.goto(`${astroUrl}/author/story/`);

    await expect(page).toHaveURL(/\/author\/story\/?$/);
    await expect(
      page.getByRole("heading", { name: "Stories by Dev User" }),
    ).toBeVisible();
  } finally {
    await servers.stop();
  }
});

test("DEV_AUTH_BYPASS=0 redirects protected author pages to Magic login", async ({
  page,
}) => {
  const servers = await startDevServers({ DEV_AUTH_BYPASS: "0" });

  try {
    await page.goto(`${astroUrl}/author/story/`);

    await expect(page).toHaveURL(/\/login(\?err=21)?$/);
    await expect(page.getByRole("heading", { name: "Login" })).toBeVisible();
    await expect(page.getByPlaceholder("sophie@example.com")).toBeVisible();
    await expect(page.getByRole("button", { name: "Log in" })).toBeVisible();
  } finally {
    await servers.stop();
  }
});

async function startDevServers(
  overrides: Record<string, string>,
): Promise<DevServers> {
  const env = {
    ...process.env,
    ...loadEnvFile(),
    PLAYWRIGHT: "1",
    DEV_DISABLE_OVERLAY: "1",
    ...overrides,
  };

  const processes = [
    spawn("npm", ["run", "astro:dev"], createSpawnOptions(env)),
    spawn(
      "node",
      ["--import", "tsx", "./src/dev/apiServer.ts"],
      createSpawnOptions(env),
    ),
  ];

  try {
    await Promise.all([
      waitForHttp(astroUrl),
      waitForHttp(`${apiUrl}/healthcheck`),
    ]);
  } catch (err) {
    await stopProcesses(processes);
    throw err;
  }

  return {
    stop: () => stopProcesses(processes),
  };
}

function createSpawnOptions(env: NodeJS.ProcessEnv) {
  return {
    cwd: process.cwd(),
    detached: true,
    env,
    stdio: "ignore" as const,
  };
}

function loadEnvFile() {
  const envPath = path.resolve(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) {
    return {};
  }

  const env: Record<string, string> = {};
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    if (!line || line.trim().startsWith("#")) {
      continue;
    }

    const index = line.indexOf("=");
    if (index === -1) {
      continue;
    }

    const key = line.slice(0, index).trim();
    const value = line.slice(index + 1).trim();
    if (key) {
      env[key] = value;
    }
  }

  return env;
}

async function waitForHttp(url: string) {
  const started = Date.now();
  let lastError: unknown;

  while (Date.now() - started < 30000) {
    try {
      const response = await fetch(url, { redirect: "manual" });
      if (response.status < 500) {
        return;
      }
    } catch (err) {
      lastError = err;
    }

    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw new Error(`Timed out waiting for ${url}`, { cause: lastError });
}

async function stopProcesses(processes: ChildProcess[]) {
  for (const child of processes) {
    if (child.pid) {
      try {
        process.kill(-child.pid, "SIGTERM");
      } catch {
        // The process may already have exited.
      }
    }
  }

  await new Promise((resolve) => setTimeout(resolve, 500));
}
