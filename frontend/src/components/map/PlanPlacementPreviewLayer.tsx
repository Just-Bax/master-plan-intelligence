import { useEffect, useRef } from "react";
import { useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { useMapData } from "@/contexts/MapDataContext";
import { circleToPolygon } from "@/lib/geoCircle";
import { getThemeColor } from "@/lib/theme";
import {
  MAP_FALLBACK_BACKGROUND,
  MAP_FALLBACK_PRIMARY,
  MAP_FILL_OPACITY_PLAN_SELECTED,
  MAP_PLACEMENT_CORNERS_COUNT,
  MAP_PLACEMENT_DEFAULT_RADIUS_M,
  MAP_PLACEMENT_MAX_RADIUS_M,
  MAP_PLACEMENT_MIN_RADIUS_M,
  MAP_STROKE_WEIGHT_PLAN_SELECTED,
} from "@/constants/map";

function getPlacementColor(): string {
  return getThemeColor("primary") || MAP_FALLBACK_PRIMARY;
}

/** Map layer that shows the preview (circle or corners) while placing a new plan. */
export function PlanPlacementPreviewLayer() {
  const map = useMap();
  const { newMasterPlanPlacement, setNewMasterPlanPlacement } = useMapData();
  const circleLayerRef = useRef<L.Polygon | null>(null);
  const centerMarkerRef = useRef<L.CircleMarker | null>(null);
  const cornersPolygonRef = useRef<L.Polygon | null>(null);
  const previewLineRef = useRef<L.Polyline | null>(null);

  // Draw preview: radius (circle + center) or corners (polygon + preview line)
  useEffect(() => {
    if (!newMasterPlanPlacement) {
      if (circleLayerRef.current) {
        map.removeLayer(circleLayerRef.current);
        circleLayerRef.current = null;
      }
      if (centerMarkerRef.current) {
        map.removeLayer(centerMarkerRef.current);
        centerMarkerRef.current = null;
      }
      if (cornersPolygonRef.current) {
        map.removeLayer(cornersPolygonRef.current);
        cornersPolygonRef.current = null;
      }
      if (previewLineRef.current) {
        map.removeLayer(previewLineRef.current);
        previewLineRef.current = null;
      }
      return;
    }

    const color = getPlacementColor();

    if (newMasterPlanPlacement.mode === "radius") {
      const { center, radiusM } = newMasterPlanPlacement;
      if (center) {
        const polygon = circleToPolygon(center[0], center[1], radiusM);
        const ring = polygon.coordinates[0].map(
          (c) => L.latLng(c[1], c[0]) as L.LatLngExpression
        );
        if (circleLayerRef.current) {
          circleLayerRef.current.setLatLngs([ring]);
          circleLayerRef.current.setStyle({
            color,
            weight: MAP_STROKE_WEIGHT_PLAN_SELECTED,
            fillColor: color,
            fillOpacity: MAP_FILL_OPACITY_PLAN_SELECTED,
          });
        } else {
          const layer = L.polygon([ring], {
            color,
            weight: MAP_STROKE_WEIGHT_PLAN_SELECTED,
            fillColor: color,
            fillOpacity: MAP_FILL_OPACITY_PLAN_SELECTED,
          });
          layer.addTo(map);
          circleLayerRef.current = layer;
        }
        if (!centerMarkerRef.current) {
          const centerFill =
            getThemeColor("background") ||
            getThemeColor("card") ||
            MAP_FALLBACK_BACKGROUND;
          const marker = L.circleMarker(L.latLng(center[1], center[0]), {
            radius: 11,
            fillColor: centerFill,
            color,
            weight: 3,
            fillOpacity: 1,
          });
          marker.addTo(map);
          centerMarkerRef.current = marker;
        } else {
          centerMarkerRef.current.setLatLng(L.latLng(center[1], center[0]));
        }
      } else {
        if (circleLayerRef.current) {
          map.removeLayer(circleLayerRef.current);
          circleLayerRef.current = null;
        }
        if (centerMarkerRef.current) {
          map.removeLayer(centerMarkerRef.current);
          centerMarkerRef.current = null;
        }
      }
      if (cornersPolygonRef.current) {
        map.removeLayer(cornersPolygonRef.current);
        cornersPolygonRef.current = null;
      }
      if (previewLineRef.current) {
        map.removeLayer(previewLineRef.current);
        previewLineRef.current = null;
      }
      return;
    }

    // mode === "corners"
    if (circleLayerRef.current) {
      map.removeLayer(circleLayerRef.current);
      circleLayerRef.current = null;
    }
    if (centerMarkerRef.current) {
      map.removeLayer(centerMarkerRef.current);
      centerMarkerRef.current = null;
    }

    const { points } = newMasterPlanPlacement;
    if (points.length >= 2) {
      const ring: L.LatLngExpression[] = points.map(([lng, lat]) =>
        L.latLng(lat, lng)
      );
      ring.push(ring[0]);
      if (cornersPolygonRef.current) {
        cornersPolygonRef.current.setLatLngs([ring]);
        cornersPolygonRef.current.setStyle({
          color,
          weight: MAP_STROKE_WEIGHT_PLAN_SELECTED,
          fillColor: color,
          fillOpacity: MAP_FILL_OPACITY_PLAN_SELECTED,
        });
      } else {
        const layer = L.polygon([ring], {
          color,
          weight: MAP_STROKE_WEIGHT_PLAN_SELECTED,
          fillColor: color,
          fillOpacity: MAP_FILL_OPACITY_PLAN_SELECTED,
        });
        layer.addTo(map);
        cornersPolygonRef.current = layer;
      }
    } else {
      if (cornersPolygonRef.current) {
        map.removeLayer(cornersPolygonRef.current);
        cornersPolygonRef.current = null;
      }
    }
    if (
      points.length >= MAP_PLACEMENT_CORNERS_COUNT &&
      previewLineRef.current
    ) {
      map.removeLayer(previewLineRef.current);
      previewLineRef.current = null;
    }

    return () => {
      if (circleLayerRef.current) {
        map.removeLayer(circleLayerRef.current);
        circleLayerRef.current = null;
      }
      if (centerMarkerRef.current) {
        map.removeLayer(centerMarkerRef.current);
        centerMarkerRef.current = null;
      }
      if (cornersPolygonRef.current) {
        map.removeLayer(cornersPolygonRef.current);
        cornersPolygonRef.current = null;
      }
      if (previewLineRef.current) {
        map.removeLayer(previewLineRef.current);
        previewLineRef.current = null;
      }
    };
  }, [map, newMasterPlanPlacement]);

  // Cursor feedback: pointer (place center / place corner), grab (define radius)
  useEffect(() => {
    const el = map.getContainer();
    if (!newMasterPlanPlacement) {
      el.style.cursor = "";
      return;
    }
    if (newMasterPlanPlacement.mode === "radius") {
      if (newMasterPlanPlacement.center === null) {
        el.style.cursor = "pointer";
      } else if (!newMasterPlanPlacement.radiusFixed) {
        el.style.cursor = "grab";
      } else {
        el.style.cursor = "pointer";
      }
    } else {
      el.style.cursor = "pointer";
    }
    return () => {
      el.style.cursor = "";
    };
  }, [map, newMasterPlanPlacement]);

  useMapEvents({
    mousedown() {
      if (
        newMasterPlanPlacement?.mode === "radius" &&
        newMasterPlanPlacement.center !== null &&
        !newMasterPlanPlacement.radiusFixed
      ) {
        map.getContainer().style.cursor = "grabbing";
      }
    },
    mouseup() {
      if (newMasterPlanPlacement?.mode === "radius") {
        map.getContainer().style.cursor =
          newMasterPlanPlacement.radiusFixed || !newMasterPlanPlacement.center
            ? "pointer"
            : "grab";
      }
    },
    mousemove(e) {
      if (!newMasterPlanPlacement) return;
      if (newMasterPlanPlacement.mode === "radius") {
        const { center, radiusFixed } = newMasterPlanPlacement;
        if (!center || radiusFixed) return;
        const centerLatLng = L.latLng(center[1], center[0]);
        const distM = map.distance(centerLatLng, e.latlng);
        const clamped = Math.max(
          MAP_PLACEMENT_MIN_RADIUS_M,
          Math.min(MAP_PLACEMENT_MAX_RADIUS_M, Math.round(distM))
        );
        if (clamped !== newMasterPlanPlacement.radiusM) {
          setNewMasterPlanPlacement({
            mode: "radius",
            center,
            radiusM: clamped,
            radiusFixed: false,
          });
        }
        return;
      }
      const { points } = newMasterPlanPlacement;
      if (points.length >= 1 && points.length < MAP_PLACEMENT_CORNERS_COUNT) {
        const last = points[points.length - 1];
        const lastLatLng = L.latLng(last[1], last[0]);
        if (previewLineRef.current) {
          previewLineRef.current.setLatLngs([lastLatLng, e.latlng]);
        } else {
          const line = L.polyline([lastLatLng, e.latlng], {
            color: getPlacementColor(),
            weight: 2,
            dashArray: "4,4",
          });
          line.addTo(map);
          previewLineRef.current = line;
        }
      } else if (previewLineRef.current) {
        map.removeLayer(previewLineRef.current);
        previewLineRef.current = null;
      }
    },
    click(e) {
      if (!newMasterPlanPlacement) return;

      if (newMasterPlanPlacement.mode === "radius") {
        if (newMasterPlanPlacement.center === null) {
          const latlng = e.latlng;
          setNewMasterPlanPlacement({
            mode: "radius",
            center: [latlng.lng, latlng.lat],
            radiusM:
              newMasterPlanPlacement.radiusM ?? MAP_PLACEMENT_DEFAULT_RADIUS_M,
            radiusFixed: false,
          });
        } else if (!newMasterPlanPlacement.radiusFixed) {
          const centerLatLng = L.latLng(
            newMasterPlanPlacement.center[1],
            newMasterPlanPlacement.center[0]
          );
          const distM = map.distance(centerLatLng, e.latlng);
          const clamped = Math.max(
            MAP_PLACEMENT_MIN_RADIUS_M,
            Math.min(MAP_PLACEMENT_MAX_RADIUS_M, Math.round(distM))
          );
          setNewMasterPlanPlacement({
            mode: "radius",
            center: newMasterPlanPlacement.center,
            radiusM: clamped,
            radiusFixed: true,
          });
        }
        return;
      }

      // mode === "corners"
      const { points } = newMasterPlanPlacement;
      if (points.length >= MAP_PLACEMENT_CORNERS_COUNT) return;
      const next: [number, number][] = [
        ...points,
        [e.latlng.lng, e.latlng.lat],
      ];
      setNewMasterPlanPlacement({ mode: "corners", points: next });
    },
  });

  return null;
}
