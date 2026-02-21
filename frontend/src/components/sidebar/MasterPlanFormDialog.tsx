import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import type {
  GeoJSONGeometry,
  MasterPlan,
  MasterPlanFormData,
} from "@/types/api";
import { EntityFormDialog } from "@/components/ui/EntityFormDialog";
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

  const deleteConfig =
    isEdit && onDelete
      ? {
          open: deleteConfirmOpen,
          onOpenChange: setDeleteConfirmOpen,
          onConfirm: handleDelete,
          deleting: deleting,
          buttonLabel: t("masterPlanForm.delete"),
          confirmTitle: t("confirm.deleteMasterPlan.title"),
          confirmDescription: t("confirm.deleteMasterPlan.description"),
          confirmLabel: t("confirm.deleteMasterPlan.confirmLabel"),
          cancelLabel: t("confirm.deleteMasterPlan.cancelLabel"),
        }
      : undefined;

  return (
    <EntityFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={
        isEdit ? t("masterPlanForm.titleEdit") : t("masterPlanForm.titleNew")
      }
      onSubmit={handleSubmit}
      saving={saving}
      cancelLabel={t("masterPlanForm.cancel")}
      submitLabel={
        saving
          ? t("masterPlanForm.saving")
          : isEdit
            ? t("masterPlanForm.save")
            : t("masterPlanForm.create")
      }
      deleteConfig={deleteConfig}
    >
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
    </EntityFormDialog>
  );
}
