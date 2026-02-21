import { useState } from "react";
import { useMap, useMapEvents } from "react-leaflet";
import { MinusIcon, PlusIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/Button";
import { cn, mapToolbarClassName } from "@/lib/utils";
import { MAP_DEFAULT_CENTER, MAP_DEFAULT_ZOOM } from "@/constants";

export function MapControls() {
  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());

  useMapEvents({
    zoomend: () => setZoom(map.getZoom()),
  });

  return (
    <div className={cn("absolute bottom-6 left-4", mapToolbarClassName)}>
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 shrink-0 rounded-t-lg rounded-b-none"
        onClick={() => map.zoomIn()}
        title="Приблизить"
        aria-label="Приблизить"
      >
        <PlusIcon className="size-5 shrink-0 stroke-[2.5]" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 shrink-0 rounded-none border-t border-border/50 font-mono text-xs tabular-nums"
        onClick={() => map.setView(MAP_DEFAULT_CENTER, MAP_DEFAULT_ZOOM)}
        title="Сбросить масштаб"
        aria-label="Сбросить масштаб"
      >
        {zoom}
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 shrink-0 rounded-b-lg rounded-t-none border-t border-border/50"
        onClick={() => map.zoomOut()}
        title="Отдалить"
        aria-label="Отдалить"
      >
        <MinusIcon className="size-5 shrink-0 stroke-[2.5]" />
      </Button>
    </div>
  );
}
