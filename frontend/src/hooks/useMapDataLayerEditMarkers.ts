import { useEffect, useRef } from "react";
import L from "leaflet";
import type { GeometryEditTarget } from "@/types/map";
import type { MasterPlan, PlanObject } from "@/types/api";
import {
  MAP_EDIT_MARKERS_PANE,
  MAP_EDIT_PANE_Z_INDEX,
  MAP_LAYER_META_KEY,
} from "@/constants/map";
import { addEditMarkersForShape } from "@/components/map/mapEditMarkers";
import {
  getRing,
  layerMatchesEditTarget,
  layerToGeoJSON,
  setRing,
  type LayerWithMeta,
} from "@/components/map/mapLayerUtils";

export interface UseMapDataLayerEditMarkersParams {
  map: L.Map;
  featureGroupRef: React.RefObject<L.FeatureGroup | null>;
  editMarkerGroupsByLayerRef: React.MutableRefObject<
    Map<L.Layer, L.LayerGroup>
  >;
  originalRingCoordinatesRef: React.MutableRefObject<Map<L.Layer, L.LatLng[]>>;
  editingTargetRef: React.MutableRefObject<GeometryEditTarget | null>;
  layersCacheKeyRef: React.MutableRefObject<string | null>;
  editMode: boolean;
  setEditMode: (v: boolean) => void;
  currentEditTarget: GeometryEditTarget;
  setCurrentEditTarget: (v: GeometryEditTarget) => void;
  editActionsRef: React.MutableRefObject<{
    save: () => void | Promise<void>;
    cancel: () => void;
  } | null>;
  geometryEditTarget: GeometryEditTarget;
  setGeometryEditTarget: (v: GeometryEditTarget) => void;
  masterPlans: MasterPlan[];
  objects: PlanObject[];
  onMasterPlanGeometryChange: (
    planId: number,
    geometry: Record<string, unknown>
  ) => Promise<void>;
}

