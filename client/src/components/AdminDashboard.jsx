import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldCheck, 
  Users, 
  Package, 
  Image as ImageIcon, 
  QrCode, 
  MessageSquare, 
  Search, 
  Filter, 
  ExternalLink, 
  CheckCircle, 
  Clock, 
  Building2, 
  RefreshCw, 
  Download, 
  Eye, 
  X,
  Phone,
  Send,
  Sparkles,
  Lock,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

import { fetchAdminDashboardData, updateOrderStatusByAdmin } from '../supabase';

export default function AdminDashboard({ onBackToHome }) {
  const { user, saveUserSession } = useAuth();
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');

  // Admin Passcode Gate (if not logged as admin)
  const [passcode, setPasscode] = useState('');
  const [gateError, setGateError] = useState('');
  const [gateLoading, setGateLoading] = useState(false);

  // Modal for Viewing Order Details & Photos
  const [viewOrderModal, setViewOrderModal] = useState(null);
  const [activeImageZoom, setActiveImageZoom] = useState(null);

  // Exhibition QR Code Generator State
  const [qrCompanyCode, setQrCompanyCode] = useState('CORP15');
  const [qrCompanyName, setQrCompanyName] = useState('خصم الشركات (Corporate)');
  const [qrDiscount, setQrDiscount] = useState(15);
  const [customQrUrl, setCustomQrUrl] = useState('');

  // Fetch Dashboard Data
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Try Supabase direct first
      try {
        const { stats: sbStats, orders: sbOrders } = await fetchAdminDashboardData();
        setStats(sbStats);
        setOrders(sbOrders);
        setFilteredOrders(sbOrders);
        setLoading(false);
        return;
      } catch (sbErr) {
        console.warn('Supabase fetch admin dashboard fallback:', sbErr);
      }

      // 2. Fallback to local server API
      const [statsRes, ordersRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/orders')
      ]);

      const statsData = await statsRes.json();
      const ordersData = await ordersRes.json();

      setStats(statsData);
      setOrders(ordersData);
      setFilteredOrders(ordersData);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Update Custom QR URL whenever company code changes
  useEffect(() => {
    const origin = window.location.origin;
    setCustomQrUrl(`${origin}/?company=${encodeURIComponent(qrCompanyCode)}&discount=${qrDiscount}`);
  }, [qrCompanyCode, qrDiscount]);

  // Apply filters
  useEffect(() => {
    let result = [...orders];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (o) =>
          o.id.toLowerCase().includes(q) ||
          o.name.toLowerCase().includes(q) ||
          o.phone.includes(q) ||
          o.companyName.toLowerCase().includes(q)
      );
    }

    if (selectedCompanyFilter !== 'ALL') {
      result = result.filter((o) => o.companyCode.toUpperCase().includes(selectedCompanyFilter.toUpperCase()));
    }

    if (selectedStatusFilter !== 'ALL') {
      result = result.filter((o) => o.status === selectedStatusFilter);
    }

    setFilteredOrders(result);
  }, [searchQuery, selectedCompanyFilter, selectedStatusFilter, orders]);

  // Update Order Status
  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      // 1. Try Supabase first
      try {
        await updateOrderStatusByAdmin(orderId, newStatus);
        fetchDashboardData();
        if (viewOrderModal && viewOrderModal.id === orderId) {
          setViewOrderModal({ ...viewOrderModal, status: newStatus });
        }
        return;
      } catch (sbErr) {
        console.warn('Supabase status update fallback:', sbErr);
      }

      // 2. Fallback to local server API
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchDashboardData();
        if (viewOrderModal && viewOrderModal.id === orderId) {
          setViewOrderModal({ ...viewOrderModal, status: newStatus });
        }
      }
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  // Generate Direct WhatsApp URL for a customer
  const getCustomerWhatsAppLink = (order) => {
    let cleanPhone = (order.phone || '').replace(/\D/g, '');
    if (cleanPhone.startsWith('01')) {
      cleanPhone = '20' + cleanPhone.substring(1);
    }
    const message = encodeURIComponent(
      `أهلاً بحضرتك يا أستاذ ${order.name}! 👋\nمعاك فريق Proviea لمعارض مستلزمات المدارس والمكتبات.\n\nاستلمنا قائمة المدرسة الخاصة بك برقم طلب: ${order.id} مع تطبيق خصم الـ ${order.discountPct}% الخاص بـ (${order.companyName}).\n\nقمنا بمراجعة القائمة وتجهيز الأسعار، هل تحب نؤكد معك التفاصيل الآن؟`
    );
    return `https://wa.me/${cleanPhone}?text=${message}`;
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (orders.length === 0) return;
    const headers = ['Order ID', 'Name', 'Phone', 'Email', 'Company', 'Discount', 'Status', 'Stage', 'Budget', 'Address', 'Images Count', 'Created At'];
    const rows = orders.map(o => [
      o.id,
      `"${o.name}"`,
      `"${o.phone}"`,
      `"${o.email || ''}"`,
      `"${o.companyName}"`,
      `${o.discountPct}%`,
      `"${o.statusLabel}"`,
      `"${o.schoolStage}"`,
      `"${o.budgetTierLabel}"`,
      `"${o.city} - ${o.address}"`,
      o.images?.length || 0,
      o.createdAt
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Proviea_Exhibition_Orders_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Copy all customer emails for Marketing campaigns
  const handleCopyAllEmails = () => {
    const emails = Array.from(
      new Set(orders.map(o => o.email).filter(e => e && e.includes('@')))
    );
    if (emails.length === 0) {
      alert('لا توجد إيميلات مسجلة بعد');
      return;
    }
    const emailList = emails.join(', ');
    navigator.clipboard?.writeText(emailList);
    alert(`تم نسخ ${emails.length} إيميل للحافظة بنجاح لحملات التسويق والإعلانات! 🎉`);
  };

  // If user is NOT admin, silently redirect to Home with ZERO admin forms
  if (!user?.isAdmin && user?.role !== 'admin') {
    if (onBackToHome) {
      setTimeout(() => onBackToHome(), 0);
    }
    return null;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20">
      {/* Top Banner */}
      <div className="bg-navy rounded-3xl p-6 text-white shadow-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-yellow text-navy flex items-center justify-center font-bold shadow">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-white">لوحة تحكم معارض Proviea</h1>
              <span className="bg-yellow text-navy text-[10px] font-black px-2 py-0.5 rounded-full">
                Exhibition CRM
              </span>
            </div>
            <p className="text-xs text-offwhite/80 mt-0.5">
              متابعة العملاء والـ Leads وقوائم المدارس وتوليد الـ QR للشركات
            </p>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2 w-full sm:w-auto">
          <button
            onClick={fetchDashboardData}
            className="flex-1 sm:flex-initial bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>تحديث</span>
          </button>

          <button
            onClick={handleCopyAllEmails}
            className="flex-1 sm:flex-initial bg-white/15 hover:bg-white/25 text-yellow text-xs font-extrabold px-3 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 border border-yellow/30"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>نسخ إيميلات العملاء</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex-1 sm:flex-initial bg-yellow hover:bg-yellow-dark text-navy text-xs font-extrabold px-3.5 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow"
          >
            <Download className="w-3.5 h-3.5" />
            <span>تصدير Excel</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-navy/10 shadow-sm flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-navy text-yellow flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-navy/60 font-semibold">إجمالي العملاء (Leads)</p>
            <p className="text-xl font-black text-navy">{stats?.totalLeads || 0}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-navy/10 shadow-sm flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-yellow text-navy flex items-center justify-center font-bold">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-navy/60 font-semibold">قوائم المدارس المستلمة</p>
            <p className="text-xl font-black text-navy">{stats?.totalOrders || 0}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-navy/10 shadow-sm flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-navy-soft text-navy flex items-center justify-center font-bold">
            <ImageIcon className="w-5 h-5 text-navy" />
          </div>
          <div>
            <p className="text-[11px] text-navy/60 font-semibold">الصور المرفوعة</p>
            <p className="text-xl font-black text-navy">{stats?.totalImagesUploaded || 0}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-navy/10 shadow-sm flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-navy/60 font-semibold">الشركات والجهات الشريكة</p>
            <p className="text-xl font-black text-navy">
              {stats?.companyCounts ? Object.keys(stats.companyCounts).length : 0}
            </p>
          </div>
        </div>
      </div>

      {/* Exhibition QR Code Generator Tool */}
      <div className="bg-white rounded-3xl p-6 border border-navy/10 shadow-card space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-navy text-yellow flex items-center justify-center font-bold text-xs">
            <QrCode className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-navy">
              مولّد كود الـ QR الخاص بالمعارض والشركات
            </h2>
            <p className="text-[11px] text-navy/60">
              أنشئ واطبع QR Code مخصص لأي شركة أو جناح بالمعرض
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center bg-offwhite p-4 rounded-2xl">
          {/* Settings */}
          <div className="md:col-span-2 space-y-3">
            <div>
              <label className="block text-xs font-bold text-navy mb-1">
                اختر أو اكتب اسم الشركة / المعرض:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {[
                  { name: 'كود عام Proviea', code: 'PROVIEA15' },
                  { name: 'خصم الشركات', code: 'CORP15' },
                  { name: 'خصم الموظفين', code: 'STAFF15' },
                  { name: 'عرض الشركاء', code: 'PARTNER15' },
                  { name: 'كود VIP', code: 'VIP15' },
                  { name: 'معرض العودة للمدارس', code: 'BACK2SCHOOL' },
                ].map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => {
                      setQrCompanyCode(c.code);
                      setQrCompanyName(c.name);
                    }}
                    className={`p-2 rounded-xl text-xs font-bold border transition-all text-center ${
                      qrCompanyCode === c.code
                        ? 'bg-navy text-yellow border-navy shadow-sm'
                        : 'bg-white text-navy border-navy/10 hover:border-navy/30'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="block text-[11px] font-bold text-navy mb-1">
                  كود الخصم (Promo Code):
                </label>
                <input
                  type="text"
                  value={qrCompanyCode}
                  onChange={(e) => setQrCompanyCode(e.target.value.toUpperCase())}
                  className="w-full bg-white border border-navy/15 rounded-xl px-3 py-2 text-xs font-bold text-navy uppercase"
                />
              </div>
              <div className="w-28">
                <label className="block text-[11px] font-bold text-navy mb-1">
                  نسبة الخصم:
                </label>
                <select
                  value={qrDiscount}
                  onChange={(e) => setQrDiscount(Number(e.target.value))}
                  className="w-full bg-white border border-navy/15 rounded-xl px-3 py-2 text-xs font-bold text-navy"
                >
                  <option value={10}>10%</option>
                  <option value={15}>15%</option>
                  <option value={20}>20%</option>
                </select>
              </div>
            </div>

            <p className="text-[11px] text-navy/50 font-mono break-all">
              الرابط المرتبط بالـ QR: {customQrUrl}
            </p>
          </div>

          {/* QR Display & Print */}
          <div className="flex flex-col items-center justify-center p-3 bg-white rounded-2xl border border-navy/10 shadow-sm text-center">
            <div className="p-2 bg-white rounded-xl shadow-sm border border-navy/10">
              <QRCodeSVG
                value={customQrUrl || window.location.href}
                size={140}
                level="H"
                includeMargin={true}
              />
            </div>
            <p className="text-xs font-bold text-navy mt-2">{qrCompanyName}</p>
            <span className="text-[10px] bg-yellow text-navy font-bold px-2 py-0.5 rounded-full mt-1">
              خصم {qrDiscount}%
            </span>
          </div>
        </div>
      </div>

      {/* Orders List & Management Section */}
      <div className="bg-white rounded-3xl p-6 border border-navy/10 shadow-card space-y-4">
        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-navy/40 absolute right-3 top-3" />
            <input
              type="text"
              placeholder="ابحث بالاسم، رقم الموبايل، كود الطلب..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-offwhite border border-navy/15 rounded-xl pr-9 pl-3 py-2 text-xs text-navy placeholder:text-navy/40 focus:outline-none focus:border-navy focus:bg-white"
            />
          </div>

          <div className="flex gap-2">
            {/* Status Filter */}
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="bg-offwhite border border-navy/15 rounded-xl px-3 py-2 text-xs font-bold text-navy"
            >
              <option value="ALL">جميع الحالات</option>
              <option value="new">جديد (استلام القائمة)</option>
              <option value="reviewing">قيد المراجعة والأسعار</option>
              <option value="contacted">تم التواصل بالواتساب</option>
              <option value="preparing">جاري التجهيز</option>
              <option value="completed">مكتمل ومسلّم</option>
            </select>
          </div>
        </div>

        {/* Orders Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-navy text-white rounded-xl">
                <th className="p-3 rounded-r-xl">رقم الطلب</th>
                <th className="p-3">العميل والموبايل</th>
                <th className="p-3">الشركة والخصم</th>
                <th className="p-3">الصور / الملفات</th>
                <th className="p-3">الميزانية</th>
                <th className="p-3">الحالة</th>
                <th className="p-3 rounded-l-xl text-center">الإجراءات السريعة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy/10">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-navy/50">
                    لا توجد طلبات تطابق معايير البحث
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-offwhite/80 transition-colors">
                    <td className="p-3 font-mono font-bold text-navy">
                      {ord.id}
                    </td>
                    <td className="p-3">
                      <p className="font-bold text-navy">{ord.name}</p>
                      <p className="text-[11px] text-navy/60 font-mono" dir="ltr">
                        {ord.phone}
                      </p>
                    </td>
                    <td className="p-3">
                      <span className="font-bold text-navy">{ord.companyName}</span>
                      <span className="inline-block mr-1 text-[10px] bg-yellow text-navy font-bold px-1.5 py-0.2 rounded">
                        %{ord.discountPct}
                      </span>
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => setViewOrderModal(ord)}
                        className="flex items-center gap-1 text-navy hover:text-yellow-dark font-bold underline"
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>{ord.images?.length || 0} صور</span>
                      </button>
                    </td>
                    <td className="p-3">
                      <span className="text-[11px] text-navy/80">{ord.budgetTierLabel}</span>
                    </td>
                    <td className="p-3">
                      <select
                        value={ord.status}
                        onChange={(e) => handleUpdateStatus(ord.id, e.target.value)}
                        className="bg-white border border-navy/20 rounded-lg px-2 py-1 text-[11px] font-bold text-navy"
                      >
                        <option value="new">تم الاستلام</option>
                        <option value="reviewing">قيد المراجعة</option>
                        <option value="contacted">تم التواصل</option>
                        <option value="preparing">جاري التجهيز</option>
                        <option value="completed">مكتمل</option>
                      </select>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Direct WhatsApp Contact Button */}
                        <a
                          href={getCustomerWhatsAppLink(ord)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded-xl transition-all shadow-sm flex items-center gap-1 text-[11px] font-bold"
                          title="تواصل عبر الواتساب برسالة جاهزة"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>واتساب</span>
                        </a>

                        {/* View Modal */}
                        <button
                          onClick={() => setViewOrderModal(ord)}
                          className="bg-navy hover:bg-navy-light text-yellow p-2 rounded-xl transition-all"
                          title="معاينة الصور والتفاصيل"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Order Modal */}
      {viewOrderModal && (
        <div className="fixed inset-0 z-50 bg-navy/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-5 border border-navy/10 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-navy/10 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-yellow text-navy flex items-center justify-center font-bold">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-navy">
                    تفاصيل طلب قائمة المدرسة: <span className="font-mono text-yellow-dark">{viewOrderModal.id}</span>
                  </h3>
                  <p className="text-xs text-navy/60">
                    العميل: {viewOrderModal.name} ({viewOrderModal.phone})
                  </p>
                </div>
              </div>

              <button
                onClick={() => setViewOrderModal(null)}
                className="p-1.5 rounded-full hover:bg-navy/10 text-navy/70"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Info Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 bg-offwhite p-4 rounded-2xl text-xs">
              <div>
                <p className="text-navy/50">الشركة والخصم:</p>
                <p className="font-bold text-navy">{viewOrderModal.companyName} ({viewOrderModal.discountPct}%)</p>
              </div>
              <div>
                <p className="text-navy/50">الطالب والمرحلة:</p>
                <p className="font-bold text-navy">{viewOrderModal.childGender} - {viewOrderModal.schoolStage}</p>
              </div>
              <div>
                <p className="text-navy/50">الميزانية:</p>
                <p className="font-bold text-navy">{viewOrderModal.budgetTierLabel}</p>
              </div>
              <div className="col-span-2">
                <p className="text-navy/50">طريقة الاستلام والعنوان:</p>
                <p className="font-bold text-navy">{viewOrderModal.deliveryType} ({viewOrderModal.city} - {viewOrderModal.address})</p>
              </div>
              {viewOrderModal.extraNotes && (
                <div className="col-span-full">
                  <p className="text-navy/50">ملاحظات العميل:</p>
                  <p className="text-navy text-[11px]">{viewOrderModal.extraNotes}</p>
                </div>
              )}
            </div>

            {/* Uploaded Images & Notes */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-navy">
                صور القائمة المرفوعة وملاحظاتها ({viewOrderModal.images?.length || 0}):
              </h4>

              {(!viewOrderModal.images || viewOrderModal.images.length === 0) ? (
                <p className="text-xs text-navy/50 italic">لا توجد صور مرفوعة لهذا الطلب.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {viewOrderModal.images.map((img, idx) => (
                    <div
                      key={idx}
                      className="bg-offwhite rounded-2xl p-3 border border-navy/10 space-y-2"
                    >
                      <div
                        onClick={() => setActiveImageZoom(img.path)}
                        className="relative aspect-video rounded-xl overflow-hidden bg-navy/10 cursor-pointer group"
                      >
                        <img
                          src={img.path}
                          alt={`Order List ${idx}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-navy/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                          <Eye className="w-4 h-4" />
                          <span>تكبير الصورة</span>
                        </div>
                      </div>
                      <div className="text-[11px]">
                        <p className="font-bold text-navy">صورة رقم #{idx + 1}</p>
                        <p className="text-navy/70 bg-white p-2 rounded-lg border border-navy/10 mt-1">
                          {img.note ? `📝 ملاحظة: ${img.note}` : 'بدون ملاحظة خاصة'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex gap-2 pt-2 border-t border-navy/10">
              <a
                href={getCustomerWhatsAppLink(viewOrderModal)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-xs transition-all"
              >
                <MessageSquare className="w-4 h-4" />
                <span>مراسلة العميل على WhatsApp</span>
              </a>

              <button
                onClick={() => setViewOrderModal(null)}
                className="bg-offwhite hover:bg-navy-soft text-navy font-bold py-3 px-4 rounded-xl text-xs"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Image Zoom Modal */}
      {activeImageZoom && (
        <div
          onClick={() => setActiveImageZoom(null)}
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={activeImageZoom}
              alt="Zoomed School List"
              className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl"
            />
            <button
              onClick={() => setActiveImageZoom(null)}
              className="absolute top-4 right-4 bg-white/20 text-white p-2 rounded-full backdrop-blur-md"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
