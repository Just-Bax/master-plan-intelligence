import { useQuery } from "@tanstack/react-query";
import { API_PATHS } from "@/constants";
import { apiGet } from "@/lib/api";
import { queryErrorToMessage } from "@/lib/utils";
import type { ObjectType } from "@/types/api";

export function useObjectTypes() {
  const {
    data: objectTypes = [],
    isLoading: loading,
    error: queryError,
    refetch,
  } = useQuery<ObjectType[]>({
    queryKey: ["object_type"],
    queryFn: () => apiGet<ObjectType[]>(API_PATHS.OBJECT_TYPE),
  });

  const error = queryErrorToMessage(queryError, "Failed to load object types");

  return {
    objectTypes,
    loading,
    error,
    refetch,
  };
}
