import React from 'react';
import { Sparkles, ArrowRight, Clock, Bell, Gift, Flame, ArrowLeft, FileText, CheckCircle2 } from 'lucide-react';

export default function OffersScreen({ onBack, onStartSchoolList }) {
  return (
    <div className="space-y-6 max-w-xl mx-auto pb-16">
      {/* Top Header with Back Button */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-bold text-navy hover:text-yellow-dark transition-colors bg-white px-3.5 py-2 rounded-full border border-navy/10 shadow-sm"
        >
          <ArrowRight className="w-4 h-4" />
          <span>رجوع للرئيسية</span>
        </button>

        <span className="text-xs font-bold text-navy/60 bg-yellow-soft border border-yellow/40 px-3 py-1 rounded-full text-navy">
          ✨ عروض حصرية
        </span>
      </div>

      {/* Hero Coming Soon Card */}
      <div className="relative bg-gradient-to-br from-navy via-navy-light to-navy rounded-3xl p-8 text-white text-center shadow-card overflow-hidden space-y-5">
        <div className="absolute -top-12 -left-12 w-48 h-48 bg-yellow/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-yellow/15 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-1.5 bg-yellow text-navy px-4 py-1.5 rounded-full text-xs font-black shadow-glow animate-pulse-subtle">
            <Clock className="w-4 h-4 text-navy" />
            <span>قريباً جداً • Coming Soon</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
            أضخم العروض والباقات الحصرية في طريقها إليك! 🎁
          </h1>

          <p className="text-xs sm:text-sm text-offwhite/85 max-w-md mx-auto leading-relaxed">
            نعمل حالياً على تجهيز باقات مدرسية ومكتبية متكاملة بأفضل الخصومات والماركات العالمية حصرياً لعملائنا.
          </p>
        </div>
      </div>

      {/* Teaser Feature Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-navy/10 shadow-sm space-y-2">
          <div className="w-10 h-10 rounded-xl bg-yellow-soft border border-yellow/40 flex items-center justify-center text-yellow-dark">
            <Gift className="w-5 h-5" />
          </div>
          <h3 className="text-xs font-bold text-navy">باقات المدارس الجاهزة</h3>
          <p className="text-[11px] text-navy/60 leading-relaxed">
            باقات مجمعة لكل مرحلة دراسية تشمل الكشاكيل والأقلام والألوان بأفضل الأسعار.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-navy/10 shadow-sm space-y-2">
          <div className="w-10 h-10 rounded-xl bg-navy-soft flex items-center justify-center text-navy">
            <Flame className="w-5 h-5" />
          </div>
          <h3 className="text-xs font-bold text-navy">عروض فلاش الحصرية</h3>
          <p className="text-[11px] text-navy/60 leading-relaxed">
            خصومات استثنائية على الأدوات الهندسية والآلات الحاسبة والشنط المدرسية.
          </p>
        </div>
      </div>

      {/* CTA Box */}
      <div className="bg-white rounded-3xl p-6 border border-navy/10 shadow-card text-center space-y-4">
        <h3 className="text-sm font-bold text-navy">
          لا تنتظر العروض.. ارفع قائمة مدرستك الآن بخصم 15%!
        </h3>
        <p className="text-xs text-navy/60">
          يمكنك الآن تصوير ورقة طلبات المدرسة وسيقوم فريق Proviea بتجهيزها وتوصيلها فوراً.
        </p>
        <button
          onClick={onStartSchoolList}
          className="w-full bg-yellow hover:bg-yellow-dark text-navy font-black py-3.5 px-6 rounded-2xl shadow-glow transition-all flex items-center justify-center gap-2 text-sm active:scale-[0.99]"
        >
          <FileText className="w-4 h-4 text-navy" />
          <span>تجهيز قائمة المدرسة الآن</span>
          <ArrowLeft className="w-4 h-4 text-navy" />
        </button>
      </div>
    </div>
  );
}
