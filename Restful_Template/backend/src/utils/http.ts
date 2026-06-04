export function getRequestIp(req: { headers?: Record<string, unknown>; ip?: string }): string | undefined {
  const forwarded = req.headers?.["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0]?.trim();
  }

  return req.ip;
}
