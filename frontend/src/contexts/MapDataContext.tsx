import { createContext, useContext, type ReactNode } from "react";
import type {
  FunctionType,
  MasterPlan,
  ObjectType,
  PlanObject,
  Project,
} from "@/types/api";
import type { GeoJSONGeometry, MasterPlanFormData } from "@/types/api";
import type { GeometryEditTarget, NewMasterPlanPlacement } from "@/types/map";

interface MapDataContextValue {
  masterPlans: MasterPlan[];
  activeId: number | null;
  setActiveId: (id: number | null) => void;
  objectTypes: ObjectType[];
  functionTypes: FunctionType[];
  objects: PlanObject[];
  objectIdsInPlan: number[];
  objectsLayerVisible: boolean;
  setObjectsLayerVisible: (visible: boolean) => void;
  selectedId: number | null;
  setSelectedId: (id: number | null) => void;
  masterPlansLoading: boolean;
  masterPlansError: string | null;
  objectsLoading: boolean;
  refetchMasterPlans: () => void;
  refetchObjects: () => void;
  geometryEditTarget: GeometryEditTarget;
  setGeometryEditTarget: (target: GeometryEditTarget) => void;
  flyToTarget: GeometryEditTarget;
  setFlyToTarget: (target: GeometryEditTarget) => void;
  newMasterPlanPlacement: NewMasterPlanPlacement;
  setNewMasterPlanPlacement: (value: NewMasterPlanPlacement) => void;
  pendingNewMasterPlanGeometry: GeoJSONGeometry | null;
  setPendingNewMasterPlanGeometry: (value: GeoJSONGeometry | null) => void;
  onMasterPlanCreate: (data: MasterPlanFormData) => Promise<void>;
  onMasterPlanUpdate: (id: number, data: MasterPlanFormData) => Promise<void>;
  onMasterPlanDelete: (id: number) => Promise<void>;
  onObjectCreate: (data: {
    object_type_id: number;
    function_type_id?: number | null;
    geometry?: Record<string, unknown> | null;
    name?: string | null;
    [key: string]: unknown;
  }) => Promise<void>;
  onObjectUpdate: (
    id: number,
    data: {
      object_type_id?: number;
      function_type_id?: number | null;
      name?: string | null;
      geometry?: Record<string, unknown> | null;
      [key: string]: unknown;
    }
  ) => Promise<void>;
  onObjectDelete: (id: number) => Promise<void>;
  onObjectGeometryChange: (
    objectId: number,
    geometry: GeoJSONGeometry
  ) => Promise<void>;
  onMasterPlanGeometryChange: (
    planId: number,
    geometry: GeoJSONGeometry
  ) => Promise<void>;
  projects: Project[];
  projectsLoading: boolean;
  activeProjectId: number | null;
  setActiveProjectId: (id: number | null) => void;
  refetchProjects: () => void;
  onProjectCreate: (data: {
    name: string;
    description?: string | null;
    master_plan_id?: number | null;
  }) => Promise<void>;
  onProjectUpdate: (
    id: number,
    data: {
      name?: string;
      description?: string | null;
      master_plan_id?: number | null;
    }
  ) => Promise<void>;
  onProjectDelete: (id: number) => Promise<void>;
}

const MapDataContext = createContext<MapDataContextValue | null>(null);

export function MapDataProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: MapDataContextValue;
}) {
  return (
    <MapDataContext.Provider value={value}>{children}</MapDataContext.Provider>
  );
}

export function useMapData(): MapDataContextValue {
  const ctx = useContext(MapDataContext);
  if (!ctx) throw new Error("useMapData must be used within MapDataProvider");
  return ctx;
}
