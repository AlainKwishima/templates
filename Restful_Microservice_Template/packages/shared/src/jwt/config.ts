export interface JwtConfig {
  accessSecret: string;
  refreshSecret: string;
  accessTtl: string;
  refreshTtl: string;
  issuer: string;
  audience: string;
}

let jwtConfig: JwtConfig | null = null;

export function initJwt(config: JwtConfig) {
  jwtConfig = config;
}

export function getJwtConfig(): JwtConfig {
  if (!jwtConfig) {
    throw new Error("JWT is not configured. Call initJwt() during service startup.");
  }
  return jwtConfig;
}
