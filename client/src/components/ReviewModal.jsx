import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  CheckCircle, 
  Building2, 
  Percent, 
  Package, 
  Image as ImageIcon, 
  FileText, 
  DollarSign, 
  MapPin, 
  ArrowRight, 
  Send, 
  RefreshCw, 
  Edit3, 
  ShieldCheck,
  Sparkles
} from 'lucide-react';

import { submitSchoolListOrder } from '../supabase';

export default function ReviewModal({ formData = {}, onBackToEdit, onSuccess }) {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const safeData = formData || {};

  const handleFinalSubmit = async () => {
    setSubmitting(true);
    setErrorMessage('');

    try {
      const imageFiles = (safeData.images || []).map(img => img?.file).filter(Boolean);
      const docFiles = (safeData.files || []).map(f => f?.file).filter(Boolean);
      const imageNotes = (safeData.images || []).map(img => img?.note || '');

      const payload = {
        userId: user?.id || '',
        name: user?.name || 'عميل Proviea',
        phone: user?.phone || '',
        email: user?.email || '',
        companyCode: safeData.companyCode || 'PROVIEA15',
        childGender: safeData.childGender || 'غير محدد',
        schoolStage: safeData.schoolStage || 'غير محدد',
        budgetTier: safeData.budgetTier || 'medium',
        deliveryType: safeData.deliveryType || 'توصيل للمنزل',
        address: safeData.address || '',
        city: safeData.city || 'القاهرة / الجيزة',
        extraNotes: safeData.extraNotes || ''
      };

      const result = await submitSchoolListOrder(payload, imageFiles, docFiles, imageNotes);
      onSuccess(result.order);
    } catch (err) {
      console.error('Submit order error:', err);
      setErrorMessage(err.message || 'حدث خطأ أثناء إرسال الطلب، يرجى المحاولة مرة أخرى');
    } finally {
      setSubmitting(false);
    }
  };

  const imagesCount = Array.isArray(safeData.images) ? safeData.images.length : 0;
  const filesCount = Array.isArray(safeData.files) ? safeData.files.length : 0;

  return (
    <div className="space-y-6 max-w-xl mx-auto pb-16">
      {/* Title Card */}
      <div className="bg-navy rounded-3xl p-6 text-white text-center shadow-card relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-yellow/20 rounded-full blur-2xl pointer-events-none" />
        <div className="flex justify-center mb-2">
          <div className="w-12 h-12 rounded-2xl bg-yellow text-navy flex items-center justify-center font-bold">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>
        <h1 className="text-2xl font-extrabold text-white">
          راجع طلبك
        </h1>
        <p className="text-xs text-offwhite/80 mt-1">
          تأكد من صحة البيانات قبل الإرسال النهائي لفريق Proviea
        </p>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl">
          {errorMessage}
        </div>
      )}

      {/* Summary Details Card */}
      <div className="bg-white rounded-3xl p-6 border border-navy/10 shadow-card space-y-4">
        {/* Company & Discount Box */}
        <div className="bg-yellow-soft border border-yellow/40 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-navy text-yellow flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-navy/70">الشركة</p>
              <p className="text-sm font-extrabold text-navy">
                {safeData.companyName || safeData.companyCode || 'خصم الشركاء'}
              </p>
            </div>
          </div>

          <div className="text-left bg-yellow text-navy px-3.5 py-1.5 rounded-xl shadow-sm">
            <p className="text-[10px] font-bold">الخصم المطبق</p>
            <p className="text-sm font-black">{safeData.discountPct || 15}%</p>
          </div>
        </div>

        {/* Rows of Information */}
        <div className="divide-y divide-navy/5 text-xs">
          {/* Order Type */}
          <div className="py-3 flex items-center justify-between">
            <span className="font-semibold text-navy/60">نوع الطلب:</span>
            <span className="font-bold text-navy bg-navy-soft px-2.5 py-1 rounded-lg">
              School Supplies (مستلزمات مدرسية)
            </span>
          </div>

          {/* List Attachments */}
          <div className="py-3 flex items-center justify-between">
            <span className="font-semibold text-navy/60">القائمة المرفقة:</span>
            <span className="font-bold text-navy flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-yellow-dark" />
              <span>{imagesCount} صور</span>
              {filesCount > 0 && <span>+ {filesCount} ملفات</span>}
            </span>
          </div>

          {/* Child & Stage */}
          <div className="py-3 flex items-center justify-between">
            <span className="font-semibold text-navy/60">الطالب والمرحلة:</span>
            <span className="font-bold text-navy">
              {safeData.childGender || 'ولد'} • مرحلة {safeData.schoolStage || 'ابتدائي'}
            </span>
          </div>

          {/* Budget & Brands */}
          <div className="py-3 flex items-center justify-between">
            <span className="font-semibold text-navy/60">الميزانية وتفضيل المنتجات:</span>
            <span className="font-bold text-navy">
              {safeData.budgetTierLabel || '⚖️ متوسطة'}
            </span>
          </div>

          {/* Delivery Method */}
          <div className="py-3 flex items-center justify-between">
            <span className="font-semibold text-navy/60">طريقة الاستلام:</span>
            <span className="font-bold text-navy">
              {safeData.deliveryType || 'توصيل للمنزل'}
            </span>
          </div>

          {/* Address */}
          <div className="py-3 flex items-start justify-between gap-4">
            <span className="font-semibold text-navy/60 shrink-0">العنوان:</span>
            <span className="font-bold text-navy text-left break-words">
              {safeData.city || 'القاهرة'} - {safeData.address || 'العنوان المسجل'}
            </span>
          </div>

          {/* Extra Notes if any */}
          {safeData.extraNotes && (
            <div className="py-3 flex items-start justify-between gap-4">
              <span className="font-semibold text-navy/60 shrink-0">ملاحظات:</span>
              <span className="text-navy text-left text-[11px]">
                {safeData.extraNotes}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Uploaded Images Thumbnails Mini Preview */}
      {Array.isArray(safeData.images) && safeData.images.length > 0 && (
        <div className="bg-white rounded-3xl p-5 border border-navy/10 shadow-card space-y-3">
          <p className="text-xs font-bold text-navy">معاينة صور القائمة ({safeData.images.length}):</p>
          <div className="grid grid-cols-5 gap-2">
            {safeData.images.map((img, idx) => (
              <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-navy/20 bg-navy/5">
                {img?.previewUrl ? (
                  <img src={img.previewUrl} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-navy/10 text-navy/40">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                )}
                <span className="absolute bottom-0 inset-x-0 bg-navy/80 text-yellow text-[9px] text-center font-bold py-0.5">
                  #{idx + 1}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-3 pt-2">
        <button
          type="button"
          onClick={handleFinalSubmit}
          disabled={submitting}
          className="w-full bg-yellow hover:bg-yellow-dark active:scale-[0.99] text-navy font-black py-4 px-6 rounded-2xl shadow-glow transition-all flex items-center justify-center gap-2 text-base disabled:opacity-50"
        >
          {submitting ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin text-navy" />
              <span>جاري إرسال وتجهيز الطلب...</span>
            </>
          ) : (
            <>
              <Send className="w-5 h-5 text-navy rotate-180" />
              <span>إرسال الطلب الآن</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={onBackToEdit}
          disabled={submitting}
          className="w-full bg-offwhite hover:bg-navy-soft text-navy font-bold py-3 px-4 rounded-xl border border-navy/15 transition-colors flex items-center justify-center gap-2 text-xs"
        >
          <Edit3 className="w-4 h-4 text-navy/70" />
          <span>تعديل بيانات القائمة</span>
        </button>
      </div>
    </div>
  );
}
