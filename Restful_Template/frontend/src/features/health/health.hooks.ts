import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";
import { getHealthCheck, getLiveness, getReadiness } from "@/features/health/health.api";

export function useHealthCheckQuery() {
  return useQuery({
    queryKey: [...queryKeys.health.root, "full"],
    queryFn: getHealthCheck,
  });
}

export function useLivenessQuery() {
  return useQuery({
    queryKey: [...queryKeys.health.root, "live"],
    queryFn: getLiveness,
  });
}

export function useReadinessQuery() {
  return useQuery({
    queryKey: [...queryKeys.health.root, "ready"],
    queryFn: getReadiness,
  });
}
