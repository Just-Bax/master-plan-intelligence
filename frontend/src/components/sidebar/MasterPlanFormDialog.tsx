import { useState, useEffect } from "react";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogContent,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useTranslation } from "react-i18next";
import type {
  GeoJSONGeometry,
  MasterPlan,
  MasterPlanFormData,
} from "@/types/api";
import { inputClassName } from "@/lib/utils";

interface MasterPlanFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  masterPlan: MasterPlan | null;
  /** When creating, geometry from map placement (circle). */
  initialGeometry?: GeoJSONGeometry;
  onSubmit: (data: MasterPlanFormData) => Promise<void>;
  onDelete?: (id: number) => Promise<void>;
}

export function MasterPlanFormDialog({
  open,
  onOpenChange,
  masterPlan,
  initialGeometry,
  onSubmit,
  onDelete,
}: MasterPlanFormDialogProps) {
  const { t } = useTranslation();
  const isEdit = masterPlan !== null;
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  useEffect(() => {
    if (open) {
      setName(masterPlan?.name ?? "");
    }
  }, [open, masterPlan]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (isEdit) {
        await onSubmit({ name: name.trim() });
      } else {
        await onSubmit({
          name: name.trim(),
          geometry: initialGeometry ?? undefined,
        });
      }
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!masterPlan || !onDelete) return;
    setDeleting(true);
    try {
      await onDelete(masterPlan.id);
      onOpenChange(false);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <form onSubmit={handleSubmit}>
        <DialogHeader>
          <DialogTitle>
            {isEdit
              ? t("masterPlanForm.titleEdit")
              : t("masterPlanForm.titleNew")}
          </DialogTitle>
        </DialogHeader>
        <DialogContent className="space-y-3">
          {!isEdit && initialGeometry && (
            <p className="text-sm text-muted-foreground">
              {t("masterPlanForm.areaDefinedOnMap")}
            </p>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              {t("masterPlanForm.nameLabel")}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClassName}
              required
            />
          </div>
        </DialogContent>
        <DialogFooter>
          {isEdit && onDelete && (
            <>
              <Button
                type="button"
                variant="destructive"
                onClick={() => setDeleteConfirmOpen(true)}
                disabled={deleting}
              >
                {t("masterPlanForm.delete")}
              </Button>
              <ConfirmDialog
                open={deleteConfirmOpen}
                onOpenChange={setDeleteConfirmOpen}
                title={t("confirm.deleteMasterPlan.title")}
                description={t("confirm.deleteMasterPlan.description")}
                confirmLabel={t("confirm.deleteMasterPlan.confirmLabel")}
                cancelLabel={t("confirm.deleteMasterPlan.cancelLabel")}
                variant="destructive"
                onConfirm={handleDelete}
              />
            </>
          )}
          <div className="flex-1" />
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t("masterPlanForm.cancel")}
          </Button>
          <Button type="submit" disabled={saving}>
            {saving
              ? t("masterPlanForm.saving")
              : isEdit
                ? t("masterPlanForm.save")
                : t("masterPlanForm.create")}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
