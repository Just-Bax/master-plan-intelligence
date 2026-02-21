"""GeoJSON geometry type with Pydantic validation at the API boundary."""

from typing import Annotated, Any

from pydantic import BeforeValidator

ALLOWED_GEOJSON_GEOMETRY_TYPES = frozenset(
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


def _validate_geojson_geometry(value: Any) -> dict[str, Any]:
    if value is None:
        return value
    if not isinstance(value, dict):
        raise ValueError("Geometry must be a JSON object")
    if "type" not in value:
        raise ValueError("Geometry must have 'type'")
    if value["type"] not in ALLOWED_GEOJSON_GEOMETRY_TYPES:
        raise ValueError(
            f"Geometry type must be one of: {', '.join(sorted(ALLOWED_GEOJSON_GEOMETRY_TYPES))}"
        )
    array_types = (list, tuple)  # Shapely __geo_interface__ uses tuples
    if value["type"] == "GeometryCollection":
        if "geometries" not in value or not isinstance(
            value["geometries"], array_types
        ):
            raise ValueError("GeometryCollection must have 'geometries' array")
    else:
        if "coordinates" not in value or not isinstance(
            value["coordinates"], array_types
        ):
            raise ValueError("Geometry must have 'coordinates' array")
    return value


GeoJSONGeometry = Annotated[dict[str, Any], BeforeValidator(_validate_geojson_geometry)]
