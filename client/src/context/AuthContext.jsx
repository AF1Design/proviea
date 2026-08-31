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

  // Register via Supabase Cloud
  const register = async (name, phone, email, companyCode = '') => {
    setLoading(true);
    setError(null);
    try {
      const data = await requestOtp({ name, phone, email, companyCode });
      return data;
    } catch (err) {
      const msg = err.message || 'فشل في إرسال رمز التحقق';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Login via Supabase Cloud
  const requestLoginOtp = async (phone) => {
    setLoading(true);
    setError(null);
    try {
      const data = await requestOtp({ phone });
      return data;
    } catch (err) {
      const msg = err.message || 'فشل في إرسال رمز التحقق';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP via Supabase Cloud
  const verifyOtp = async (phone, otp) => {
    setLoading(true);
    setError(null);
    try {
      const data = await verifyOtpSupabase({ phone, otp });
      saveUserSession(data.user);
      return data;
    } catch (err) {
      const msg = err.message || 'رمز التحقق غير صحيح';
      setError(msg);
      throw new Error(msg);
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
