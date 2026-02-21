import L from "leaflet";
import type { NewMasterPlanPlacement } from "@/types/map";
import { circleToPolygon } from "@/lib/geoCircle";
import { getThemeColor } from "@/lib/theme";
import {
  MAP_FALLBACK_BACKGROUND,
  MAP_FALLBACK_PRIMARY,
  MAP_FILL_OPACITY_PLAN_SELECTED,
  MAP_PLACEMENT_CORNERS_COUNT,
  MAP_STROKE_WEIGHT_PLAN_SELECTED,
} from "@/constants/map";

export interface PlanPlacementRefs {
  circleLayer: React.MutableRefObject<L.Polygon | null>;
  centerMarker: React.MutableRefObject<L.CircleMarker | null>;
  cornersPolygon: React.MutableRefObject<L.Polygon | null>;
  previewLine: React.MutableRefObject<L.Polyline | null>;
}

function getPlacementColor(): string {
  return getThemeColor("primary") || MAP_FALLBACK_PRIMARY;
}

const polygonStyle = (color: string) => ({
  color,
  weight: MAP_STROKE_WEIGHT_PLAN_SELECTED,
  fillColor: color,
  fillOpacity: MAP_FILL_OPACITY_PLAN_SELECTED,
});

/** Remove all placement preview layers from the map and clear refs. */
export function clearPlacementPreview(
  map: L.Map,
  refs: PlanPlacementRefs
): void {
  if (refs.circleLayer.current) {
    map.removeLayer(refs.circleLayer.current);
    refs.circleLayer.current = null;
  }
  if (refs.centerMarker.current) {
    map.removeLayer(refs.centerMarker.current);
    refs.centerMarker.current = null;
  }
  if (refs.cornersPolygon.current) {
    map.removeLayer(refs.cornersPolygon.current);
    refs.cornersPolygon.current = null;
  }
  if (refs.previewLine.current) {
    map.removeLayer(refs.previewLine.current);
    refs.previewLine.current = null;
  }
}

/** Draw radius-mode preview: circle polygon + center marker. */
function drawRadiusPreview(
  map: L.Map,
  placement: Extract<NewMasterPlanPlacement, { mode: "radius" }>,
  refs: PlanPlacementRefs
): void {
  const color = getPlacementColor();
  const { center, radiusM } = placement;

  if (center) {
    const polygon = circleToPolygon(center[0], center[1], radiusM);
    const ring = polygon.coordinates[0].map(
      (c) => L.latLng(c[1], c[0]) as L.LatLngExpression
    );
    if (refs.circleLayer.current) {
      refs.circleLayer.current.setLatLngs([ring]);
      refs.circleLayer.current.setStyle(polygonStyle(color));
    } else {
      const layer = L.polygon([ring], polygonStyle(color));
      layer.addTo(map);
      refs.circleLayer.current = layer;
    }
    const centerFill =
      getThemeColor("background") ||
      getThemeColor("card") ||
      MAP_FALLBACK_BACKGROUND;
    if (!refs.centerMarker.current) {
      const marker = L.circleMarker(L.latLng(center[1], center[0]), {
        radius: 11,
        fillColor: centerFill,
        color,
        weight: 3,
        fillOpacity: 1,
      });
      marker.addTo(map);
      refs.centerMarker.current = marker;
    } else {
      refs.centerMarker.current.setLatLng(L.latLng(center[1], center[0]));
    }
  } else {
    if (refs.circleLayer.current) {
      map.removeLayer(refs.circleLayer.current);
      refs.circleLayer.current = null;
    }
    if (refs.centerMarker.current) {
      map.removeLayer(refs.centerMarker.current);
      refs.centerMarker.current = null;
    }
  }
  if (refs.cornersPolygon.current) {
    map.removeLayer(refs.cornersPolygon.current);
    refs.cornersPolygon.current = null;
  }
  if (refs.previewLine.current) {
    map.removeLayer(refs.previewLine.current);
    refs.previewLine.current = null;
  }
}

/** Draw corners-mode preview: polygon (if ≥2 points) and optionally preview line. */
function drawCornersPreview(
  map: L.Map,
  placement: Extract<NewMasterPlanPlacement, { mode: "corners" }>,
  refs: PlanPlacementRefs
): void {
  const color = getPlacementColor();
  const { points } = placement;

  if (refs.circleLayer.current) {
    map.removeLayer(refs.circleLayer.current);
    refs.circleLayer.current = null;
  }
  if (refs.centerMarker.current) {
    map.removeLayer(refs.centerMarker.current);
    refs.centerMarker.current = null;
  }

  if (points.length >= 2) {
    const ring: L.LatLngExpression[] = points.map(([lng, lat]) =>
      L.latLng(lat, lng)
    );
    ring.push(ring[0]);
    if (refs.cornersPolygon.current) {
      refs.cornersPolygon.current.setLatLngs([ring]);
      refs.cornersPolygon.current.setStyle(polygonStyle(color));
    } else {
      const layer = L.polygon([ring], polygonStyle(color));
      layer.addTo(map);
      refs.cornersPolygon.current = layer;
    }
  } else {
    if (refs.cornersPolygon.current) {
      map.removeLayer(refs.cornersPolygon.current);
      refs.cornersPolygon.current = null;
    }
  }
  if (
    points.length >= MAP_PLACEMENT_CORNERS_COUNT &&
    refs.previewLine.current
  ) {
    map.removeLayer(refs.previewLine.current);
    refs.previewLine.current = null;
  }
}

/** Update placement preview layers based on current placement state. */
export function drawPlacementPreview(
  map: L.Map,
  placement: NewMasterPlanPlacement,
  refs: PlanPlacementRefs
): void {
  if (!placement) {
    clearPlacementPreview(map, refs);
    return;
  }
  if (placement.mode === "radius") {
    drawRadiusPreview(map, placement, refs);
  } else {
    drawCornersPreview(map, placement, refs);
  }
}

export { getPlacementColor };
