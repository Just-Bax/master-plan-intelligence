import { useQuery } from "@tanstack/react-query";
import { API_PATHS } from "@/constants";
import { apiGet } from "@/lib/api";
import { queryErrorToMessage } from "@/lib/utils";
import type { FunctionType } from "@/types/api";

export function useFunctionTypes() {
  const {
    data: functionTypes = [],
    isLoading: loading,
    error: queryError,
    refetch,
  } = useQuery<FunctionType[]>({
    queryKey: ["function_type"],
    queryFn: () => apiGet<FunctionType[]>(API_PATHS.FUNCTION_TYPE),
  });

  const error = queryErrorToMessage(queryError, "Failed to load function types");

  return {
    functionTypes,
    loading,
    error,
    refetch,
  };
}
