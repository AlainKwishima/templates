import { mkdir } from "node:fs/promises";
import path from "node:path";
import { env } from "@/config/env.js";

export async function ensureUploadDir() {
  await mkdir(env.UPLOAD_DIR, { recursive: true });
  return path.resolve(env.UPLOAD_DIR);
}
