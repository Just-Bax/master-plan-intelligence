import type { FunctionType, ObjectType, PlanObject } from "@/types/api";
import { EMPTY_DISPLAY } from "@/constants";

export function formatNum(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return EMPTY_DISPLAY;
  return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

export function formatBool(
  value: boolean | null | undefined,
  t: (k: string) => string
): string {
  if (value == null) return EMPTY_DISPLAY;
  return value ? t("objectDetails.yes") : t("objectDetails.no");
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return EMPTY_DISPLAY;
  try {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? value : d.toLocaleString();
  } catch {
    return value;
  }
}

/** Resolve object type label: i18n key objectType.<code> with fallback to API name. */
export function getObjectTypeLabel(
  object: PlanObject,
  objectTypes: ObjectType[],
  t: (key: string, opts?: { defaultValue?: string }) => string
): string {
  const code =
    object.object_type_code ??
    objectTypes.find((ot) => ot.id === object.object_type_id)?.code;
  const apiName =
    objectTypes.find((ot) => ot.id === object.object_type_id)?.name ??
    object.object_type_code;
  if (!code) return apiName ?? EMPTY_DISPLAY;
  return t(`objectType.${code}`, { defaultValue: apiName ?? code });
}

/** Resolve function type label: i18n key functionType.<code> with fallback to API name. */
export function getFunctionTypeLabel(
  object: PlanObject,
  functionTypes: FunctionType[],
  t: (key: string, opts?: { defaultValue?: string }) => string
): string | null {
  const code =
    object.function_type_code ??
    functionTypes.find((ft) => ft.id === object.function_type_id)?.code;
  const apiName =
    functionTypes.find((ft) => ft.id === object.function_type_id)?.name ??
    object.function_type_code;
  if (!code)
    return object.function_type_id != null
      ? (apiName ?? String(object.function_type_id))
      : null;
  return t(`functionType.${code}`, { defaultValue: apiName ?? code });
}
