"""GeoJSON <-> WKB geometry conversion (GeoAlchemy2 / Shapely). Area is computed in DB via PostGIS ST_Area(geometry::geography). Point geometry validation for objects."""

from typing import Any

from geoalchemy2.shape import from_shape, to_shape
from shapely.geometry import shape as shapely_shape

from app.constants import (
    ERROR_MESSAGE_GEOMETRY_COORDS_LNG_LAT,
    ERROR_MESSAGE_GEOMETRY_COORDS_NUMBERS,
    ERROR_MESSAGE_GEOMETRY_TYPE_POINT,
)


def geometry_to_geojson(geometry: Any) -> dict[str, Any] | None:
    """Convert GeoAlchemy2 geometry to GeoJSON dict."""
    if geometry is None:
        return None
    try:
        shape = to_shape(geometry)
        return shape.__geo_interface__ if shape is not None else None
    except Exception:
        return None


def geojson_to_wkb(geojson: dict[str, Any] | None):
    """Convert GeoJSON to WKB. Expects coordinates in [lng, lat] per GeoJSON spec."""
    if geojson is None:
        return None
    try:
        shape = shapely_shape(geojson)
        return from_shape(shape, srid=4326)
    except Exception:
        return None


def require_point_geojson(geometry: dict[str, Any]) -> None:
    """Raise ValueError if geometry is not a GeoJSON Point with at least [lng, lat]."""
    if not isinstance(geometry.get("type"), str) or geometry.get("type") != "Point":
        raise ValueError(ERROR_MESSAGE_GEOMETRY_TYPE_POINT)
    coords = geometry.get("coordinates")
    if not isinstance(coords, (list, tuple)) or len(coords) < 2:
        raise ValueError(ERROR_MESSAGE_GEOMETRY_COORDS_LNG_LAT)
    try:
        float(coords[0])
        float(coords[1])
    except (TypeError, ValueError):
        raise ValueError(ERROR_MESSAGE_GEOMETRY_COORDS_NUMBERS)


def first_coordinate_pair(
    geometry: dict[str, Any] | None,
) -> tuple[float | None, float | None]:
    """Extract (longitude, latitude) from GeoJSON: Point, or first vertex of Polygon/LineString/MultiPoint."""
    if not isinstance(geometry, dict):
        return (None, None)
    coords = geometry.get("coordinates")
    if not isinstance(coords, (list, tuple)) or len(coords) < 1:
        return (None, None)
    if (
        isinstance(coords[0], (int, float))
        and len(coords) >= 2
        and isinstance(coords[1], (int, float))
    ):
        return (float(coords[0]), float(coords[1]))
    first = coords[0]
    if isinstance(first, (list, tuple)) and len(first) >= 2:
        if isinstance(first[0], (int, float)) and isinstance(first[1], (int, float)):
            return (float(first[0]), float(first[1]))
        if isinstance(first[0], (list, tuple)) and len(first[0]) >= 2:
            point = first[0]
            if isinstance(point[0], (int, float)) and isinstance(
                point[1], (int, float)
            ):
                return (float(point[0]), float(point[1]))
    return (None, None)


# Backward compatibility aliases (geom_to_geojson is used widely)
geom_to_geojson = geometry_to_geojson
