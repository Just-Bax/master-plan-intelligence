import { useRef, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  DEFAULT_LOCALE,
  LOCALE_LABELS,
  SUPPORTED_LOCALES,
  type Locale,
} from "@/lib/i18n";
import { cn } from "@/lib/utils";

function resolveLocale(lng: string | undefined): Locale {
  const code = lng?.slice(0, 2).toLowerCase();
  if (SUPPORTED_LOCALES.some((locale) => locale === code))
    return code as Locale;
  return DEFAULT_LOCALE;
}

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [open]);

  const current = resolveLocale(i18n.language);

  function selectLocale(locale: Locale) {
    i18n.changeLanguage(locale);
    setOpen(false);
  }

  return (
    <div className="relative" ref={menuRef}>
      <Button
        variant="ghost"
        size="icon"
        className="min-w-10 justify-center"
        onClick={() => setOpen((o) => !o)}
        aria-label={current}
        aria-expanded={open}
        title={LOCALE_LABELS[current]}
      >
        <span className="text-xs font-medium tabular-nums text-center">
          {LOCALE_LABELS[current]}
        </span>
      </Button>
      {open && (
        <div
          className={cn(
            "absolute left-1/2 -translate-x-1/2 top-full z-50 mt-2 min-w-10 rounded-md border bg-popover text-popover-foreground shadow-md"
          )}
          role="menu"
        >
          {SUPPORTED_LOCALES.map((locale) => (
            <button
              key={locale}
              type="button"
              className={cn(
                "w-full px-3 py-2 text-center text-sm hover:bg-accent",
                current === locale
                  ? "font-medium text-foreground bg-accent/50"
                  : "text-muted-foreground"
              )}
              onClick={() => selectLocale(locale)}
              role="menuitem"
            >
              {LOCALE_LABELS[locale]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
