import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { existsSync } from "node:fs";
import { createServer } from "node:net";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";
import { assertLocalEmulatorEnvironment, localEnvironment } from "./emulator-env.mjs";

assertLocalEmulatorEnvironment();
const require = createRequire(import.meta.url);
const appRoot = fileURLToPath(new URL("../", import.meta.url));
const dev = process.argv.includes("--dev");
if (!dev && !existsSync(new URL("../.next/BUILD_ID", import.meta.url))) {
  throw new Error("Execute npm run build:admin antes da integração, ou use --dev para validar o servidor de desenvolvimento.");
}
const listener = createServer();
await new Promise((resolve, reject) => { listener.once("error", reject); listener.listen(0, "127.0.0.1", resolve); });
const port = listener.address().port;
await new Promise((resolve) => listener.close(resolve));
const origin = `http://127.0.0.1:${port}`;
const testEnv = { ...localEnvironment(origin), NODE_ENV: dev ? "development" : "production", ADMIN_TEST_ORIGIN: origin };

async function stopServer(server) {
  if (!server.pid || server.exitCode !== null || server.signalCode !== null) return;
  if (process.platform === "win32") {
    await new Promise((resolve) => {
      const stop = spawn("taskkill", ["/PID", String(server.pid), "/T", "/F"], { stdio: "ignore", windowsHide: true });
      stop.once("exit", resolve);
      stop.once("error", resolve);
    });
  } else {
    server.kill("SIGTERM");
    await Promise.race([new Promise((resolve) => server.once("exit", resolve)), delay(5000, undefined, { ref: false })]);
    if (server.exitCode === null && server.signalCode === null) server.kill("SIGKILL");
  }
}

async function runSuite(file, overrides = {}, scenario = "auth") {
  const server = spawn(process.execPath, [require.resolve("next/dist/bin/next"), dev ? "dev" : "start",
    "--hostname", "127.0.0.1", "--port", String(port)], {
    cwd: appRoot, env: { ...testEnv, ...overrides }, stdio: ["ignore", "pipe", "pipe"], windowsHide: true,
  });
  let startupLog = "";
  let spawnFailed = false;
  server.once("error", () => { spawnFailed = true; });
  server.stdout.on("data", (data) => { startupLog = (startupLog + data).slice(-6000); });
  server.stderr.on("data", (data) => { startupLog = (startupLog + data).slice(-6000); });
  try {
    let ready = false;
    const deadline = Date.now() + 120_000;
    while (Date.now() < deadline) {
      if (spawnFailed || server.exitCode !== null || server.signalCode !== null) break;
      try {
        const response = await fetch(`${origin}/admin/entrar`, { signal: AbortSignal.timeout(3000) });
        if (response.status === 200) { ready = true; break; }
      } catch { /* Wait only for the local server to start. */ }
      await delay(250);
    }
    if (!ready) throw new Error(`Servidor Next local não iniciou.\n${startupLog}`);
    console.log(`Integração HTTP com Next ${dev ? "dev" : "start"}: ${scenario}.`);
    const code = await new Promise((resolve, reject) => {
      const tests = spawn(process.execPath, ["--test", file], {
        cwd: appRoot, env: { ...testEnv, ADMIN_TEST_SCENARIO: scenario }, stdio: "inherit", windowsHide: true,
      });
      tests.once("error", reject);
      tests.once("exit", (value) => resolve(value ?? 1));
    });
    return code;
  } finally { await stopServer(server); }
}

for (const [file, overrides, scenario] of [
  ["tests/auth.integration.test.mjs", {}, "auth"],
  ["tests/config.integration.test.mjs", { ADMIN_ENABLE_DEMO_APPOINTMENTS: "false" }, "demo-disabled"],
  ["tests/config.integration.test.mjs", { ADMIN_ALLOWED_UID: "" }, "config-incomplete"],
  ["tests/config.integration.test.mjs", {
    FIREBASE_AUTH_EMULATOR_HOST: "127.0.0.1:1", NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_URL: "http://127.0.0.1:1",
  }, "auth-unavailable"],
]) {
  const code = await runSuite(file, overrides, scenario);
  if (code !== 0) { process.exitCode = code; break; }
}
