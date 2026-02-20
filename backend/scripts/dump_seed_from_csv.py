#!/usr/bin/env python3
"""
Update seed_data from the objects CSV (e.g. objects_200_full.csv).

Reads the CSV (Russian header row, then English headers, then description row, then data),
builds 001_object_type.json, 002_function_type.json, and 003_object.json in seed_data.
Only object types, function types, and objects are written; no master plans or projects.
Output uses key "name" for object name (plan); CSV may have "name" or "name_ru".

CSV columns used (English header row, normalized):
  object_type, function_type, name or name_ru, latitude, longitude,
  object_id, parcel_id, address_full, administrative_region, district, mahalla,
  capacity_people_max, student_capacity, bed_count, unit_count,
  distance_public_transport_m, distance_primary_road_m, parking_spaces_total,
  protected_zone, heritage_zone, flood_zone, environmental_risk_score,
  power_connected, available_power_capacity_kw, water_connected, sewer_connected,
  data_source_reference (Да/Нет -> boolean).

Usage:
  # From repo root, with backend venv activated:
  python backend/scripts/dump_seed_from_csv.py "path/to/objects_200_full.csv"

  # Writes to backend/seed_data by default. Custom output:
  python backend/scripts/dump_seed_from_csv.py "path/to/objects_200_full.csv" --out-dir ./backend/seed_data
"""

import csv
import json
import sys
from pathlib import Path


def _normalize_header(name: str) -> str:
    return name.strip().lower().replace(" ", "_")


def _read_csv_rows(csv_path: Path):
    """Read CSV: skip first row (RU headers), use second as headers, skip third (descriptions), yield dicts."""
    with open(csv_path, encoding="utf-8", newline="") as f:
        reader = csv.reader(f)
        next(reader)  # Russian headers
        raw_headers = next(reader)
        headers = [_normalize_header(h) for h in raw_headers]
        next(reader)  # description row
        for row in reader:
            if len(row) < len(headers):
                row = row + [""] * (len(headers) - len(row))
            elif len(row) > len(headers):
                row = row[: len(headers)]
            yield dict(zip(headers, row))


def _float(val: str, default: float | None = None) -> float | None:
    if val is None or (isinstance(val, str) and not val.strip()):
        return default
    try:
        return float(str(val).replace(",", ".").strip())
    except (ValueError, TypeError):
        return default


def _int(val: str, default: int | None = None) -> int | None:
    if val is None or (isinstance(val, str) and not val.strip()):
        return default
    try:
        return int(float(str(val).replace(",", ".").strip()))
    except (ValueError, TypeError):
        return default


def _str(val: str | None) -> str:
    if val is None:
        return ""
    s = str(val).strip()
    return s if s else ""


def _bool_from_da_net(val: str | None) -> bool | None:
    if val is None or (isinstance(val, str) and not val.strip()):
        return None
    s = str(val).strip().lower()
    if s in ("да", "yes", "true", "1"):
        return True
    if s in ("нет", "no", "false", "0"):
        return False
    return None


def _function_type_name_from_code(code: str) -> str:
    """Derive display name from function_type code (e.g. residential_apartment -> Residential apartment)."""
    return code.replace("_", " ").title()


