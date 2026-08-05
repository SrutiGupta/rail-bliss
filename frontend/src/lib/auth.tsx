import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { http, setToken, getToken } from "@/api/client";
import type { AuthUser } from "@/api/types";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (data: {
    email: string;
    password: string;
    fullName: string;
    phone?: string | undefined;
  }) => Promise<AuthUser>;
  googleLogin: (credential: string) => Promise<AuthUser>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (!getToken()) {
      setLoading(false);
      return;
    }
    http
      .get<{ user: AuthUser }>("/auth/me")
      .then((data) => {
        if (active) setUser(data.user);
      })
      .catch(() => {
        setToken(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await http.post<{ token: string; user: AuthUser }>("/auth/login", {
      email,
      password,
    });
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(
    async (input: {
      email: string;
      password: string;
      fullName: string;
      phone?: string | undefined;
    }) => {
      const data = await http.post<{ token: string; user: AuthUser }>("/auth/register", input);
      setToken(data.token);
      setUser(data.user);
      return data.user;
    },
    [],
  );

  const googleLogin = useCallback(async (credential: string) => {
    const data = await http.post<{ token: string; user: AuthUser }>("/auth/google", {
      credential,
    });
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const signOut = useCallback(async () => {
    queryClient.cancelQueries();
    queryClient.clear();
    setToken(null);
    setUser(null);
  }, [queryClient]);

  const value = useMemo(
    () => ({ user, loading, login, register, googleLogin, signOut }),
    [user, loading, login, register, googleLogin, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}

export function useIsAdmin(): boolean {
  const { user } = useAuth();
  return !!user?.roles?.includes("admin");
}
