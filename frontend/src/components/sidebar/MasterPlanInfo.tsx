import { useTranslation } from "react-i18next";
import type { MasterPlan } from "@/types/api";

interface MasterPlanInfoProps {
  masterPlan: MasterPlan | null;
  loading?: boolean;
}

function formatArea(m2: number | null): string {
  if (m2 == null) return "—";
  return `${Number(m2).toLocaleString(undefined, { maximumFractionDigits: 0 })} m²`;
}

export function MasterPlanInfo({ masterPlan, loading }: MasterPlanInfoProps) {
  const { t } = useTranslation();

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
      </div>
    </div>
  );
}
