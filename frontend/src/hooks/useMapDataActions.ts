import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { API_PATHS } from "@/constants";
import { apiPatch, apiPost, apiDelete } from "@/lib/api";
import type { MasterPlanFormData, GeoJSONGeometry } from "@/types/api";

interface UseMapDataActionsParams {
  activeId: number | null;
  masterPlans: { id: number }[];
  selectedId: number | null;
  setSelectedId: (id: number | null) => void;
  setActiveId: (id: number | null) => void;
}

export function useMapDataActions({
  activeId,
  masterPlans,
  selectedId,
  setSelectedId,
  setActiveId,
}: UseMapDataActionsParams) {
  const queryClient = useQueryClient();

  const onPlanCreate = useCallback(
    async (data: MasterPlanFormData) => {
      await apiPost(API_PATHS.MASTER_PLAN, {
        name: data.name,
        geometry: data.geometry ?? null,
      });
      queryClient.invalidateQueries({ queryKey: ["master_plan"] });
    },
    [queryClient]
  );

  const onPlanUpdate = useCallback(
    async (id: number, data: MasterPlanFormData) => {
      await apiPatch(API_PATHS.MASTER_PLAN_BY_ID(id), {
        name: data.name,
        geometry: data.geometry ?? undefined,
      });
      queryClient.invalidateQueries({ queryKey: ["master_plan"] });
    },
    [queryClient]
  );

  const onPlanDelete = useCallback(
    async (id: number) => {
      await apiDelete(API_PATHS.MASTER_PLAN_BY_ID(id));
      if (activeId === id) {
        setActiveId(masterPlans.find((p) => p.id !== id)?.id ?? null);
      }
      queryClient.invalidateQueries({ queryKey: ["master_plan"] });
    },
    [activeId, masterPlans, queryClient, setActiveId]
  );

  const onObjectCreate = useCallback(
    async (data: {
      object_type_id: number;
      function_type_id?: number | null;
      geometry?: GeoJSONGeometry | null;
      name?: string | null;
      [key: string]: unknown;
    }) => {
      await apiPost(API_PATHS.OBJECT, data);
      queryClient.invalidateQueries({ queryKey: ["object"] });
      queryClient.invalidateQueries({ queryKey: ["master_plan"] });
    },
    [queryClient]
  );

  const onObjectUpdate = useCallback(
    async (
      id: number,
      data: {
        object_type_id?: number;
        function_type_id?: number | null;
        name?: string | null;
        geometry?: GeoJSONGeometry | null;
        [key: string]: unknown;
      }
    ) => {
      await apiPatch(API_PATHS.OBJECT_BY_ID(id), data);
      queryClient.invalidateQueries({ queryKey: ["object"] });
      queryClient.invalidateQueries({ queryKey: ["master_plan"] });
    },
    [queryClient]
  );

  const onObjectDelete = useCallback(
    async (id: number) => {
      await apiDelete(API_PATHS.OBJECT_BY_ID(id));
      if (selectedId === id) setSelectedId(null);
      queryClient.invalidateQueries({ queryKey: ["object"] });
      queryClient.invalidateQueries({ queryKey: ["master_plan"] });
    },
    [queryClient, selectedId, setSelectedId]
  );

  const onObjectGeometryChange = useCallback(
    async (objectId: number, geometry: GeoJSONGeometry) => {
      await apiPatch(API_PATHS.OBJECT_BY_ID(objectId), { geometry });
      queryClient.invalidateQueries({ queryKey: ["object"] });
      queryClient.invalidateQueries({ queryKey: ["master_plan"] });
    },
    [queryClient]
  );

  const onMasterPlanGeometryChange = useCallback(
    async (planId: number, geometry: GeoJSONGeometry) => {
      await apiPatch(API_PATHS.MASTER_PLAN_BY_ID(planId), { geometry });
      queryClient.invalidateQueries({ queryKey: ["master_plan"] });
    },
    [queryClient]
  );

  const onProjectCreate = useCallback(
    async (data: {
      name: string;
      description?: string | null;
      master_plan_id?: number | null;
    }) => {
      await apiPost(API_PATHS.PROJECT, {
        name: data.name,
        description: data.description ?? null,
        master_plan_id: data.master_plan_id ?? null,
      });
      queryClient.invalidateQueries({ queryKey: ["project"] });
    },
    [queryClient]
  );

  const onProjectUpdate = useCallback(
    async (
      id: number,
      data: {
        name?: string;
        description?: string | null;
        master_plan_id?: number | null;
      }
    ) => {
      await apiPatch(API_PATHS.PROJECT_BY_ID(id), data);
      queryClient.invalidateQueries({ queryKey: ["project"] });
    },
    [queryClient]
  );

  const onProjectDelete = useCallback(
    async (id: number) => {
      await apiDelete(API_PATHS.PROJECT_BY_ID(id));
      queryClient.invalidateQueries({ queryKey: ["project"] });
    },
    [queryClient]
  );

  return {
    onMasterPlanCreate: onPlanCreate,
    onMasterPlanUpdate: onPlanUpdate,
    onMasterPlanDelete: onPlanDelete,
    onObjectCreate,
    onObjectUpdate,
    onObjectDelete,
    onObjectGeometryChange,
    onMasterPlanGeometryChange,
    onProjectCreate,
    onProjectUpdate,
    onProjectDelete,
  };
}
