const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const AUTH_TOKEN_KEY = "access_token";

export const OBJECT_TYPES = [
  "project",
  "candidate_site",
  "zone",
  "parcel",
  "building",
  "other",
] as const;

export const MAP_DEFAULT_CENTER: [number, number] = [41.31, 69.279];
export const MAP_DEFAULT_ZOOM = 15;

export const ACTIVE_MASTER_PLAN_STORAGE_KEY =
  "master-plan-intelligence.activeMasterPlanId";

export const THEME_STORAGE_KEY = "theme";

export const HTTP_STATUS_NO_CONTENT = 204;

export const MIN_PASSWORD_LENGTH = 6;

/** Length of datetime-local input value (YYYY-MM-DDTHH:mm). */
export const DATETIME_LOCAL_LENGTH = 16;

/** Typing indicator dot animation delays (ms). */
export const CHAT_TYPING_DELAYS_MS = [0, 150, 300] as const;

/** Sidebar width in pixels. */
export const SIDEBAR_WIDTH_PX = 380;

export const REACT_QUERY_STALE_TIME_MS = 60_000;

export const ROUTES = {
  HOME: "/",
  SIGN_IN: "/signin",
  SIGN_UP: "/signup",
} as const;

export const API_PATHS = {
  AUTH_LOGIN: "/auth/login",
  AUTH_REGISTER: "/auth/register",
  USER_ME: "/user/me",
  MASTER_PLAN: "/master_plan",
  MASTER_PLAN_OBJECTS: (id: number) => `/master_plan/${id}/objects`,
  MASTER_PLAN_BY_ID: (id: number) => `/master_plan/${id}`,
  OBJECT: "/object",
  OBJECT_BY_ID: (id: number) => `/object/${id}`,
  OBJECT_TYPE: "/object_type",
  FUNCTION_TYPE: "/function_type",
  PROJECT: "/project",
  PROJECT_BY_ID: (id: number) => `/project/${id}`,
  AI_CHAT: "/ai/chat",
  AI_REPORT: "/ai/report",
} as const;

export { API_BASE_URL };
export * from "@/constants/map";
