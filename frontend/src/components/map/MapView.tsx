import "leaflet/dist/leaflet.css";
import { MapContainer } from "react-leaflet";
import { MapEditProvider } from "@/contexts/MapEditContext";
import { MapControls } from "@/components/map/MapControls";
import { MapObjectsToggle } from "@/components/map/MapObjectsToggle";
import { MapEditToolbar } from "@/components/map/MapEditToolbar";
import { PlacementModeSelector } from "@/components/map/PlacementModeSelector";
import { MapZoomSync } from "@/components/map/MapZoomSync";
import { MapDataLayer } from "@/components/map/MapDataLayer";
import { PlanPlacementPreviewLayer } from "@/components/map/PlanPlacementPreviewLayer";
import { OsmTileLayer } from "@/components/map/OsmTileLayer";
import { MAP_DEFAULT_CENTER, MAP_DEFAULT_ZOOM } from "@/constants";

export function MapView() {
  return (
    <div className="relative h-full w-full">
      <MapEditProvider>
        <MapContainer
          center={MAP_DEFAULT_CENTER}
          zoom={MAP_DEFAULT_ZOOM}
          className="h-full w-full z-0"
          zoomControl={false}
          attributionControl={false}
        >
          <OsmTileLayer />
          <MapZoomSync />
          <MapDataLayer />
          <PlanPlacementPreviewLayer />
          <MapEditToolbar />
          <PlacementModeSelector />
          <MapControls />
          <MapObjectsToggle />
        </MapContainer>
      </MapEditProvider>
    </div>
  );
}
