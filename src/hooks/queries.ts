// TanStack Query hooks. Caching, retries, polling, background refresh.
// Return shape is intentionally compatible with the existing components
// ({ data, loading, error, refetch }) so the UI does not need redesigning.

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryResult,
} from "@tanstack/react-query";
import { dataSource } from "../services/dataSource";

// Refresh cadence per requirements.
export const REFRESH = {
  metrics: 5000,
  anomalies: 10000,
  health: 15000,
  charts: 8000,
  events: 5000,
} as const;

interface Adapted<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

function adapt<T>(q: UseQueryResult<T>): Adapted<T> {
  return {
    data: (q.data ?? null) as T | null,
    loading: q.isPending,
    error: q.isError ? (q.error as Error)?.message ?? "Request failed" : null,
    refetch: () => void q.refetch(),
  };
}

export function useMetrics() {
  return adapt(
    useQuery({
      queryKey: ["metrics"],
      queryFn: () => dataSource.getMetrics(),
      refetchInterval: REFRESH.metrics,
    }),
  );
}

export function useStoreMetrics(id: string) {
  return adapt(
    useQuery({
      queryKey: ["metrics", id],
      queryFn: () => dataSource.getStoreMetrics(id),
      refetchInterval: REFRESH.metrics,
      enabled: !!id,
    }),
  );
}

export function useFunnel(storeId?: string) {
  return adapt(
    useQuery({
      queryKey: ["funnel", storeId ?? "all"],
      queryFn: () => dataSource.getFunnel(storeId),
      refetchInterval: REFRESH.charts,
    }),
  );
}

export function useHeatmap(storeId?: string) {
  return adapt(
    useQuery({
      queryKey: ["heatmap", storeId ?? "all"],
      queryFn: () => dataSource.getHeatmap(storeId),
      refetchInterval: REFRESH.charts,
    }),
  );
}

export function useAnomalies(storeId?: string) {
  return adapt(
    useQuery({
      queryKey: ["anomalies", storeId ?? "all"],
      queryFn: () => dataSource.getAnomalies(storeId),
      refetchInterval: REFRESH.anomalies,
    }),
  );
}

export function useHealth() {
  return adapt(
    useQuery({
      queryKey: ["health"],
      queryFn: () => dataSource.getHealth(),
      refetchInterval: REFRESH.health,
    }),
  );
}

export function useEvents(storeId?: string) {
  return adapt(
    useQuery({
      queryKey: ["events", storeId ?? "all"],
      queryFn: () => dataSource.getEvents(storeId),
      refetchInterval: REFRESH.events,
    }),
  );
}

export function useStoreSeries(id: string) {
  return adapt(
    useQuery({
      queryKey: ["series", id],
      queryFn: () => dataSource.getStoreSeries(id),
      refetchInterval: REFRESH.charts,
      enabled: !!id,
    }),
  );
}

export function useAggregatedSeries() {
  return adapt(
    useQuery({
      queryKey: ["series", "aggregated"],
      queryFn: () => dataSource.getAggregatedSeries(),
      refetchInterval: REFRESH.charts,
    }),
  );
}

export function useSparkline(key: "visitors" | "conversions" | "queue") {
  return adapt(
    useQuery({
      queryKey: ["sparkline", key],
      queryFn: () => dataSource.getAggregatedSparkline(key),
      refetchInterval: REFRESH.metrics,
    }),
  );
}

export function useFleetSummary() {
  return adapt(
    useQuery({
      queryKey: ["fleet"],
      queryFn: () => dataSource.getFleetSummary(),
      refetchInterval: REFRESH.anomalies,
    }),
  );
}

export function useCameraFeeds() {
  return adapt(
    useQuery({
      queryKey: ["cameras"],
      queryFn: () => dataSource.getCameraFeeds(),
      refetchInterval: REFRESH.anomalies,
    }),
  );
}

export function useAcknowledge() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["anomalies"] });
  const ackOne = useMutation({
    mutationFn: (id: string) => dataSource.acknowledgeAnomaly(id),
    onSuccess: invalidate,
  });
  const ackAll = useMutation({
    mutationFn: () => dataSource.acknowledgeAll(),
    onSuccess: invalidate,
  });
  return {
    acknowledge: (id: string) => ackOne.mutate(id),
    acknowledgeAll: () => ackAll.mutate(),
  };
}
