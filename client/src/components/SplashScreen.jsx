import React, { useState, useEffect } from 'react';
import { ArrowLeft, Sparkles, School, Percent, ShoppingBag } from 'lucide-react';

export default function SplashScreen({ onFinish }) {
  const [secondsLeft, setSecondsLeft] = useState(5);

  useEffect(() => {
    if (secondsLeft <= 0) {
      onFinish();
      return;
    }

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onFinish();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsLeft, onFinish]);

  const progressPercentage = ((5 - secondsLeft) / 5) * 100;

  return (
    <div className="fixed inset-0 z-50 bg-navy flex flex-col items-center justify-between p-6 text-white overflow-hidden select-none">
      {/* Background ambient lighting */}
      <div className="absolute -top-32 -right-32 w-80 h-80 bg-yellow/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-yellow/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar with Skip Button */}
      <div className="w-full max-w-md flex items-center justify-between pt-2">
        <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-xs text-yellow font-medium">
          <Sparkles className="w-3.5 h-3.5" />
          <span>المعرض الحصري</span>
        </div>
        
        <button
          onClick={onFinish}
          className="flex items-center gap-1 bg-white/10 hover:bg-white/20 active:scale-95 text-white/90 px-3.5 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md transition-all"
        >
          <span>تخطي ({secondsLeft} ث)</span>
          <ArrowLeft className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Center Hero Card */}
      <div className="w-full max-w-sm flex flex-col items-center text-center my-auto space-y-6">
        {/* Brand Logo Container (White Logo on Navy background) */}
        <div className="relative py-2">
          <img
            src="/logo-white.png"
            alt="Proviea"
            className="h-20 sm:h-24 w-auto object-contain drop-shadow-2xl transition-transform hover:scale-105"
          />
        </div>

        {/* Welcome Text */}
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold text-white tracking-wide">
            أهلاً بك في <span className="text-yellow">Proviea</span>
          </h1>
          <p className="text-sm text-offwhite/85 leading-relaxed font-normal">
            شريكك الموثوق لتجهيز كافة مستلزمات المدارس والمكتبات بجودة فائقة وأسعار حصرية
          </p>
        </div>

        {/* Highlight Tags */}
        <div className="grid grid-cols-2 gap-2.5 w-full pt-2">
          <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl p-3 flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-yellow/20 flex items-center justify-center text-yellow shrink-0">
              <Percent className="w-5 h-5" />
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-yellow">خصم 15%</p>
              <p className="text-[10px] text-white/70">لفترة محدودة</p>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl p-3 flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-yellow/20 flex items-center justify-center text-yellow shrink-0">
              <School className="w-5 h-5" />
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-yellow">قائمة المدرسة</p>
              <p className="text-[10px] text-white/70">تجهيز فوري وتوصيل</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Progress Indicator */}
      <div className="w-full max-w-sm flex flex-col items-center space-y-3 pb-4">
        {/* Animated Progress Bar */}
        <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-yellow h-full transition-all duration-1000 ease-linear rounded-full"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        <button
          onClick={onFinish}
          className="w-full bg-yellow hover:bg-yellow-dark text-navy font-extrabold py-3.5 px-6 rounded-xl shadow-glow active:scale-[0.99] transition-all flex items-center justify-center gap-2 text-base"
        >
          <ShoppingBag className="w-5 h-5 text-navy" />
          <span>ابدأ الآن واستفد بالخصم</span>
          <ArrowLeft className="w-4 h-4 text-navy" />
        </button>

        <p className="text-[11px] text-white/50">
          جاري فتح شاشة التسجيل تلقائياً خلال {secondsLeft} ثوانٍ...
        </p>
      </div>
    </div>
  );
}
