export interface User {
  id: number;
  email: string;
  created_at: string;
}

export interface MasterPlan {
  id: number;
  name: string;
  geometry: GeoJSONGeometry | null;
  /** Area in m², computed from geometry (WGS84). */
  area_m2: number | null;
  created_at: string;
  created_by: number | null;
  updated_at: string;
  updated_by: number | null;
}

export interface MasterPlanFormData {
  name: string;
  /** When creating, optional geometry (e.g. circle from map placement). */
  geometry?: GeoJSONGeometry;
}

/** GeoJSON geometry object, e.g. { type: "Polygon", coordinates: [...] } */
export type GeoJSONGeometry = Record<string, unknown>;

export interface ObjectType {
  id: number;
  code: string;
  name: string | null;
}

export interface FunctionType {
  id: number;
  code: string;
  name: string | null;
}

export interface PlanObject {
  id: number;
  object_type_id: number;
  object_type_code?: string | null;
  function_type_id: number | null;
  function_type_code?: string | null;
  parent_id: number | null;
  object_id: string | null;
  parcel_id: string | null;
  name: string | null;
  administrative_region: string | null;
  district: string | null;
  mahalla: string | null;
  address_full: string | null;
  capacity_people_max: number | null;
  student_capacity: number | null;
  bed_count: number | null;
  unit_count: number | null;
  distance_public_transport_m: number | null;
  distance_primary_road_m: number | null;
  parking_spaces_total: number | null;
  protected_zone: boolean | null;
  heritage_zone: boolean | null;
  flood_zone: boolean | null;
  environmental_risk_score: number | null;
  power_connected: boolean | null;
  available_power_capacity_kw: number | null;
  water_connected: boolean | null;
  sewer_connected: boolean | null;
  data_source_reference: string | null;
  created_by: number | null;
  created_at: string;
  updated_at: string;
  updated_by: number | null;
  geometry: GeoJSONGeometry | null;
  /** Area in m², computed from geometry (WGS84). */
  area_m2: number | null;
  /** @deprecated Prefer top-level name, district, etc. */
  attributes?: Record<string, unknown> | null;
}

export interface FileRecord {
  file_id: string;
  filename: string;
  size: number;
  created_at: string;
}

export interface Project {
  id: number;
  name: string;
  description: string | null;
  master_plan_id: number | null;
  created_by: number | null;
  created_at: string;
  updated_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

/** Form payload for create/update project. */
export interface ProjectFormData {
  name: string;
  description?: string | null;
  master_plan_id?: number | null;
}
