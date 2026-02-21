import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { useTranslation } from "react-i18next";
import type { MasterPlan, Project, ProjectFormData } from "@/types/api";
import { EntityFormDialog } from "@/components/ui/EntityFormDialog";
import { inputClassName } from "@/lib/utils";

export type { ProjectFormData };

interface ProjectFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project | null;
  masterPlans: MasterPlan[];
  onSubmit: (data: ProjectFormData) => Promise<void>;
  onDelete?: (id: number) => Promise<void>;
}

export function ProjectFormDialog({
  open,
  onOpenChange,
  project,
  masterPlans,
  onSubmit,
  onDelete,
}: ProjectFormDialogProps) {
  const { t } = useTranslation();
  const isEdit = project !== null;
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [masterPlanId, setMasterPlanId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  useEffect(() => {
    if (open) {
      setName(project?.name ?? "");
      setDescription(project?.description ?? "");
      setMasterPlanId(project?.master_plan_id ?? null);
    }
  }, [open, project]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim() || null,
        master_plan_id: masterPlanId,
      });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!project || !onDelete) return;
    setDeleting(true);
    try {
      await onDelete(project.id);
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
          buttonLabel: t("projectForm.delete"),
          confirmTitle: t("confirm.deleteProject.title"),
          confirmDescription: t("confirm.deleteProject.description"),
          confirmLabel: t("confirm.deleteProject.confirmLabel"),
          cancelLabel: t("confirm.deleteProject.cancelLabel"),
        }
      : undefined;

  return (
    <EntityFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? t("projectForm.titleEdit") : t("projectForm.titleNew")}
      onSubmit={handleSubmit}
      saving={saving}
      cancelLabel={t("projectForm.cancel")}
      submitLabel={
        saving
          ? t("projectForm.saving")
          : isEdit
            ? t("projectForm.save")
            : t("projectForm.create")
      }
      deleteConfig={deleteConfig}
    >
      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">
          {t("projectForm.nameLabel")}
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClassName}
          required
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">
          {t("projectForm.descriptionLabel")}
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={inputClassName}
          rows={3}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">
          {t("projectForm.masterPlanLabel")}
        </label>
        <Select
          value={masterPlanId !== null ? String(masterPlanId) : "none"}
          onValueChange={(v) =>
            setMasterPlanId(v === "none" ? null : Number(v))
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={t("projectForm.masterPlanPlaceholder")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">
              {t("projectForm.noMasterPlan")}
            </SelectItem>
            {masterPlans.map((plan) => (
              <SelectItem key={plan.id} value={String(plan.id)}>
                {plan.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </EntityFormDialog>
  );
}
