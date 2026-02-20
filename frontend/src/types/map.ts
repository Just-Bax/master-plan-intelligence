/**
 * Map and layer types: edit targets, placement draft, fly options, edit actions.
 * Reusable across map components, contexts, and hooks.
 */

/** Target for geometry editing or fly-to: a master plan zone or an object. */
export type GeometryEditTarget =
  | { type: "masterPlan"; id: number }
  | { type: "object"; id: number }
  | null;

/** Mode when drawing a new master plan on the map (radius circle or 4 corners). */
export type MasterPlanPlacementMode = "radius" | "corners";

/** Draft state while user is placing a new master plan on the map. */
export type NewMasterPlanPlacement =
  | {
      mode: "radius";
      center: [number, number] | null;
      radiusM: number;
      radiusFixed?: boolean;
    }
  | {
      mode: "corners";
      /** [lng, lat] per point; 0–4 points. */
      points: [number, number][];
    }
  | null;

/** Metadata stored on a Leaflet layer: identifies master plan zone or object. */
export type MapLayerMeta =
  | { kind: "masterPlan"; id: number }
  | { kind: "object"; id: number };

/** Options for map flyToBounds (duration, padding, maxZoom). */
export type MapFlyOptions = {
  duration?: number;
  padding?: [number, number];
  maxZoom?: number;
};

/** Actions exposed by map edit mode (save geometry, cancel). */
export interface MapEditActions {
  save: () => void | Promise<void>;
  cancel: () => void;
}
