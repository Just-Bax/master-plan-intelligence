import {
  createContext,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { MapEditActions } from "@/types/map";

export type { MapEditActions };

interface MapEditContextValue {
  editMode: boolean;
  setEditMode: (v: boolean) => void;
  editActionsRef: React.MutableRefObject<MapEditActions | null>;
}

const MapEditContext = createContext<MapEditContextValue | null>(null);

export function MapEditProvider({ children }: { children: ReactNode }) {
  const [editMode, setEditMode] = useState(false);
  const editActionsRef = useRef<MapEditActions | null>(null);
  return (
    <MapEditContext.Provider value={{ editMode, setEditMode, editActionsRef }}>
      {children}
    </MapEditContext.Provider>
  );
}

export function useMapEdit(): MapEditContextValue {
  const ctx = useContext(MapEditContext);
  if (!ctx) throw new Error("useMapEdit must be used within MapEditProvider");
  return ctx;
}
