import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Camera, 
  Upload, 
  X, 
  Image as ImageIcon, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Tag, 
  Sparkles, 
  ArrowLeft,
  ArrowRight, 
  MapPin, 
  Building2, 
  Home, 
  HelpCircle,
  Plus,
  Trash2,
  Percent,
  User,
  Phone,
  Mail
} from 'lucide-react';

import { validateCorporateCode } from '../supabase';

export default function SchoolListForm({ onProceedToReview, onBack, initialData }) {
  const { user } = useAuth();

  // 1. Uploaded Images & Notes
  // Array of { file, previewUrl, note }
  const [images, setImages] = useState(initialData?.images || []);
  
  // 2. Uploaded Files (PDF/Docs)
  // Array of { file, name, size }
  const [files, setFiles] = useState(initialData?.files || []);

  // 3. Manual Text Notes
  const [extraNotes, setExtraNotes] = useState(initialData?.extraNotes || '');

  // 4. Corporate Code
  const [companyCode, setCompanyCode] = useState(initialData?.companyCode || user?.companyCode || 'PROVIEA15');
  const [companyName, setCompanyName] = useState(initialData?.companyName || 'عرض خاص Proviea');
  const [discountPct, setDiscountPct] = useState(initialData?.discountPct || 15);
  const [codeValid, setCodeValid] = useState(true);
  const [codeChecking, setCodeChecking] = useState(false);
  const [codeFeedback, setCodeFeedback] = useState('تم تفعيل خصم 15% تلقائياً');

  // 5. Child Gender & School Stage
  const [childGender, setChildGender] = useState(initialData?.childGender || 'ولد');
  const [schoolStage, setSchoolStage] = useState(initialData?.schoolStage || 'ابتدائي');

  // 6. Budget Tier
  const [budgetTier, setBudgetTier] = useState(initialData?.budgetTier || 'medium');

  // 7. Customer Contact Info (Direct order without mandatory login)
  const [customerName, setCustomerName] = useState(initialData?.customerName || user?.name || '');
  const [customerPhone, setCustomerPhone] = useState(initialData?.customerPhone || user?.phone || '');
  const [customerEmail, setCustomerEmail] = useState(initialData?.customerEmail || user?.email || '');

  // 8. Delivery & Address
  const [deliveryType, setDeliveryType] = useState(initialData?.deliveryType || 'توصيل للمنزل');
  const [address, setAddress] = useState(initialData?.address || '');
  const [city, setCity] = useState(initialData?.city || 'القاهرة / الجيزة');

  const [formError, setFormError] = useState('');

  const imageInputRef = useRef(null);
  const fileInputRef = useRef(null);

  // Handle Image Selection
  const handleImageSelect = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (images.length + selectedFiles.length > 5) {
      setFormError('الحد الأقصى للصور هو 5 صور فقط');
      return;
    }
    setFormError('');

    const newImages = selectedFiles.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
      note: ''
    }));

    setImages([...images, ...newImages]);
  };

  // Update Specific Image Note
  const handleImageNoteChange = (index, noteText) => {
    const updated = [...images];
    updated[index].note = noteText;
    setImages(updated);
  };

  // Remove Image
  const handleRemoveImage = (index) => {
    const updated = [...images];
    URL.revokeObjectURL(updated[index].previewUrl);
    updated.splice(index, 1);
    setImages(updated);
  };

  // Handle Files Selection
  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (files.length + selectedFiles.length > 5) {
      setFormError('الحد الأقصى للملفات هو 5 ملفات فقط');
      return;
    }
    setFormError('');

    const newFiles = selectedFiles.map((file) => ({
      file,
      name: file.name,
      size: (file.size / 1024).toFixed(1) + ' KB'
    }));

    setFiles([...files, ...newFiles]);
  };

  // Remove File
  const handleRemoveFile = (index) => {
    const updated = [...files];
    updated.splice(index, 1);
    setFiles(updated);
  };

  // Validate Corporate Code
  const handleValidateCode = async (codeToTest) => {
    const targetCode = (codeToTest || companyCode || '').trim();
    if (!targetCode) return;

    setCodeChecking(true);
    setCodeFeedback('');
    try {
      const data = await validateCorporateCode(targetCode);
      if (data && data.valid) {
        setCodeValid(true);
        setCompanyCode(data.companyCode || targetCode.toUpperCase());
        setCompanyName(data.companyName || 'خصم الشركات المعتمد');
        setDiscountPct(data.discountPct || 15);
        setCodeFeedback(`🎉 تم تفعيل خصم ${data.discountPct || 15}% بنجاح (${data.companyName || 'خصم الشركات'})`);
      } else {
        setCodeValid(false);
        setCodeFeedback('الكود غير صحيح أو انتهت صلاحيته');
      }
    } catch {
      setCodeValid(true);
      setDiscountPct(15);
      setCompanyName(targetCode.toUpperCase());
      setCodeFeedback('تم تفعيل الخصم 15% بنجاح');
    } finally {
      setCodeChecking(false);
    }
  };

  // Quick Apply Company Code
  const applyPresetCode = (code) => {
    setCompanyCode(code);
    handleValidateCode(code);
  };

  // Proceed to Review
  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError('');

    if (images.length === 0 && files.length === 0 && !extraNotes.trim()) {
      setFormError('يرجى رفع صورة واحدة على الأقل لقائمة المدرسة أو رفع ملف أو كتابة الطلبات');
      window.scrollTo({ top: 150, behavior: 'smooth' });
      return;
    }

    if (!customerName.trim()) {
      setFormError('يرجى كتابة اسم ولي الأمر للتواصل');
      return;
    }

    if (!customerPhone.trim() || customerPhone.trim().replace(/\s+/g, '').length < 10) {
      setFormError('يرجى كتابة رقم هاتف / واتساب صحيح للتواصل وتأكيد الطلب (11 رقم)');
      return;
    }

    if (!address.trim()) {
      setFormError('يرجى كتابة عنوان التوصيل بالتفصيل');
      return;
    }

    const budgetLabels = {
      economy: '💰 اقتصادية',
      medium: '⚖️ متوسطة',
      premium: '⭐ Premium',
      flexible: '🤷‍♂️ مش فارقة، اختارولي الأنسب'
    };

    onProceedToReview({
      images,
      files,
      extraNotes,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim().replace(/\s+/g, ''),
      customerEmail: customerEmail.trim(),
      companyCode,
      companyName,
      discountPct,
      childGender,
      schoolStage,
      budgetTier,
      budgetTierLabel: budgetLabels[budgetTier] || budgetTier,
      deliveryType,
      address,
      city
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-xl mx-auto pb-20">
      {/* Top Header with Back Button */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-bold text-navy hover:text-yellow-dark transition-colors bg-white px-3.5 py-2 rounded-full border border-navy/10 shadow-sm"
        >
          <ArrowRight className="w-4 h-4" />
          <span>رجوع للرئيسية</span>
        </button>

        <span className="text-xs font-bold text-navy/60">
          خطوة 1 من 2
        </span>
      </div>

      {/* Title Header */}
      <div className="bg-white rounded-3xl p-5 border border-navy/10 shadow-card">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-yellow text-navy flex items-center justify-center font-bold shadow-sm">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-navy">
              تجهيز قائمة المدرسة (School List)
            </h1>
            <p className="text-xs text-navy/70 mt-0.5">
              ارفع صور القائمة وسنقوم بمراجعتها وتجهيزها وتطبيق خصم شركتك
            </p>
          </div>
        </div>
      </div>

      {/* Global Error Banner */}
      {formError && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl flex items-center gap-3 animate-bounce">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
          <span className="font-semibold">{formError}</span>
        </div>
      )}

      {/* ================= 1. UPLOAD IMAGES (UP TO 5) ================= */}
      <div className="bg-white rounded-3xl p-5 border border-navy/10 shadow-card space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-navy text-yellow flex items-center justify-center font-bold text-xs">
              1
            </div>
            <div>
              <h2 className="text-sm font-bold text-navy">
                رفع صور القائمة (حتى 5 صور) <span className="text-red-500">*</span>
              </h2>
              <p className="text-[11px] text-navy/60">
                يمكنك تصوير ورقة طلبات المدرسة بالكاميرا أو رفعها من المعرض
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-navy bg-offwhite px-2.5 py-1 rounded-full border border-navy/10">
            {images.length} / 5 صور
          </span>
        </div>

        {/* Upload Trigger Area */}
        {images.length < 5 && (
          <div>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageSelect}
              className="hidden"
            />
            <div
              onClick={() => imageInputRef.current?.click()}
              className="border-2 border-dashed border-navy/20 hover:border-yellow bg-offwhite/50 hover:bg-yellow-soft/30 rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 group"
            >
              <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-navy group-hover:text-yellow-dark group-hover:scale-110 transition-transform">
                <Camera className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-navy">
                  اضغط هنا لتصوير أو اختيار صور القائمة
                </p>
                <p className="text-[11px] text-navy/50 mt-0.5">
                  JPG, PNG, WEBP (حتى 5 صور)
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Uploaded Images List with Individual Notes */}
        {images.length > 0 && (
          <div className="space-y-3.5 pt-2">
            {images.map((img, idx) => (
              <div
                key={idx}
                className="bg-offwhite rounded-2xl p-3.5 border border-navy/10 space-y-2.5 transition-all"
              >
                <div className="flex items-center gap-3">
                  {/* Thumbnail */}
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-navy/10 shrink-0 border border-navy/15">
                    <img
                      src={img.previewUrl}
                      alt={`School List Image ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-1 right-1 bg-navy text-yellow text-[10px] font-bold px-1.5 py-0.2 rounded">
                      {idx + 1}
                    </span>
                  </div>

                  {/* Image info & Remove button */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-navy truncate">
                        صورة القائمة رقم ({idx + 1})
                      </p>
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="text-red-500 hover:text-red-700 p-1 rounded-lg hover:bg-red-50 transition-colors"
                        title="حذف هذه الصورة"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-[11px] text-navy/50 truncate">
                      {img.file?.name || 'صورة جاهزة للمراجعة'}
                    </p>
                  </div>
                </div>

                {/* Specific Note Field Under Each Image */}
                <div className="pt-1">
                  <label className="block text-[11px] font-bold text-navy/80 mb-1">
                    📝 ملاحظة خاصة بالصورة رقم ({idx + 1}):
                  </label>
                  <input
                    type="text"
                    placeholder="مثلاً: الصفحة الأولى / مطلوب كشاكيل 80 ورقة فقط / إلخ"
                    value={img.note}
                    onChange={(e) => handleImageNoteChange(idx, e.target.value)}
                    className="w-full bg-white border border-navy/15 rounded-xl px-3 py-2 text-xs text-navy placeholder:text-navy/35 focus:outline-none focus:border-navy transition-all"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ================= 2. UPLOAD FILES / PDFS ================= */}
      <div className="bg-white rounded-3xl p-5 border border-navy/10 shadow-card space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-navy text-yellow flex items-center justify-center font-bold text-xs">
              2
            </div>
            <div>
              <h2 className="text-sm font-bold text-navy">
                رفع ملفات ومستندات (PDF / Word) (اختياري)
              </h2>
              <p className="text-[11px] text-navy/60">
                إذا كانت المدرسة قد أرسلت ملف PDF بقائمة الطلبات
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-navy bg-offwhite px-2.5 py-1 rounded-full border border-navy/10">
            {files.length} / 5
          </span>
        </div>

        {files.length < 5 && (
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full bg-offwhite hover:bg-navy-soft border border-navy/15 text-navy font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all"
            >
              <Upload className="w-4 h-4 text-navy" />
              <span>إرفاق ملف PDF أو مستند</span>
            </button>
          </div>
        )}

        {files.length > 0 && (
          <div className="space-y-2 pt-1">
            {files.map((file, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 bg-offwhite border border-navy/10 rounded-xl text-xs"
              >
                <div className="flex items-center gap-2 truncate">
                  <FileText className="w-4 h-4 text-navy/70 shrink-0" />
                  <span className="font-semibold text-navy truncate">{file.name}</span>
                  <span className="text-[10px] text-navy/40">({file.size})</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveFile(idx)}
                  className="text-red-500 hover:text-red-700 p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ================= 3. MANUAL TEXT NOTES ================= */}
      <div className="bg-white rounded-3xl p-5 border border-navy/10 shadow-card space-y-2">
        <label className="block text-xs font-bold text-navy">
          ✍️ كتابة الطلبات أو ملاحظات إضافية يدوياً:
        </label>
        <textarea
          rows={3}
          placeholder="اكتب هنا أي طلبات إضافية مثل: (اسم المدرسة، ألوان تجليد معينة، متطلبات خاصة بالمعلمين...)"
          value={extraNotes}
          onChange={(e) => setExtraNotes(e.target.value)}
          className="w-full bg-offwhite border border-navy/15 rounded-xl p-3 text-xs text-navy placeholder:text-navy/35 focus:outline-none focus:border-navy focus:bg-white transition-all"
        />
      </div>

      {/* ================= 4. CORPORATE DISCOUNT CODE ================= */}
      <div className="bg-gradient-to-br from-navy via-navy to-navy-dark rounded-3xl p-5 text-white shadow-card space-y-4 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-yellow/15 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-yellow text-navy flex items-center justify-center font-bold text-xs">
              %
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">
                كود شركتك للحصول على الخصم
              </h2>
              <p className="text-[11px] text-offwhite/70">
                خصم 15% فوري لموظفي الشركات والمؤسسات
              </p>
            </div>
          </div>
          <span className="text-xs font-extrabold bg-yellow text-navy px-2.5 py-1 rounded-full shadow-sm">
            خصم {discountPct}%
          </span>
        </div>

        {/* Code Input & Button */}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="مثال: PROVIEA15 أو كود شركتك"
            value={companyCode}
            onChange={(e) => setCompanyCode(e.target.value.toUpperCase())}
            className="flex-1 bg-white/10 border border-white/20 rounded-xl px-3 py-2.5 text-xs text-yellow font-bold uppercase tracking-wider placeholder:text-white/40 focus:outline-none focus:border-yellow focus:bg-white/20 transition-all text-right"
          />
          <button
            type="button"
            onClick={() => handleValidateCode(companyCode)}
            disabled={codeChecking}
            className="bg-yellow hover:bg-yellow-dark text-navy font-bold px-4 py-2.5 rounded-xl text-xs transition-all active:scale-95 shrink-0 shadow"
          >
            {codeChecking ? 'جاري التحقق...' : 'تطبيق الكود'}
          </button>
        </div>

        {/* Code Feedback Alert */}
        {codeFeedback && (
          <div
            className={`p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
              codeValid
                ? 'bg-yellow/20 text-yellow border border-yellow/30'
                : 'bg-red-500/20 text-red-200 border border-red-500/30'
            }`}
          >
            {codeValid ? <CheckCircle2 className="w-4 h-4 text-yellow shrink-0" /> : <AlertCircle className="w-4 h-4 text-red-300 shrink-0" />}
            <span>{codeFeedback}</span>
          </div>
        )}

        {/* Quick Suggestion Buttons */}
        <div>
          <p className="text-[11px] text-offwhite/60 mb-2">أكواد سريعة مقترحة:</p>
          <div className="flex flex-wrap gap-1.5">
            {[
              { label: 'كود المعرض العام', code: 'PROVIEA15' },
              { label: 'خصم الشركات', code: 'CORP15' },
              { label: 'خصم الموظفين', code: 'STAFF15' },
              { label: 'عرض الشركاء', code: 'PARTNER15' },
            ].map((co) => (
              <button
                key={co.code}
                type="button"
                onClick={() => applyPresetCode(co.code)}
                className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${
                  companyCode === co.code
                    ? 'bg-yellow text-navy font-bold border-yellow'
                    : 'bg-white/10 text-white/80 border-white/15 hover:bg-white/20'
                }`}
              >
                {co.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ================= 5. CHILD GENDER & SCHOOL STAGE ================= */}
      <div className="bg-white rounded-3xl p-5 border border-navy/10 shadow-card space-y-4">
        <h2 className="text-sm font-bold text-navy flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-yellow-dark" />
          <span>تحديد نوع المنتجات المناسبة للطالب</span>
        </h2>

        {/* Gender Selection */}
        <div>
          <label className="block text-xs font-bold text-navy mb-2">
            جنس الطفل:
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'ولد', label: '👦 ولد' },
              { id: 'بنت', label: '👧 بنت' },
              { id: 'أكثر من طفل', label: '👨‍👩‍👧‍👦 أكثر من طفل' }
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setChildGender(opt.id)}
                className={`p-3 rounded-2xl border text-xs font-bold transition-all text-center ${
                  childGender === opt.id
                    ? 'bg-navy text-yellow border-navy shadow-sm'
                    : 'bg-offwhite text-navy/80 border-navy/10 hover:border-navy/30'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* School Stage Selection */}
        <div>
          <label className="block text-xs font-bold text-navy mb-2">
            المرحلة الدراسية:
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {[
              { id: 'حضانة', label: 'حضانة / KG' },
              { id: 'ابتدائي', label: 'ابتدائي' },
              { id: 'إعدادي', label: 'إعدادي' },
              { id: 'ثانوي', label: 'ثانوي' },
              { id: 'جامعي', label: 'جامعي' }
            ].map((stg) => (
              <button
                key={stg.id}
                type="button"
                onClick={() => setSchoolStage(stg.id)}
                className={`p-2.5 rounded-2xl border text-xs font-bold transition-all text-center ${
                  schoolStage === stg.id
                    ? 'bg-navy text-yellow border-navy shadow-sm'
                    : 'bg-offwhite text-navy/80 border-navy/10 hover:border-navy/30'
                }`}
              >
                {stg.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ================= 6. BUDGET & BRAND TIER ================= */}
      <div className="bg-white rounded-3xl p-5 border border-navy/10 shadow-card space-y-3">
        <h2 className="text-sm font-bold text-navy">
          اختيار الميزانية والبراندات:
        </h2>
        <p className="text-[11px] text-navy/60">
          حدد فئة المنتجات التي تفضلها لتجهيز قائمتك
        </p>

        <div className="space-y-2.5 pt-1">
          {[
            {
              id: 'economy',
              title: '💰 اقتصادية',
              desc: 'أفضل قيمة مقابل السعر مع خامات عملية وممتازة'
            },
            {
              id: 'medium',
              title: '⚖️ متوسطة',
              desc: 'توازن مثالي بين الماركات المعروفة والأسعار التنافسية'
            },
            {
              id: 'premium',
              title: '⭐ Premium',
              desc: 'أعلى جودة وماركات عالمية فاخرة (Faber-Castell, Staedtler...)'
            },
            {
              id: 'flexible',
              title: '🤷‍♂️ مش فارقة، اختارولي الأنسب',
              desc: 'فريق Proviea الخبير سيقوم باختيار أنسب وأجود تشكيلة لك'
            }
          ].map((tier) => (
            <div
              key={tier.id}
              onClick={() => setBudgetTier(tier.id)}
              className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                budgetTier === tier.id
                  ? 'bg-yellow-soft border-yellow shadow-sm ring-1 ring-yellow'
                  : 'bg-offwhite/50 border-navy/10 hover:border-navy/25 hover:bg-white'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full mt-0.5 border flex items-center justify-center shrink-0 transition-all ${
                  budgetTier === tier.id
                    ? 'border-navy bg-navy text-yellow'
                    : 'border-navy/30 bg-white'
                }`}
              >
                {budgetTier === tier.id && <div className="w-2 h-2 rounded-full bg-yellow" />}
              </div>
              <div>
                <h3 className="text-xs font-bold text-navy">{tier.title}</h3>
                <p className="text-[11px] text-navy/70 mt-0.5">{tier.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ================= 7. CUSTOMER CONTACT INFO ================= */}
      <div className="bg-white rounded-3xl p-5 border border-navy/10 shadow-card space-y-4">
        <h2 className="text-sm font-bold text-navy flex items-center gap-2">
          <User className="w-4 h-4 text-yellow-dark" />
          <span>بيانات ولي الأمر للتواصل والتأكيد</span>
        </h2>
        <p className="text-[11px] text-navy/60">
          سيتم التواصل معك عبر الواتساب لتأكيد تفاصيل وأسعار القائمة قبل التجهيز
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Customer Name */}
          <div>
            <label className="block text-xs font-bold text-navy mb-1">
              الاسم الكامل <span className="text-red-500">*</span>:
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-navy/40 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                required
                placeholder="أحمد محمد"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full bg-offwhite border border-navy/15 rounded-xl pr-9 pl-3 py-2.5 text-xs text-navy placeholder:text-navy/35 focus:outline-none focus:border-navy focus:bg-white transition-all font-semibold"
              />
            </div>
          </div>

          {/* Customer Phone */}
          <div>
            <label className="block text-xs font-bold text-navy mb-1">
              رقم الموبايل / واتساب <span className="text-red-500">*</span>:
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-navy/40 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="tel"
                required
                dir="ltr"
                placeholder="01018237667"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full bg-offwhite border border-navy/15 rounded-xl pr-9 pl-3 py-2.5 text-xs text-navy placeholder:text-navy/35 focus:outline-none focus:border-navy focus:bg-white transition-all font-semibold text-right"
              />
            </div>
          </div>
        </div>

        {/* Customer Email (Optional) */}
        <div>
          <label className="block text-xs font-bold text-navy mb-1">
            البريد الإلكتروني <span className="text-navy/40 font-normal">(اختياري لمتابعة الطلب)</span>:
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-navy/40 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="email"
              dir="ltr"
              placeholder="name@example.com"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              className="w-full bg-offwhite border border-navy/15 rounded-xl pr-9 pl-3 py-2.5 text-xs text-navy placeholder:text-navy/35 focus:outline-none focus:border-navy focus:bg-white transition-all text-right"
            />
          </div>
        </div>
      </div>

      {/* ================= 8. DELIVERY & ADDRESS ================= */}
      <div className="bg-white rounded-3xl p-5 border border-navy/10 shadow-card space-y-4">
        <h2 className="text-sm font-bold text-navy flex items-center gap-2">
          <MapPin className="w-4 h-4 text-yellow-dark" />
          <span>طريقة الاستلام وعنوان التوصيل</span>
        </h2>

        {/* Delivery Type */}
        <div className="grid grid-cols-2 gap-2.5">
          {[
            { id: 'توصيل للمنزل', icon: Home, label: 'توصيل لباب المنزل 🏠' },
            { id: 'توصيل للشركة', icon: Building2, label: 'توصيل لمقر العمل / الشركة 🏢' }
          ].map((del) => {
            const DeliveryIcon = del.icon;
            return (
              <button
                key={del.id}
                type="button"
                onClick={() => setDeliveryType(del.id)}
                className={`p-3 rounded-2xl border text-xs font-bold transition-all text-center flex items-center justify-center gap-2 ${
                  deliveryType === del.id
                    ? 'bg-navy text-yellow border-navy shadow-sm'
                    : 'bg-offwhite text-navy/80 border-navy/10 hover:border-navy/30'
                }`}
              >
                <DeliveryIcon className="w-4 h-4" />
                <span>{del.label}</span>
              </button>
            );
          })}
        </div>

        {/* City / Area */}
        <div>
          <label className="block text-xs font-bold text-navy mb-1">
            المحافظة / المنطقة:
          </label>
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full bg-offwhite border border-navy/15 rounded-xl px-3 py-2.5 text-xs text-navy focus:outline-none focus:border-navy focus:bg-white transition-all font-semibold"
          >
            <option value="القاهرة - التجمع والقاهرة الجديدة">القاهرة - التجمع والقاهرة الجديدة</option>
            <option value="القاهرة - مدينة نصر ومصر الجديدة">القاهرة - مدينة نصر ومصر الجديدة</option>
            <option value="القاهرة - المعادي وحلوان">القاهرة - المعادي وحلوان</option>
            <option value="الجيزة - الشيخ زايد و6 أكتوبر">الجيزة - الشيخ زايد و6 أكتوبر</option>
            <option value="الجيزة - الدقي والمهندسين والهرم">الجيزة - الدقي والمهندسين والهرم</option>
            <option value="الإسكندرية">الإسكندرية</option>
            <option value="السويس / بورسعيد / الإسماعيلية">السويس / بورسعيد / الإسماعيلية</option>
            <option value="محافظة أخرى">محافظة أخرى</option>
          </select>
        </div>

        {/* Detailed Address */}
        <div>
          <label className="block text-xs font-bold text-navy mb-1">
            العنوان بالتفصيل <span className="text-red-500">*</span>:
          </label>
          <input
            type="text"
            required
            placeholder="اسم الشارع، رقم العمارة، الشقة، أو اسم المقر/الشركة"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full bg-offwhite border border-navy/15 rounded-xl px-3 py-2.5 text-xs text-navy placeholder:text-navy/35 focus:outline-none focus:border-navy focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* ================= SUBMIT BUTTON (GO TO REVIEW) ================= */}
      <div className="pt-2">
        <button
          type="submit"
          className="w-full bg-yellow hover:bg-yellow-dark active:scale-[0.99] text-navy font-black py-4 px-6 rounded-2xl shadow-glow transition-all flex items-center justify-center gap-2 text-base"
        >
          <span>مراجعة الطلب والمتابعة</span>
          <ArrowLeft className="w-5 h-5 text-navy" />
        </button>
        <p className="text-center text-[11px] text-navy/50 mt-2">
          ستتمكن من مراجعة كافة التفاصيل قبل الإرسال النهائي
        </p>
      </div>
    </form>
  );
}
