import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Phone, Mail, Lock, ArrowRight, ShieldCheck, RefreshCw, Sparkles, CheckCircle2 } from 'lucide-react';

export default function AuthModal({ onComplete, onCancel }) {
  const { register, requestLoginOtp, verifyOtp, loading, error: authError } = useAuth();

  const [mode, setMode] = useState('register'); // 'register' | 'login'
  const [step, setStep] = useState('form'); // 'form' | 'otp'

  // Form Fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [companyCode, setCompanyCode] = useState('');

  // OTP Fields
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const [simulatedOtp, setSimulatedOtp] = useState('');
  const [resendCountdown, setResendCountdown] = useState(60);
  const [localError, setLocalError] = useState('');
  const [successToast, setSuccessToast] = useState('');

  const otpInputsRef = useRef([]);

  // Resend Timer Effect
  useEffect(() => {
    let interval = null;
    if (step === 'otp' && resendCountdown > 0) {
      interval = setInterval(() => {
        setResendCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, resendCountdown]);

  // Handle Form Submission (Register or Login)
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setLocalError('');
    setSuccessToast('');

    if (!phone || phone.trim().length < 10) {
      setLocalError('يرجى إدخال رقم موبايل صحيح (11 رقم)');
      return;
    }

    if (mode === 'register' && !name.trim()) {
      setLocalError('يرجى إدخال الاسم الكامل');
      return;
    }

    try {
      let result;
      if (mode === 'register') {
        result = await register(name, phone, email, companyCode);
      } else {
        result = await requestLoginOtp(phone);
      }

      if (result.simulatedOtp) {
        setSimulatedOtp(result.simulatedOtp);
      }
      setStep('otp');
      setResendCountdown(60);
      setSuccessToast(`تم إرسال رمز التحقق إلى الرقم ${phone}`);
    } catch (err) {
      setLocalError(err.message || 'حدث خطأ، يرجى المحاولة مرة أخرى');
    }
  };

  // Handle OTP Inputs Change
  const handleOtpChange = (index, value) => {
    if (isNaN(value)) return;
    const newValues = [...otpValues];
    newValues[index] = value.slice(-1); // Take last char
    setOtpValues(newValues);

    // Auto-focus next input
    if (value && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  // Handle Paste OTP
  const handleOtpPaste = (e) => {
    const pasteData = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pasteData)) {
      const digits = pasteData.split('');
      setOtpValues(digits);
      otpInputsRef.current[5]?.focus();
      e.preventDefault();
    }
  };

  // Verify OTP
  const handleVerifyOtp = async (e) => {
    e?.preventDefault();
    setLocalError('');
    const fullOtp = otpValues.join('');

    if (fullOtp.length !== 6) {
      setLocalError('يرجى إدخال رمز التحقق المكون من 6 أرقام كاملاً');
      return;
    }

    try {
      await verifyOtp(phone, fullOtp);
      onComplete?.();
    } catch (err) {
      setLocalError(err.message || 'رمز التحقق غير صحيح، يرجى التأكد وإعادة المحاولة');
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendCountdown > 0) return;
    setLocalError('');
    try {
      let result;
      if (mode === 'register') {
        result = await register(name, phone, email, companyCode);
      } else {
        result = await requestLoginOtp(phone);
      }
      if (result.simulatedOtp) {
        setSimulatedOtp(result.simulatedOtp);
      }
      setResendCountdown(60);
      setSuccessToast('تم إعادة إرسال رمز التحقق بنجاح');
    } catch (err) {
      setLocalError(err.message || 'فشل في إعادة إرسال الرمز');
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-3xl shadow-card border border-navy/10 overflow-hidden">
      {/* Header Banner with White Logo */}
      <div className="bg-navy p-6 text-white text-center relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-yellow/20 rounded-full blur-2xl pointer-events-none" />
        
        {/* Clean white logo on navy background */}
        <div className="flex justify-center mb-3">
          <img 
            src="/logo-white.png" 
            alt="Proviea" 
            className="h-12 sm:h-14 w-auto object-contain drop-shadow-md" 
          />
        </div>

        <h2 className="text-xl font-bold text-white">
          {step === 'otp'
            ? 'تأكيد رقم الموبايل (OTP)'
            : mode === 'register'
            ? 'إنشاء حساب جديد في Proviea'
            : 'تسجيل الدخول'}
        </h2>
        <p className="text-xs text-offwhite/80 mt-1">
          {step === 'otp'
            ? `أدخل الرمز المكون من 6 أرقام المرسل إلى ${phone}`
            : 'سجّل للاستفادة من خصم الـ 15% وتجهيز قائمة مدرستك'}
        </p>

        {/* Tab Switcher (if in form step) */}
        {step === 'form' && (
          <div className="flex items-center bg-white/10 p-1 rounded-xl mt-4 max-w-xs mx-auto text-xs font-semibold">
            <button
              type="button"
              onClick={() => { setMode('register'); setLocalError(''); }}
              className={`flex-1 py-1.5 rounded-lg transition-all ${
                mode === 'register' ? 'bg-yellow text-navy font-bold shadow' : 'text-white/80 hover:text-white'
              }`}
            >
              إنشاء حساب
            </button>
            <button
              type="button"
              onClick={() => { setMode('login'); setLocalError(''); }}
              className={`flex-1 py-1.5 rounded-lg transition-all ${
                mode === 'login' ? 'bg-yellow text-navy font-bold shadow' : 'text-white/80 hover:text-white'
              }`}
            >
              تسجيل الدخول
            </button>
          </div>
        )}
      </div>

      {/* Body Content */}
      <div className="p-6">
        {/* Error Alert */}
        {(localError || authError) && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
            <span>{localError || authError}</span>
          </div>
        )}

        {/* Success Alert / Simulated OTP Toast */}
        {simulatedOtp && step === 'otp' && (
          <div className="mb-4 p-3 bg-yellow-soft border border-yellow/50 rounded-xl flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-yellow-dark shrink-0 mt-0.5" />
            <div className="text-xs text-navy">
              <p className="font-bold text-navy">رمز التحقق للتجربة الفورية:</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-mono text-base font-extrabold tracking-widest text-navy bg-white px-2.5 py-0.5 rounded border border-yellow">
                  {simulatedOtp}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const digits = simulatedOtp.split('');
                    setOtpValues(digits);
                  }}
                  className="text-[11px] text-yellow-dark underline font-bold"
                >
                  تعبئة تلقائية
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 1: FORM ================= */}
        {step === 'form' ? (
          <form onSubmit={handleSubmitForm} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-bold text-navy mb-1">
                  الاسم الكامل <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-navy/40 absolute right-3 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="مثال: أحمد محمد علي"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-offwhite/50 border border-navy/15 rounded-xl pr-10 pl-3 py-2.5 text-sm text-navy placeholder:text-navy/35 focus:outline-none focus:border-navy focus:bg-white transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-navy mb-1">
                رقم الموبايل / واتساب <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-navy/40 absolute right-3 top-3" />
                <input
                  type="tel"
                  required
                  placeholder="010XXXXXXXX"
                  dir="ltr"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-offwhite/50 border border-navy/15 rounded-xl pr-10 pl-3 py-2.5 text-sm text-navy placeholder:text-navy/35 text-right focus:outline-none focus:border-navy focus:bg-white transition-all"
                />
              </div>
              <p className="text-[11px] text-navy/50 mt-1">
                سنرسل لك رمز تحقق (OTP) للتأكد من رقمك وتأكيد طلباتك
              </p>
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-xs font-bold text-navy mb-1">
                  البريد الإلكتروني (اختياري)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-navy/40 absolute right-3 top-3" />
                  <input
                    type="email"
                    placeholder="name@company.com"
                    dir="ltr"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-offwhite/50 border border-navy/15 rounded-xl pr-10 pl-3 py-2.5 text-sm text-navy placeholder:text-navy/35 text-right focus:outline-none focus:border-navy focus:bg-white transition-all"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-yellow hover:bg-yellow-dark active:scale-[0.99] text-navy font-bold py-3 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-navy" />
                  <span>جاري الإرسال...</span>
                </>
              ) : (
                <>
                  <span>{mode === 'register' ? 'متابعة وإرسال رمز التحقق' : 'تسجيل الدخول'}</span>
                  <ArrowRight className="w-4 h-4 text-navy rotate-180" />
                </>
              )}
            </button>
          </form>
        ) : (
          /* ================= STEP 2: OTP VERIFICATION ================= */
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-navy text-center mb-3">
                أدخل رمز التحقق المكون من 6 أرقام
              </label>

              {/* 6 Digit Inputs */}
              <div className="flex justify-center gap-2" dir="ltr" onPaste={handleOtpPaste}>
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
                    className="w-11 h-13 text-center text-xl font-bold font-mono text-navy bg-offwhite border border-navy/20 rounded-xl focus:outline-none focus:border-navy focus:ring-2 focus:ring-yellow focus:bg-white transition-all"
                  />
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={handleVerifyOtp}
              disabled={loading || otpValues.join('').length !== 6}
              className="w-full bg-navy hover:bg-navy-light active:scale-[0.99] text-yellow font-bold py-3 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>جاري التحقق...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-yellow" />
                  <span>تأكيد الرمز والمتابعة</span>
                </>
              )}
            </button>

            {/* Resend & Change Number */}
            <div className="flex items-center justify-between text-xs pt-2 border-t border-navy/10">
              <button
                type="button"
                onClick={() => { setStep('form'); setLocalError(''); }}
                className="text-navy/60 hover:text-navy underline"
              >
                تغيير رقم الموبايل
              </button>

              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendCountdown > 0}
                className={`font-semibold ${
                  resendCountdown > 0 ? 'text-navy/40 cursor-not-allowed' : 'text-yellow-dark hover:underline'
                }`}
              >
                {resendCountdown > 0 ? `إعادة الإرسال بعد (${resendCountdown} ث)` : 'إعادة إرسال الرمز'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
