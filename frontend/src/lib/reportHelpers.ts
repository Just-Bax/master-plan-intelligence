import type { AiDevelopmentReport } from "@/types/api";
import { EMPTY_DISPLAY } from "@/constants";

/** Safe getters for report shape (API returns flexible JSON). */
export function reportBaseline(report: AiDevelopmentReport) {
  const b = report.baseline as Record<string, unknown> | undefined;
  const capacities = (b?.capacities as Record<string, unknown>) ?? {};
  return {
    objects_total: (b?.objects_total as number) ?? 0,
    housing_units_total: (b?.housing_units_total as number) ?? 0,
    population_estimated: (b?.population_estimated as number | null) ?? null,
    capacities: {
      school_seats_total: (capacities.school_seats_total as number) ?? 0,
      kindergarten_seats_total:
        (capacities.kindergarten_seats_total as number) ?? 0,
      hospital_beds_total: (capacities.hospital_beds_total as number) ?? 0,
      clinic_capacity_total: (capacities.clinic_capacity_total as number) ?? 0,
      parking_spaces_total: (capacities.parking_spaces_total as number) ?? 0,
      green_objects_total: (capacities.green_objects_total as number) ?? 0,
    },
  };
}

export function reportProjectsSummary(report: AiDevelopmentReport) {
  const n = report.needs_15y as Record<string, unknown> | undefined;
  const list = (n?.projects_summary as Array<Record<string, unknown>>) ?? [];
  return list;
}

export function reportTotalNewProjects(report: AiDevelopmentReport): number {
  return reportProjectsSummary(report).reduce(
    (sum, p) => sum + (Number(p.new_projects) || 0),
    0
  );
}

/** Format capacity_added object for display (e.g. { seats: 0 } → "0 seats"). */
export function formatCapacityAdded(
  cap: Record<string, unknown> | null | undefined
): string {
  if (cap == null || typeof cap !== "object") return EMPTY_DISPLAY;
  const parts: string[] = [];
  if (typeof cap.seats === "number") parts.push(`${cap.seats} seats`);
  if (typeof cap.spaces === "number") parts.push(`${cap.spaces} spaces`);
  if (typeof cap.capacity_people_max === "number")
    parts.push(`${cap.capacity_people_max} capacity`);
  if (typeof cap.objects === "number") parts.push(`${cap.objects} objects`);
  return parts.length > 0 ? parts.join(", ") : EMPTY_DISPLAY;
}
