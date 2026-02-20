import { useState } from "react";
import { useTranslation } from "react-i18next";
import { SparklesIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { SIDEBAR_WIDTH_PX } from "@/constants";
import { MasterPlanSelect } from "@/components/sidebar/MasterPlanSelect";
import { SidebarPlansSkeleton } from "@/components/sidebar/SidebarSkeletons";
import { MasterPlanInfo } from "@/components/sidebar/MasterPlanInfo";
import { ChatPanel } from "@/components/sidebar/ChatPanel";
import { useMapData } from "@/contexts/MapDataContext";

export function Sidebar() {
  const { t } = useTranslation();
  const [sidebarView, setSidebarView] = useState<"default" | "ai">("default");
  const {
    masterPlans,
    activeId,
    setActiveId,
    objects,
    selectedId,
    masterPlansLoading,
    masterPlansError,
    setFlyToTarget,
    onMasterPlanCreate,
    onMasterPlanUpdate,
    onMasterPlanDelete,
    projects,
    activeProjectId,
  } = useMapData();

  const activeMasterPlan =
    activeId !== null
      ? (masterPlans.find((p) => p.id === activeId) ?? null)
      : null;
  const selectedObjects =
    selectedId !== null ? objects.filter((o) => o.id === selectedId) : [];

  const activeProject =
    activeProjectId !== null
      ? (projects.find((p) => p.id === activeProjectId) ?? null)
      : null;

  if (sidebarView === "ai") {
    return (
      <aside
        className="flex shrink-0 flex-col overflow-hidden border-l bg-background"
        style={{ width: `${SIDEBAR_WIDTH_PX}px` }}
      >
        <ChatPanel
          activeMasterPlan={activeMasterPlan}
          activeProject={activeProject}
          selectedObjects={selectedObjects}
          onClose={() => setSidebarView("default")}
        />
      </aside>
    );
  }

  return (
    <aside
      className="flex shrink-0 flex-col overflow-hidden border-l bg-background"
      style={{ width: `${SIDEBAR_WIDTH_PX}px` }}
    >
      <div className="shrink-0 border-b p-4">
        {masterPlansLoading && <SidebarPlansSkeleton />}
        {masterPlansError && (
          <p
            className="mb-3 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            role="alert"
          >
            {masterPlansError}
          </p>
        )}
        <MasterPlanSelect
          masterPlans={masterPlans}
          activeId={activeId}
          onActiveIdChange={setActiveId}
          loading={masterPlansLoading}
          onMasterPlanCreate={onMasterPlanCreate}
          onMasterPlanUpdate={onMasterPlanUpdate}
          onMasterPlanDelete={onMasterPlanDelete}
          onSeeOnMap={(planId) =>
            setFlyToTarget({ type: "masterPlan", id: planId })
          }
        />
      </div>
      <MasterPlanInfo
        masterPlan={activeMasterPlan}
        loading={masterPlansLoading}
      />
      <div className="shrink-0 space-y-2 border-t p-4">
        <Button
          className="w-full bg-gradient-to-r from-primary to-[var(--ai-gradient-end)] text-primary-foreground hover:opacity-90"
          size="default"
          onClick={() => setSidebarView("ai")}
        >
          <SparklesIcon className="size-4 mr-2" />
          {t("sidebar.aiButton")}
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          {t("sidebar.aiSubtitle")}
        </p>
      </div>
    </aside>
  );
}
