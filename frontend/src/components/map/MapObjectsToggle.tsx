import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { cn, mapToolbarClassName } from "@/lib/utils";
import { useMapData } from "@/contexts/MapDataContext";

export function MapObjectsToggle() {
  const { objectsLayerVisible, setObjectsLayerVisible } = useMapData();

  return (
    <div
      className={cn("absolute bottom-6 right-4", mapToolbarClassName)}
      onClick={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
    >
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 shrink-0 rounded-lg"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setObjectsLayerVisible(!objectsLayerVisible);
        }}
        onDoubleClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
        title={objectsLayerVisible ? "Скрыть объекты" : "Показать объекты"}
        aria-label={objectsLayerVisible ? "Скрыть объекты" : "Показать объекты"}
      >
        {objectsLayerVisible ? (
          <EyeIcon className="size-5 shrink-0 stroke-[2.5]" />
        ) : (
          <EyeSlashIcon className="size-5 shrink-0 stroke-[2.5]" />
        )}
      </Button>
    </div>
  );
}
