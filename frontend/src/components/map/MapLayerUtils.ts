import L from "leaflet";
import {
  MAP_DOT_RADIUS_DEFAULT,
  MAP_DOT_RADIUS_MAX,
  MAP_DOT_RADIUS_MIN,
  MAP_DOT_RADIUS_SELECTED,
  MAP_FALLBACK_MUTED,
  MAP_FALLBACK_PRIMARY,
  MAP_FILL_OPACITY_DOT_IN_PLAN,
  MAP_FILL_OPACITY_DOT_OUTSIDE,
  MAP_LAYER_META_KEY,
  MAP_PIN_ICON_SIZE,
  MAP_PIN_ICON_SIZE_MIN,
  MAP_PIN_ZOOM_REF,
  MAP_STROKE_WEIGHT_DOT,
  MAP_STROKE_WEIGHT_MAX,
  MAP_STROKE_WEIGHT_MIN,
} from "@/constants/map";
import { MAP_DEFAULT_ZOOM } from "@/constants";
import type { GeometryEditTarget, MapLayerMeta } from "@/types/map";
import { getThemeColor } from "@/lib/theme";

export type { MapLayerMeta as LayerMeta };

export type LayerWithMeta = L.Layer &
  Partial<Record<typeof MAP_LAYER_META_KEY, MapLayerMeta>>;

/** True if the layer matches the given edit target. */
export function layerMatchesEditTarget(
  layer: L.Layer,
  editTarget: GeometryEditTarget
): boolean {
  if (editTarget === null) return false;
  const meta = (layer as LayerWithMeta)[MAP_LAYER_META_KEY];
  if (!meta) return false;
  if (editTarget.type === "masterPlan")
    return meta.kind === "masterPlan" && meta.id === editTarget.id;
  return meta.kind === "object" && meta.id === editTarget.id;
}

export function getPrimaryColor(): string {
  const color = getThemeColor("primary");
  return color || MAP_FALLBACK_PRIMARY;
}

export function getMutedColor(): string {
  const color =
    getThemeColor("object-outside-fill") || getThemeColor("muted-foreground");
  return color || MAP_FALLBACK_MUTED;
}

/**
 * Pin marker icon size [width, height] for a given zoom.
 * Lower zoom = smaller pins to reduce overlap when zoomed out.
 */
export function getObjectMarkerIconSize(zoom: number): [number, number] {
  const [baseW, baseH] = MAP_PIN_ICON_SIZE;
  const [minW, minH] = MAP_PIN_ICON_SIZE_MIN;
  const scale = Math.max(0, Math.min(1, zoom / MAP_PIN_ZOOM_REF));
  const w = Math.round(minW + (baseW - minW) * scale);
  const h = Math.round(minH + (baseH - minH) * scale);
  return [Math.max(minW, w), Math.max(minH, h)];
}

/** Create a pin-shaped marker icon for map objects (modern, professional look). */
export function createObjectMarkerIcon(
  isSelected: boolean,
  _isInPlan: boolean,
  fillColor: string,
  strokeColor?: string,
  zoom?: number
): L.DivIcon {
  const stroke = strokeColor ?? getThemeColor("border") ?? fillColor;
  const [w, h] =
    typeof zoom === "number" && zoom > 0
      ? getObjectMarkerIconSize(zoom)
      : MAP_PIN_ICON_SIZE;
  const strokeWidth = isSelected ? 3 : 2;
  const pathD = `M12 0C5.4 0 0 5.4 0 12c0 9 12 20 12 20s12-11 12-20C24 5.4 18.6 0 12 0z`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 24 32"><path d="${pathD}" fill="${fillColor}" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linejoin="round"/></svg>`;
  return L.divIcon({
    html: `<div class="leaflet-object-pin" style="line-height:0">${svg}</div>`,
    className: "leaflet-object-pin-wrapper",
    iconSize: [w, h],
    iconAnchor: [w / 2, h],
  });
}

export function getObjectDotStyle(
  isSelected: boolean,
  fillColor: string,
  isInPlan: boolean,
  zoom?: number
): L.CircleMarkerOptions {
  const baseRadius = isSelected
    ? MAP_DOT_RADIUS_SELECTED
    : MAP_DOT_RADIUS_DEFAULT;
  const baseWeight = MAP_STROKE_WEIGHT_DOT;
  const refZoom = MAP_DEFAULT_ZOOM;

  let radius = baseRadius;
  let weight = baseWeight;
  if (typeof zoom === "number" && zoom > 0) {
    const scale = zoom / refZoom;
    radius = Math.round(
      Math.max(
        MAP_DOT_RADIUS_MIN,
        Math.min(MAP_DOT_RADIUS_MAX, baseRadius * scale)
      )
    );
    weight = Math.max(
      MAP_STROKE_WEIGHT_MIN,
      Math.min(MAP_STROKE_WEIGHT_MAX, Math.round(baseWeight * scale))
    );
  }

  const strokeColor =
    getThemeColor("border") || getThemeColor("primary") || fillColor;
  return {
    radius,
    fillColor,
    color: strokeColor,
    weight,
    fillOpacity: isInPlan
      ? MAP_FILL_OPACITY_DOT_IN_PLAN
      : MAP_FILL_OPACITY_DOT_OUTSIDE,
  };
}

