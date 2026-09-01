import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  registerWithEmailPassword, 
  loginWithEmailPassword, 
  verifyRegistrationOtp, 
  requestPasswordResetOtp, 
  resetPasswordWithOtp 
} from '../supabase';

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

  // 1. Register with Email & Password
  const register = async ({ name, phone, email, password, companyCode = '' }) => {
    setLoading(true);
    setError(null);
    try {
      const data = await registerWithEmailPassword({ name, phone, email, password, companyCode });
      return data;
    } catch (err) {
      const msg = err.message || 'فشل في إنشاء الحساب';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  // 2. Verify Registration OTP
  const verifyOtp = async (email, otp) => {
    setLoading(true);
    setError(null);
    try {
      const data = await verifyRegistrationOtp({ email, otp });
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

  // 3. Login with Email or Phone + Password
  const login = async ({ identifier, password }) => {
    setLoading(true);
    setError(null);
    try {
      const data = await loginWithEmailPassword({ identifier, password });
      saveUserSession(data.user);
      return data;
    } catch (err) {
      const msg = err.message || 'فشل في تسجيل الدخول';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  // 4. Request Password Reset OTP
  const requestResetOtp = async (email) => {
    setLoading(true);
    setError(null);
    try {
      const data = await requestPasswordResetOtp(email);
      return data;
    } catch (err) {
      const msg = err.message || 'فشل في إرسال رمز الاستعادة';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  // 5. Confirm Password Reset
  const resetPassword = async ({ email, otp, newPassword }) => {
    setLoading(true);
    setError(null);
    try {
      const data = await resetPasswordWithOtp({ email, otp, newPassword });
      return data;
    } catch (err) {
      const msg = err.message || 'فشل في تغيير كلمة المرور';
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
        verifyOtp,
        login,
        requestResetOtp,
        resetPassword,
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
