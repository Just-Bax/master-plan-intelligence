import { PlusIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import type { NewMasterPlanPlacement } from "@/types/map";

interface AddPlanButtonProps {
  onSelect: (placement: NonNullable<NewMasterPlanPlacement>) => void;
  disabled?: boolean;
  className?: string;
}

/** Button that starts add-plan placement with default mode (4 corners). */
export function AddPlanButton({
  onSelect,
  disabled,
  className,
}: AddPlanButtonProps) {
  const { t } = useTranslation();

  function handleClick() {
    if (disabled) return;
    onSelect({
      mode: "corners",
      points: [],
    });
  }

  return (
    <div className={cn("relative", className)}>
      <Button
        type="button"
        size="icon"
        variant="iconCardGroup"
        className="h-8 w-8 rounded-l-lg rounded-r-none border-0 border-r border-border/50 disabled:opacity-50"
        onClick={handleClick}
        disabled={disabled}
        title={t("sidebar.addPlan")}
        aria-label={t("sidebar.addPlan")}
      >
        <PlusIcon className="size-4" />
      </Button>
    </div>
  );
}
