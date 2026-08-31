import React, { createContext, useContext, useState, useEffect } from 'react';
import { requestOtp, verifyOtp as verifyOtpSupabase, adminLogin as adminLoginSupabase } from '../supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('proviea_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const saveUserSession = (userData) => {
    setUser(userData);
    localStorage.setItem('proviea_user', JSON.stringify(userData));
  };

  // Register or Login via Supabase
  const register = async (name, phone, email, companyCode = '') => {
    setLoading(true);
    setError(null);
    try {
      // 1. Try Supabase direct
      try {
        const data = await requestOtp({ name, phone, email, companyCode });
        return data;
      } catch (sbErr) {
        console.warn('Supabase auth fallback to local API:', sbErr);
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, phone, email, companyCode })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'فشل في إنشاء الحساب');
        return data;
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const requestLoginOtp = async (phone) => {
    setLoading(true);
    setError(null);
    try {
      // 1. Try Supabase direct
      try {
        const data = await requestOtp({ phone });
        return data;
      } catch (sbErr) {
        console.warn('Supabase login fallback to local API:', sbErr);
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'فشل في إرسال الرمز');
        return data;
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (phone, otp) => {
    setLoading(true);
    setError(null);
    try {
      // 1. Try Supabase direct
      try {
        const data = await verifyOtpSupabase({ phone, otp });
        saveUserSession(data.user);
        return data;
      } catch (sbErr) {
        console.warn('Supabase verify fallback to local API:', sbErr);
        const res = await fetch('/api/auth/verify-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone, otp })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'رمز التحقق غير صحيح');
        saveUserSession(data.user);
        return data;
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('proviea_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        register,
        requestLoginOtp,
        verifyOtp,
        logout,
        saveUserSession
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
