import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { AiDevelopmentReport } from "@/types/api";
import { EMPTY_DISPLAY } from "@/constants";
import {
  reportBaseline,
  reportProjectsSummary,
  formatCapacityAdded,
} from "@/lib/reportHelpers";

export interface ReportPanelContentProps {
  report: AiDevelopmentReport;
}

export function ReportPanelContent({ report }: ReportPanelContentProps) {
  const { t } = useTranslation();
  const [showRaw, setShowRaw] = useState(false);

  const assumptions = (report.assumptions as Record<string, unknown>) ?? {};
  const baseline = reportBaseline(report);
  const needs = (report.needs_15y as Record<string, unknown>) ?? {};
  const gaps = (needs.gaps as Record<string, unknown>) ?? {};
  const projectsSummary = reportProjectsSummary(report);
  const phasesRaw = report.phases;
  const phases = Array.isArray(phasesRaw)
    ? (phasesRaw as Array<{ phase?: string; projects?: unknown[] }>)
    : [];
  const questionsRaw = report.questions;
  const questions = Array.isArray(questionsRaw)
    ? (questionsRaw as string[])
    : [];

  return (
    <div className="space-y-8">
      {Object.keys(assumptions).length > 0 && (
        <section>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            {t("sidebar.reportSectionAssumptions")}
          </h3>
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
            {Object.entries(assumptions).map(([key, value]) => (
              <div key={key} className="flex justify-between gap-2">
                <span className="text-muted-foreground">
                  {t(`sidebar.reportAssumption.${key}` as const) || key}
                </span>
                <span className="font-medium tabular-nums">
                  {value != null ? String(value) : EMPTY_DISPLAY}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          {t("sidebar.reportSectionBaseline")}
        </h3>
        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm sm:grid-cols-4">
            <div>
              <span className="block text-muted-foreground">
                {t("sidebar.reportBaseline.objects_total")}
              </span>
              <p className="mt-0.5 font-semibold tabular-nums">
                {baseline.objects_total}
              </p>
            </div>
            <div>
              <span className="block text-muted-foreground">
                {t("sidebar.reportBaseline.housing_units_total")}
              </span>
              <p className="mt-0.5 font-semibold tabular-nums">
                {baseline.housing_units_total}
              </p>
            </div>
            <div>
              <span className="block text-muted-foreground">
                {t("sidebar.reportBaseline.population_estimated")}
              </span>
              <p className="mt-0.5 font-semibold tabular-nums">
                {baseline.population_estimated ?? EMPTY_DISPLAY}
              </p>
            </div>
            <div>
              <span className="block text-muted-foreground">
                {t("sidebar.reportBaseline.school_seats_total")}
              </span>
              <p className="mt-0.5 font-semibold tabular-nums">
                {baseline.capacities.school_seats_total}
              </p>
            </div>
            <div>
              <span className="block text-muted-foreground">
                {t("sidebar.reportBaseline.kindergarten_seats_total")}
              </span>
              <p className="mt-0.5 font-semibold tabular-nums">
                {baseline.capacities.kindergarten_seats_total}
              </p>
            </div>
            <div>
              <span className="block text-muted-foreground">
                {t("sidebar.reportBaseline.parking_spaces_total")}
              </span>
              <p className="mt-0.5 font-semibold tabular-nums">
                {baseline.capacities.parking_spaces_total}
              </p>
            </div>
            <div>
              <span className="block text-muted-foreground">
                {t("sidebar.reportBaseline.green_objects_total")}
              </span>
              <p className="mt-0.5 font-semibold tabular-nums">
                {baseline.capacities.green_objects_total}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          {t("sidebar.reportSectionNeeds")}
        </h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-4">
            {Object.entries(gaps).map(([key, value]) => (
              <div key={key}>
                <span className="block text-muted-foreground">
                  {t(`sidebar.reportGap.${key}` as const) || key}
                </span>
                <p className="mt-0.5 font-semibold tabular-nums">
                  {value != null ? String(value) : EMPTY_DISPLAY}
                </p>
              </div>
            ))}
          </div>
          {projectsSummary.length > 0 && (
            <div>
              <h4 className="mb-1 text-xs font-medium text-muted-foreground">
                {t("sidebar.reportProjectsSummary")}
              </h4>
              <div className="overflow-x-auto rounded border border-border">
                <table className="w-full min-w-[320px] text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-4 py-2.5 text-left font-medium">
                        {t("sidebar.reportTableServiceType")}
                      </th>
                      <th className="px-4 py-2.5 text-right font-medium">
                        {t("sidebar.reportTableNewProjects")}
                      </th>
                      <th className="px-4 py-2.5 text-right font-medium">
                        {t("sidebar.reportTableCapacityAdded")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {projectsSummary.map((row, i) => (
                      <tr
                        key={i}
                        className="border-b border-border/50 last:border-0"
                      >
                        <td className="px-4 py-2.5">
                          {row.service_type
                            ? t(
                                `sidebar.reportServiceType.${row.service_type}` as const
                              ) || String(row.service_type)
                            : EMPTY_DISPLAY}
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums">
                          {Number(row.new_projects) ?? 0}
                        </td>
                        <td className="px-4 py-2.5 text-right text-muted-foreground">
                          {formatCapacityAdded(
                            row.capacity_added as
                              | Record<string, unknown>
                              | undefined
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </section>

      {phases.length > 0 && (
        <section>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            {t("sidebar.reportSectionPhases")}
          </h3>
          <div className="space-y-4">
            {phases.map((ph, i) => (
              <div
                key={i}
                className="rounded-lg border border-border bg-muted/20 p-4"
              >
                <h4 className="mb-3 font-medium">
                  {t("sidebar.reportPhase")} {ph.phase ?? String(i + 1)}
                </h4>
                <ul className="space-y-4">
                  {Array.isArray(ph.projects) && ph.projects.length > 0 ? (
                    ph.projects.map((proj: unknown, j: number) => {
                      const p = proj as Record<string, unknown>;
                      const cap = p.capacity_added as
                        | Record<string, unknown>
                        | null
                        | undefined;
                      const whyList = Array.isArray(p.why_this_object)
                        ? (p.why_this_object as string[])
                        : [];
                      const backupList = Array.isArray(p.backup_object_ids)
                        ? (p.backup_object_ids as string[])
                        : [];
                      const interventionsList = Array.isArray(
                        p.required_interventions
                      )
                        ? (p.required_interventions as string[])
                        : [];
                      const actionKey = String(p.action ?? "");
                      const eligibilityKey = String(p.eligibility ?? "");
                      return (
                        <li
                          key={j}
                          className="rounded-md border border-border/60 bg-background/80 p-3 text-sm"
                        >
                          <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1">
                            <span className="font-semibold">
                              {String(p.project_id ?? EMPTY_DISPLAY)}
                            </span>
                            <span className="text-muted-foreground">
                              {p.service_type
                                ? t(
                                    `sidebar.reportServiceType.${p.service_type}` as const
                                  ) || String(p.service_type)
                                : ""}
                            </span>
                            {actionKey ? (
                              <span className="rounded bg-muted px-1.5 py-0.5 text-xs">
                                {t(
                                  `sidebar.reportAction.${actionKey}` as const
                                ) || actionKey}
                              </span>
                            ) : null}
                            {eligibilityKey ? (
                              <span className="rounded bg-muted px-1.5 py-0.5 text-xs">
                                {t(
                                  `sidebar.reportEligibility.${eligibilityKey}` as const
                                ) || eligibilityKey}
                              </span>
                            ) : null}
                          </div>
                          <dl className="grid grid-cols-1 gap-x-4 gap-y-1.5 sm:grid-cols-2">
                            {cap && Object.keys(cap).length > 0 ? (
                              <div>
                                <dt className="text-xs text-muted-foreground">
                                  {t("sidebar.reportProject.capacityAdded")}
                                </dt>
                                <dd className="font-medium tabular-nums">
                                  {formatCapacityAdded(cap)}
                                </dd>
                              </div>
                            ) : null}
                            {p.target_object_id != null ? (
                              <div>
                                <dt className="text-xs text-muted-foreground">
                                  {t("sidebar.reportProject.targetObject")}
                                </dt>
                                <dd className="font-medium">
                                  {String(p.target_object_id)}
                                </dd>
                              </div>
                            ) : null}
                            {backupList.length > 0 ? (
                              <div className="sm:col-span-2">
                                <dt className="text-xs text-muted-foreground">
                                  {t("sidebar.reportProject.backupObjects")}
                                </dt>
                                <dd className="font-medium">
                                  {backupList.join(", ")}
                                </dd>
                              </div>
                            ) : null}
                          </dl>
                          {whyList.length > 0 ? (
                            <div className="mt-2">
                              <div className="text-xs text-muted-foreground">
                                {t("sidebar.reportProject.whyThisObject")}
                              </div>
                              <ul className="mt-0.5 list-inside list-disc space-y-0.5 text-xs text-muted-foreground">
                                {whyList.map((w, k) => (
                                  <li key={k}>{w}</li>
                                ))}
                              </ul>
                            </div>
                          ) : null}
                          {interventionsList.length > 0 ? (
                            <div className="mt-2">
                              <div className="text-xs text-muted-foreground">
                                {t(
                                  "sidebar.reportProject.requiredInterventions"
                                )}
                              </div>
                              <ul className="mt-0.5 list-inside list-disc space-y-0.5 text-xs text-muted-foreground">
                                {interventionsList.map((r, k) => (
                                  <li key={k}>{r}</li>
                                ))}
                              </ul>
                            </div>
                          ) : null}
                        </li>
                      );
                    })
                  ) : (
                    <li className="text-muted-foreground">{EMPTY_DISPLAY}</li>
                  )}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {questions.length > 0 && (
        <section>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            {t("sidebar.reportSectionQuestions")}
          </h3>
          <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
            {questions.map((q, i) => (
              <li key={i}>{q}</li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <button
          type="button"
          className="text-xs text-muted-foreground underline hover:text-foreground"
          onClick={() => setShowRaw((v) => !v)}
        >
          {showRaw ? "Hide " : ""}
          {t("sidebar.reportRawJson")}
        </button>
        {showRaw && (
          <pre className="mt-2 max-h-48 overflow-auto rounded border border-border bg-muted/30 p-3 text-xs">
            {JSON.stringify(report, null, 2)}
          </pre>
        )}
      </section>
    </div>
  );
}
