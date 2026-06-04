import { existsSync } from "node:fs";
import { execSync } from "node:child_process";

if (!existsSync(".git")) {
  process.exit(0);
}

try {
  execSync("husky", { stdio: "inherit" });
} catch {
  process.exit(0);
}
