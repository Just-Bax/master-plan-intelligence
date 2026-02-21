import { useState, useEffect } from "react";
import {
  MapIcon,
  PencilSquareIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { useTranslation } from "react-i18next";
import { MasterPlanFormDialog } from "@/components/sidebar/MasterPlanFormDialog";
import type { MasterPlan } from "@/types/api";
import type { GeoJSONGeometry, MasterPlanFormData } from "@/types/api";
import type { NewMasterPlanPlacement } from "@/types/map";
import { useMapData } from "@/contexts/MapDataContext";
import { AddPlanButton } from "@/components/sidebar/AddPlanButton";

interface MasterPlanSelectProps {
  masterPlans: MasterPlan[];
  activeId: number | null;
  onActiveIdChange: (id: number | null) => void;
  loading: boolean;
  onMasterPlanCreate: (data: MasterPlanFormData) => Promise<void>;
  onMasterPlanUpdate: (id: number, data: MasterPlanFormData) => Promise<void>;
  onMasterPlanDelete: (id: number) => Promise<void>;
  onSeeOnMap?: (planId: number) => void;
}

export function MasterPlanSelect({
  masterPlans,
  activeId,
  onActiveIdChange,
  loading,
  onMasterPlanCreate,
  onMasterPlanUpdate,
  onMasterPlanDelete,
  onSeeOnMap,
}: MasterPlanSelectProps) {
  const { t } = useTranslation();
  const {
    setNewMasterPlanPlacement,
    pendingNewMasterPlanGeometry,
    setPendingNewMasterPlanGeometry,
  } = useMapData();
  const [formOpen, setFormOpen] = useState(false);
  const [editingMasterPlan, setEditingMasterPlan] = useState<MasterPlan | null>(
    null
  );
  const [initialGeometry, setInitialGeometry] =
    useState<GeoJSONGeometry | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const activeMasterPlan = masterPlans.find((p) => p.id === activeId);
  const value = activeId !== null ? String(activeId) : "all";

  useEffect(() => {
    if (pendingNewMasterPlanGeometry) {
      setInitialGeometry(pendingNewMasterPlanGeometry);
      setFormOpen(true);
      setEditingMasterPlan(null);
      setPendingNewMasterPlanGeometry(null);
    }
  }, [pendingNewMasterPlanGeometry, setPendingNewMasterPlanGeometry]);

  async function handleSubmit(data: MasterPlanFormData) {
    if (editingMasterPlan) {
      await onMasterPlanUpdate(editingMasterPlan.id, data);
    } else {
      await onMasterPlanCreate({
        ...data,
        geometry: initialGeometry ?? data.geometry,
      });
      setInitialGeometry(null);
    }
  }

  function startAddMasterPlan(placement: NonNullable<NewMasterPlanPlacement>) {
    setEditingMasterPlan(null);
    setInitialGeometry(null);
    setNewMasterPlanPlacement(placement);
  }

  function handleFormOpenChange(open: boolean) {
    if (!open) setInitialGeometry(null);
    setFormOpen(open);
  }

  function openEdit() {
    setEditingMasterPlan(activeMasterPlan ?? null);
    setFormOpen(true);
  }

  function handleDeleteConfirm() {
    if (activeMasterPlan) {
      onMasterPlanDelete(activeMasterPlan.id);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t("sidebar.masterPlanHeading")}
        </h2>
        <>
          <div
            className="inline-flex overflow-hidden rounded-lg border border-border/50 bg-background shadow-sm"
            role="group"
          >
            <AddPlanButton
              onSelect={startAddMasterPlan}
              disabled={loading}
              className="shrink-0"
            />
            <Button
              size="icon"
              variant="iconCardGroup"
              className="h-8 w-8 rounded-none border-0 border-r border-border/50 disabled:opacity-50"
              onClick={openEdit}
              disabled={!activeMasterPlan}
              title={t("sidebar.editPlan")}
              aria-label={t("sidebar.editPlan")}
            >
              <PencilSquareIcon className="size-4" />
            </Button>
            {onSeeOnMap &&
              activeMasterPlan &&
              "geometry" in activeMasterPlan &&
              activeMasterPlan.geometry && (
                <Button
                  size="icon"
                  variant="iconCardGroup"
                  className="h-8 w-8 rounded-none border-0 border-r border-border/50 disabled:opacity-50"
                  onClick={() => onSeeOnMap(activeMasterPlan.id)}
                  title={t("sidebar.showOnMap")}
                  aria-label={t("sidebar.showOnMap")}
                >
                  <MapIcon className="size-4" />
                </Button>
              )}
            <Button
              size="icon"
              variant="iconCardGroupDestructive"
              className="h-8 w-8 rounded-r-lg rounded-l-none border-0 disabled:opacity-50"
              onClick={() => setDeleteConfirmOpen(true)}
              disabled={!activeMasterPlan}
              title={t("sidebar.deletePlan")}
              aria-label={t("sidebar.deletePlan")}
            >
              <TrashIcon className="size-4" />
            </Button>
          </div>
          <ConfirmDialog
            open={deleteConfirmOpen}
            onOpenChange={setDeleteConfirmOpen}
            title={t("confirm.deleteMasterPlan.title")}
            description={t("confirm.deleteMasterPlan.description")}
            confirmLabel={t("confirm.deleteMasterPlan.confirmLabel")}
            cancelLabel={t("confirm.deleteMasterPlan.cancelLabel")}
            variant="destructive"
            onConfirm={handleDeleteConfirm}
          />
        </>
      </div>
      {loading ? (
        <Skeleton className="h-9 w-full rounded-md" aria-hidden />
      ) : (
        <Select
          value={value}
          onValueChange={(v) => {
            if (v === "all") onActiveIdChange(null);
            else if (v !== "") onActiveIdChange(Number(v));
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue
              placeholder={
                value === "all"
                  ? t("sidebar.allPlans")
                  : activeMasterPlan
                    ? `${activeMasterPlan.name}${t("sidebar.activeSuffix")}`
                    : t("sidebar.choosePlan")
              }
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("sidebar.allPlans")}</SelectItem>
            {masterPlans.map((plan) => (
              <SelectItem key={plan.id} value={String(plan.id)}>
                {plan.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      {!loading && masterPlans.length === 0 && (
        <p className="mt-2 text-sm text-muted-foreground">
          {t("sidebar.noPlans")}
          {t("sidebar.noPlansHint")}
        </p>
      )}
      <MasterPlanFormDialog
        open={formOpen}
        onOpenChange={handleFormOpenChange}
        masterPlan={editingMasterPlan}
        initialGeometry={initialGeometry ?? undefined}
        onSubmit={handleSubmit}
        onDelete={
          editingMasterPlan ? (id) => onMasterPlanDelete(id) : undefined
        }
      />
    </div>
  );
}
