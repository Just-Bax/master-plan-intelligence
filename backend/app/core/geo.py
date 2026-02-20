"""GeoJSON <-> WKB geometry conversion (GeoAlchemy2 / Shapely). Area is computed in DB via PostGIS ST_Area(geometry::geography)."""

from typing import Any

from geoalchemy2.shape import from_shape, to_shape
from shapely.geometry import shape as shapely_shape


def geom_to_geojson(geom: Any) -> dict[str, Any] | None:
    if geom is None:
        return None
    try:
        shp = to_shape(geom)
        return shp.__geo_interface__ if shp is not None else None
    except Exception:
        return None


def geojson_to_wkb(geojson: dict[str, Any] | None):
    """Convert GeoJSON to WKB. Expects coordinates in [lng, lat] per GeoJSON spec."""
    if geojson is None:
        return None
    try:
        shp = shapely_shape(geojson)
        return from_shape(shp, srid=4326)
    except Exception:
        return None
