import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { login, register, getCurrentUser, logout as apiLogout, type UserInfo } from '@/services/campaignApi';
import { toast } from 'sonner';

interface AuthContextType {
  user: UserInfo | null;
  token: string | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const loadUser = async () => {
      const storedToken = localStorage.getItem('auth_token');
      if (storedToken) {
        setToken(storedToken);
        try {
          const userInfo = await getCurrentUser();
          setUser(userInfo);
        } catch (err) {
          // Token invalid, clear it
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user_id');
          localStorage.removeItem('username');
          setToken(null);
        }
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  const handleLogin = async (username: string, password: string) => {
    try {
      const tokenData = await login({ username, password });
      const token = tokenData.access_token;
      setToken(token);
      localStorage.setItem('auth_token', token);
      
      // Fetch user info
      const userInfo = await getCurrentUser();
      setUser(userInfo);
      localStorage.setItem('user_id', String(userInfo.id));
      localStorage.setItem('username', userInfo.username);
      
      toast.success(`Welcome back, ${userInfo.username}!`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      toast.error(errorMessage);
      throw err;
    }
  };

  const handleRegister = async (username: string, email: string, password: string) => {
    try {
      await register({ username, email, password });
      // After registration, automatically log in
      await handleLogin(username, password);
      toast.success(`Account created! Welcome, ${username}!`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed';
      toast.error(errorMessage);
      throw err;
    }
  };

  const handleLogout = () => {
    apiLogout();
    setUser(null);
    setToken(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('username');
    toast.success('Logged out successfully');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login: handleLogin,
        register: handleRegister,
        logout: handleLogout,
        isAuthenticated: !!user && !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

