import { useTranslation } from "react-i18next";
import { MapPinIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";
import type { FunctionType, ObjectType, PlanObject } from "@/types/api";
import {
  getPlanObjectName,
  getPlanObjectArea,
  getPlanObjectLocation,
} from "@/lib/objectHelpers";

const PANEL_WIDTH_PX = 360;
const EMPTY = "—";

function formatNum(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return EMPTY;
  return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

function formatBool(
  value: boolean | null | undefined,
  t: (k: string) => string
): string {
  if (value == null) return EMPTY;
  return value ? t("objectDetails.yes") : t("objectDetails.no");
}

function formatDate(value: string | null | undefined): string {
  if (!value) return EMPTY;
  try {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? value : d.toLocaleString();
  } catch {
    return value;
  }
}

/** Resolve object type label: i18n key objectType.<code> with fallback to API name. */
function getObjectTypeLabel(
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
  if (!code) return apiName ?? EMPTY;
  return t(`objectType.${code}`, { defaultValue: apiName ?? code });
}

/** Resolve function type label: i18n key functionType.<code> with fallback to API name. */
function getFunctionTypeLabel(
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

interface DetailRowProps {
  label: string;
  value: string | null | undefined;
  className?: string;
  empty?: boolean;
}

function DetailRow({ label, value, className, empty }: DetailRowProps) {
  const display = value != null && String(value).trim() !== "" ? value : EMPTY;
  const isEmpty = empty ?? display === EMPTY;
  return (
    <div
      className={cn(
        "flex flex-col gap-0.5 py-2",
        isEmpty && "opacity-70",
        className
      )}
    >
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="text-sm font-medium text-foreground">{display}</span>
    </div>
  );
}

interface ObjectDetailsPanelProps {
  object: PlanObject;
  objectTypes: ObjectType[];
  functionTypes: FunctionType[];
  onClose: () => void;
}

export function ObjectDetailsPanel({
  object,
  objectTypes,
  functionTypes,
  onClose,
}: ObjectDetailsPanelProps) {
  const { t } = useTranslation();
  const name = getPlanObjectName(object);
  const area = getPlanObjectArea(object);
  const location = getPlanObjectLocation(object);
  const objectTypeLabel = getObjectTypeLabel(object, objectTypes, t);
  const functionTypeLabel = getFunctionTypeLabel(object, functionTypes, t);

  return (
    <aside
      className="flex shrink-0 flex-col overflow-hidden border-l border-border/60 bg-card shadow-lg"
      style={{ width: PANEL_WIDTH_PX }}
    >
      <div className="flex shrink-0 flex-col border-b border-border/60 bg-muted/40 px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-wrap gap-2">
            {objectTypeLabel !== EMPTY && (
              <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                {objectTypeLabel}
              </span>
            )}
            {functionTypeLabel != null && functionTypeLabel !== "" && (
              <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">
                {functionTypeLabel}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            aria-label={t("objectDetails.close")}
          >
            <XMarkIcon className="size-5" />
          </button>
        </div>
        <h2 className="mt-3 text-xl font-bold tracking-tight text-foreground">
          {name}
        </h2>
        <div className="mt-2 flex items-start gap-2 text-sm text-muted-foreground">
          <MapPinIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span className="line-clamp-2">{location}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <section className="mb-5 rounded-lg bg-muted/30 p-4">
          <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            {t("objectDetails.mainIndicators")}
          </h3>
          <div className="grid grid-cols-2 gap-x-6 gap-y-0">
            <DetailRow
              label={t("objectDetails.area")}
              value={area > 0 ? `${formatNum(area)} m²` : EMPTY}
            />
            <DetailRow
              label={t("objectDetails.environmentalRiskScore")}
              value={
                object.environmental_risk_score != null
                  ? formatNum(object.environmental_risk_score)
                  : EMPTY
              }
            />
            <DetailRow
              label={t("objectDetails.power")}
              value={formatBool(object.power_connected, t)}
            />
            <DetailRow
              label={t("objectDetails.water")}
              value={formatBool(object.water_connected, t)}
            />
            <DetailRow
              label={t("objectDetails.sewer")}
              value={formatBool(object.sewer_connected, t)}
            />
          </div>
        </section>

        <section className="mb-5 rounded-lg bg-muted/30 p-4">
          <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            {t("objectDetails.identity")}
          </h3>
          <div className="grid grid-cols-2 gap-x-6 gap-y-0">
            <DetailRow label={t("objectDetails.name")} value={object.name} />
            <DetailRow
              label={t("objectDetails.objectId")}
              value={object.object_id}
            />
            <DetailRow
              label={t("objectDetails.parcelId")}
              value={object.parcel_id}
            />
            <DetailRow
              label={t("objectDetails.objectType")}
              value={objectTypeLabel !== EMPTY ? objectTypeLabel : EMPTY}
            />
            <DetailRow
              label={t("objectDetails.functionType")}
              value={functionTypeLabel}
            />
          </div>
        </section>

        <section className="mb-5 rounded-lg bg-muted/30 p-4">
          <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            {t("objectDetails.location")}
          </h3>
          <div className="grid grid-cols-2 gap-x-6 gap-y-0">
            <DetailRow
              label={t("objectDetails.administrativeRegion")}
              value={object.administrative_region}
            />
            <DetailRow
              label={t("objectDetails.district")}
              value={object.district}
            />
            <DetailRow
              label={t("objectDetails.mahalla")}
              value={object.mahalla}
            />
            <DetailRow
              label={t("objectDetails.addressFull")}
              value={object.address_full}
              className="col-span-2"
            />
          </div>
        </section>

        <section className="mb-5 rounded-lg bg-muted/30 p-4">
          <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            {t("objectDetails.capacity")}
          </h3>
          <div className="grid grid-cols-2 gap-x-6 gap-y-0">
            <DetailRow
              label={t("objectDetails.capacityPeopleMax")}
              value={formatNum(object.capacity_people_max)}
            />
            <DetailRow
              label={t("objectDetails.studentCapacity")}
              value={formatNum(object.student_capacity)}
            />
            <DetailRow
              label={t("objectDetails.bedCount")}
              value={formatNum(object.bed_count)}
            />
            <DetailRow
              label={t("objectDetails.unitCount")}
              value={formatNum(object.unit_count)}
            />
          </div>
        </section>

        <section className="mb-5 rounded-lg bg-muted/30 p-4">
          <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            {t("objectDetails.distancesParking")}
          </h3>
          <div className="grid grid-cols-2 gap-x-6 gap-y-0">
            <DetailRow
              label={t("objectDetails.distancePublicTransport")}
              value={
                object.distance_public_transport_m != null
                  ? `${formatNum(object.distance_public_transport_m)} m`
                  : EMPTY
              }
            />
            <DetailRow
              label={t("objectDetails.distancePrimaryRoad")}
              value={
                object.distance_primary_road_m != null
                  ? `${formatNum(object.distance_primary_road_m)} m`
                  : EMPTY
              }
            />
            <DetailRow
              label={t("objectDetails.parkingSpaces")}
              value={formatNum(object.parking_spaces_total)}
            />
          </div>
        </section>

        <section className="mb-5 rounded-lg bg-muted/30 p-4">
          <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            {t("objectDetails.zonesRisk")}
          </h3>
          <div className="grid grid-cols-2 gap-x-6 gap-y-0">
            <DetailRow
              label={t("objectDetails.protectedZone")}
              value={formatBool(object.protected_zone, t)}
            />
            <DetailRow
              label={t("objectDetails.heritageZone")}
              value={formatBool(object.heritage_zone, t)}
            />
            <DetailRow
              label={t("objectDetails.floodZone")}
              value={formatBool(object.flood_zone, t)}
            />
            <DetailRow
              label={t("objectDetails.environmentalRiskScore")}
              value={
                object.environmental_risk_score != null
                  ? formatNum(object.environmental_risk_score)
                  : EMPTY
              }
            />
          </div>
        </section>

        <section className="mb-5 rounded-lg bg-muted/30 p-4">
          <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            {t("objectDetails.utilities")}
          </h3>
          <div className="grid grid-cols-2 gap-x-6 gap-y-0">
            <DetailRow
              label={t("objectDetails.power")}
              value={formatBool(object.power_connected, t)}
            />
            <DetailRow
              label={t("objectDetails.availablePowerCapacityKw")}
              value={
                object.available_power_capacity_kw != null
                  ? `${formatNum(object.available_power_capacity_kw)} kW`
                  : EMPTY
              }
            />
            <DetailRow
              label={t("objectDetails.water")}
              value={formatBool(object.water_connected, t)}
            />
            <DetailRow
              label={t("objectDetails.sewer")}
              value={formatBool(object.sewer_connected, t)}
            />
          </div>
        </section>

        <section className="rounded-lg bg-muted/30 p-4">
          <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            {t("objectDetails.meta")}
          </h3>
          <div className="grid grid-cols-2 gap-x-6 gap-y-0">
            <DetailRow
              label={t("objectDetails.dataSourceReference")}
              value={object.data_source_reference}
              className="col-span-2"
            />
            <DetailRow
              label={t("objectDetails.createdAt")}
              value={formatDate(object.created_at)}
            />
            <DetailRow
              label={t("objectDetails.updatedAt")}
              value={formatDate(object.updated_at)}
            />
          </div>
        </section>
      </div>
    </aside>
  );
}
