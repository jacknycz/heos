import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiGet, apiPost, setAuthToken } from "../api/client";

export type Role = "ADMIN" | "MANAGER" | "MECHANIC" | "DRIVER";
export type CurrentUser = { id: string; organizationId: string; organizationName?: string; name: string; email: string; role: Role };

type AuthResponse = { token: string; user: Omit<CurrentUser, "organizationName"> };

const TOKEN_KEY = "heos.authToken";

type AuthContextValue = {
  user: CurrentUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signupOrganization: (organizationName: string, name: string, email: string, password: string) => Promise<void>;
  acceptInvite: (code: string, name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function afterAuth(res: AuthResponse) {
  await AsyncStorage.setItem(TOKEN_KEY, res.token);
  setAuthToken(res.token);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      if (token) {
        setAuthToken(token);
        try {
          setUser(await apiGet<CurrentUser>("/auth/me"));
        } catch {
          await AsyncStorage.removeItem(TOKEN_KEY);
          setAuthToken(null);
        }
      }
      setLoading(false);
    })();
  }, []);

  async function login(email: string, password: string) {
    const res = await apiPost<AuthResponse>("/auth/login", { email, password });
    await afterAuth(res);
    setUser(await apiGet<CurrentUser>("/auth/me"));
  }

  async function signupOrganization(organizationName: string, name: string, email: string, password: string) {
    const res = await apiPost<AuthResponse>("/auth/signup-organization", { organizationName, name, email, password });
    await afterAuth(res);
    setUser(await apiGet<CurrentUser>("/auth/me"));
  }

  async function acceptInvite(code: string, name: string, email: string, password: string) {
    const res = await apiPost<AuthResponse>("/auth/accept-invite", { code, name, email, password });
    await afterAuth(res);
    setUser(await apiGet<CurrentUser>("/auth/me"));
  }

  async function logout() {
    await AsyncStorage.removeItem(TOKEN_KEY);
    setAuthToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signupOrganization, acceptInvite, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
