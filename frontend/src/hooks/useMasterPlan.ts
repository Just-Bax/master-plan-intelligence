import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { ACTIVE_MASTER_PLAN_STORAGE_KEY, API_PATHS } from "@/constants";
import { apiGet } from "@/lib/api";
import { queryErrorToMessage } from "@/lib/utils";
import type { MasterPlan } from "@/types/api";

function getStoredActiveMasterPlanId(): number | null {
  try {
    const storedValue = localStorage.getItem(ACTIVE_MASTER_PLAN_STORAGE_KEY);
    if (storedValue === null || storedValue === "") return null;
    const parsedId = parseInt(storedValue, 10);
    return Number.isNaN(parsedId) ? null : parsedId;
  } catch {
    return null;
  }
}

export function useMasterPlan() {
  const [activeId, setActiveId] = useState<number | null>(
    getStoredActiveMasterPlanId
  );

  const {
    data: masterPlans = [],
    isLoading: loading,
    error: queryError,
    refetch,
  } = useQuery<MasterPlan[]>({
    queryKey: ["master_plan"],
    queryFn: () => apiGet<MasterPlan[]>(API_PATHS.MASTER_PLAN),
  });

  useEffect(() => {
    if (activeId === null) return;
    try {
      localStorage.setItem(ACTIVE_MASTER_PLAN_STORAGE_KEY, String(activeId));
    } catch {
      /* ignore */
    }
  }, [activeId]);

  useEffect(() => {
    const storedPlanNotFound =
      activeId !== null &&
      (masterPlans.length === 0 || !masterPlans.some((p) => p.id === activeId));
    if (storedPlanNotFound) {
      setActiveId(null);
      try {
        localStorage.removeItem(ACTIVE_MASTER_PLAN_STORAGE_KEY);
      } catch {
        /* ignore */
      }
    }
  }, [masterPlans, activeId]);

  const activePlan =
    activeId !== null
      ? (masterPlans.find((p) => p.id === activeId) ?? null)
      : null;

  const error = queryErrorToMessage(queryError, "Failed to load master plans");

  return {
    masterPlans,
    activeId,
    activePlan,
    setActiveId,
    loading,
    error,
    refetch,
  };
}
