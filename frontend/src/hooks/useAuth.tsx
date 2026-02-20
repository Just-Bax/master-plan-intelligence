import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { apiGet, apiPost } from "@/lib/api";
import type { User, TokenResponse } from "@/types/api";
import { AUTH_TOKEN_KEY, API_PATHS } from "@/constants";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  signup: (email: string, password: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) {
      setUser(null);
      return;
    }
    try {
      const me = await apiGet<User>(API_PATHS.USER_ME);
      setUser(me);
    } catch {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    refreshUser().finally(() => setIsLoading(false));
  }, [refreshUser]);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await apiPost<TokenResponse>(API_PATHS.AUTH_LOGIN, {
        email,
        password,
      });
      localStorage.setItem(AUTH_TOKEN_KEY, res.access_token);
      await refreshUser();
    },
    [refreshUser]
  );

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    setUser(null);
  }, []);

  const signup = useCallback(
    async (email: string, password: string) => {
      const res = await apiPost<TokenResponse>(API_PATHS.AUTH_REGISTER, {
        email,
        password,
      });
      localStorage.setItem(AUTH_TOKEN_KEY, res.access_token);
      await refreshUser();
    },
    [refreshUser]
  );

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      logout,
      signup,
      refreshUser,
    }),
    [user, isLoading, login, logout, signup, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
