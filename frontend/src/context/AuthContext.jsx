import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api';

const AuthContext = createContext(null);

const tokenKey = 'token';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async (token) => {
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const { data } = await api.get('/auth/me');
      setUser({
        email: data.email,
        is_admin: data.is_admin,
        must_change_password: data.must_change_password ?? false,
      });
    } catch {
      localStorage.removeItem(tokenKey);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem(tokenKey);
    if (!token) {
      setLoading(false);
      return;
    }
    loadUser(token);
  }, [loadUser]);

  useEffect(() => {
    const onLogout = () => setUser(null);
    window.addEventListener('auth:logout', onLogout);
    return () => window.removeEventListener('auth:logout', onLogout);
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem(tokenKey, data.access_token);
    setUser({
      email: data.user.email,
      is_admin: data.user.is_admin,
      must_change_password: data.user.must_change_password ?? false,
    });
    return data;
  };

  const register = async (email, password) => {
    const { data } = await api.post('/auth/register', { email, password });
    localStorage.setItem(tokenKey, data.access_token);
    setUser({
      email: data.user.email,
      is_admin: data.user.is_admin,
      must_change_password: data.user.must_change_password ?? false,
    });
    return data;
  };

  const changePassword = async (currentPassword, newPassword) => {
    const { data } = await api.post('/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
    setUser((prev) => (prev ? { ...prev, must_change_password: false } : null));
    return data;
  };

  const logout = () => {
    localStorage.removeItem(tokenKey);
    setUser(null);
  };

  const value = { user, loading, login, register, logout, changePassword };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
