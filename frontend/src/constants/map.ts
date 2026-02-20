/** Map layer metadata key stored on Leaflet layers for plan/object id. */
export const MAP_LAYER_META_KEY = "__layerMeta";

/** Leaflet pane name for geometry edit markers (vertices, middle, move). */
export const MAP_EDIT_MARKERS_PANE = "editMarkersPane";

/** Fallback primary color when theme CSS var is missing (softer indigo). */
export const MAP_FALLBACK_PRIMARY = "#818cf8";

/** Fallback muted/outside color when theme CSS var is missing. */
export const MAP_FALLBACK_MUTED = "#94a3b8";

/** Fallback stroke color for point markers. */
export const MAP_FALLBACK_STROKE = "#fff";

/** Fallback background color when theme CSS var is missing. */
export const MAP_FALLBACK_BACKGROUND = "#fff";

/** Plan placement: min radius (m) for circle mode. */
export const MAP_PLACEMENT_MIN_RADIUS_M = 10;

/** Plan placement: max radius (m) for circle mode. */
export const MAP_PLACEMENT_MAX_RADIUS_M = 10000;

/** Plan placement: default radius (m) for circle mode. */
export const MAP_PLACEMENT_DEFAULT_RADIUS_M = 50;

/** Plan placement: number of corners for corners mode. */
export const MAP_PLACEMENT_CORNERS_COUNT = 4;

/** Meters per degree latitude (WGS84 approximation). */
export const METERS_PER_DEGREE_LAT = 111320;

/** Default number of points for circle-to-polygon approximation. */
export const MAP_CIRCLE_POINTS = 32;

/** Point marker radius when selected. */
export const MAP_DOT_RADIUS_SELECTED = 10;

/** Point marker radius when not selected. */
export const MAP_DOT_RADIUS_DEFAULT = 8;

/** Min/max point marker radius when scaling by zoom. */
export const MAP_DOT_RADIUS_MIN = 4;
export const MAP_DOT_RADIUS_MAX = 16;

/** Stroke weight for point markers. */
export const MAP_STROKE_WEIGHT_DOT = 2;

/** Min/max stroke weight when scaling by zoom. */
export const MAP_STROKE_WEIGHT_MIN = 1;
export const MAP_STROKE_WEIGHT_MAX = 4;

/** Pin marker (object) icon size at reference zoom [width, height]. */
export const MAP_PIN_ICON_SIZE: [number, number] = [24, 32];

/** Min pin icon size when zoomed out [width, height]. */
export const MAP_PIN_ICON_SIZE_MIN: [number, number] = [12, 16];

/** Zoom level at which pin icons use full size; lower zoom = smaller pins. */
export const MAP_PIN_ZOOM_REF = 17;

/** Stroke weight for plan/object polygons (muted or not in plan). */
export const MAP_STROKE_WEIGHT_MUTED = 1.5;

/** Stroke weight for object polygons that are in the active plan but not selected. */
export const MAP_STROKE_WEIGHT_IN_PLAN = 2;

/** Stroke weight for the currently selected object polygon (clearly distinct). */
export const MAP_STROKE_WEIGHT_OBJECT_SELECTED = 3;

/** Stroke weight for the active/selected master plan boundary. */
export const MAP_STROKE_WEIGHT_PLAN_SELECTED = 2;

/** Fill opacity for master plan zones (not selected). */
export const MAP_FILL_OPACITY_PLAN_MUTED = 0.12;

/** Fill opacity for master plan zones (selected). */
export const MAP_FILL_OPACITY_PLAN_SELECTED = 0.28;

/** Fill opacity for object polygons (not in plan). */
export const MAP_FILL_OPACITY_OBJECT_OUTSIDE = 0.18;

/** Fill opacity for object polygons (in plan, not selected). */
export const MAP_FILL_OPACITY_OBJECT_IN_PLAN = 0.12;

/** Fill opacity for object polygons (selected – clearly stands out). */
export const MAP_FILL_OPACITY_OBJECT_SELECTED = 0.35;

/** Fill opacity for point markers in plan. */
export const MAP_FILL_OPACITY_DOT_IN_PLAN = 1;

/** Fill opacity for point markers outside plan. */
export const MAP_FILL_OPACITY_DOT_OUTSIDE = 0.5;

/** Edit vertex/middle icon size [width, height]. */
export const MAP_EDIT_ICON_SIZE_VERTEX: [number, number] = [18, 18];

/** Edit move handle icon size [width, height]. */
export const MAP_EDIT_ICON_SIZE_MOVE: [number, number] = [20, 20];

/** Z-index for the edit markers pane. */
export const MAP_EDIT_PANE_Z_INDEX = "1000";

/** Dash array for master plan zone borders (softer, longer dash). */
export const MAP_PLAN_DASH_ARRAY = "8 6";

/** Map fly/fitBounds duration (ms). */
export const MAP_FLY_DURATION_MS = 600;

/** Map fly padding (px) for plan and object. */
export const MAP_FLY_PADDING_PLAN: [number, number] = [32, 32];
export const MAP_FLY_PADDING_OBJECT: [number, number] = [32, 32];
export const MAP_FLY_PADDING_DEFAULT: [number, number] = [24, 24];

/** Map fly max zoom for plan vs object. */
export const MAP_FLY_MAX_ZOOM_PLAN = 15;
export const MAP_FLY_MAX_ZOOM_OBJECT = 17;
export const MAP_FLY_MAX_ZOOM_DEFAULT = 15;
