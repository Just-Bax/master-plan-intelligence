import { MAP_CIRCLE_POINTS, METERS_PER_DEGREE_LAT } from "@/constants/map";

/**
 * Approximate a circle in WGS84 as a polygon (for master plan placement).
 * Uses meters at center latitude for conversion to degrees.
 */

/**
 * Convert radius in meters to approximate degrees at a given latitude.
 * 1 deg lat ≈ 111320 m; 1 deg lng ≈ 111320 * cos(lat) m.
 */
function metersToDegrees(
  radiusM: number,
  centerLat: number
): { lat: number; lng: number } {
  const latRad = (centerLat * Math.PI) / 180;
  const lngScale = Math.cos(latRad);
  return {
    lat: radiusM / METERS_PER_DEGREE_LAT,
    lng: lngScale > 0.01 ? radiusM / (METERS_PER_DEGREE_LAT * lngScale) : 0,
  };
}

/**
 * Create a GeoJSON Polygon approximating a circle with center [lng, lat] and radius in meters.
 * First and last ring point are the same (closed polygon).
 */
export function circleToPolygon(
  centerLng: number,
  centerLat: number,
  radiusM: number,
  numPoints: number = MAP_CIRCLE_POINTS
): { type: "Polygon"; coordinates: [number, number][][] } {
  const { lat: radiusLat, lng: radiusLng } = metersToDegrees(
    radiusM,
    centerLat
  );
  const ring: [number, number][] = [];
  for (let i = 0; i <= numPoints; i++) {
    const angle = (2 * Math.PI * i) / numPoints;
    ring.push([
      centerLng + radiusLng * Math.cos(angle),
      centerLat + radiusLat * Math.sin(angle),
    ]);
  }
  return { type: "Polygon", coordinates: [ring] };
}
