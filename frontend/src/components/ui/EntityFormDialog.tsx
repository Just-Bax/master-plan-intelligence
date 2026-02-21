import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogContent,
  DialogFooter,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

export interface EntityFormDialogDeleteConfig {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
  deleting: boolean;
  buttonLabel: string;
  confirmTitle: string;
  confirmDescription: string;
  confirmLabel: string;
  cancelLabel: string;
}

export interface EntityFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
  onSubmit: (e: React.FormEvent) => void;
  saving: boolean;
  cancelLabel: string;
  submitLabel: string;
  deleteConfig?: EntityFormDialogDeleteConfig;
}

export function EntityFormDialog({
  open,
  onOpenChange,
  title,
  children,
  onSubmit,
  saving,
  cancelLabel,
  submitLabel,
  deleteConfig,
}: EntityFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <form onSubmit={onSubmit}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <DialogContent className="space-y-3">{children}</DialogContent>
        <DialogFooter>
          {deleteConfig && (
            <>
              <Button
                type="button"
                variant="destructive"
                onClick={() => deleteConfig.onOpenChange(true)}
                disabled={deleteConfig.deleting}
              >
                {deleteConfig.buttonLabel}
              </Button>
              <ConfirmDialog
                open={deleteConfig.open}
                onOpenChange={deleteConfig.onOpenChange}
                title={deleteConfig.confirmTitle}
                description={deleteConfig.confirmDescription}
                confirmLabel={deleteConfig.confirmLabel}
                cancelLabel={deleteConfig.cancelLabel}
                variant="destructive"
                onConfirm={deleteConfig.onConfirm}
              />
            </>
          )}
          <div className="flex-1" />
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {cancelLabel}
          </Button>
          <Button type="submit" disabled={saving}>
            {submitLabel}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
