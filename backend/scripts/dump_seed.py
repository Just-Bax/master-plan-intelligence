#!/usr/bin/env python3
"""
Dump object types, function types, and objects from the API into seed_data JSON files.

Fetches object_type, function_type, and object; writes 001_object_type.json,
002_function_type.json, and 003_object.json. Master plans and projects are not seeded.

Requirements: requests (pip install requests)

Usage:
  # From repo root, with backend venv activated:
  python backend/scripts/dump_seed.py --api-base http://localhost:8000

  # With auth (if API requires it):
  python backend/scripts/dump_seed.py --api-base http://localhost:8000 \\
    --email admin@example.com --password admin123

  # Custom output directory:
  python backend/scripts/dump_seed.py --out-dir ./my_seed
"""

import argparse
import json
import sys
from pathlib import Path

try:
    import requests
except ImportError:
    print("Install requests: pip install requests", file=sys.stderr)
    sys.exit(1)


def login(base_url: str, email: str, password: str) -> str | None:
    r = requests.post(
        f"{base_url.rstrip('/')}/auth/login",
        json={"email": email, "password": password},
        headers={"Content-Type": "application/json"},
        timeout=10,
    )
    if r.status_code != 200:
        return None
    data = r.json()
    return data.get("access_token")


def _object_to_flat_record(obj: dict) -> dict:
    """Build a flat object record matching dump_seed_from_csv / 002_seed expectations."""
    geom = obj.get("geometry")
    if not geom:
        return {}
    code = obj.get("object_type_code") or "other"
    ft = obj.get("function_type")
    function_type_code = obj.get("function_type_code")
    if function_type_code is None and isinstance(ft, dict):
        function_type_code = ft.get("code")
    name = obj.get("name") or (obj.get("attributes") or {}).get("name") or "Object"
    rec = {
        "object_type_code": code,
        "function_type_code": function_type_code,
        "geometry": geom,
        "name": name,
        "object_id": obj.get("object_id"),
        "parcel_id": obj.get("parcel_id"),
        "address_full": obj.get("address_full"),
        "administrative_region": obj.get("administrative_region"),
        "district": obj.get("district"),
        "mahalla": obj.get("mahalla"),
        "capacity_people_max": obj.get("capacity_people_max"),
        "student_capacity": obj.get("student_capacity"),
        "bed_count": obj.get("bed_count"),
        "unit_count": obj.get("unit_count"),
        "distance_public_transport_m": obj.get("distance_public_transport_m"),
        "distance_primary_road_m": obj.get("distance_primary_road_m"),
        "parking_spaces_total": obj.get("parking_spaces_total"),
        "protected_zone": obj.get("protected_zone"),
        "heritage_zone": obj.get("heritage_zone"),
        "flood_zone": obj.get("flood_zone"),
        "environmental_risk_score": obj.get("environmental_risk_score"),
        "power_connected": obj.get("power_connected"),
        "available_power_capacity_kw": obj.get("available_power_capacity_kw"),
        "water_connected": obj.get("water_connected"),
        "sewer_connected": obj.get("sewer_connected"),
        "data_source_reference": obj.get("data_source_reference"),
    }
    return {k: v for k, v in rec.items() if v is not None}


def dump_seed(
    api_base: str,
    out_dir: Path,
    email: str | None = None,
    password: str | None = None,
) -> bool:
    base = api_base.rstrip("/")
    headers: dict = {}
    if email and password:
        token = login(base, email, password)
        if token:
            headers["Authorization"] = f"Bearer {token}"
        else:
            print("Warning: login failed, continuing without auth", file=sys.stderr)

    # 1) Object types
    r = requests.get(f"{base}/object_type", headers=headers, timeout=10)
    if r.status_code != 200:
        print(f"GET /object_type failed: {r.status_code}", file=sys.stderr)
        return False
    object_types = r.json()
    seed_001 = [{"code": t["code"], "name": t.get("name")} for t in object_types]

    # 2) Function types
    r = requests.get(f"{base}/function_type", headers=headers, timeout=10)
    if r.status_code != 200:
        print(f"GET /function_type failed: {r.status_code}", file=sys.stderr)
        return False
    function_types = r.json()
    seed_002_ft = [{"code": t["code"], "name": t.get("name")} for t in function_types]

    # 3) Objects (all)
    r = requests.get(f"{base}/object", headers=headers, timeout=10)
    if r.status_code != 200:
        print(f"GET /object failed: {r.status_code}", file=sys.stderr)
        return False
    objects = r.json()
    seed_003 = []
    for obj in objects:
        flat = _object_to_flat_record(obj)
        if flat:
            seed_003.append(flat)

    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / "001_object_type.json").write_text(
        json.dumps(seed_001, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    (out_dir / "002_function_type.json").write_text(
        json.dumps(seed_002_ft, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    (out_dir / "003_object.json").write_text(
        json.dumps(seed_003, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(
        f"Wrote seed data to {out_dir}: {len(seed_001)} object types, "
        f"{len(seed_002_ft)} function types, {len(seed_003)} objects."
    )
    return True


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Dump object types, function types, and objects from API into seed_data JSON."
    )
    parser.add_argument(
        "--api-base",
        default="http://localhost:8000",
        help="API base URL (default: http://localhost:8000)",
    )
    parser.add_argument(
        "--out-dir",
        type=Path,
        default=None,
        help="Output directory (default: backend/seed_data)",
    )
    parser.add_argument("--email", default=None, help="Login email (optional)")
    parser.add_argument("--password", default=None, help="Login password (optional)")
    args = parser.parse_args()
    out_dir = args.out_dir
    if out_dir is None:
        backend = Path(__file__).resolve().parent.parent
        out_dir = backend / "seed_data"
    ok = dump_seed(args.api_base, out_dir, args.email, args.password)
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
