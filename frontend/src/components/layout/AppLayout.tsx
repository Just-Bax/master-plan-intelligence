import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { MapView } from "@/components/map/MapView";
import { ObjectDetailsPanel } from "@/components/sidebar/ObjectDetailsPanel";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { MapDataProvider } from "@/contexts/MapDataContext";
import type { GeometryEditTarget, NewMasterPlanPlacement } from "@/types/map";
import type { GeoJSONGeometry } from "@/types/api";
import { useMapDataActions } from "@/hooks/useMapDataActions";
import { useMasterPlan } from "@/hooks/useMasterPlan";
import { useObjects } from "@/hooks/useObjects";
import { useFunctionTypes } from "@/hooks/useFunctionTypes";
import { useObjectTypes } from "@/hooks/useObjectTypes";
import { useProjects } from "@/hooks/useProjects";

export function AppLayout() {
  const [geometryEditTarget, setGeometryEditTarget] =
    useState<GeometryEditTarget>(null);
  const [flyToTarget, setFlyToTarget] = useState<GeometryEditTarget>(null);
  const [activeProjectId, setActiveProjectId] = useState<number | null>(null);
  const [newMasterPlanPlacement, setNewMasterPlanPlacement] =
    useState<NewMasterPlanPlacement>(null);
  const [pendingNewMasterPlanGeometry, setPendingNewMasterPlanGeometry] =
    useState<GeoJSONGeometry | null>(null);
  const [objectsLayerVisible, setObjectsLayerVisible] = useState(true);

  const {
    masterPlans,
    activeId,
    setActiveId,
    loading: masterPlansLoading,
    error: masterPlansError,
    refetch: refetchMasterPlans,
  } = useMasterPlan();
  const { objectTypes } = useObjectTypes();
  const { functionTypes } = useFunctionTypes();
  const {
    objects,
    objectIdsInPlan,
    selectedId,
    setSelectedId,
    loading: objectsLoading,
    refetch: refetchObjects,
  } = useObjects(activeId);
  const {
    projects,
    loading: projectsLoading,
    refetch: refetchProjects,
  } = useProjects(undefined);

  const actions = useMapDataActions({
    activeId,
    masterPlans,
    selectedId,
    setSelectedId,
    setActiveId,
  });

  const selectedObject =
    selectedId != null ? objects.find((o) => o.id === selectedId) ?? null : null;

  const mapDataContextValue = {
    masterPlans,
    activeId,
    setActiveId,
    objectTypes,
    functionTypes,
    objects,
    objectIdsInPlan,
    objectsLayerVisible,
    setObjectsLayerVisible,
    selectedId,
    setSelectedId,
    masterPlansLoading,
    masterPlansError,
    objectsLoading,
    geometryEditTarget,
    setGeometryEditTarget,
    flyToTarget,
    setFlyToTarget,
    newMasterPlanPlacement,
    setNewMasterPlanPlacement,
    pendingNewMasterPlanGeometry,
    setPendingNewMasterPlanGeometry,
    refetchMasterPlans,
    refetchObjects,
    projects,
    projectsLoading,
    activeProjectId,
    setActiveProjectId,
    refetchProjects,
    ...actions,
  };

  return (
    <MapDataProvider value={mapDataContextValue}>
      <div className="flex h-screen flex-col">
        <Navbar />
        <div className="flex flex-1 min-h-0">
          <main className="flex-1 min-w-0">
            <MapView />
          </main>
          {selectedObject != null && (
            <ObjectDetailsPanel
              object={selectedObject}
              objectTypes={objectTypes}
              functionTypes={functionTypes}
              onClose={() => setSelectedId(null)}
            />
          )}
          <Sidebar />
        </div>
      </div>
    </MapDataProvider>
  );
}
