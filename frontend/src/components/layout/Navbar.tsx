import { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { EMPTY_DISPLAY, ROUTES } from "@/constants";
import { GlobeAltIcon, MoonIcon, SunIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/Button";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

export function Navbar() {
  const { t } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!userMenuOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [userMenuOpen]);

  function handleSignOut() {
    setUserMenuOpen(false);
    logout();
    navigate(ROUTES.SIGN_IN, { replace: true });
  }

  const initial = user?.email?.slice(0, 1).toUpperCase() ?? "U";

  return (
    <header className="flex h-14 items-center justify-between border-b bg-background px-4">
      <div className="flex items-center gap-2">
        <GlobeAltIcon className="size-6 shrink-0 text-primary" aria-hidden />
        <span className="text-lg font-semibold tracking-tight text-foreground">
          {t("navbar.appTitle")}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          aria-label={
            theme === "dark" ? t("navbar.lightMode") : t("navbar.darkMode")
          }
          title={
            theme === "dark" ? t("navbar.lightMode") : t("navbar.darkMode")
          }
        >
          {theme === "dark" ? (
            <SunIcon className="size-5 shrink-0" />
          ) : (
            <MoonIcon className="size-5 shrink-0" />
          )}
        </Button>
        <LanguageSwitcher />
        <div className="relative" ref={menuRef}>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 rounded-full"
            onClick={() => setUserMenuOpen((o) => !o)}
            aria-label={t("navbar.userMenu")}
            aria-expanded={userMenuOpen}
          >
            <span className="size-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium text-muted-foreground">
              {initial}
            </span>
          </Button>
          {userMenuOpen && (
            <div
              className={cn(
                "absolute right-0 top-full z-50 mt-2 min-w-[10rem] rounded-md border bg-popover text-popover-foreground shadow-md"
              )}
              role="menu"
            >
              <div className="px-3 py-2 text-sm border-b border-border/50">
                <p className="font-medium truncate">
                  {user?.email ?? EMPTY_DISPLAY}
                </p>
              </div>
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-sm hover:bg-accent text-muted-foreground"
                onClick={handleSignOut}
                role="menuitem"
              >
                {t("navbar.signOut")}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
