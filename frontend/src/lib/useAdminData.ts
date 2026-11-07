"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { authRequest, AuthError } from "./auth";
export function useServiceData<T>(path: string, namespace = "/api/admin") {
  const [data, setData] = useState<T | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  const sequence = useRef(0);
  const pending = useRef<number | null>(null);
  const refresh = useCallback(
    async (silent = false) => {
      if (silent && pending.current !== null) return;
      const request = ++sequence.current;
      pending.current = request;
      if (!silent) setLoading(true);
      try {
        const result = await authRequest(
          path,
          undefined,
          "GET",
          true,
          namespace,
        );
        if (request === sequence.current) {
          setData(result);
          setError("");
        }
      } catch (e) {
        if (request === sequence.current) {
          if (e instanceof AuthError && (e.status === 401 || e.status === 403))
            setData(null);
          setError(
            e instanceof Error ? e.message : "Unable to load account data.",
          );
        }
      } finally {
        if (pending.current === request) pending.current = null;
        if (request === sequence.current) setLoading(false);
      }
    },
    [path, namespace],
  );
  useEffect(() => {
    setData(null);
    refresh();
    const update = () => {
      if (!document.hidden) refresh(true);
    };
    const timer = setInterval(update, 15000);
    window.addEventListener("focus", update);
    return () => {
      sequence.current++;
      clearInterval(timer);
      window.removeEventListener("focus", update);
    };
  }, [refresh]);
  return { data, loading, error, refresh };
}
export function useAdminData<T>(path: string) {
  return useServiceData<T>(path);
}
