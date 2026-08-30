import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  CheckCircle2, 
  Sparkles, 
  Copy, 
  Share2, 
  ArrowLeft, 
  PlusCircle, 
  PhoneCall, 
  Percent, 
  Building2,
  Clock
} from 'lucide-react';

export default function ConfirmationScreen({ order, onTrackOrder, onNewList }) {
  useEffect(() => {
    // Launch celebratory confetti burst
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#F4B942', '#12304A', '#F7F5EF', '#22c55e']
      });
    } catch (e) {
      // ignore
    }
  }, []);

  const orderId = order?.id || '#PRV-10482';
  const discountPct = order?.discountPct || 15;
  const companyName = order?.companyName || 'الشركات الشريكة';

  const handleCopyOrderId = () => {
    navigator.clipboard?.writeText(orderId);
    alert(`تم نسخ رقم الطلب: ${orderId}`);
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `أهلاً Proviea! قمت بإرسال قائمة المدرسة الخاصة بي برقم طلب: ${orderId} (${companyName}) وأريد متابعة التجهيز.`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="space-y-6 max-w-xl mx-auto pb-16">
      {/* Celebration Main Card */}
      <div className="bg-white rounded-3xl p-6 border border-navy/10 shadow-card text-center space-y-5">
        {/* Animated Celebration Icon */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="w-20 h-20 rounded-3xl bg-yellow/20 flex items-center justify-center animate-pulse-subtle">
              <span className="text-4xl">🎉</span>
            </div>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-navy text-yellow flex items-center justify-center border-2 border-white shadow">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Success Message */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black text-navy">
            طلبك وصل لـ <span className="text-yellow-dark">Proviea</span>
          </h1>
          <p className="text-xs sm:text-sm text-navy/75 leading-relaxed max-w-md mx-auto">
            استلمنا قائمة احتياجاتك بنجاح. فريق <strong className="text-navy font-bold">Proviea</strong> هيقوم بمراجعة القائمة والتأكد من توافر الأصناف والأسعار، وهيتواصل معاك على رقم الموبايل المسجل.
          </p>
        </div>

        {/* Order ID Box */}
        <div className="bg-navy rounded-2xl p-4 text-white space-y-1.5 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-28 h-28 bg-yellow/15 rounded-full blur-xl pointer-events-none" />
          <p className="text-xs text-offwhite/70">رقم الطلب الخاص بك:</p>
          <div className="flex items-center justify-center gap-2 font-mono">
            <span className="text-2xl font-black text-yellow tracking-wider">
              {orderId}
            </span>
            <button
              onClick={handleCopyOrderId}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-yellow transition-colors"
              title="نسخ رقم الطلب"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Corporate Discount Tag */}
        <div className="bg-yellow-soft border border-yellow/50 rounded-2xl p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-yellow text-navy flex items-center justify-center font-bold text-xs">
              <Percent className="w-4 h-4" />
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-navy">خصم الموظفين</p>
              <p className="text-[11px] text-navy/60">{companyName}</p>
            </div>
          </div>
          <span className="text-sm font-black text-navy bg-yellow px-3 py-1 rounded-xl">
            {discountPct}% OFF
          </span>
        </div>

        {/* Timeline Note */}
        <div className="bg-offwhite rounded-2xl p-3.5 text-xs text-navy/70 flex items-center gap-2 text-right">
          <Clock className="w-4 h-4 text-yellow-dark shrink-0" />
          <span>
            سيتم التواصل معك عبر الواتساب خلال دقائق لتأكيد قائمة الأصناف والأسعار قبل التجهيز.
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        {/* Track Order Button */}
        <button
          type="button"
          onClick={onTrackOrder}
          className="w-full bg-navy hover:bg-navy-light active:scale-[0.99] text-yellow font-black py-4 px-6 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 text-sm"
        >
          <Clock className="w-4 h-4 text-yellow" />
          <span>متابعة الطلب</span>
          <ArrowLeft className="w-4 h-4 text-yellow" />
        </button>

        {/* Submit Another List */}
        <button
          type="button"
          onClick={onNewList}
          className="w-full bg-white hover:bg-offwhite text-navy font-bold py-3.5 px-6 rounded-2xl border border-navy/15 shadow-sm transition-all flex items-center justify-center gap-2 text-xs"
        >
          <PlusCircle className="w-4 h-4 text-yellow-dark" />
          <span>إرسال قائمة جديدة (لطالب آخر)</span>
        </button>

        {/* WhatsApp Chat Button */}
        <button
          type="button"
          onClick={handleWhatsAppShare}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2 text-xs"
        >
          <Share2 className="w-4 h-4" />
          <span>مشاركة وتأكيد الطلب عبر WhatsApp</span>
        </button>
      </div>
    </div>
  );
}
