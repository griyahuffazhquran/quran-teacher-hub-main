import { useEffect, useState, useSyncExternalStore } from "react";
import type { Repository } from "@/lib/data/repository";
import { hydrateAll } from "@/lib/data/repositories";

type Base = { id: string; createdAt: string; updatedAt: string };

const EMPTY: never[] = [];

/**
 * Subscribes a component to a repository. `ready` is false during SSR and the
 * first client render so markup stays stable, then flips to true after hydration.
 */
export function useCollection<T extends Base>(repo: Repository<T>) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    hydrateAll();
    setReady(true);
  }, []);

  const rows = useSyncExternalStore(
    repo.subscribe,
    () => repo.list(),
    () => EMPTY as unknown as T[],
  );

  return { rows, ready, repo };
}
