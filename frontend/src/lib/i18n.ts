import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "@/locales/en.json";
import ru from "@/locales/ru.json";
import uz from "@/locales/uz.json";
import { SUPPORTED_LOCALES, type Locale } from "@/types/i18n";

export const LOCALE_STORAGE_KEY = "master-plan-intelligence.locale";
export { SUPPORTED_LOCALES };
export type { Locale };

export const DEFAULT_LOCALE: Locale = "ru";

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "EN",
  ru: "RU",
  uz: "UZ",
};

function getStoredLocale(): Locale | null {
  try {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (stored && SUPPORTED_LOCALES.includes(stored as Locale))
      return stored as Locale;
  } catch {
    /* ignore */
  }
  return null;
}

const resources = {
  en: { translation: en },
  ru: { translation: ru },
  uz: { translation: uz },
};

i18n.use(initReactI18next).init({
  resources,
  lng: getStoredLocale() ?? DEFAULT_LOCALE,
  fallbackLng: DEFAULT_LOCALE,
  interpolation: {
    escapeValue: false,
  },
});

i18n.on("languageChanged", (lng) => {
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, lng);
  } catch {
    /* ignore */
  }
});

export default i18n;
