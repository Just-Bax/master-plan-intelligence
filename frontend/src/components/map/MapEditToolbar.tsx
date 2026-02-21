import { useEffect, useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { CheckIcon } from "@heroicons/react/24/solid";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { NewMasterPlanPlacement } from "@/types/map";
import { useMapData } from "@/contexts/MapDataContext";
import { useMapEdit } from "@/contexts/MapEditContext";
import { isPlacementComplete, placementToPolygon } from "@/lib/planPlacement";
import { cn, mapToolbarClassName } from "@/lib/utils";

export function MapEditToolbar() {
  const { t } = useTranslation();
  const {
    newMasterPlanPlacement,
    setNewMasterPlanPlacement,
    setPendingNewMasterPlanGeometry,
  } = useMapData();
  const { editMode, setEditMode, editActionsRef } = useMapEdit();
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const isPlacing =
    newMasterPlanPlacement !== null &&
    !isPlacementComplete(newMasterPlanPlacement);
  const placementComplete =
    newMasterPlanPlacement !== null &&
    isPlacementComplete(newMasterPlanPlacement);

  useEffect(() => {
    if (newMasterPlanPlacement !== null) setEditMode(false);
  }, [newMasterPlanPlacement, setEditMode]);

  function handlePlacementConfirm() {
    if (!newMasterPlanPlacement) return;
    const polygon = placementToPolygon(newMasterPlanPlacement);
    if (!polygon) return;
    setPendingNewMasterPlanGeometry(polygon);
    setNewMasterPlanPlacement(null);
  }

  function handlePlacementCancel() {
    setNewMasterPlanPlacement(null);
  }

  async function handleSave() {
    const saveFn = editActionsRef.current?.save;
    if (!saveFn) return;
    setSaving(true);
    try {
      await saveFn();
      setEditMode(false);
    } finally {
      setSaving(false);
    }
  }

  function requestCancel() {
    setCancelDialogOpen(true);
  }

  function confirmCancel() {
    editActionsRef.current?.cancel();
    setEditMode(false);
    setCancelDialogOpen(false);
  }

  return (
    <>
      {isPlacing && (
        <div
          className={cn(
            "absolute left-4 top-4 items-center gap-0",
            mapToolbarClassName,
            "flex flex-row"
          )}
          style={{ marginTop: 0 }}
        >
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-9 shrink-0 rounded-lg border border-border/50 px-3 hover:bg-accent"
            onClick={handlePlacementCancel}
            title={t("mapEdit.cancel")}
            aria-label={t("mapEdit.cancel")}
          >
            <XMarkIcon className="size-4 mr-1.5" />
            {t("mapEdit.cancel")}
          </Button>
        </div>
      )}
      {placementComplete && (
        <div
          className={cn(
            "absolute left-4 top-4 items-center gap-0",
            mapToolbarClassName,
            "flex flex-row"
          )}
          style={{ marginTop: 0 }}
        >
          <Button
            type="button"
            variant="default"
            size="sm"
            className="h-9 shrink-0 rounded-l-lg rounded-r-none border-0 border-r border-border/50 px-3 font-medium"
            onClick={handlePlacementConfirm}
            title={t("mapEdit.confirmPlacement")}
            aria-label={t("mapEdit.confirmPlacement")}
          >
            <CheckIcon className="size-4 mr-1.5" />
            {t("mapEdit.confirmPlacement")}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-9 shrink-0 rounded-r-lg rounded-l-none border-0 px-3 hover:bg-accent"
            onClick={handlePlacementCancel}
            title={t("mapEdit.cancel")}
            aria-label={t("mapEdit.cancel")}
          >
            <XMarkIcon className="size-4 mr-1.5" />
            {t("mapEdit.cancel")}
          </Button>
        </div>
      )}
      {editMode && (
        <div
          className={cn(
            "absolute left-4 top-4 items-center gap-0",
            mapToolbarClassName,
            "flex flex-row"
          )}
          style={{ marginTop: 0 }}
        >
          <Button
            type="button"
            variant="default"
            size="sm"
            className="h-9 shrink-0 rounded-l-lg rounded-r-none border-0 border-r border-border/50 px-3 font-medium"
            onClick={handleSave}
            disabled={saving}
            title={t("mapEdit.save")}
            aria-label={t("mapEdit.save")}
          >
            <CheckIcon className="size-4 mr-1.5" />
            {saving ? t("mapEdit.saving") : t("mapEdit.save")}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-9 shrink-0 rounded-r-lg rounded-l-none border-0 px-3 hover:bg-accent"
            onClick={requestCancel}
            title={t("mapEdit.cancel")}
            aria-label={t("mapEdit.cancel")}
          >
            <XMarkIcon className="size-4 mr-1.5" />
            {t("mapEdit.cancel")}
          </Button>
        </div>
      )}
      <ConfirmDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        title={t("confirm.cancelEdit.title")}
        description={t("confirm.cancelEdit.description")}
        confirmLabel={t("confirm.cancelEdit.confirmLabel")}
        cancelLabel={t("confirm.cancelEdit.cancelLabel")}
        variant="destructive"
        onConfirm={confirmCancel}
      />
    </>
  );
}
