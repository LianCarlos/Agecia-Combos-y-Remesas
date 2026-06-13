"use client";

import { useState, useEffect } from "react";
import type { Combo } from "@/types";

export function useCombos() {
  const [combos, setCombos] = useState<Combo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchCombos() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/combos");

        if (cancelled) return;

        if (!res.ok) {
          setError("Error al cargar combos");
          return;
        }

        const data: Combo[] = await res.json();
        if (!cancelled) {
          setCombos(data);
        }
      } catch {
        if (!cancelled) {
          setError("Error al cargar combos");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchCombos();

    return () => {
      cancelled = true;
    };
  }, []);

  return { combos, loading, error };
}

