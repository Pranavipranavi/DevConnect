import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import api from '../services/api.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const hydrate = async () => {
      const token = localStorage.getItem('devconnect_token');
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await api.get('/auth/me');
        setUser(data.user);
      } catch {
        localStorage.removeItem('devconnect_token');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    hydrate();
  }, []);

  const login = useCallback(async (payload) => {
    const { data } = await api.post('/auth/login', payload);
    localStorage.setItem('devconnect_token', data.token);
    setUser(data.user);
    toast.success('Welcome back');
  }, []);

  const register = useCallback(async (payload) => {
    const { data } = await api.post('/auth/register', payload);
    localStorage.setItem('devconnect_token', data.token);
    setUser(data.user);
    toast.success('Account created');
  }, []);

  const googleLogin = useCallback(async (credential) => {
    const { data } = await api.post('/auth/google', { credential });
    localStorage.setItem('devconnect_token', data.token);
    setUser(data.user);
    toast.success('Signed in with Google');
  }, []);

  const logout = useCallback(async () => {
    localStorage.removeItem('devconnect_token');
    setUser(null);
    window.setTimeout(() => navigate('/', { replace: true }), 0);
    await api.post('/auth/logout').catch(() => {});
    toast.success('Logged out');
  }, [navigate]);

  const value = useMemo(
    () => ({ user, setUser, loading, login, register, logout, googleLogin }),
    [user, loading, login, register, logout, googleLogin]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
