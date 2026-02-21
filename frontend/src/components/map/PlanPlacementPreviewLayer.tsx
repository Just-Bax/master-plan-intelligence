import { useEffect, useRef } from "react";
import { useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { useMapData } from "@/contexts/MapDataContext";
import {
  MAP_PLACEMENT_CORNERS_COUNT,
  MAP_PLACEMENT_DEFAULT_RADIUS_M,
  MAP_PLACEMENT_MAX_RADIUS_M,
  MAP_PLACEMENT_MIN_RADIUS_M,
} from "@/constants/map";
import {
  clearPlacementPreview,
  drawPlacementPreview,
  getPlacementColor,
} from "@/lib/planPlacementDrawing";

/** Map layer that shows the preview (circle or corners) while placing a new plan. */
export function PlanPlacementPreviewLayer() {
  const map = useMap();
  const { newMasterPlanPlacement, setNewMasterPlanPlacement } = useMapData();
  const circleLayerRef = useRef<L.Polygon | null>(null);
  const centerMarkerRef = useRef<L.CircleMarker | null>(null);
  const cornersPolygonRef = useRef<L.Polygon | null>(null);
  const previewLineRef = useRef<L.Polyline | null>(null);

  const refs = {
    circleLayer: circleLayerRef,
    centerMarker: centerMarkerRef,
    cornersPolygon: cornersPolygonRef,
    previewLine: previewLineRef,
  };

  useEffect(() => {
    drawPlacementPreview(map, newMasterPlanPlacement, refs);
    return () => clearPlacementPreview(map, refs);
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
