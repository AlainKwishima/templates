#!/usr/bin/env node
const GATEWAY = process.env.GATEWAY_URL ?? "http://localhost:3000/api/v1";

async function request(path, options = {}) {
  const response = await fetch(`${GATEWAY}${path}`, {
    headers: { "Content-Type": "application/json", Accept: "application/json", ...(options.headers ?? {}) },
    ...options,
  });
  const body = await response.json().catch(() => null);
  return { response, body };
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  console.log("E2E tests against", GATEWAY);

  const health = await request("/health");
  assert(health.response.ok, `Gateway health failed: ${health.response.status}`);
  console.log("✓ Gateway health");

  const login = await request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: "admin@example.com", password: "Admin123!" }),
  });
  assert(login.response.ok && login.body?.success, `Login failed: ${JSON.stringify(login.body)}`);
  const accessToken = login.body.data.tokens.accessToken;
  console.log("✓ Admin login");

  const authHeaders = { Authorization: `Bearer ${accessToken}` };

  const me = await request("/auth/me", { headers: authHeaders });
  assert(me.response.ok && me.body?.data?.user?.email, "Auth /me failed");
  console.log("✓ Auth /me");

  const profile = await request("/users/me", { headers: authHeaders });
  assert(profile.response.ok && profile.body?.data?.user?.email, "Users /me failed");
  console.log("✓ Users /me");

  const refresh = await request("/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refreshToken: login.body.data.tokens.refreshToken }),
  });
  assert(refresh.response.ok, "Token refresh failed");
  console.log("✓ Auth refresh");

  console.log("\nAll E2E checks passed.");
}

main().catch((error) => {
  console.error("\nE2E failed:", error.message);
  process.exit(1);
});
