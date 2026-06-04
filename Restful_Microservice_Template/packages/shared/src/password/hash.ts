import argon2 from "argon2";
import { getArgon2Config } from "./config.js";

export async function hashPassword(password: string): Promise<string> {
  const config = getArgon2Config();
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: config.memoryCost,
    timeCost: config.timeCost,
    parallelism: config.parallelism,
  });
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  return argon2.verify(hash, password);
}
