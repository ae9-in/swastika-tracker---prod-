/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';

const AUTH_KEY = 'swastika_tracker_auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [authState, setAuthState] = useState(() => {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) {
      return { token: null, user: null, allowedBusinesses: [], activeBusiness: null };
    }

    try {
      return JSON.parse(raw);
    } catch {
      return { token: null, user: null, allowedBusinesses: [], activeBusiness: null };
    }
  });

  useEffect(() => {
    localStorage.setItem(AUTH_KEY, JSON.stringify(authState));
  }, [authState]);

  useEffect(() => {
    function clearStaleAuth() {
      setAuthState({ token: null, user: null, allowedBusinesses: [], activeBusiness: null });
      localStorage.removeItem(AUTH_KEY);
    }

    window.addEventListener('auth:invalid-token', clearStaleAuth);
    return () => window.removeEventListener('auth:invalid-token', clearStaleAuth);
  }, []);

  useEffect(() => {
    if (!authState.token) {
      return;
    }

    let active = true;
    api.auth.me(authState.token).catch(() => {
      if (active) {
        setAuthState({ token: null, user: null, allowedBusinesses: [], activeBusiness: null });
        localStorage.removeItem(AUTH_KEY);
      }
    });

    return () => {
      active = false;
    };
  }, [authState.token]);

  const value = useMemo(
    () => ({
      ...authState,
      isAuthenticated: Boolean(authState.token),
      async login(email, password) {
        const res = await api.auth.login(email, password);
        setAuthState({
          token: res.token,
          user: res.user,
          allowedBusinesses: res.allowedBusinesses,
          activeBusiness: null,
        });
      },
      async register(name, email, password) {
        const res = await api.auth.register(name, email, password);
        setAuthState({
          token: res.token,
          user: res.user,
          allowedBusinesses: res.allowedBusinesses,
          activeBusiness: res.activeBusiness,
        });
      },
      async selectBusiness(businessId) {
        const res = await api.auth.selectBusiness(authState.token, businessId);
        setAuthState({
          token: res.token,
          user: res.user,
          allowedBusinesses: res.allowedBusinesses,
          activeBusiness: res.activeBusiness,
        });
      },
      logout() {
        setAuthState({ token: null, user: null, allowedBusinesses: [], activeBusiness: null });
        localStorage.removeItem(AUTH_KEY);
      },
    }),
    [authState],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider.');
  }
  return context;
}