def build_seed_from_csv(csv_path: Path, out_dir: Path) -> bool:
    """Build 001_object_type.json, 002_function_type.json, and 003_object.json from CSV."""
    csv_path = csv_path.resolve()
    if not csv_path.is_file():
        print(f"Error: CSV file not found: {csv_path}", file=sys.stderr)
        return False

    object_types_seen: set[str] = set()
    object_types_list: list[dict] = []
    function_types_seen: set[str] = set()
    function_types_list: list[dict] = []
    objects_list: list[dict] = []

    type_name_map = {
        "building": "Building",
        "facility": "Facility",
        "poi": "POI",
        "transport_node": "Transport node",
        "utility_node": "Utility node",
        "green_space": "Green space",
    }

    for row in _read_csv_rows(csv_path):
        object_type_code = _str(row.get("object_type") or "").strip().lower()
        if not object_type_code:
            continue
        if object_type_code not in object_types_seen:
            object_types_seen.add(object_type_code)
            name = (
                type_name_map.get(object_type_code)
                or object_type_code.replace("_", " ").title()
            )
            object_types_list.append({"code": object_type_code, "name": name})

        function_type_code = _str(row.get("function_type") or "").strip().lower()
        if function_type_code and function_type_code not in function_types_seen:
            function_types_seen.add(function_type_code)
            function_types_list.append(
                {
                    "code": function_type_code,
                    "name": _function_type_name_from_code(function_type_code),
                }
            )

        lat = _float(row.get("latitude"))
        lon = _float(row.get("longitude"))
        if lat is None or lon is None:
            continue
        name = _str(row.get("name") or row.get("name_ru")) or "Object"
        geometry = {"type": "Point", "coordinates": [lon, lat]}

        rec: dict = {
            "object_type_code": object_type_code,
            "function_type_code": function_type_code if function_type_code else None,
            "geometry": geometry,
            "name": name,
            "object_id": _str(row.get("object_id")) or None,
            "parcel_id": _str(row.get("parcel_id")) or None,
            "address_full": _str(row.get("address_full")) or None,
            "administrative_region": _str(row.get("administrative_region")) or None,
            "district": _str(row.get("district")) or None,
            "mahalla": _str(row.get("mahalla")) or None,
            "capacity_people_max": _int(row.get("capacity_people_max")),
            "student_capacity": _int(row.get("student_capacity")),
            "bed_count": _int(row.get("bed_count")),
            "unit_count": _int(row.get("unit_count")),
            "distance_public_transport_m": _int(row.get("distance_public_transport_m")),
            "distance_primary_road_m": _int(row.get("distance_primary_road_m")),
            "parking_spaces_total": _int(row.get("parking_spaces_total")),
            "protected_zone": _bool_from_da_net(row.get("protected_zone")),
            "heritage_zone": _bool_from_da_net(row.get("heritage_zone")),
            "flood_zone": _bool_from_da_net(row.get("flood_zone")),
            "environmental_risk_score": _float(row.get("environmental_risk_score")),
            "power_connected": _bool_from_da_net(row.get("power_connected")),
            "available_power_capacity_kw": _int(row.get("available_power_capacity_kw")),
            "water_connected": _bool_from_da_net(row.get("water_connected")),
            "sewer_connected": _bool_from_da_net(row.get("sewer_connected")),
            "data_source_reference": _str(row.get("data_source_reference")) or None,
        }
        objects_list.append({k: v for k, v in rec.items() if v is not None})

    if not object_types_list or not objects_list:
        print("Error: No object types or objects found in CSV.", file=sys.stderr)
        return False

    out_dir = out_dir.resolve()
    out_dir.mkdir(parents=True, exist_ok=True)

    (out_dir / "001_object_type.json").write_text(
        json.dumps(object_types_list, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    (out_dir / "002_function_type.json").write_text(
        json.dumps(function_types_list, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    (out_dir / "003_object.json").write_text(
        json.dumps(objects_list, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(
        f"Wrote {out_dir}: {len(object_types_list)} object types, "
        f"{len(function_types_list)} function types, {len(objects_list)} objects."
    )
    return True


def main() -> None:
    import argparse

    parser = argparse.ArgumentParser(
        description="Update seed_data (object types, function types, objects) from objects CSV."
    )
    parser.add_argument(
        "csv_path",
        type=Path,
        help="Path to CSV file (e.g. objects_200_full.csv)",
    )
    parser.add_argument(
        "--out-dir",
        type=Path,
        default=None,
        help="Output directory (default: backend/seed_data)",
    )
    args = parser.parse_args()
    out_dir = args.out_dir
    if out_dir is None:
        backend = Path(__file__).resolve().parent.parent
        out_dir = backend / "seed_data"
    ok = build_seed_from_csv(args.csv_path, out_dir)
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
