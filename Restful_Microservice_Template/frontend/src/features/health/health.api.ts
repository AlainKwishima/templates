import { requestData } from "@/lib/api/client";
import type { HealthStatus } from "@/types/health";

export async function getHealthCheck() {
  return requestData<HealthStatus>("/health", { method: "GET", auth: false });
}

export async function getLiveness() {
  return requestData<HealthStatus>("/health/live", { method: "GET", auth: false });
}

export async function getReadiness() {
  return requestData<HealthStatus>("/health/ready", { method: "GET", auth: false });
}
