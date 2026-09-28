import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

export type ParamPatch = Record<string, string | null | undefined>;

/**
 * The URL is the page's memory. Every change replaces the entry (never
 * pushes), so the page never routes and a reload restores it exactly.
 */
export function useQuery() {
  const [params, setParams] = useSearchParams();

  const patch = useCallback(
    (changes: ParamPatch) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          Object.entries(changes).forEach(([key, value]) => {
            if (value === null || value === undefined || value === "") next.delete(key);
            else next.set(key, value);
          });
          return next;
        },
        { replace: true },
      );
    },
    [setParams],
  );

  return { params, patch };
}

/** Returns the raw value only when it is one of the known option ids. */
export function pickValid<T extends string>(raw: string | null, options: readonly { id: T }[]): T | null {
  if (!raw) return null;
  return options.some((o) => o.id === raw) ? (raw as T) : null;
}

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => typeof window !== "undefined" && window.matchMedia(query).matches);

  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setMatches(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}

export const DESKTOP = "(min-width: 1024px)";
