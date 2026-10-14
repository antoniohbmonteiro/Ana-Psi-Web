import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { DEMO_PROJECT_ID, localEnvironment } from "./emulator-env.mjs";

const require = createRequire(import.meta.url);
const appRoot = fileURLToPath(new URL("../", import.meta.url));
const [command = "start", mode] = process.argv.slice(2);
if (!["start", "test"].includes(command) || (mode !== undefined && mode !== "--dev")) {
  throw new Error("Uso: node scripts/run-emulators.mjs start|test [--dev]");
}
const args = [require.resolve("firebase-tools/lib/bin/firebase.js"),
  command === "test" ? "emulators:exec" : "emulators:start",
  "--config", "firebase.json", "--project", DEMO_PROJECT_ID, "--only", "auth,firestore"];
if (command === "test") args.push(`"${process.execPath}" scripts/run-integration.mjs${mode ? " --dev" : ""}`);
const child = spawn(process.execPath, args, { cwd: appRoot, env: localEnvironment(), stdio: "inherit", windowsHide: true });
child.on("error", () => { console.error("Não foi possível iniciar a CLI Firebase."); process.exitCode = 1; });
child.on("exit", (code) => { process.exitCode = code ?? 1; });
