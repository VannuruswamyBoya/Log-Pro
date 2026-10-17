import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('logpro_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem('logpro_access_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const savedToken = localStorage.getItem('logpro_access_token');
      if (savedToken) {
        try {
          const profile = await authApi.getProfile();
          setUser(profile);
          localStorage.setItem('logpro_user', JSON.stringify(profile));
        } catch (err) {
          console.warn('Session expired or invalid, logging out.');
          localStorage.removeItem('logpro_access_token');
          localStorage.removeItem('logpro_refresh_token');
          localStorage.removeItem('logpro_user');
          setUser(null);
          setToken(null);
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (identifier, password, portal = 'user') => {
    const data = await authApi.login(identifier, password, portal);
    localStorage.setItem('logpro_access_token', data.access);
    localStorage.setItem('logpro_refresh_token', data.refresh);
    localStorage.setItem('logpro_user', JSON.stringify(data.user));
    setToken(data.access);
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    await authApi.logout();
    setToken(null);
    setUser(null);
  };

  const refreshProfile = async () => {
    try {
      const updated = await authApi.getProfile();
      setUser(updated);
      localStorage.setItem('logpro_user', JSON.stringify(updated));
      return updated;
    } catch (err) {
      console.error('Failed to refresh profile:', err);
    }
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token && !!user,
    isAdmin: user?.role === 'admin',
    login,
    logout,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
