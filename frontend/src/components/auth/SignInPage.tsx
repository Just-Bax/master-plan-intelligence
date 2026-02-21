import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ROUTES } from "@/constants";
import { AuthCard } from "@/components/auth/AuthCard";
import { useAuth } from "@/hooks/useAuth";
import { inputClassName } from "@/lib/utils";

export function SignInPage() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth.signInFailed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard
      title={t("auth.appTitle")}
      subtitle={t("auth.signInSubtitle")}
      error={error || null}
      onSubmit={handleSubmit}
      submitLabel={loading ? t("auth.signingIn") : t("auth.signIn")}
      loading={loading}
      bottomText={t("auth.noAccount")}
      bottomLinkTo={ROUTES.SIGN_UP}
      bottomLinkLabel={t("auth.signUp")}
    >
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium">
          {t("auth.email")}
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          className={inputClassName}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("auth.placeholderEmail")}
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium">
          {t("auth.password")}
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          className={inputClassName}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
    </AuthCard>
  );
}