export function layerToGeoJSON(layer: L.Layer): GeoJSON.Geometry | null {
  if (layer instanceof L.Polygon) {
    const latlngs = layer.getLatLngs();
    const rings = Array.isArray(latlngs[0])
      ? (latlngs as L.LatLng[][])
      : ([latlngs] as L.LatLng[][]);
    const coords = rings.map((ring) =>
      ring.map((ll) => [ll.lng, ll.lat] as [number, number])
    );
    return { type: "Polygon", coordinates: coords };
  }
  if (layer instanceof L.Polyline) {
    const latlngs = layer.getLatLngs();
    const arr = Array.isArray(latlngs[0])
      ? (latlngs as L.LatLng[][])
      : ([latlngs] as L.LatLng[][]);
    const coords = arr.map((ring) =>
      ring.map((ll) => [ll.lng, ll.lat] as [number, number])
    );
    return coords.length === 1
      ? { type: "LineString", coordinates: coords[0] }
      : { type: "MultiLineString", coordinates: coords };
  }
  if (layer instanceof L.Marker || layer instanceof L.CircleMarker) {
    const latlng =
      layer instanceof L.Marker
        ? (layer as L.Marker).getLatLng()
        : (layer as L.CircleMarker).getLatLng();
    return {
      type: "Point",
      coordinates: [latlng.lng, latlng.lat],
    };
  }
  if (layer instanceof L.GeoJSON) {
    const feature = (layer as L.GeoJSON).toGeoJSON() as GeoJSON.Feature;
    return feature.geometry ?? null;
  }
  return null;
}

export function hasGeometry(
  value: unknown
): value is { type: string; coordinates: unknown } {
  return (
    !!value &&
    typeof value === "object" &&
    "type" in value &&
    "coordinates" in value
  );
}

export function getRing(layer: L.Polygon | L.Polyline): L.LatLng[] {
  const latlngs = layer.getLatLngs();
  if (Array.isArray(latlngs[0])) return (latlngs as L.LatLng[][])[0] ?? [];
  return latlngs as L.LatLng[];
}

export function setRing(layer: L.Polygon | L.Polyline, ring: L.LatLng[]): void {
  if (layer instanceof L.Polygon) {
    layer.setLatLngs([ring]);
  } else {
    layer.setLatLngs(ring);
  }
}

/** Get a representative [lng, lat] from a GeoJSON geometry (for point-in-polygon). */
export function getPointFromGeometry(geom: {
  type: string;
  coordinates: unknown;
}): [number, number] | null {
  if (!geom || typeof geom !== "object" || !("coordinates" in geom))
    return null;
  const c = geom.coordinates as unknown;
  if (geom.type === "Point" && Array.isArray(c) && c.length >= 2) {
    return [Number(c[0]), Number(c[1])];
  }
  if (geom.type === "Polygon" && Array.isArray(c) && c.length > 0) {
    const ring = c[0];
    if (Array.isArray(ring) && ring.length > 0 && Array.isArray(ring[0])) {
      return [Number(ring[0][0]), Number(ring[0][1])];
    }
  }
  if (geom.type === "MultiPolygon" && Array.isArray(c) && c.length > 0) {
    const poly = c[0];
    if (
      Array.isArray(poly) &&
      poly.length > 0 &&
      Array.isArray(poly[0]) &&
      poly[0].length > 0
    ) {
      return [Number(poly[0][0][0]), Number(poly[0][0][1])];
    }
  }
  return null;
}

/** Ray-casting: true if point [lng, lat] is inside the polygon ring (exterior ring). */
function pointInRing(
  lng: number,
  lat: number,
  ring: [number, number][]
): boolean {
  let inside = false;
  const n = ring.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (
      yi > lat !== yj > lat &&
      lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi
    )
      inside = !inside;
  }
  return inside;
}

/** True if [lng, lat] is inside the GeoJSON polygon or multi-polygon. */
export function pointInGeometry(
  lng: number,
  lat: number,
  geom: { type: string; coordinates: unknown }
): boolean {
  if (!geom || typeof geom !== "object" || !("coordinates" in geom))
    return false;
  const c = geom.coordinates as unknown;
  if (geom.type === "Polygon" && Array.isArray(c) && c.length > 0) {
    const ring = (c[0] as [number, number][]).map(
      (p) => [p[0], p[1]] as [number, number]
    );
    return pointInRing(lng, lat, ring);
  }
  if (geom.type === "MultiPolygon" && Array.isArray(c)) {
    for (const poly of c as [number, number][][][]) {
      if (Array.isArray(poly) && poly.length > 0) {
        const ring = (poly[0] as [number, number][]).map(
          (p) => [p[0], p[1]] as [number, number]
        );
        if (pointInRing(lng, lat, ring)) return true;
      }
    }
  }
  return false;
}

export function getBoundsForLayer(layer: L.Layer): L.LatLngBounds | null {
  if (layer instanceof L.Polygon || layer instanceof L.Polyline) {
    return (layer as L.Polygon).getBounds?.() ?? null;
  }
  if (layer instanceof L.CircleMarker || layer instanceof L.Marker) {
    const latLng =
      layer instanceof L.Marker
        ? (layer as L.Marker).getLatLng()
        : (layer as L.CircleMarker).getLatLng();
    return L.latLngBounds(latLng, latLng);
  }
  return null;
}
