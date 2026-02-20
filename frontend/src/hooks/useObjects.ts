import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { API_PATHS } from "@/constants";
import { apiGet } from "@/lib/api";
import { queryErrorToMessage } from "@/lib/utils";
import type { PlanObject } from "@/types/api";

export function useObjects(masterPlanId: number | null) {
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const fullObjectsQuery = useQuery<PlanObject[]>({
    queryKey: ["object"],
    queryFn: () => apiGet<PlanObject[]>(API_PATHS.OBJECT),
    enabled: true,
  });

  const planObjectsQuery = useQuery<PlanObject[]>({
    queryKey: ["master_plan", masterPlanId, "objects"],
    queryFn: () =>
      apiGet<PlanObject[]>(API_PATHS.MASTER_PLAN_OBJECTS(masterPlanId!)),
    enabled: masterPlanId !== null,
  });

  const objects = fullObjectsQuery.data ?? [];
  const objectIdsInPlan =
    masterPlanId !== null ? (planObjectsQuery.data ?? []).map((o) => o.id) : [];
  const loading = fullObjectsQuery.isLoading;
  const error = queryErrorToMessage(
    fullObjectsQuery.error,
    "Failed to load objects"
  );

  async function refetch() {
    await Promise.all([fullObjectsQuery.refetch(), planObjectsQuery.refetch()]);
  }

  return {
    objects,
    objectIdsInPlan,
    selectedId,
    setSelectedId,
    loading,
    error,
    refetch,
  };
}
