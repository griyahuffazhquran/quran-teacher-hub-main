import { useEffect, useSyncExternalStore } from "react";
import type { Repository } from "@/lib/data/repository";
import { hydrateAll } from "@/lib/data/repositories";

type Base = { id: string; createdAt: string; updatedAt: string };

/**
 * Subscribes a component to a repository. Returns rows and a `ready` flag that
 * is false during SSR / before hydration so markup stays stable.
 */
export function useCollection<T extends Base>(repo: Repository<T>) {
  useEffect(() => {
    hydrateAll();
  }, []);

  const rows = useSyncExternalStore(
    repo.subscribe,
    () => repo.list(),
    () => [] as T[],
  );

  const ready = typeof window !== "undefined" && rows.length >= 0 && isHydrated();

  return { rows, ready, repo };
}

let hydratedFlag = false;
if (typeof window !== "undefined") {
  // set after first client tick; used only for skeleton gating
  queueMicrotask(() => {
    hydratedFlag = true;
  });
}
function isHydrated() {
  return hydratedFlag;
}
