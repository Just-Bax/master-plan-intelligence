import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useMapData } from "@/contexts/MapDataContext";
import { MAP_PLACEMENT_DEFAULT_RADIUS_M } from "@/constants/map";
import { cn, mapToolbarClassName } from "@/lib/utils";

type PlacementMode = "radius" | "corners";

export function PlacementModeSelector() {
  const { t } = useTranslation();
  const { newMasterPlanPlacement, setNewMasterPlanPlacement } = useMapData();

  if (newMasterPlanPlacement === null) return null;

  const mode: PlacementMode = newMasterPlanPlacement.mode;

  function setRadius() {
    setNewMasterPlanPlacement({
      mode: "radius",
      center: null,
      radiusM: MAP_PLACEMENT_DEFAULT_RADIUS_M,
      radiusFixed: false,
    });
  }

  function setCorners() {
    setNewMasterPlanPlacement({ mode: "corners", points: [] });
  }

  return (
    <div
      className={cn(
        "absolute right-4 top-4 items-center gap-0",
        mapToolbarClassName,
        "flex flex-row"
      )}
      style={{ marginTop: 0 }}
    >
      <Button
        type="button"
        variant={mode === "corners" ? "default" : "ghost"}
        size="sm"
        className={cn(
          "h-9 shrink-0 px-3 font-medium",
          mode === "corners"
            ? "rounded-l-lg rounded-r-none border-0 border-r border-border/50"
            : "rounded-none border-0 border-r border-border/50 hover:bg-accent"
        )}
        onClick={setCorners}
        title={t("sidebar.addPlanByCorners")}
        aria-label={t("sidebar.addPlanByCorners")}
        aria-pressed={mode === "corners"}
      >
        {t("sidebar.addPlanByCorners")}
      </Button>
      <Button
        type="button"
        variant={mode === "radius" ? "default" : "ghost"}
        size="sm"
        className={cn(
          "h-9 shrink-0 px-3 font-medium",
          mode === "radius"
            ? "rounded-r-lg rounded-l-none border-0 px-3"
            : "rounded-r-lg rounded-l-none border-0 px-3 hover:bg-accent"
        )}
        onClick={setRadius}
        title={t("sidebar.addPlanByRadius")}
        aria-label={t("sidebar.addPlanByRadius")}
        aria-pressed={mode === "radius"}
      >
        {t("sidebar.addPlanByRadius")}
      </Button>
    </div>
  );
}
