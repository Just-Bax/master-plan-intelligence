import i18n from "@/lib/i18n";
import type { PlanObject } from "@/types/api";

export function getPlanObjectName(obj: PlanObject): string {
  const name =
    obj.name ??
    (obj.attributes?.name as string) ??
    (obj.attributes?.title as string);
  return typeof name === "string" && name
    ? name
    : `${i18n.t("planObject.namePrefix")}${obj.id}`;
}

/** Area in m² from API (computed from geometry). */
export function getPlanObjectArea(obj: PlanObject): number {
  if (typeof obj.area_m2 === "number" && !Number.isNaN(obj.area_m2))
    return obj.area_m2;
  return 0;
}

export function getPlanObjectLocation(obj: PlanObject): string {
  const location =
    obj.district ??
    obj.administrative_region ??
    obj.mahalla ??
    obj.address_full ??
    (obj.attributes?.location as string) ??
    (obj.attributes?.district as string) ??
    (obj.attributes?.sector as string);
  if (typeof location === "string" && location) return location;
  const parts = [
    obj.district,
    obj.administrative_region,
    obj.mahalla,
    obj.attributes?.district as string,
    obj.attributes?.sector as string,
  ].filter(Boolean);
  return parts.length > 0
    ? parts.join(", ")
    : i18n.t("planObject.emptyPlaceholder");
}

/** Name for form initial state (empty string when no name/title). */
export function getPlanObjectNameForEdit(obj: PlanObject): string {
  const name =
    obj.name ??
    (obj.attributes?.name as string) ??
    (obj.attributes?.title as string);
  return typeof name === "string" ? name : "";
}

/** Area for form display (read-only, from API). */
export function getPlanObjectAreaForEdit(obj: PlanObject): string {
  if (typeof obj.area_m2 === "number" && !Number.isNaN(obj.area_m2))
    return String(Math.round(obj.area_m2));
  return "";
}

/** Location for form initial state (empty string when none). */
export function getPlanObjectLocationForEdit(obj: PlanObject): string {
  const location =
    obj.district ??
    obj.administrative_region ??
    obj.mahalla ??
    obj.address_full ??
    (obj.attributes?.location as string) ??
    (obj.attributes?.district as string) ??
    (obj.attributes?.sector as string);
  if (typeof location === "string" && location) return location;
  const parts = [
    obj.district,
    obj.administrative_region,
    obj.mahalla,
    obj.attributes?.district as string,
    obj.attributes?.sector as string,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "";
}
