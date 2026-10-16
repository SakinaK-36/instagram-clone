import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AuthContext } from './AuthContext';
import type { User } from './AuthContext';
import { disconnectSocket } from '../socket';

const readSavedUser = (): User | null => {
  try {
    const saved = localStorage.getItem('user');
    return saved ? (JSON.parse(saved) as User) : null;
  } catch {
    return null; // corrupted value, treat as logged out
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [user, setUser] = useState<User | null>(() =>
    localStorage.getItem('token') ? readSavedUser() : null
  );

  const login = useCallback((newToken: string, newUser: User) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  }, []);

  const logout = useCallback(() => {
    disconnectSocket();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  }, []);

  // The API client fires this when the server answers 401
  useEffect(() => {
    window.addEventListener('auth:expired', logout);
    return () => window.removeEventListener('auth:expired', logout);
  }, [logout]);

  const value = useMemo(
    () => ({ user, token, login, logout }),
    [user, token, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};