import { useState } from "react";
import { useTranslation } from "react-i18next";
import { XMarkIcon } from "@heroicons/react/24/outline";
import type { MasterPlan } from "@/types/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { EMPTY_DISPLAY } from "@/constants";
import { reportBaseline, reportTotalNewProjects } from "@/lib/reportHelpers";
import { ReportPanelContent } from "@/components/sidebar/ReportPanelContent";

interface MasterPlanInfoProps {
  masterPlan: MasterPlan | null;
  loading?: boolean;
}

function formatArea(m2: number | null): string {
  if (m2 == null) return EMPTY_DISPLAY;
  return `${Number(m2).toLocaleString(undefined, { maximumFractionDigits: 0 })} m²`;
}

export function MasterPlanInfo({ masterPlan, loading }: MasterPlanInfoProps) {
  const { t } = useTranslation();
  const [reportDialogOpen, setReportDialogOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="shrink-0 px-4 py-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t("sidebar.masterPlanInfoHeading")}
          </h2>
        </div>
        <div className="flex-1 overflow-auto px-4 py-3">
          <div className="animate-pulse space-y-3">
            <div className="h-4 w-3/4 rounded bg-muted" />
            <div className="h-3 w-1/2 rounded bg-muted" />
            <div className="h-3 w-1/3 rounded bg-muted" />
          </div>
        </div>
      </div>
    );
  }

  if (!masterPlan) {
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="shrink-0 px-4 py-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t("sidebar.masterPlanInfoHeading")}
          </h2>
        </div>
        <div className="flex flex-1 items-center justify-center px-4 py-6">
          <p className="text-center text-sm text-muted-foreground">
            {t("sidebar.choosePlanAbove")}
          </p>
        </div>
      </div>
    );
  }

  const report = masterPlan.ai_development_report;
  const hasReport =
    report && typeof report === "object" && "masterplan_name" in report;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="shrink-0 px-4 py-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t("sidebar.masterPlanInfoHeading")}
        </h2>
      </div>
      <div className="flex-1 overflow-auto px-4 py-4">
        <dl className="space-y-3 text-sm">
          <div>
            <dt className="text-xs font-medium text-muted-foreground">
              {t("masterPlanForm.nameLabel")}
            </dt>
            <dd className="mt-0.5 font-medium">{masterPlan.name}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-muted-foreground">
              {t("sidebar.planAreaLabel")}
            </dt>
            <dd className="mt-0.5">{formatArea(masterPlan.area_m2)}</dd>
          </div>
        </dl>

        {hasReport && (
          <Card className="mt-5 overflow-hidden border border-primary/20 bg-primary/[0.06] shadow-sm gap-4 py-4">
            <CardHeader className="space-y-0.5">
              <CardTitle className="text-base font-semibold leading-tight">
                {t("sidebar.developmentReportHeading")}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {t("sidebar.reportGeneratedAt", {
                  date:
                    (report as { generated_at?: string }).generated_at ??
                    EMPTY_DISPLAY,
                })}
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <div className="flex min-w-0 flex-col items-center justify-center gap-1.5 rounded-lg border border-border/60 bg-background/90 px-2.5 py-3.5 text-center shadow-sm sm:px-3">
                  <div className="text-xs font-medium leading-tight text-muted-foreground">
                    {t("sidebar.reportSummaryObjects")}
                  </div>
                  <div className="text-lg font-semibold tabular-nums">
                    {reportBaseline(report).objects_total}
                  </div>
                </div>
                <div className="flex min-w-0 flex-col items-center justify-center gap-1.5 rounded-lg border border-border/60 bg-background/90 px-2.5 py-3.5 text-center shadow-sm sm:px-3">
                  <div className="text-xs font-medium leading-tight text-muted-foreground">
                    {t("sidebar.reportSummaryPopulation")}
                  </div>
                  <div className="text-lg font-semibold tabular-nums">
                    {reportBaseline(report).population_estimated ??
                      EMPTY_DISPLAY}
                  </div>
                </div>
                <div className="flex min-w-0 flex-col items-center justify-center gap-1.5 rounded-lg border border-border/60 bg-background/90 px-2.5 py-3.5 text-center shadow-sm sm:px-3">
                  <div className="text-xs font-medium leading-tight text-muted-foreground">
                    {t("sidebar.reportSummaryNewProjects")}
                  </div>
                  <div className="text-lg font-semibold tabular-nums">
                    {reportTotalNewProjects(report)}
                  </div>
                </div>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="w-full"
                onClick={() => setReportDialogOpen(true)}
              >
                {t("sidebar.reportViewFullReport")}
              </Button>
            </CardContent>
          </Card>
        )}

        {hasReport && (
          <Dialog
            open={reportDialogOpen}
            onOpenChange={setReportDialogOpen}
            className="max-w-5xl"
          >
            <DialogHeader className="relative flex-row items-start justify-between gap-4 border-b pr-10">
              <div className="flex flex-col gap-0.5">
                <DialogTitle>{t("sidebar.reportTitle")}</DialogTitle>
                <p className="text-sm text-muted-foreground">
                  {t("sidebar.reportGeneratedAt", {
                    date:
                      (report as { generated_at?: string }).generated_at ??
                      EMPTY_DISPLAY,
                  })}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-3 top-3 size-8 shrink-0"
                onClick={() => setReportDialogOpen(false)}
                aria-label={t("aiChat.close")}
              >
                <XMarkIcon className="size-5" />
              </Button>
            </DialogHeader>
            <DialogContent className="max-h-[70dvh] pt-2 overflow-y-auto">
              <ReportPanelContent report={report!} />
            </DialogContent>
            <DialogFooter>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setReportDialogOpen(false)}
              >
                {t("aiChat.close")}
              </Button>
            </DialogFooter>
          </Dialog>
        )}
      </div>
    </div>
  );
}
