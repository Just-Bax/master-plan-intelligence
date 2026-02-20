import { useQuery } from "@tanstack/react-query";
import { API_PATHS } from "@/constants";
import { apiGet } from "@/lib/api";
import { queryErrorToMessage } from "@/lib/utils";
import type { Project } from "@/types/api";

export function useProjects(masterPlanId: number | null | undefined) {
  const url =
    masterPlanId != null
      ? `${API_PATHS.PROJECT}?master_plan_id=${masterPlanId}`
      : API_PATHS.PROJECT;

  const {
    data: projects = [],
    isLoading: loading,
    error: queryError,
    refetch,
  } = useQuery<Project[]>({
    queryKey: ["project", masterPlanId ?? "all"],
    queryFn: () => apiGet<Project[]>(url),
  });

  const error = queryErrorToMessage(queryError, "Failed to load projects");

  return { projects, loading, error, refetch };
}
