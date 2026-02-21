import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import { useTheme } from "@/hooks/useTheme";
import { TILE_DARK, TILE_LIGHT, TILE_ATTRIBUTION } from "@/constants";

export function OsmTileLayer() {
  const map = useMap();
  const { theme } = useTheme();
  const layerRef = useRef<L.TileLayer | null>(null);

  useEffect(() => {
    if (layerRef.current) {
      map.removeLayer(layerRef.current);
      layerRef.current = null;
    }
    const url = theme === "dark" ? TILE_DARK : TILE_LIGHT;
    const layer = L.tileLayer(url, { attribution: TILE_ATTRIBUTION });
    layer.addTo(map);
    layerRef.current = layer;
    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
    };
  }, [map, theme]);

  return null;
}
