import L from "leaflet";
import {
  MAP_FLY_DURATION_MS,
  MAP_FLY_MAX_ZOOM_DEFAULT,
  MAP_FLY_MAX_ZOOM_OBJECT,
  MAP_FLY_MAX_ZOOM_PLAN,
  MAP_FLY_PADDING_DEFAULT,
  MAP_FLY_PADDING_OBJECT,
  MAP_FLY_PADDING_PLAN,
} from "@/constants/map";
import type { MapFlyOptions } from "@/types/map";

export type { MapFlyOptions };

/** Shared config for map fly/fitBounds. Used when "See on map" is clicked. */
export const MAP_FLY_CONFIG = {
  durationMs: MAP_FLY_DURATION_MS,
  plan: {
    paddingPx: MAP_FLY_PADDING_PLAN,
    maxZoom: MAP_FLY_MAX_ZOOM_PLAN,
  },
  object: {
    paddingPx: MAP_FLY_PADDING_OBJECT,
    maxZoom: MAP_FLY_MAX_ZOOM_OBJECT,
  },
  paddingPx: MAP_FLY_PADDING_DEFAULT,
  maxZoom: MAP_FLY_MAX_ZOOM_DEFAULT,
} as const;

/** Options for Leaflet flyToBounds. */
export function getFlyOptions(overrides?: MapFlyOptions) {
  const { durationMs, paddingPx, maxZoom } = MAP_FLY_CONFIG;
  return {
    duration: (overrides?.duration ?? durationMs) / 1000,
    maxZoom: overrides?.maxZoom ?? maxZoom,
    padding: overrides?.padding ?? paddingPx,
  };
}

/** Options when flying to an object (zoom in more). */
export function getFlyOptionsForObject(): MapFlyOptions {
  return {
    padding: MAP_FLY_CONFIG.object.paddingPx,
    maxZoom: MAP_FLY_CONFIG.object.maxZoom,
  };
}

/** Options when flying to a master plan. */
export function getFlyOptionsForPlan(): MapFlyOptions {
  return {
    padding: MAP_FLY_CONFIG.plan.paddingPx,
    maxZoom: MAP_FLY_CONFIG.plan.maxZoom,
  };
}

/** Fly map to bounds (e.g. when user clicks "See on map"). */
export function flyToBounds(
  map: L.Map,
  bounds: L.LatLngBounds,
  options?: MapFlyOptions
): void {
  map.stop();
  map.flyToBounds(bounds, getFlyOptions(options));
}
