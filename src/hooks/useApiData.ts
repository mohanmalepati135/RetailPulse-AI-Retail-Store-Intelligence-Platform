import { useCallback, useEffect, useRef, useState } from "react";
import { liveRelay } from "../lib/api";
import { SKELETON_TIMEOUT_MS } from "../lib/constants";

interface State<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/**
 * Generic data hook with loading / empty / error handling and optional live
 * refresh driven by the WebSocket relay. Components never call the API directly.
 */
export function useApiData<T>(
  fetcher: () => Promise<T>,
  options: { live?: boolean; deps?: unknown[] } = {},
) {
  const { live = false, deps = [] } = options;
  const [state, setState] = useState<State<T>>({
    data: null,
    loading: true,
    error: null,
  });
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const mounted = useRef(true);

  const load = useCallback(async (showSpinner: boolean) => {
    if (showSpinner) setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await fetcherRef.current();
      if (mounted.current) setState({ data, loading: false, error: null });
    } catch (err) {
      if (mounted.current)
        setState((s) => ({
          ...s,
          loading: false,
          error: err instanceof Error ? err.message : "Unknown error",
        }));
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    load(true);
    // Fall through to empty/error state if a load hangs past the skeleton budget.
    const safety = setTimeout(() => {
      if (mounted.current) setState((s) => (s.loading ? { ...s, loading: false } : s));
    }, SKELETON_TIMEOUT_MS);

    let unsub: (() => void) | undefined;
    if (live) unsub = liveRelay.subscribe(() => load(false));

    return () => {
      mounted.current = false;
      clearTimeout(safety);
      unsub?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { ...state, refetch: () => load(true) };
}
