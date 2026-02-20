import { useEffect, useRef, useState } from "react";
import { useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { useMapData } from "@/contexts/MapDataContext";
import type { GeometryEditTarget } from "@/types/map";
import { useMapEdit } from "@/contexts/MapEditContext";
import { useMapDataLayerFlyTo } from "@/hooks/useMapDataLayerFlyTo";
import {
  MAP_EDIT_MARKERS_PANE,
  MAP_EDIT_PANE_Z_INDEX,
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
import { addEditMarkersForShape } from "@/components/map/MapEditMarkers";
import {
  createObjectMarkerIcon,
  getMutedColor,
  getPrimaryColor,
  getPointFromGeometry,
  getRing,
  hasGeometry,
  layerMatchesEditTarget,
  layerToGeoJSON,
  pointInGeometry,
  setRing,
  type LayerWithMeta,
} from "@/components/map/MapLayerUtils";
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

  useMapDataLayerFlyTo(map, flyToTarget, setFlyToTarget, featureGroupRef);

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

  return null;
}
