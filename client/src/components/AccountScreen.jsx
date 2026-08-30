import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import AuthModal from './AuthModal';
import { 
  User, 
  Phone, 
  Mail, 
  LogOut, 
  ArrowRight, 
  ClipboardList, 
  Edit3, 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2,
  LogIn,
  X,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

export default function AccountScreen({ onBack, onNavigateToOrders }) {
  const { user, saveUserSession, logout } = useAuth();
  const [ordersCount, setOrdersCount] = useState(0);

  // Edit Profile States
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');

  // OTP Verification Step for Profile Update
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const [simulatedOtp, setSimulatedOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [updateMessage, setUpdateMessage] = useState('');
  const [resendTimer, setResendTimer] = useState(60);

  const otpInputsRef = useRef([]);

  useEffect(() => {
    if (user?.phone) {
      fetch(`/api/orders/user/${user.phone}`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) setOrdersCount(data.length);
        })
        .catch((err) => console.error(err));
    }
  }, [user]);

  // Resend Timer Effect
  useEffect(() => {
    let interval = null;
    if (showOtpModal && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [showOtpModal, resendTimer]);

  // Open Edit Form with Current Data
  const handleStartEdit = () => {
    setEditName(user?.name || '');
    setEditPhone(user?.phone || '');
    setEditEmail(user?.email || '');
    setUpdateMessage('');
    setOtpError('');
    setIsEditing(true);
  };

  // Submit Profile Edit -> Triggers OTP
  const handleSubmitProfileEdit = async (e) => {
    e.preventDefault();
    setOtpError('');
    setUpdateMessage('');

    if (!editPhone || editPhone.trim().length < 10) {
      setOtpError('يرجى إدخال رقم موبايل صحيح (11 رقم)');
      return;
    }
    if (!editName.trim()) {
      setOtpError('الاسم مطلوب');
      return;
    }

    setOtpLoading(true);
    try {
      const res = await fetch('/api/auth/request-update-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPhone: user.phone,
          newEmail: editEmail,
          newPhone: editPhone
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل في إرسال رمز التحقق');

      if (data.simulatedOtp) {
        setSimulatedOtp(data.simulatedOtp);
      }
      setResendTimer(60);
      setOtpValues(['', '', '', '', '', '']);
      setShowOtpModal(true);
    } catch (err) {
      setOtpError(err.message || 'حدث خطأ، يرجى المحاولة مرة أخرى');
    } finally {
      setOtpLoading(false);
    }
  };

  // Handle OTP Inputs
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

  // Confirm OTP and Save Changes
  const handleConfirmProfileUpdate = async (e) => {
    e?.preventDefault();
    setOtpError('');
    const fullOtp = otpValues.join('');

    if (fullOtp.length !== 6) {
      setOtpError('يرجى إدخال رمز التحقق كاملاً (6 أرقام)');
      return;
    }

    setOtpLoading(true);
    try {
      const res = await fetch('/api/auth/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPhone: user.phone,
          name: editName,
          phone: editPhone,
          email: editEmail,
          otp: fullOtp
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'رمز التحقق غير صحيح');

      saveUserSession(data.user);
      setShowOtpModal(false);
      setIsEditing(false);
      setUpdateMessage('تم حفظ وتحديث بيانات حسابك بنجاح ✔');
    } catch (err) {
      setOtpError(err.message || 'فشل في التحقق وتحديث البيانات');
    } finally {
      setOtpLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    setOtpError('');
    try {
      const res = await fetch('/api/auth/request-update-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPhone: user.phone,
          newEmail: editEmail,
          newPhone: editPhone
        })
      });
      const data = await res.json();
      if (data.simulatedOtp) {
        setSimulatedOtp(data.simulatedOtp);
      }
      setResendTimer(60);
    } catch {
      setOtpError('فشل في إعادة إرسال الرمز');
    }
  };

  return (
    <div className="space-y-6 max-w-xl mx-auto pb-20">
      {/* Top Header with Back Button */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-bold text-navy hover:text-yellow-dark transition-colors bg-white px-3.5 py-2 rounded-full border border-navy/10 shadow-sm"
        >
          <ArrowRight className="w-4 h-4" />
          <span>رجوع للرئيسية</span>
        </button>

        <span className="text-xs font-bold text-navy/60">
          الملف الشخصي
        </span>
      </div>

      {/* Success Message Banner */}
      {updateMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-bold">{updateMessage}</span>
        </div>
      )}

      {user ? (
        /* Logged In User Profile */
        <div className="space-y-5">
          {/* Main User Card */}
          <div className="bg-white rounded-3xl p-6 border border-navy/10 shadow-card relative overflow-hidden space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-16 h-16 rounded-2xl bg-navy text-yellow flex items-center justify-center font-extrabold text-2xl shrink-0 shadow-md">
                  {user.name ? user.name.charAt(0) : 'U'}
                </div>
                <div className="min-w-0">
                  <h1 className="text-lg font-black text-navy truncate">{user.name || 'عميل Proviea'}</h1>
                  <p className="text-xs text-navy/60 font-mono mt-0.5" dir="ltr">
                    {user.phone}
                  </p>
                  {user.email ? (
                    <p className="text-[11px] text-navy/50 truncate">
                      {user.email}
                    </p>
                  ) : (
                    <p className="text-[11px] text-yellow-dark font-medium">
                      لم يتم إضافة إيميل بعد
                    </p>
                  )}
                </div>
              </div>

              {/* Edit Profile Button */}
              <button
                onClick={handleStartEdit}
                className="bg-yellow-soft hover:bg-yellow/30 text-navy font-bold text-xs px-3.5 py-2 rounded-xl border border-yellow/40 transition-all flex items-center gap-1.5 shadow-sm active:scale-95 shrink-0"
              >
                <Edit3 className="w-3.5 h-3.5 text-navy" />
                <span>تعديل</span>
              </button>
            </div>

            {/* Quick Orders Count Card */}
            <div className="pt-2 border-t border-navy/10">
              <div 
                onClick={onNavigateToOrders}
                className="bg-offwhite hover:bg-yellow-soft/50 p-4 rounded-2xl cursor-pointer transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-navy text-yellow flex items-center justify-center font-bold">
                    <ClipboardList className="w-4 h-4" />
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-navy">طلباتي السابقة</p>
                    <p className="text-[11px] text-navy/60">قوائم المدرسة المرفوعة وتتبعها</p>
                  </div>
                </div>
                <span className="text-sm font-black text-navy bg-white px-3 py-1 rounded-xl border border-navy/10">
                  {ordersCount} طلب
                </span>
              </div>
            </div>
          </div>

          {/* Account Actions */}
          <div className="bg-white rounded-3xl p-4 border border-navy/10 shadow-card space-y-1 divide-y divide-navy/5 text-xs font-bold text-navy">
            <button
              onClick={handleStartEdit}
              className="w-full py-3.5 px-3 flex items-center justify-between hover:bg-offwhite rounded-xl transition-colors text-right"
            >
              <div className="flex items-center gap-2.5">
                <Edit3 className="w-4 h-4 text-navy/70" />
                <span>تعديل بيانات الحساب (الاسم، الهاتف، الإيميل)</span>
              </div>
              <ArrowLeft className="w-4 h-4 text-navy/40" />
            </button>

            <button
              onClick={onNavigateToOrders}
              className="w-full py-3.5 px-3 flex items-center justify-between hover:bg-offwhite rounded-xl transition-colors text-right pt-3"
            >
              <div className="flex items-center gap-2.5">
                <ClipboardList className="w-4 h-4 text-navy/70" />
                <span>استعراض وتعديل القوائم السابقة</span>
              </div>
              <ArrowLeft className="w-4 h-4 text-navy/40" />
            </button>

            <button
              onClick={logout}
              className="w-full py-3.5 px-3 flex items-center justify-between text-red-600 hover:bg-red-50 rounded-xl transition-colors text-right pt-3"
            >
              <div className="flex items-center gap-2.5">
                <LogOut className="w-4 h-4 text-red-500" />
                <span>تسجيل الخروج من الحساب</span>
              </div>
            </button>
          </div>
        </div>
      ) : (
        /* Guest / Not Logged In -> Show Auth Form directly */
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-4 border border-navy/10 shadow-sm text-center">
            <p className="text-xs text-navy/70">
              قم بتسجيل الدخول أو إنشاء حساب للوصول لملفك الشخصي وطلباتك
            </p>
          </div>
          <AuthModal onComplete={() => {}} />
        </div>
      )}

      {/* ================= EDIT PROFILE MODAL ================= */}
      {isEditing && (
        <div className="fixed inset-0 z-50 bg-navy/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 border border-navy/10 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-navy/10 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-yellow text-navy flex items-center justify-center font-bold">
                  <Edit3 className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-extrabold text-navy">
                  تعديل بيانات الحساب
                </h3>
              </div>
              <button
                onClick={() => setIsEditing(false)}
                className="p-1.5 rounded-full hover:bg-navy/10 text-navy/60"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {otpError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{otpError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitProfileEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-navy mb-1">
                  الاسم الكامل <span className="text-red-500">*</span>:
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-offwhite border border-navy/15 rounded-xl px-3 py-2.5 text-xs text-navy focus:outline-none focus:border-navy focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-navy mb-1">
                  رقم الموبايل / واتساب <span className="text-red-500">*</span>:
                </label>
                <input
                  type="tel"
                  required
                  dir="ltr"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full bg-offwhite border border-navy/15 rounded-xl px-3 py-2.5 text-xs text-navy text-right focus:outline-none focus:border-navy focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-navy mb-1">
                  البريد الإلكتروني (Gmail):
                </label>
                <input
                  type="email"
                  dir="ltr"
                  placeholder="name@gmail.com"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full bg-offwhite border border-navy/15 rounded-xl px-3 py-2.5 text-xs text-navy text-right focus:outline-none focus:border-navy focus:bg-white"
                />
                <p className="text-[10px] text-navy/50 mt-1">
                  💡 سيتم إرسال رمز تحقق OTP للتأكد من ملكية الحساب قبل حفظ أي تعديل
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={otpLoading}
                  className="flex-1 bg-yellow hover:bg-yellow-dark text-navy font-bold py-3 px-4 rounded-xl text-xs transition-all shadow flex items-center justify-center gap-2"
                >
                  {otpLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>جاري إرسال الرمز...</span>
                    </>
                  ) : (
                    <span>متابعة والتحقق بـ OTP</span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="bg-offwhite hover:bg-navy-soft text-navy font-bold py-3 px-4 rounded-xl text-xs"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= OTP VERIFICATION MODAL ================= */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 bg-navy/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-5 border border-navy/10 shadow-2xl relative text-center">
            <div className="w-12 h-12 bg-navy text-yellow rounded-2xl flex items-center justify-center mx-auto shadow-sm">
              <ShieldCheck className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-navy">
                تأكيد تعديل بيانات الحساب
              </h3>
              <p className="text-xs text-navy/60">
                أدخل رمز التحقق (OTP) المرسل للتحقق من هويتك
              </p>
            </div>

            {/* Simulated OTP Notification for testing */}
            {simulatedOtp && (
              <div className="p-3 bg-yellow-soft border border-yellow/50 rounded-xl text-xs text-navy text-right">
                <p className="font-bold">رمز التحقق للتجربة الفورية:</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="font-mono text-base font-extrabold text-navy bg-white px-2 py-0.5 rounded border border-yellow">
                    {simulatedOtp}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setOtpValues(simulatedOtp.split(''));
                    }}
                    className="text-[11px] text-yellow-dark underline font-bold"
                  >
                    تعبئة تلقائية
                  </button>
                </div>
              </div>
            )}

            {otpError && (
              <div className="p-2.5 bg-red-50 text-red-700 text-xs rounded-xl">
                {otpError}
              </div>
            )}

            {/* 6 Digits Input */}
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

            {/* Actions */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleConfirmProfileUpdate}
                disabled={otpLoading || otpValues.join('').length !== 6}
                className="w-full bg-navy hover:bg-navy-light text-yellow font-bold py-3 px-4 rounded-xl text-xs transition-all shadow disabled:opacity-50"
              >
                {otpLoading ? 'جاري التحقق...' : 'تأكيد وحفظ البيانات الجديدة'}
              </button>

              <div className="flex items-center justify-between text-xs pt-2">
                <button
                  type="button"
                  onClick={() => setShowOtpModal(false)}
                  className="text-navy/50 hover:text-navy underline"
                >
                  إلغاء
                </button>

                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendTimer > 0}
                  className={`font-semibold ${
                    resendTimer > 0 ? 'text-navy/40' : 'text-yellow-dark hover:underline'
                  }`}
                >
                  {resendTimer > 0 ? `إعادة الإرسال (${resendTimer} ث)` : 'إعادة إرسال الرمز'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
