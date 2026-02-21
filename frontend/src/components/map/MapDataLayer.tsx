import { useEffect, useRef, useState } from "react";
import { useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { useMapData } from "@/contexts/MapDataContext";
import type { GeometryEditTarget } from "@/types/map";
import { useMapEdit } from "@/contexts/MapEditContext";
import { useMapFlyTo } from "@/hooks/useMapFlyTo";
import {
  MAP_FILL_OPACITY_OBJECT_IN_PLAN,
  MAP_FILL_OPACITY_OBJECT_OUTSIDE,
  MAP_FILL_OPACITY_OBJECT_SELECTED,
  MAP_FILL_OPACITY_PLAN_MUTED,
  MAP_FILL_OPACITY_PLAN_SELECTED,
  MAP_LAYER_META_KEY,
  MAP_PLAN_DASH_ARRAY,
  MAP_STROKE_WEIGHT_IN_PLAN,
  MAP_STROKE_WEIGHT_MUTED,
  MAP_STROKE_WEIGHT_OBJECT_SELECTED,
  MAP_STROKE_WEIGHT_PLAN_SELECTED,
} from "@/constants/map";
import {
  createObjectMarkerIcon,
  getMutedColor,
  getPrimaryColor,
  getPointFromGeometry,
  getRing,
  hasGeometry,
  layerMatchesEditTarget,
  pointInGeometry,
  setRing,
  type LayerWithMeta,
} from "@/components/map/mapLayerUtils";
import { useMapDataLayerEditMarkers } from "@/hooks/useMapDataLayerEditMarkers";
import { getThemeColor } from "@/lib/theme";

export function MapDataLayer() {
  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());

  useMapEvents({
    zoomend: () => setZoom(map.getZoom()),
  });

  const {
    masterPlans,
    objects,
    objectIdsInPlan,
    objectsLayerVisible,
    activeId,
    setActiveId,
    selectedId,
    setSelectedId,
    geometryEditTarget,
    setGeometryEditTarget,
    flyToTarget,
    setFlyToTarget,
    onMasterPlanGeometryChange,
    newMasterPlanPlacement,
  } = useMapData();

  const { editMode, setEditMode, editActionsRef } = useMapEdit();

  const featureGroupRef = useRef<L.FeatureGroup | null>(null);
  const editMarkerGroupsByLayerRef = useRef<Map<L.Layer, L.LayerGroup>>(
    new Map()
  );
  const originalRingCoordinatesRef = useRef<Map<L.Layer, L.LatLng[]>>(
    new Map()
  );
  const editingTargetRef = useRef<GeometryEditTarget | null>(null);
  const layersCacheKeyRef = useRef<string | null>(null);
  const skipCleanupOnceRef = useRef(false);
  const primaryColor = getPrimaryColor();
  const [currentEditTarget, setCurrentEditTarget] =
    useState<GeometryEditTarget>(null);
  const editModeRef = useRef(editMode);
  editModeRef.current = editMode;

  useMapFlyTo(map, flyToTarget, setFlyToTarget, featureGroupRef);

  useMapDataLayerEditMarkers({
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
  });

  useEffect(() => {
    const mapInstance = map;
    const plansWithGeometry = masterPlans.filter((plan) =>
      hasGeometry(plan.geometry)
    );
    const objectsWithGeometry = objects.filter((obj) =>
      hasGeometry(obj.geometry)
    );
    const mutedColor = getMutedColor();
    const dataSignatureKey =
      JSON.stringify({
        plans: plansWithGeometry.map((p) => ({ id: p.id, g: p.geometry })),
        objects: objectsWithGeometry.map((o) => ({ id: o.id, g: o.geometry })),
      }) +
      "|" +
      String(activeId) +
      "|" +
      JSON.stringify(objectIdsInPlan) +
      "|" +
      primaryColor +
      "|" +
      mutedColor +
      "|" +
      String(objectsLayerVisible);

    if (
      layersCacheKeyRef.current === dataSignatureKey &&
      featureGroupRef.current
    ) {
      skipCleanupOnceRef.current = true;
      return () => {
        if (skipCleanupOnceRef.current) {
          skipCleanupOnceRef.current = false;
          return;
        }
        editMarkerGroupsByLayerRef.current.forEach((editMarkerGroup) => {
          mapInstance.removeLayer(editMarkerGroup);
          editMarkerGroup.clearLayers();
        });
        editMarkerGroupsByLayerRef.current.clear();
        originalRingCoordinatesRef.current.clear();
        if (featureGroupRef.current && !editModeRef.current) {
          mapInstance.removeLayer(featureGroupRef.current);
        }
      };
    }
    skipCleanupOnceRef.current = false;
    layersCacheKeyRef.current = dataSignatureKey;

    let featureGroup = featureGroupRef.current;
    if (!featureGroup) {
      featureGroup = new L.FeatureGroup();
      featureGroupRef.current = featureGroup;
    }

    let savedRing: L.LatLng[] | null = null;
    if (
      editModeRef.current &&
      currentEditTarget &&
      featureGroup.getLayers().length > 0
    ) {
      featureGroup.eachLayer((layer) => {
        if (savedRing !== null) return;
        if (
          (layer instanceof L.Polygon || layer instanceof L.Polyline) &&
          layerMatchesEditTarget(layer, currentEditTarget)
        ) {
          savedRing = getRing(layer).map((ll: L.LatLng) =>
            L.latLng(ll.lat, ll.lng)
          );
        }
      });
    }
    editMarkerGroupsByLayerRef.current.forEach((editMarkerGroup) => {
      mapInstance.removeLayer(editMarkerGroup);
      editMarkerGroup.clearLayers();
    });
    editMarkerGroupsByLayerRef.current.clear();
    originalRingCoordinatesRef.current.clear();

    featureGroup.clearLayers();

    const zoneSelectedColor =
      getThemeColor("zone-selected-border") || primaryColor;
    const zoneMutedColor = getThemeColor("zone-border") || primaryColor;

    plansWithGeometry.forEach((plan) => {
      const isSelected = plan.id === activeId;
      const planColor = isSelected ? zoneSelectedColor : zoneMutedColor;
      const planWeight = isSelected
        ? MAP_STROKE_WEIGHT_PLAN_SELECTED
        : MAP_STROKE_WEIGHT_MUTED;
      const planFillOpacity = isSelected
        ? MAP_FILL_OPACITY_PLAN_SELECTED
        : MAP_FILL_OPACITY_PLAN_MUTED;
      const geometry = plan.geometry as { type: string; coordinates: unknown };
      const layer = L.geoJSON(
        {
          type: "Feature",
          geometry: geometry as GeoJSON.Geometry,
          properties: {},
        } as GeoJSON.Feature,
        {
          style: () => ({
            color: planColor,
            weight: planWeight,
            fillColor: planColor,
            fillOpacity: planFillOpacity,
            dashArray: isSelected ? MAP_PLAN_DASH_ARRAY : undefined,
          }),
        }
      );
      if (layer.getLayers().length > 0) {
        const firstLayer = layer.getLayers()[0] as LayerWithMeta & L.Polygon;
        firstLayer[MAP_LAYER_META_KEY] = { kind: "masterPlan", id: plan.id };
        firstLayer.on("click", () => {
          setActiveId(plan.id);
          setGeometryEditTarget({ type: "masterPlan", id: plan.id });
        });
        featureGroup!.addLayer(firstLayer);
      }
    });

    if (objectsLayerVisible) {
      const strokeColor =
        getThemeColor("border") || getThemeColor("primary") || primaryColor;
      objectsWithGeometry.forEach((obj) => {
        const geometry = obj.geometry as { type: string; coordinates: unknown };
        if (geometry.type !== "Point") return;
        const isInPlan = activeId !== null && objectIdsInPlan.includes(obj.id);
        const objColor = isInPlan ? primaryColor : mutedColor;
        const icon = createObjectMarkerIcon(
          false,
          isInPlan,
          objColor,
          strokeColor,
          map.getZoom()
        );
        const layer = L.geoJSON(
          {
            type: "Feature",
            geometry: geometry as GeoJSON.Geometry,
            properties: {},
          } as GeoJSON.Feature,
          {
            pointToLayer: (_feature, latlng) => L.marker(latlng, { icon }),
          }
        );
        if (layer.getLayers().length > 0) {
          const pointLayer = layer.getLayers()[0] as LayerWithMeta & L.Marker;
          pointLayer[MAP_LAYER_META_KEY] = { kind: "object", id: obj.id };
          pointLayer.on("click", () => {
            const pt = getPointFromGeometry(geometry);
            if (pt) {
              const plan = plansWithGeometry.find(
                (p) =>
                  hasGeometry(p.geometry) &&
                  pointInGeometry(
                    pt[0],
                    pt[1],
                    p.geometry as { type: string; coordinates: unknown }
                  )
              );
              if (plan) setActiveId(plan.id);
            }
            setSelectedId(obj.id);
          });
          featureGroup!.addLayer(pointLayer);
        }
      });
    }

    if (savedRing !== null && currentEditTarget) {
      featureGroup.eachLayer((layer) => {
        if (
          (layer instanceof L.Polygon || layer instanceof L.Polyline) &&
          layerMatchesEditTarget(layer, currentEditTarget)
        ) {
          setRing(layer, savedRing!);
          layer.redraw?.();
        }
      });
    }

    featureGroup.addTo(mapInstance);

    return () => {
      editMarkerGroupsByLayerRef.current.forEach((editMarkerGroup) => {
        mapInstance.removeLayer(editMarkerGroup);
        editMarkerGroup.clearLayers();
      });
      editMarkerGroupsByLayerRef.current.clear();
      originalRingCoordinatesRef.current.clear();
      if (featureGroupRef.current && !editModeRef.current) {
        mapInstance.removeLayer(featureGroupRef.current);
        layersCacheKeyRef.current = null;
      }
    };
  }, [
    map,
    masterPlans,
    objects,
    objectIdsInPlan,
    objectsLayerVisible,
    activeId,
    setActiveId,
    primaryColor,
    setSelectedId,
    setGeometryEditTarget,
    editMode,
    currentEditTarget,
  ]);

  useEffect(() => {
    const featureGroup = featureGroupRef.current;
    if (!featureGroup) return;
    const muted = getMutedColor();
    const strokeColor =
      getThemeColor("border") || getThemeColor("primary") || primaryColor;
    featureGroup.eachLayer((layer) => {
      const meta = (layer as LayerWithMeta)[MAP_LAYER_META_KEY];
      if (!meta || meta.kind !== "object") return;
      const isSelected = meta.id === selectedId;
      const isInPlan = activeId !== null && objectIdsInPlan.includes(meta.id);
      const objColor = isInPlan ? primaryColor : muted;
      if (layer instanceof L.Marker) {
        layer.setIcon(
          createObjectMarkerIcon(
            isSelected,
            isInPlan,
            objColor,
            strokeColor,
            zoom
          )
        );
      } else if (layer instanceof L.Polygon || layer instanceof L.Polyline) {
        layer.setStyle({
          weight: isSelected
            ? MAP_STROKE_WEIGHT_OBJECT_SELECTED
            : isInPlan
              ? MAP_STROKE_WEIGHT_IN_PLAN
              : MAP_STROKE_WEIGHT_MUTED,
          fillOpacity: isSelected
            ? MAP_FILL_OPACITY_OBJECT_SELECTED
            : isInPlan
              ? MAP_FILL_OPACITY_OBJECT_IN_PLAN
              : MAP_FILL_OPACITY_OBJECT_OUTSIDE,
          color: objColor,
          fillColor: objColor,
        });
      }
    });
  }, [selectedId, primaryColor, activeId, objectIdsInPlan, zoom]);

  useEffect(() => {
    const pane = map.getPane("overlayPane");
    if (!pane) return;
    if (newMasterPlanPlacement !== null) {
      pane.style.pointerEvents = "none";
    } else {
      pane.style.pointerEvents = "";
    }
    return () => {
      pane.style.pointerEvents = "";
    };
  }, [map, newMasterPlanPlacement]);

  return null;
}
