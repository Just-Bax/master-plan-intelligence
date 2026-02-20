import { useCallback, useSyncExternalStore } from "react";
import { THEME_STORAGE_KEY } from "@/constants";

type Theme = "light" | "dark";

// Single source of truth so every component (including map tile layer) re-renders when theme changes.
let currentTheme: Theme = (() => {
  if (typeof window === "undefined") return "light";
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
    if (stored === "light" || stored === "dark") return stored;
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  } catch {
    return "light";
  }
})();

type Listener = () => void;
const listeners = new Set<Listener>();

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): Theme {
  return currentTheme;
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(theme);
}

applyTheme(currentTheme);

function setThemeStore(next: Theme) {
  if (currentTheme === next) return;
  currentTheme = next;
  localStorage.setItem(THEME_STORAGE_KEY, next);
  applyTheme(next);
  listeners.forEach((l) => l());
}

export function useTheme(): {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
} {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const setTheme = useCallback((t: Theme) => {
    setThemeStore(t);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeStore(currentTheme === "light" ? "dark" : "light");
  }, []);

  return { theme, setTheme, toggleTheme };
}
