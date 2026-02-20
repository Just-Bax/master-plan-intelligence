"""GeoJSON geometry type with Pydantic validation at the API boundary."""

from typing import Annotated, Any

from pydantic import BeforeValidator

_ALLOWED_TYPES = frozenset(
    {
        "Point",
        "LineString",
        "Polygon",
        "MultiPoint",
        "MultiLineString",
        "MultiPolygon",
        "GeometryCollection",
    }
)


def _validate_geojson_geometry(v: Any) -> dict[str, Any]:
    if v is None:
        return v
    if not isinstance(v, dict):
        raise ValueError("Geometry must be a JSON object")
    if "type" not in v:
        raise ValueError("Geometry must have 'type'")
    if v["type"] not in _ALLOWED_TYPES:
        raise ValueError(
            f"Geometry type must be one of: {', '.join(sorted(_ALLOWED_TYPES))}"
        )
    _array = (list, tuple)  # Shapely __geo_interface__ uses tuples
    if v["type"] == "GeometryCollection":
        if "geometries" not in v or not isinstance(v["geometries"], _array):
            raise ValueError("GeometryCollection must have 'geometries' array")
    else:
        if "coordinates" not in v or not isinstance(v["coordinates"], _array):
            raise ValueError("Geometry must have 'coordinates' array")
    return v


GeoJSONGeometry = Annotated[dict[str, Any], BeforeValidator(_validate_geojson_geometry)]
