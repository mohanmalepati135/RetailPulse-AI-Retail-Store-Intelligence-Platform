import { useSyncExternalStore } from "react";
import { demoState } from "../services/dataSource";

/** Reactively reports whether the app has degraded to simulated (demo) data. */
export function useDemoMode(): boolean {
  return useSyncExternalStore(
    (cb) => demoState.subscribe(cb),
    () => demoState.isActive(),
    () => demoState.isActive(),
  );
}
