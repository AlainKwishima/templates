import fs from "node:fs/promises";
import path from "node:path";
import { env } from "@/config/env.js";

export async function ensureUploadDir() {
  const directory = path.resolve(env.UPLOAD_DIR);
  await fs.mkdir(directory, { recursive: true });
  return directory;
}
