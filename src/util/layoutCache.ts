/**
 * Simple in-memory cache for the vsatlatarium layout computation.
 * Keyed by a fingerprint of story/scene data so we skip the O(N²)
 * force-directed layout when nothing has changed.
 *
 * Uses globalThis so the cache survives Vite SSR module re-evaluation
 * in dev mode (Vite can re-execute module scope per request).
 */

type CacheEntry<T> = { key: string; value: T };

const GLOBAL_KEY = "__vsatLayoutCache";

function getStore(): Map<string, CacheEntry<unknown>> {
  const g = globalThis as Record<string, unknown>;
  if (!g[GLOBAL_KEY]) g[GLOBAL_KEY] = new Map();
  return g[GLOBAL_KEY] as Map<string, CacheEntry<unknown>>;
}

export function cached<T>(
  namespace: string,
  key: string,
  compute: () => T,
): T {
  const store = getStore();
  const entry = store.get(namespace) as CacheEntry<T> | undefined;
  if (entry && entry.key === key) return entry.value;
  const value = compute();
  store.set(namespace, { key, value });
  return value;
}
