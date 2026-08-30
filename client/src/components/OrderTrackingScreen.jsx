import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Package, 
  CheckCircle2, 
  Clock, 
  MessageSquare, 
  Building2, 
  Image as ImageIcon, 
  FileText, 
  MapPin, 
  ArrowRight,
  RefreshCw,
  Truck,
  Edit3,
  Plus,
  Camera,
  Trash2,
  X,
  AlertCircle
} from 'lucide-react';

export default function OrderTrackingScreen({ selectedOrderId, onBack }) {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [activeOrder, setActiveOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  // Edit Order Modal States
  const [isEditingOrder, setIsEditingOrder] = useState(false);
  const [editNotes, setEditNotes] = useState('');
  const [editChildGender, setEditChildGender] = useState('');
  const [editSchoolStage, setEditSchoolStage] = useState('');
  const [editBudgetTier, setEditBudgetTier] = useState('');
  const [editDeliveryType, setEditDeliveryType] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editCity, setEditCity] = useState('');

  // Extra images to add to the order
  const [extraImages, setExtraImages] = useState([]); // [{ file, previewUrl, note }]
  const [savingEdit, setSavingEdit] = useState(false);
  const [editSuccessMsg, setEditSuccessMsg] = useState('');
  const [editErrorMsg, setEditErrorMsg] = useState('');

  const imageInputRef = useRef(null);

  const fetchOrders = async () => {
    if (!user?.phone) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/user/${user.phone}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setOrders(data);
        if (selectedOrderId) {
          const found = data.find((o) => o.id === selectedOrderId || o.id === `PRV-${selectedOrderId}`);
          setActiveOrder(found || data[0] || null);
        } else {
          setActiveOrder(data[0] || null);
        }
      }
    } catch (err) {
      console.error('Fetch orders error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [user, selectedOrderId]);

  // Open Edit Order Modal
  const handleOpenEditModal = () => {
    if (!activeOrder) return;
    setEditNotes(activeOrder.extraNotes || '');
    setEditChildGender(activeOrder.childGender || 'ولد');
    setEditSchoolStage(activeOrder.schoolStage || 'ابتدائي');
    setEditBudgetTier(activeOrder.budgetTier || 'medium');
    setEditDeliveryType(activeOrder.deliveryType || 'توصيل للمنزل');
    setEditAddress(activeOrder.address || '');
    setEditCity(activeOrder.city || 'القاهرة / الجيزة');
    setExtraImages([]);
    setEditSuccessMsg('');
    setEditErrorMsg('');
    setIsEditingOrder(true);
  };

  // Handle Adding Extra Images
  const handleAddImages = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (extraImages.length + selectedFiles.length > 5) {
      setEditErrorMsg('الحد الأقصى للصور الإضافية هو 5 صور');
      return;
    }
    setEditErrorMsg('');
    const newItems = selectedFiles.map(file => ({
      file,
      previewUrl: URL.createObjectURL(file),
      note: ''
    }));
    setExtraImages([...extraImages, ...newItems]);
  };

  const handleUpdateExtraImageNote = (index, noteText) => {
    const updated = [...extraImages];
    updated[index].note = noteText;
    setExtraImages(updated);
  };

  const handleRemoveExtraImage = (index) => {
    const updated = [...extraImages];
    URL.revokeObjectURL(updated[index].previewUrl);
    updated.splice(index, 1);
    setExtraImages(updated);
  };

  // Submit Order Update
  const handleSubmitOrderUpdate = async (e) => {
    e.preventDefault();
    if (!activeOrder) return;
    setSavingEdit(true);
    setEditErrorMsg('');

    try {
      const payload = new FormData();
      payload.append('extraNotes', editNotes);
      payload.append('childGender', editChildGender);
      payload.append('schoolStage', editSchoolStage);
      payload.append('budgetTier', editBudgetTier);
      payload.append('deliveryType', editDeliveryType);
      payload.append('address', editAddress);
      payload.append('city', editCity);

      // Append image notes
      const notesArray = extraImages.map(img => img.note || '');
      payload.append('imageNotes', JSON.stringify(notesArray));

      // Append new files
      extraImages.forEach(img => {
        if (img.file) payload.append('images', img.file);
      });

      const res = await fetch(`/api/orders/${activeOrder.id}/update`, {
        method: 'POST',
        body: payload
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل في تحديث الطلب');

      setActiveOrder(data.order);
      setIsEditingOrder(false);
      setEditSuccessMsg('تم تحديث بيانات وملاحظات القائمة بنجاح ✔');
      fetchOrders();
    } catch (err) {
      setEditErrorMsg(err.message || 'حدث خطأ أثناء التحديث');
    } finally {
      setSavingEdit(false);
    }
  };

  const steps = [
    { key: 'new', label: 'استلام القائمة', desc: 'تم استلام الصور والطلبات بنجاح' },
    { key: 'reviewing', label: 'مراجعة الأسعار والتوافر', desc: 'فريق Proviea يفحص الأصناف والمخزون' },
    { key: 'contacted', label: 'تواصل الواتساب', desc: 'تم إرسال الأسعار والتفاصيل للموافقة' },
    { key: 'preparing', label: 'جاري التجهيز والتغليف', desc: 'تجهيز وتغليف الأدوات المدرسية بعناية' },
    { key: 'completed', label: 'التوصيل والاستلام', desc: 'تم تسليم الطلب بنجاح' }
  ];

  const getStepStatus = (currentStatus, stepKey) => {
    const statusOrder = ['new', 'reviewing', 'contacted', 'preparing', 'completed'];
    const currentIndex = statusOrder.indexOf(currentStatus);
    const stepIndex = statusOrder.indexOf(stepKey);

    if (currentIndex > stepIndex) return 'completed';
    if (currentIndex === stepIndex) return 'active';
    return 'pending';
  };

  if (loading) {
    return (
      <div className="text-center py-20">
        <RefreshCw className="w-8 h-8 animate-spin text-navy mx-auto mb-3" />
        <p className="text-xs text-navy/70">جاري تحميل بيانات الطلب...</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-navy/10 shadow-card text-center space-y-4 max-w-md mx-auto">
        <div className="w-16 h-16 bg-navy/5 rounded-full flex items-center justify-center mx-auto text-navy/40">
          <Package className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-navy">لا توجد طلبات سابقة</h2>
        <p className="text-xs text-navy/60">
          لم تقم برفع أي قائمة مدرسة حتى الآن، ابدأ برفع قائمتك واستمتع بأفضل العروض.
        </p>
        <button
          onClick={onBack}
          className="bg-yellow hover:bg-yellow-dark text-navy font-bold py-2.5 px-6 rounded-xl text-xs transition-all"
        >
          تجهيز قائمة جديدة
        </button>
      </div>
    );
  }

  const order = activeOrder || orders[0];

  return (
    <div className="space-y-6 max-w-xl mx-auto pb-20">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-bold text-navy hover:text-yellow-dark transition-colors bg-white px-3.5 py-2 rounded-full border border-navy/10 shadow-sm"
        >
          <ArrowRight className="w-4 h-4" />
          <span>رجوع للرئيسية</span>
        </button>

        <span className="text-xs font-bold text-navy/60">
          إجمالي طلباتك: {orders.length}
        </span>
      </div>

      {/* Success Alert */}
      {editSuccessMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-bold">{editSuccessMsg}</span>
        </div>
      )}

      {/* Multiple Orders Selector Tabs */}
      {orders.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {orders.map((o) => (
            <button
              key={o.id}
              onClick={() => {
                setActiveOrder(o);
                setEditSuccessMsg('');
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition-all ${
                order?.id === o.id
                  ? 'bg-navy text-yellow shadow'
                  : 'bg-white text-navy/70 border border-navy/10 hover:bg-navy-soft'
              }`}
            >
              طلب {o.id}
            </button>
          ))}
        </div>
      )}

      {/* Main Tracking Card */}
      {order && (
        <div className="bg-white rounded-3xl p-6 border border-navy/10 shadow-card space-y-6">
          {/* Order Header Box */}
          <div className="bg-navy rounded-2xl p-4 text-white flex items-center justify-between">
            <div>
              <p className="text-[11px] text-offwhite/70">رقم الطلب</p>
              <p className="text-lg font-black text-yellow font-mono">{order.id}</p>
              <p className="text-[10px] text-offwhite/60 mt-0.5">
                {new Date(order.createdAt).toLocaleDateString('ar-EG', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })}
              </p>
            </div>

            <div className="text-left bg-yellow text-navy px-3 py-1.5 rounded-xl font-bold text-xs">
              <span>خصم {order.discountPct}%</span>
              <p className="text-[9px] font-medium">{order.companyName}</p>
            </div>
          </div>

          {/* Edit Order CTA Button */}
          <button
            onClick={handleOpenEditModal}
            className="w-full bg-yellow-soft hover:bg-yellow/30 text-navy font-bold py-2.5 px-4 rounded-xl border border-yellow/40 transition-all flex items-center justify-center gap-2 text-xs shadow-sm"
          >
            <Edit3 className="w-4 h-4 text-navy" />
            <span>تعديل القائمة (إضافة صور جديدة، تغيير الملاحظات أو العنوان)</span>
          </button>

          {/* Timeline Steps */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-navy flex items-center gap-2">
              <Clock className="w-4 h-4 text-yellow-dark" />
              <span>مراحل تجهيز وتوصيل طلبك:</span>
            </h3>

            <div className="relative pr-6 space-y-5">
              {/* Vertical line */}
              <div className="absolute right-2.5 top-3 bottom-3 w-0.5 bg-navy/10 -z-0" />

              {steps.map((st, idx) => {
                const status = getStepStatus(order.status, st.key);
                return (
                  <div key={st.key} className="relative z-10 flex items-start gap-3">
                    {/* Step Icon / Dot */}
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 transition-all ${
                        status === 'completed'
                          ? 'bg-navy text-yellow'
                          : status === 'active'
                          ? 'bg-yellow text-navy ring-4 ring-yellow/30 font-black'
                          : 'bg-offwhite text-navy/40 border border-navy/20'
                      }`}
                    >
                      {status === 'completed' ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        idx + 1
                      )}
                    </div>

                    {/* Step Content */}
                    <div>
                      <h4
                        className={`text-xs font-bold ${
                          status === 'active'
                            ? 'text-navy'
                            : status === 'completed'
                            ? 'text-navy/80'
                            : 'text-navy/40'
                        }`}
                      >
                        {st.label}
                      </h4>
                      <p className="text-[11px] text-navy/60 leading-tight mt-0.5">
                        {st.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Order Details Accordion */}
          <div className="bg-offwhite rounded-2xl p-4 border border-navy/10 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-navy">بيانات وملاحظات القائمة:</h4>
              <button
                onClick={handleOpenEditModal}
                className="text-[11px] text-yellow-dark hover:underline font-bold"
              >
                تعديل ✏️
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-navy/80">
              <div>
                <span className="text-navy/50">الطالب:</span>{' '}
                <span className="font-bold">{order.childGender} ({order.schoolStage})</span>
              </div>
              <div>
                <span className="text-navy/50">الميزانية:</span>{' '}
                <span className="font-bold">{order.budgetTierLabel}</span>
              </div>
              <div className="col-span-2">
                <span className="text-navy/50">العنوان:</span>{' '}
                <span className="font-bold">{order.city} - {order.address}</span>
              </div>
              {order.extraNotes && (
                <div className="col-span-2 bg-white p-2.5 rounded-xl border border-navy/10 mt-1">
                  <span className="text-navy/50 font-bold block mb-0.5">ملاحظاتك المكتوبة:</span>
                  <span className="text-navy text-[11px]">{order.extraNotes}</span>
                </div>
              )}
            </div>

            {/* Images List */}
            {order.images && order.images.length > 0 && (
              <div className="pt-2 border-t border-navy/10">
                <p className="text-[11px] font-bold text-navy mb-2">
                  الصور المرفوعة وملاحظاتها ({order.images.length}):
                </p>
                <div className="space-y-2">
                  {order.images.map((img, i) => (
                    <div key={i} className="flex items-center gap-2.5 bg-white p-2 rounded-xl border border-navy/10">
                      <img
                        src={img.path}
                        alt={`List ${i}`}
                        className="w-10 h-10 rounded-lg object-cover bg-navy/5 shrink-0"
                      />
                      <div className="text-[11px] min-w-0">
                        <p className="font-bold text-navy">صورة رقم #{i + 1}</p>
                        <p className="text-navy/60 truncate">
                          {img.note ? `ملاحظة: ${img.note}` : 'بدون ملاحظات إضافية'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Contact Support on WhatsApp */}
          <a
            href={`https://wa.me/201000000000?text=${encodeURIComponent(
              `مرحباً Proviea، أريد الاستفسار عن طلبي رقم: ${order.id}`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-xs transition-all shadow-sm"
          >
            <MessageSquare className="w-4 h-4" />
            <span>تواصل مع ممثل خدمة العملاء عبر WhatsApp</span>
          </a>
        </div>
      )}

      {/* ================= EDIT ORDER / LIST MODAL ================= */}
      {isEditingOrder && (
        <div className="fixed inset-0 z-50 bg-navy/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 border border-navy/10 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-navy/10 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-yellow text-navy flex items-center justify-center font-bold">
                  <Edit3 className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-extrabold text-navy">
                  تعديل بيانات القائمة والملاحظات
                </h3>
              </div>
              <button
                onClick={() => setIsEditingOrder(false)}
                className="p-1.5 rounded-full hover:bg-navy/10 text-navy/60"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {editErrorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{editErrorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmitOrderUpdate} className="space-y-4">
              {/* Add Extra Images */}
              <div>
                <label className="block text-xs font-bold text-navy mb-1.5">
                  📸 إضافة صور جديدة للقائمة:
                </label>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleAddImages}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  className="w-full bg-offwhite hover:bg-yellow-soft/50 border border-dashed border-navy/20 rounded-xl p-3 text-xs font-bold text-navy flex items-center justify-center gap-2 transition-colors"
                >
                  <Camera className="w-4 h-4 text-navy" />
                  <span>اضغط لإرفاق صور إضافية للقائمة</span>
                </button>

                {/* Extra Images Preview */}
                {extraImages.length > 0 && (
                  <div className="space-y-2.5 mt-2.5">
                    {extraImages.map((img, idx) => (
                      <div key={idx} className="bg-offwhite p-2.5 rounded-xl border border-navy/10 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <img src={img.previewUrl} alt={`New ${idx}`} className="w-10 h-10 rounded-lg object-cover" />
                            <span className="text-xs font-bold text-navy">صورة إضافية #{idx + 1}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveExtraImage(idx)}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <input
                          type="text"
                          placeholder="ملاحظة خاصة بهذه الصورة الجديدة..."
                          value={img.note}
                          onChange={(e) => handleUpdateExtraImageNote(idx, e.target.value)}
                          className="w-full bg-white border border-navy/15 rounded-lg px-2.5 py-1.5 text-xs text-navy focus:outline-none focus:border-navy"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Edit Written Notes */}
              <div>
                <label className="block text-xs font-bold text-navy mb-1">
                  ✍️ تعديل الملاحظات والطلبات المكتوبة:
                </label>
                <textarea
                  rows={3}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="اكتب أي ملاحظات إضافية لتجهيز القائمة..."
                  className="w-full bg-offwhite border border-navy/15 rounded-xl p-2.5 text-xs text-navy focus:outline-none focus:border-navy focus:bg-white"
                />
              </div>

              {/* Student & Stage */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-navy mb-1">جنس الطفل:</label>
                  <select
                    value={editChildGender}
                    onChange={(e) => setEditChildGender(e.target.value)}
                    className="w-full bg-offwhite border border-navy/15 rounded-xl p-2 text-xs font-bold text-navy"
                  >
                    <option value="ولد">ولد 👦</option>
                    <option value="بنت">بنت 👧</option>
                    <option value="أكثر من طفل">أكثر من طفل 👨‍👩‍👧‍👦</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-navy mb-1">المرحلة الدراسية:</label>
                  <select
                    value={editSchoolStage}
                    onChange={(e) => setEditSchoolStage(e.target.value)}
                    className="w-full bg-offwhite border border-navy/15 rounded-xl p-2 text-xs font-bold text-navy"
                  >
                    <option value="حضانة">حضانة / KG</option>
                    <option value="ابتدائي">ابتدائي</option>
                    <option value="إعدادي">إعدادي</option>
                    <option value="ثانوي">ثانوي</option>
                    <option value="جامعي">جامعي</option>
                  </select>
                </div>
              </div>

              {/* Budget Tier */}
              <div>
                <label className="block text-[11px] font-bold text-navy mb-1">الميزانية وتفضيل البراندات:</label>
                <select
                  value={editBudgetTier}
                  onChange={(e) => setEditBudgetTier(e.target.value)}
                  className="w-full bg-offwhite border border-navy/15 rounded-xl p-2 text-xs font-bold text-navy"
                >
                  <option value="economy">💰 اقتصادية (توفير وجودة عملية)</option>
                  <option value="medium">⚖️ متوسطة (توازن بين الماركات والأسعار)</option>
                  <option value="premium">⭐ Premium (أعلى جودة وماركات عالمية)</option>
                  <option value="flexible">🤷‍♂️ مش فارقة، اختارولي الأنسب</option>
                </select>
              </div>

              {/* Delivery Address */}
              <div>
                <label className="block text-[11px] font-bold text-navy mb-1">عنوان التوصيل بالتفصيل:</label>
                <input
                  type="text"
                  required
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="w-full bg-offwhite border border-navy/15 rounded-xl p-2 text-xs text-navy focus:outline-none focus:border-navy focus:bg-white"
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-navy/10">
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="flex-1 bg-yellow hover:bg-yellow-dark text-navy font-bold py-3 px-4 rounded-xl text-xs transition-all shadow flex items-center justify-center gap-2"
                >
                  {savingEdit ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>جاري حفظ التعديلات...</span>
                    </>
                  ) : (
                    <span>حفظ التعديلات على الطلب</span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setIsEditingOrder(false)}
                  className="bg-offwhite hover:bg-navy-soft text-navy font-bold py-3 px-4 rounded-xl text-xs"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
