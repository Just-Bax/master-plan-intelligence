import type { NewMasterPlanPlacement } from "@/types/map";
import type { GeoJSONGeometry } from "@/types/api";
import { MAP_PLACEMENT_CORNERS_COUNT } from "@/constants/map";
import { circleToPolygon } from "@/lib/geoCircle";

export function isPlacementComplete(
  placement: NonNullable<NewMasterPlanPlacement>
): boolean {
  if (placement.mode === "radius") {
    return placement.center !== null && placement.radiusFixed === true;
  }
  return placement.points.length === MAP_PLACEMENT_CORNERS_COUNT;
}

export function placementToPolygon(
  placement: NonNullable<NewMasterPlanPlacement>
): GeoJSONGeometry | null {
  if (placement.mode === "radius") {
    if (!placement.center) return null;
    return circleToPolygon(
      placement.center[0],
      placement.center[1],
      placement.radiusM
    );
  }
  if (placement.points.length !== MAP_PLACEMENT_CORNERS_COUNT) return null;
  const ring = [...placement.points, placement.points[0]].map(
    ([lng, lat]) => [lng, lat] as [number, number]
  );
  return { type: "Polygon", coordinates: [ring] };
}