/** Side-effect only hook: manages edit markers, save/cancel, and geometry-edit target sync. */
export function useMapDataLayerEditMarkers({
  map,
  featureGroupRef,
  editMarkerGroupsByLayerRef,
  originalRingCoordinatesRef,
  editingTargetRef,
  layersCacheKeyRef,
  editMode,
  setEditMode,
  currentEditTarget,
  setCurrentEditTarget,
  editActionsRef,
  geometryEditTarget,
  setGeometryEditTarget,
  masterPlans,
  objects,
  onMasterPlanGeometryChange,
}: UseMapDataLayerEditMarkersParams): void {
  const editModeRef = useRef(editMode);
  editModeRef.current = editMode;

  useEffect(() => {
    if (!editMode || !featureGroupRef.current) {
      editMarkerGroupsByLayerRef.current.forEach((editMarkerGroup) => {
        map.removeLayer(editMarkerGroup);
        editMarkerGroup.clearLayers();
      });
      editMarkerGroupsByLayerRef.current.clear();
      originalRingCoordinatesRef.current.clear();
      editingTargetRef.current = null;
      setCurrentEditTarget(null);
      return;
    }

    editMarkerGroupsByLayerRef.current.forEach((editMarkerGroup) => {
      map.removeLayer(editMarkerGroup);
      editMarkerGroup.clearLayers();
    });
    editMarkerGroupsByLayerRef.current.clear();
    originalRingCoordinatesRef.current.clear();

    const featureGroup = featureGroupRef.current;
    const editMarkerGroupsByLayer = editMarkerGroupsByLayerRef.current;
    const originalRingCoordinates = originalRingCoordinatesRef.current;
    const target = currentEditTarget;
    editingTargetRef.current = target;

    if (!map.getPane(MAP_EDIT_MARKERS_PANE)) {
      const editPane = map.createPane(MAP_EDIT_MARKERS_PANE);
      editPane.style.zIndex = MAP_EDIT_PANE_Z_INDEX;
    }

    const cleanups: (() => void)[] = [];

    featureGroup.eachLayer((layer) => {
      if (!(layer instanceof L.Polygon) && !(layer instanceof L.Polyline))
        return;
      if (target !== null) {
        if (!layerMatchesEditTarget(layer, target)) return;
      }
      const shape = layer as L.Polygon | L.Polyline;
      const ring = getRing(shape);
      if (ring.length === 0) return;
      originalRingCoordinates.set(
        layer,
        ring.map((ll: L.LatLng) => L.latLng(ll.lat, ll.lng))
      );
      const group = new L.LayerGroup([], { pane: MAP_EDIT_MARKERS_PANE });
      addEditMarkersForShape(map, shape, group, {
        pane: MAP_EDIT_MARKERS_PANE,
      });
      group.addTo(map);
      editMarkerGroupsByLayer.set(layer, group);

      let startLatLng: L.LatLng | null = null;
      let startRing: L.LatLng[] | null = null;
      const onPolygonMouseDown = (e: L.LeafletMouseEvent) => {
        L.DomEvent.stopPropagation(e.originalEvent);
        startLatLng = e.latlng;
        startRing = getRing(shape).map((ll: L.LatLng) =>
          L.latLng(ll.lat, ll.lng)
        );
        map.removeLayer(group);
        map.getContainer().style.cursor = "grabbing";
        map.dragging.disable();
        map.on("mousemove", onMapMove);
        map.once("mouseup", onMapUp);
      };
      const onMapMove = (e: L.LeafletMouseEvent) => {
        if (!startLatLng || !startRing) return;
        const dLat = e.latlng.lat - startLatLng.lat;
        const dLng = e.latlng.lng - startLatLng.lng;
        const newRing = startRing.map((ll: L.LatLng) =>
          L.latLng(ll.lat + dLat, ll.lng + dLng)
        );
        setRing(shape, newRing);
        shape.redraw?.();
      };
      const onMapUp = () => {
        map.getContainer().style.cursor = "";
        map.dragging.enable();
        map.off("mousemove", onMapMove);
        startLatLng = null;
        startRing = null;
        const editGroup = editMarkerGroupsByLayerRef.current.get(layer);
        if (editGroup) {
          editGroup.clearLayers();
          addEditMarkersForShape(map, shape, editGroup, {
            pane: MAP_EDIT_MARKERS_PANE,
          });
          editGroup.addTo(map);
        }
      };
      shape.on("mousedown", onPolygonMouseDown);
      cleanups.push(() => {
        shape.off("mousedown", onPolygonMouseDown);
      });
    });

    return () => {
      cleanups.forEach((cleanup) => cleanup());
      editMarkerGroupsByLayer.forEach((editMarkerGroup) => {
        map.removeLayer(editMarkerGroup);
        editMarkerGroup.clearLayers();
      });
      editMarkerGroupsByLayer.clear();
      originalRingCoordinates.clear();
    };
  }, [editMode, map, masterPlans.length, objects.length, currentEditTarget]);

  useEffect(() => {
    const el = map.getContainer();
    if (editMode) {
      el.classList.add("leaflet-edit-mode");
      return () => el.classList.remove("leaflet-edit-mode");
    }
    el.classList.remove("leaflet-edit-mode");
  }, [editMode, map]);

  useEffect(() => {
    if (!editMode || !currentEditTarget) return;
    const stillExists =
      currentEditTarget.type === "object"
        ? objects.some((o) => o.id === currentEditTarget.id)
        : masterPlans.some((p) => p.id === currentEditTarget.id);
    if (!stillExists) {
      setEditMode(false);
      setCurrentEditTarget(null);
      editingTargetRef.current = null;
    }
  }, [editMode, currentEditTarget, objects, masterPlans, setEditMode]);

  useEffect(() => {
    editActionsRef.current = {
      async save() {
        const featureGroup = featureGroupRef.current;
        if (!featureGroup) return;
        const promises: Promise<void>[] = [];
        featureGroup.eachLayer((layer: L.Layer) => {
          const withMeta = layer as LayerWithMeta;
          const meta = withMeta[MAP_LAYER_META_KEY];
          if (!meta || meta.kind !== "masterPlan") return;
          const geometry = layerToGeoJSON(layer);
          if (!geometry) return;
          const geometryPayload = geometry as unknown as Record<
            string,
            unknown
          >;
          promises.push(onMasterPlanGeometryChange(meta.id, geometryPayload));
        });
        await Promise.all(promises);
        editMarkerGroupsByLayerRef.current.forEach((editMarkerGroup) => {
          map.removeLayer(editMarkerGroup);
          editMarkerGroup.clearLayers();
        });
        editMarkerGroupsByLayerRef.current.clear();
        originalRingCoordinatesRef.current.clear();
        editingTargetRef.current = null;
      },
      cancel() {
        const originalRingCoordinates = originalRingCoordinatesRef.current;
        editMarkerGroupsByLayerRef.current.forEach((editMarkerGroup, layer) => {
          const orig = originalRingCoordinates.get(layer);
          if (
            orig &&
            (layer instanceof L.Polygon || layer instanceof L.Polyline)
          ) {
            setRing(layer as L.Polygon | L.Polyline, orig);
            (layer as L.Polygon).redraw?.();
          }
          map.removeLayer(editMarkerGroup);
          editMarkerGroup.clearLayers();
        });
        editMarkerGroupsByLayerRef.current.clear();
        originalRingCoordinatesRef.current.clear();
        editingTargetRef.current = null;
        layersCacheKeyRef.current = null;
      },
    };
    return () => {
      editActionsRef.current = null;
    };
  }, [map, onMasterPlanGeometryChange, editActionsRef]);

  useEffect(() => {
    if (!geometryEditTarget || !featureGroupRef.current) return;
    if (geometryEditTarget.type === "object") {
      setGeometryEditTarget(null);
      return;
    }
    const featureGroup = featureGroupRef.current;
    let found: L.Layer | null = null;
    featureGroup.eachLayer((layer) => {
      const withMeta = layer as LayerWithMeta;
      const meta = withMeta[MAP_LAYER_META_KEY];
      if (!meta) return;
      if (
        geometryEditTarget.type === "masterPlan" &&
        meta.kind === "masterPlan" &&
        meta.id === geometryEditTarget.id
      )
        found = layer;
    });
    if (!found) {
      setGeometryEditTarget(null);
      return;
    }
    editingTargetRef.current = geometryEditTarget;
    setCurrentEditTarget(geometryEditTarget);
    setEditMode(true);
    setGeometryEditTarget(null);
  }, [geometryEditTarget, map, setGeometryEditTarget, setEditMode]);
}
