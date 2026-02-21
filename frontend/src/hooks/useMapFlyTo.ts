import { useEffect, type RefObject } from "react";
import L from "leaflet";
import type { GeometryEditTarget } from "@/types/map";
import { getBoundsForLayer } from "@/components/map/mapLayerUtils";
import {
  flyToBounds,
  getFlyOptionsForObject,
  getFlyOptionsForPlan,
} from "@/lib/mapFlyTo";
import type { LayerWithMeta } from "@/components/map/mapLayerUtils";
import { MAP_LAYER_META_KEY } from "@/constants/map";

/**
 * Fly map to the layer matching flyToTarget (plan or object), then clear flyToTarget.
 */
export function useMapFlyTo(
  map: L.Map,
  flyToTarget: GeometryEditTarget,
  setFlyToTarget: (target: GeometryEditTarget) => void,
  featureGroupRef: RefObject<L.FeatureGroup | null>
): void {
  useEffect(() => {
    if (!flyToTarget || !featureGroupRef.current) return;
    const featureGroup = featureGroupRef.current;
    let found: L.Layer | null = null;
    featureGroup.eachLayer((layer) => {
      const withMeta = layer as LayerWithMeta;
      const meta = withMeta[MAP_LAYER_META_KEY];
      if (!meta) return;
      if (
        flyToTarget.type === "masterPlan" &&
        meta.kind === "masterPlan" &&
        meta.id === flyToTarget.id
      )
        found = layer;
      if (
        flyToTarget.type === "object" &&
        meta.kind === "object" &&
        meta.id === flyToTarget.id
      )
        found = layer;
    });
    const bounds = found ? getBoundsForLayer(found) : null;
    if (bounds) {
      const options =
        flyToTarget.type === "object"
          ? getFlyOptionsForObject()
          : getFlyOptionsForPlan();
      flyToBounds(map, bounds, options);
    }
    setFlyToTarget(null);
  }, [flyToTarget, map, setFlyToTarget]);
}
