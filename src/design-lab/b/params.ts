import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

export type ParamPatch = Record<string, string | null | undefined>;

/**
 * The URL is the brief's memory. Every chosen value is a search param, so
 * Back steps through choices and a reload restores the whole order form.
 */
export function useQuery() {
  const [params, setParams] = useSearchParams();

  const patch = useCallback(
    (changes: ParamPatch, replace = false) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          Object.entries(changes).forEach(([key, value]) => {
            if (value === null || value === undefined || value === "") next.delete(key);
            else next.set(key, value);
          });
          return next;
        },
        { replace },
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
/** Between 640 and 1023 px the results sheet lays out in two columns. */
export const TABLET = "(min-width: 640px)";
