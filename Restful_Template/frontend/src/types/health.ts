export interface HealthStatus {
  status: string;
  timestamp: string;
  service?: string;
  database?: string;
  uptime?: number;
}
