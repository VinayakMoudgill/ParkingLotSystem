import { createContext, useContext, useState, ReactNode } from 'react';
import { TOKEN_KEY } from '../api/client';

interface AuthState {
  token: string | null;
  username: string | null;
  isSuperAdmin: boolean;
  isLoggedIn: boolean;
  login: (token: string, username: string, isSuperAdmin: boolean) => void;
  logout: () => void;
}

const USER_KEY = 'parkflow_user';
const SUPER_KEY = 'parkflow_super';

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [username, setUsername] = useState<string | null>(() => localStorage.getItem(USER_KEY));
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(
    () => localStorage.getItem(SUPER_KEY) === 'true',
  );

  const login = (newToken: string, newUsername: string, newIsSuper: boolean) => {
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(USER_KEY, newUsername);
    localStorage.setItem(SUPER_KEY, String(newIsSuper));
    setToken(newToken);
    setUsername(newUsername);
    setIsSuperAdmin(newIsSuper);
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(SUPER_KEY);
    setToken(null);
    setUsername(null);
    setIsSuperAdmin(false);
  };

  return (
    <AuthContext.Provider
      value={{ token, username, isSuperAdmin, isLoggedIn: !!token, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
