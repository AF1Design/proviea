import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  User, 
  Phone, 
  Mail, 
  Lock, 
  ArrowRight, 
  ShieldCheck, 
  RefreshCw, 
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';

export default function AuthModal({ onComplete }) {
  const { register, verifyOtp, login, requestResetOtp, resetPassword, loading } = useAuth();

  // Screen Modes: 'register' | 'login' | 'register_otp' | 'forgot_password' | 'reset_otp'
  const [mode, setMode] = useState('register');

  // Form Fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [companyCode, setCompanyCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // OTP Verification Fields
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const [resendCountdown, setResendCountdown] = useState(60);
  const [activeEmail, setActiveEmail] = useState('');

  // Password Reset Fields
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // Feedback Messages
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const otpInputsRef = useRef([]);

  // Resend Timer Effect
  useEffect(() => {
    let interval = null;
    if ((mode === 'register_otp' || mode === 'reset_otp') && resendCountdown > 0) {
      interval = setInterval(() => {
        setResendCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [mode, resendCountdown]);

  const clearMessages = () => {
    setErrorMessage('');
    setSuccessMessage('');
  };

  // 1. Submit Registration Form
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    clearMessages();

    if (!name.trim()) {
      setErrorMessage('يرجى إدخال الاسم الكامل');
      return;
    }
    if (!phone || phone.trim().length < 10) {
      setErrorMessage('يرجى إدخال رقم موبايل صحيح (11 رقم)');
      return;
    }
    if (!email || !email.includes('@')) {
      setErrorMessage('يرجى إدخال بريد إلكتروني صحيح لاستلام رمز التفعيل');
      return;
    }
    if (!password || password.length < 6) {
      setErrorMessage('كلمة المرور يجب أن لا تقل عن 6 أحرف أو أرقام');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('كلمة المرور وتأكيد كلمة المرور غير متطابقين');
      return;
    }

    try {
      await register({
        name,
        phone,
        email,
        password,
        companyCode
      });

      setActiveEmail(email.trim().toLowerCase());
      setMode('register_otp');
      setResendCountdown(60);
      setOtpValues(['', '', '', '', '', '']);
      setSuccessMessage(`تم إرسال رمز التحقق OTP إلى بريدك الإلكتروني (${email})`);
    } catch (err) {
      setErrorMessage(err.message || 'فشل في إنشاء الحساب');
    }
  };

  // 2. Verify Registration OTP
  const handleVerifyRegisterOtp = async (e) => {
    e?.preventDefault();
    clearMessages();
    const fullOtp = otpValues.join('');

    if (fullOtp.length !== 6) {
      setErrorMessage('يرجى إدخال رمز التحقق المكون من 6 أرقام كاملاً');
      return;
    }

    try {
      await verifyOtp(activeEmail || email, fullOtp);
      onComplete?.();
    } catch (err) {
      setErrorMessage(err.message || 'رمز التحقق غير صحيح، يرجى التأكد من الرمز المرسل لإيميلك');
    }
  };

  // 3. Submit Login Form
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    clearMessages();

    const identifier = (email || phone).trim();
    if (!identifier) {
      setErrorMessage('يرجى إدخال البريد الإلكتروني أو رقم الموبايل');
      return;
    }
    if (!password) {
      setErrorMessage('يرجى إدخال كلمة المرور');
      return;
    }

    try {
      await login({
        identifier,
        password
      });
      onComplete?.();
    } catch (err) {
      setErrorMessage(err.message || 'فشل في تسجيل الدخول');
    }
  };

  // 4. Request Forgot Password OTP
  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    clearMessages();

    if (!email || !email.includes('@')) {
      setErrorMessage('يرجى إدخال بريدك الإلكتروني المسجل في المنصة');
      return;
    }

    try {
      await requestResetOtp(email.trim().toLowerCase());
      setActiveEmail(email.trim().toLowerCase());
      setMode('reset_otp');
      setResendCountdown(60);
      setOtpValues(['', '', '', '', '', '']);
      setSuccessMessage(`تم إرسال رمز استعادة كلمة المرور إلى (${email})`);
    } catch (err) {
      setErrorMessage(err.message || 'فشل في إرسال رمز الاستعادة');
    }
  };

  // 5. Submit New Password Reset with OTP
  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    clearMessages();
    const fullOtp = otpValues.join('');

    if (fullOtp.length !== 6) {
      setErrorMessage('يرجى إدخال رمز التحقق (6 أرقام)');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setErrorMessage('كلمة المرور الجديدة يجب أن لا تقل عن 6 أحرف أو أرقام');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setErrorMessage('كلمتا المرور غير متطابقتين');
      return;
    }

    try {
      await resetPassword({
        email: activeEmail || email,
        otp: fullOtp,
        newPassword
      });
      setSuccessMessage('تم تغيير كلمة المرور بنجاح! يمكنك الآن تسجيل الدخول.');
      setMode('login');
      setPassword('');
    } catch (err) {
      setErrorMessage(err.message || 'فشل في تعيين كلمة المرور الجديدة');
    }
  };

  // OTP Key Handling
  const handleOtpChange = (index, value) => {
    if (isNaN(value)) return;
    const newValues = [...otpValues];
    newValues[index] = value.slice(-1);
    setOtpValues(newValues);

    if (value && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-3xl shadow-card border border-navy/10 overflow-hidden">
      {/* Header Banner */}
      <div className="bg-navy p-6 text-white text-center relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-yellow/20 rounded-full blur-2xl pointer-events-none" />
        
        {/* Brand Logo */}
        <div className="flex justify-center mb-3">
          <img 
            src="/proviea-white.png" 
            alt="Proviea" 
            className="h-10 w-auto object-contain brightness-0 invert"
            onError={(e) => {
              e.target.onerror = null;
              e.target.style.display = 'none';
              e.target.parentElement.innerHTML = '<span class="text-2xl font-black text-white tracking-wider">Proviea</span>';
            }}
          />
        </div>

        <h2 className="text-xl font-extrabold text-white">
          {mode === 'register' && 'إنشاء حساب جديد في Proviea'}
          {mode === 'login' && 'تسجيل الدخول إلى حسابك'}
          {mode === 'register_otp' && 'تأكيد الحساب عبر البريد الإلكتروني'}
          {mode === 'forgot_password' && 'استعادة كلمة المرور'}
          {mode === 'reset_otp' && 'تعيين كلمة المرور الجديدة'}
        </h2>

        <p className="text-xs text-offwhite/80 mt-1">
          {mode === 'register' && 'سجل للاستفادة من خصم الشركات وتجهيز قائمة مدرستك'}
          {mode === 'login' && 'أدخل بياناتك لمتابعة طلباتك وقوائم المدرسة'}
          {mode === 'register_otp' && `أدخل رمز الـ 6 أرقام المرسل إلى ${activeEmail || email}`}
          {mode === 'forgot_password' && 'سنرسل رمز تحقق إلى بريدك الإلكتروني لإعادة التعيين'}
          {mode === 'reset_otp' && 'أدخل رمز التحقق وكلمة المرور الجديدة'}
        </p>

        {/* Tab Switcher (Register / Login) */}
        {(mode === 'register' || mode === 'login') && (
          <div className="flex bg-navy-light/60 p-1 rounded-2xl mt-4 border border-white/10 max-w-xs mx-auto">
            <button
              type="button"
              onClick={() => {
                setMode('register');
                clearMessages();
              }}
              className={`flex-1 py-2 text-xs font-black rounded-xl transition-all ${
                mode === 'register'
                  ? 'bg-yellow text-navy shadow-sm'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              إنشاء حساب
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('login');
                clearMessages();
              }}
              className={`flex-1 py-2 text-xs font-black rounded-xl transition-all ${
                mode === 'login'
                  ? 'bg-yellow text-navy shadow-sm'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              تسجيل الدخول
            </button>
          </div>
        )}
      </div>

      <div className="p-6 space-y-4">
        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="font-semibold">{errorMessage}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span className="font-semibold">{successMessage}</span>
          </div>
        )}

        {/* ================= 1. REGISTER FORM ================= */}
        {mode === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-navy mb-1">
                الاسم الكامل <span className="text-red-500">*</span>:
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="مثال: عمار فكري"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-offwhite border border-navy/15 rounded-xl pr-9 pl-3 py-2.5 text-xs text-navy focus:outline-none focus:border-navy focus:bg-white"
                />
                <User className="w-4 h-4 text-navy/40 absolute right-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-navy mb-1">
                رقم الموبايل / واتساب <span className="text-red-500">*</span>:
              </label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  dir="ltr"
                  placeholder="010XXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-offwhite border border-navy/15 rounded-xl pr-9 pl-3 py-2.5 text-xs text-navy text-right focus:outline-none focus:border-navy focus:bg-white"
                />
                <Phone className="w-4 h-4 text-navy/40 absolute right-3 top-3" />
              </div>
              <p className="text-[10px] text-navy/40 mt-0.5">يسجل رقم الموبايل مرة واحدة فقط لحماية حسابك</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-navy mb-1">
                البريد الإلكتروني (Gmail) <span className="text-red-500">*</span>:
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  dir="ltr"
                  placeholder="name@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-offwhite border border-navy/15 rounded-xl pr-9 pl-3 py-2.5 text-xs text-navy text-right focus:outline-none focus:border-navy focus:bg-white"
                />
                <Mail className="w-4 h-4 text-navy/40 absolute right-3 top-3" />
              </div>
              <p className="text-[10px] text-navy/40 mt-0.5">سيصلك رمز التحقق OTP على بريدك لتفعيل الحساب</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-navy mb-1">
                كلمة المرور <span className="text-red-500">*</span>:
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  dir="ltr"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-offwhite border border-navy/15 rounded-xl pr-9 pl-9 py-2.5 text-xs text-navy text-right focus:outline-none focus:border-navy focus:bg-white"
                />
                <Lock className="w-4 h-4 text-navy/40 absolute right-3 top-3" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-3 text-navy/40 hover:text-navy"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-navy mb-1">
                تأكيد كلمة المرور <span className="text-red-500">*</span>:
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  dir="ltr"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-offwhite border border-navy/15 rounded-xl pr-9 pl-3 py-2.5 text-xs text-navy text-right focus:outline-none focus:border-navy focus:bg-white"
                />
                <Lock className="w-4 h-4 text-navy/40 absolute right-3 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-yellow hover:bg-yellow-dark text-navy font-black py-3.5 px-4 rounded-xl text-xs transition-all shadow flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-navy" />
                  <span>جاري إنشاء الحساب وإرسال الرمز...</span>
                </>
              ) : (
                <>
                  <span>إنشاء الحساب واستلام رمز التحقق</span>
                  <ArrowRight className="w-4 h-4 text-navy" />
                </>
              )}
            </button>
          </form>
        )}

        {/* ================= 2. LOGIN FORM ================= */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-navy mb-1">
                البريد الإلكتروني أو رقم الموبايل:
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  dir="ltr"
                  placeholder="010XXXXXXXX أو name@gmail.com"
                  value={email || phone}
                  onChange={(e) => {
                    const val = e.target.value;
                    setEmail(val);
                    setPhone(val);
                  }}
                  className="w-full bg-offwhite border border-navy/15 rounded-xl pr-9 pl-3 py-3 text-xs text-navy text-right focus:outline-none focus:border-navy focus:bg-white"
                />
                <User className="w-4 h-4 text-navy/40 absolute right-3 top-3.5" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-navy">
                  كلمة المرور:
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setMode('forgot_password');
                    clearMessages();
                  }}
                  className="text-[11px] text-yellow-dark hover:underline font-bold"
                >
                  نسيت كلمة المرور؟
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  dir="ltr"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-offwhite border border-navy/15 rounded-xl pr-9 pl-9 py-3 text-xs text-navy text-right focus:outline-none focus:border-navy focus:bg-white"
                />
                <Lock className="w-4 h-4 text-navy/40 absolute right-3 top-3.5" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-3.5 text-navy/40 hover:text-navy"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-yellow hover:bg-yellow-dark text-navy font-black py-3.5 px-4 rounded-xl text-xs transition-all shadow flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-navy" />
                  <span>جاري التحقق وتسجيل الدخول...</span>
                </>
              ) : (
                <>
                  <span>تسجيل الدخول</span>
                  <ArrowRight className="w-4 h-4 text-navy" />
                </>
              )}
            </button>
          </form>
        )}

        {/* ================= 3. REGISTRATION OTP VERIFICATION ================= */}
        {mode === 'register_otp' && (
          <div className="space-y-4 text-center">
            <div className="w-12 h-12 bg-navy text-yellow rounded-2xl flex items-center justify-center mx-auto shadow-sm">
              <Mail className="w-6 h-6" />
            </div>

            <p className="text-xs text-navy/70 leading-relaxed">
              تم إرسال رمز التحقق المكون من 6 أرقام إلى بريدك الإلكتروني: <br />
              <strong className="text-navy font-mono text-xs">{activeEmail || email}</strong>
            </p>

            {/* 6 Digits Inputs */}
            <div className="flex justify-center gap-1.5 pt-2" dir="ltr">
              {otpValues.map((val, idx) => (
                <input
                  key={idx}
                  ref={(el) => (otpInputsRef.current[idx] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={val}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                  className="w-10 h-12 text-center text-lg font-bold font-mono text-navy bg-offwhite border border-navy/20 rounded-xl focus:outline-none focus:border-navy focus:bg-white"
                />
              ))}
            </div>

            <button
              type="button"
              onClick={handleVerifyRegisterOtp}
              disabled={loading || otpValues.join('').length !== 6}
              className="w-full bg-navy hover:bg-navy-light text-yellow font-bold py-3.5 px-4 rounded-xl text-xs transition-all shadow disabled:opacity-50 mt-2"
            >
              {loading ? 'جاري تفعيل الحساب...' : 'تأكيد الرمز وتفعيل الحساب'}
            </button>

            <div className="flex items-center justify-between text-xs pt-2">
              <button
                type="button"
                onClick={() => setMode('register')}
                className="text-navy/50 hover:text-navy underline"
              >
                تعديل البريد
              </button>

              <button
                type="button"
                onClick={handleRegisterSubmit}
                disabled={resendCountdown > 0}
                className={`font-semibold ${
                  resendCountdown > 0 ? 'text-navy/40' : 'text-yellow-dark hover:underline'
                }`}
              >
                {resendCountdown > 0 ? `إعادة الإرسال (${resendCountdown} ث)` : 'إعادة إرسال الرمز'}
              </button>
            </div>
          </div>
        )}

        {/* ================= 4. FORGOT PASSWORD ================= */}
        {mode === 'forgot_password' && (
          <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-navy mb-1">
                أدخل البريد الإلكتروني المسجل:
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  dir="ltr"
                  placeholder="name@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-offwhite border border-navy/15 rounded-xl pr-9 pl-3 py-3 text-xs text-navy text-right focus:outline-none focus:border-navy focus:bg-white"
                />
                <Mail className="w-4 h-4 text-navy/40 absolute right-3 top-3.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-yellow hover:bg-yellow-dark text-navy font-bold py-3.5 px-4 rounded-xl text-xs transition-all shadow flex items-center justify-center gap-2"
            >
              {loading ? 'جاري إرسال الرمز...' : 'إرسال رمز الاستعادة إلى البريد'}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  clearMessages();
                }}
                className="text-xs text-navy/60 hover:text-navy underline"
              >
                الرجوع لتسجيل الدخول
              </button>
            </div>
          </form>
        )}

        {/* ================= 5. RESET PASSWORD WITH OTP ================= */}
        {mode === 'reset_otp' && (
          <form onSubmit={handleResetPasswordSubmit} className="space-y-3.5">
            <div className="text-center space-y-1">
              <p className="text-xs text-navy/70">
                أدخل رمز التحقق المرسل إلى: <br />
                <strong className="text-navy font-mono">{activeEmail || email}</strong>
              </p>
            </div>

            {/* 6 Digits OTP */}
            <div className="flex justify-center gap-1.5" dir="ltr">
              {otpValues.map((val, idx) => (
                <input
                  key={idx}
                  ref={(el) => (otpInputsRef.current[idx] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={val}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                  className="w-10 h-12 text-center text-lg font-bold font-mono text-navy bg-offwhite border border-navy/20 rounded-xl focus:outline-none focus:border-navy focus:bg-white"
                />
              ))}
            </div>

            <div>
              <label className="block text-xs font-bold text-navy mb-1">
                كلمة المرور الجديدة:
              </label>
              <input
                type="password"
                required
                dir="ltr"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-offwhite border border-navy/15 rounded-xl px-3 py-2.5 text-xs text-navy text-right focus:outline-none focus:border-navy focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-navy mb-1">
                تأكيد كلمة المرور الجديدة:
              </label>
              <input
                type="password"
                required
                dir="ltr"
                placeholder="••••••••"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                className="w-full bg-offwhite border border-navy/15 rounded-xl px-3 py-2.5 text-xs text-navy text-right focus:outline-none focus:border-navy focus:bg-white"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-yellow hover:bg-yellow-dark text-navy font-bold py-3.5 px-4 rounded-xl text-xs transition-all shadow"
            >
              {loading ? 'جاري الحفظ...' : 'تأكيد وتعيين كلمة المرور الجديدة'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
