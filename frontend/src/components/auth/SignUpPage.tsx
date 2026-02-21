import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { MIN_PASSWORD_LENGTH, ROUTES } from "@/constants";
import { AuthCard } from "@/components/auth/AuthCard";
import { useAuth } from "@/hooks/useAuth";
import { inputClassName } from "@/lib/utils";

export function SignUpPage() {
  const { t } = useTranslation();
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError(t("auth.passwordsDoNotMatch"));
      return;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(t("auth.passwordMinLength", { count: MIN_PASSWORD_LENGTH }));
      return;
    }
    setLoading(true);
    try {
      await signup(email, password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth.signUpFailed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard
      title={t("auth.appTitle")}
      subtitle={t("auth.signUpSubtitle")}
      error={error || null}
      onSubmit={handleSubmit}
      submitLabel={loading ? t("auth.creatingAccount") : t("auth.signUp")}
      loading={loading}
      bottomText={t("auth.haveAccount")}
      bottomLinkTo={ROUTES.SIGN_IN}
      bottomLinkLabel={t("auth.signIn")}
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
          autoComplete="new-password"
          required
          minLength={MIN_PASSWORD_LENGTH}
          className={inputClassName}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t("auth.placeholderPassword")}
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="confirmPassword" className="text-sm font-medium">
          {t("auth.confirmPassword")}
        </label>
        <input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          className={inputClassName}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder={t("auth.placeholderConfirm")}
        />
      </div>
    </AuthCard>
  );
}
