export interface Argon2Config {
  memoryCost: number;
  timeCost: number;
  parallelism: number;
}

let argon2Config: Argon2Config | null = null;

export function initPassword(config: Argon2Config) {
  argon2Config = config;
}

export function getArgon2Config(): Argon2Config {
  if (!argon2Config) {
    throw new Error("Argon2 is not configured. Call initPassword() during service startup.");
  }
  return argon2Config;
}
