import { useEffect, useState } from "react";
import { useMap, useMapEvents } from "react-leaflet";

/** Syncs map zoom to a CSS variable on the map container for zoom-responsive edit markers. */
export function MapZoomSync() {
  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());

  useMapEvents({
    zoomend: () => setZoom(map.getZoom()),
  });

  useEffect(() => {
    const container = map.getContainer();
    if (!container) return;
    container.style.setProperty("--map-zoom", String(zoom));
    return () => {
      container.style.removeProperty("--map-zoom");
    };
  }, [map, zoom]);

  return null;
}
