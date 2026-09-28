import { createContext, useCallback, useContext, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { useLabStore } from "../shared/store";
import type { JourneyApi } from "./journey";

export interface LabContextValue {
  store: ReturnType<typeof useLabStore>;
  journey: JourneyApi;
  /** Absolute mount path of this concept, e.g. /__design/c. */
  base: string;
  /** What the frame shows when nothing else is rendered on it. */
  portraitSrc: string;
  /** True once he stepped in this session or has a saved DNA with a portrait. */
  hasPortrait: boolean;
  reduced: boolean;
}

export const LabContext = createContext<LabContextValue | null>(null);

export function useLab(): LabContextValue {
  const value = useContext(LabContext);
  if (!value) throw new Error("useLab must be used inside ConceptC");
  return value;
}

/** Path of the current location relative to the concept mount, without a leading slash. */
export function useRelativePath(): string {
  const { base } = useLab();
  const { pathname } = useLocation();
  return pathname.slice(base.length).replace(/^\/+/, "");
}

/** Navigate to a path relative to the concept mount. */
export function useGo(): (path: string, replace?: boolean) => void {
  const { base } = useLab();
  const navigate = useNavigate();
  return useCallback((path: string, replace = false) => navigate(path ? `${base}/${path}` : base, { replace }), [base, navigate]);
}

/** Runs one deferred action; a new call or unmount cancels the pending one. */
export function useLater(): (fn: () => void, ms: number) => void {
  const timer = useRef<number | null>(null);
  useEffect(() => () => {
    if (timer.current !== null) window.clearTimeout(timer.current);
  }, []);
  return useCallback((fn: () => void, ms: number) => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      timer.current = null;
      fn();
    }, ms);
  }, []);
}

export function baseFromPathname(pathname: string): string {
  const match = pathname.match(/^(.*?\/c)(?=\/|$)/);
  return match ? match[1] : pathname;
}
