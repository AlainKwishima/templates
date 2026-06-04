#!/usr/bin/env node
import { copyFileSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: "inherit",
    shell: process.platform === "win32",
    ...options,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

const envTargets = [
  "services/gateway/.env",
  "services/auth-service/.env",
  "services/user-service/.env",
  "services/file-service/.env",
  "frontend/.env",
];

for (const target of envTargets) {
  const example = `${target}.example`;
  if (!existsSync(path.join(root, target)) && existsSync(path.join(root, example))) {
    copyFileSync(path.join(root, example), path.join(root, target));
    console.log(`Created ${target}`);
  }
}

run("npm", ["install"]);
run("npm", ["run", "build", "-w", "@restful/shared"]);
run("npm", ["run", "build", "-w", "@restful/service-kit"]);
run("npm", ["run", "prisma:generate", "-w", "@restful/user-service"]);
run("npm", ["run", "prisma:generate", "-w", "@restful/auth-service"]);
run("npm", ["run", "prisma:generate", "-w", "@restful/file-service"]);

console.log("\nSetup complete. Next steps:");
console.log("  1. Start Postgres: npm run docker:up");
console.log("  2. Migrate: npm run db:migrate");
console.log("  3. Seed: npm run db:seed");
console.log("  4. Run: npm run dev:all");
