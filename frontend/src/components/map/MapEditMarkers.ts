import L from "leaflet";
import { MAP_EDIT_ICON_SIZE_VERTEX } from "@/constants/map";
import { getRing, setRing } from "@/components/map/MapLayerUtils";

function createVertexIcon(): L.DivIcon {
  const [size] = MAP_EDIT_ICON_SIZE_VERTEX;
  const anchor = size / 2;
  return L.divIcon({
    className: "map-edit-vertex",
    iconSize: MAP_EDIT_ICON_SIZE_VERTEX,
    iconAnchor: [anchor, anchor],
  });
}

function createMiddleIcon(): L.DivIcon {
  const [size] = MAP_EDIT_ICON_SIZE_VERTEX;
  const anchor = size / 2;
  return L.divIcon({
    className: "map-edit-middle",
    iconSize: MAP_EDIT_ICON_SIZE_VERTEX,
    iconAnchor: [anchor, anchor],
  });
}

interface MiddleMarkerWithIndex extends L.Marker {
  _insertIndex?: number;
}

export function addEditMarkersForShape(
  map: L.Map,
  shape: L.Polygon | L.Polyline,
  group: L.LayerGroup,
  options: { pane?: string } = {}
): void {
  const ring = getRing(shape);
  if (ring.length === 0) return;

  const pane = options.pane ?? undefined;
  const getMarkerOptions = (overrides?: L.MarkerOptions) =>
    pane ? { ...overrides, pane } : overrides;

  const vertexIcon = createVertexIcon();
  const middleIcon = createMiddleIcon();

  const vertexMarkers: L.Marker[] = [];
  ring.forEach((latLng) => {
    const marker = L.marker(latLng, {
      draggable: true,
      icon: vertexIcon,
      ...getMarkerOptions(),
    });
    marker.on("drag", () => updateShape());
    group.addLayer(marker);
    vertexMarkers.push(marker);
  });

  let middleMarkers: L.Marker[] = [];

  const updateRingAndMove = () => {
    const newRing = vertexMarkers.map((marker) => marker.getLatLng());
    setRing(shape, newRing);
    shape.redraw();
  };

  function refreshMiddleMarkers() {
    middleMarkers.forEach((marker) => group.removeLayer(marker));
    middleMarkers = [];
    const currentRing = getRing(shape);
    for (let i = 0; i < currentRing.length; i++) {
      const a = currentRing[i];
      const b = currentRing[(i + 1) % currentRing.length];
      const mid = L.latLng((a.lat + b.lat) / 2, (a.lng + b.lng) / 2);
      const midMarker = L.marker(mid, {
        draggable: true,
        icon: middleIcon,
        ...getMarkerOptions(),
      }) as MiddleMarkerWithIndex;
      const insertIndex = i + 1;
      midMarker._insertIndex = insertIndex;
      midMarker.on("click", () => {
        const newRing = getRing(shape).map((ll) => L.latLng(ll.lat, ll.lng));
        newRing.splice(insertIndex, 0, mid);
        setRing(shape, newRing);
        shape.redraw();
        group.clearLayers();
        addEditMarkersForShape(map, shape, group, options);
      });
      midMarker.on("dragstart", () => {
        const currentRing = getRing(shape).map((ll) =>
          L.latLng(ll.lat, ll.lng)
        );
        const newVertex = midMarker.getLatLng();
        currentRing.splice(insertIndex, 0, newVertex);
        setRing(shape, currentRing);
        shape.redraw();
        const newVertexMarker = L.marker(newVertex, {
          draggable: true,
          icon: vertexIcon,
          ...getMarkerOptions(),
        });
        newVertexMarker.on("drag", () => updateShape());
        vertexMarkers.splice(insertIndex, 0, newVertexMarker);
        group.addLayer(newVertexMarker);
        updateRingAndMove();
      });
      midMarker.on("drag", () => {
        const idx = midMarker._insertIndex ?? insertIndex;
        if (vertexMarkers[idx]) {
          vertexMarkers[idx].setLatLng(midMarker.getLatLng());
          updateRingAndMove();
        }
      });
      midMarker.on("dragend", () => {
        refreshMiddleMarkers();
      });
      group.addLayer(midMarker);
      middleMarkers.push(midMarker);
    }
  }

  const updateShape = () => {
    updateRingAndMove();
    refreshMiddleMarkers();
  };

  refreshMiddleMarkers();
}
