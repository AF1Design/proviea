import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  FileText, 
  Percent, 
  Sparkles, 
  ArrowLeft, 
  CheckCircle2, 
  Clock, 
  Package, 
  Truck, 
  Building2, 
  ShieldCheck,
  ChevronLeft
} from 'lucide-react';

import { fetchUserOrders } from '../supabase';

export default function HomeScreen({ onStartSchoolList, onViewOrders }) {
  const { user } = useAuth();
  const [recentOrders, setRecentOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  useEffect(() => {
    if (user?.phone) {
      setLoadingOrders(true);
      fetchUserOrders(user.phone)
        .then((data) => {
          if (Array.isArray(data)) setRecentOrders(data);
        })
        .catch((err) => console.error(err))
        .finally(() => setLoadingOrders(false));
    }
  }, [user]);

  return (
    <div className="space-y-6 max-w-xl mx-auto pb-12">
      {/* Top Welcome Banner */}
      <div className="relative bg-gradient-to-br from-navy via-navy-light to-navy rounded-3xl p-6 text-white shadow-card overflow-hidden">
        {/* Decorative ambient elements */}
        <div className="absolute -top-12 -left-12 w-40 h-40 bg-yellow/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -right-10 w-36 h-36 bg-yellow/15 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-yellow">
            <Sparkles className="w-3.5 h-3.5 text-yellow" />
            <span>معرض الأدوات المدرسية والمكتبية</span>
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              أهلاً بك في <span className="text-yellow">Proviea</span>
            </h1>
            <p className="text-sm text-offwhite/85">
              {user?.name ? `سعداء بوجودك معنا يا ${user.name}` : 'شريكك الأول لتجهيز كافة مستلزمات المدارس والمكتبات'}
            </p>
          </div>

          {/* Corporate Discount Badge - Updated Text */}
          <div className="bg-white/10 border border-yellow/30 rounded-2xl p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-yellow text-navy flex items-center justify-center font-black text-sm shrink-0 shadow-sm">
                %15
              </div>
              <div className="text-right">
                <p className="text-xs sm:text-sm font-bold text-white">خصم خاص لفترة محدودة</p>
                <p className="text-[11px] text-yellow/90 font-medium">ادخل كود شركتك للاستفادة من الخصم</p>
              </div>
            </div>
            <span className="text-[11px] bg-yellow/20 text-yellow px-2.5 py-1 rounded-full font-bold">
              معتمد
            </span>
          </div>
        </div>
      </div>

      {/* Main Action Button (تجهيز قائمة المدرسة) */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-yellow to-yellow-dark rounded-3xl blur opacity-75 group-hover:opacity-100 transition duration-300 animate-pulse-subtle" />
        <button
          onClick={onStartSchoolList}
          className="relative w-full bg-yellow hover:bg-yellow-dark active:scale-[0.99] text-navy rounded-2xl p-5 shadow-glow transition-all flex items-center justify-between group text-right"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-navy text-yellow flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform">
              <FileText className="w-7 h-7" />
            </div>
            <div>
              <span className="inline-block bg-navy/10 text-navy font-black text-[11px] px-2.5 py-0.5 rounded-full mb-1">
                الخدمة الأكثر طلباً 📝
              </span>
              <h2 className="text-xl font-extrabold text-navy leading-tight">
                تجهيز قائمة المدرسة (School List)
              </h2>
              <p className="text-xs text-navy/80 mt-0.5">
                ارفع صور أو ملفات طلبات المدرسة وسنقوم بتجهيزها وتوصيلها فوراً
              </p>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-navy/10 flex items-center justify-center text-navy shrink-0 group-hover:-translate-x-1 transition-transform">
            <ArrowLeft className="w-5 h-5" />
          </div>
        </button>
      </div>

      {/* How It Works Steps */}
      <div className="bg-white rounded-3xl p-5 border border-navy/10 shadow-card space-y-4">
        <h3 className="text-sm font-bold text-navy flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-yellow-dark" />
          <span>كيف تعمل الخدمة في 3 خطوات؟</span>
        </h3>

        <div className="grid grid-cols-3 gap-2.5 text-center">
          <div className="bg-offwhite p-3 rounded-2xl flex flex-col items-center space-y-1.5">
            <div className="w-8 h-8 rounded-xl bg-navy text-yellow flex items-center justify-center font-bold text-xs">
              1
            </div>
            <p className="text-xs font-bold text-navy">ارفع القائمة</p>
            <p className="text-[10px] text-navy/60 leading-tight">صور أو ملفات الطلبات</p>
          </div>

          <div className="bg-offwhite p-3 rounded-2xl flex flex-col items-center space-y-1.5">
            <div className="w-8 h-8 rounded-xl bg-yellow text-navy flex items-center justify-center font-bold text-xs">
              2
            </div>
            <p className="text-xs font-bold text-navy">مراجعة وخصم</p>
            <p className="text-[10px] text-navy/60 leading-tight">تأكيد الأسعار وخصم 15%</p>
          </div>

          <div className="bg-offwhite p-3 rounded-2xl flex flex-col items-center space-y-1.5">
            <div className="w-8 h-8 rounded-xl bg-navy text-yellow flex items-center justify-center font-bold text-xs">
              3
            </div>
            <p className="text-xs font-bold text-navy">توصيل لبابك</p>
            <p className="text-[10px] text-navy/60 leading-tight">للمنزل أو مقر العمل</p>
          </div>
        </div>
      </div>

      {/* Recent Orders Section (if user has any) */}
      {recentOrders.length > 0 && (
        <div className="bg-white rounded-3xl p-5 border border-navy/10 shadow-card space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-navy flex items-center gap-2">
              <Package className="w-4 h-4 text-yellow-dark" />
              <span>طلباتك السابقة ({recentOrders.length})</span>
            </h3>
            <button
              onClick={onViewOrders}
              className="text-xs text-yellow-dark hover:underline font-bold flex items-center gap-1"
            >
              <span>عرض الكل</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2">
            {recentOrders.slice(0, 2).map((ord) => (
              <div
                key={ord.id}
                onClick={onViewOrders}
                className="p-3 bg-offwhite hover:bg-yellow-soft/50 border border-navy/10 rounded-2xl cursor-pointer transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-navy text-yellow flex items-center justify-center font-mono font-bold text-xs">
                    #
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-navy">{ord.id}</p>
                    <p className="text-[11px] text-navy/60">
                      {ord.images?.length || 0} صور • {ord.budgetTierLabel}
                    </p>
                  </div>
                </div>

                <div className="text-left">
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-navy text-white">
                    {ord.statusLabel || 'قيد المراجعة'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trust Bar */}
      <div className="text-center pt-2">
        <p className="text-[11px] text-navy/50 font-medium mb-2">
          خدمة مخصصة لمعارض وموظفي كبرى الشركات والمؤسسات
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-bold text-navy/70">
          <span className="bg-white border border-navy/10 px-3 py-1 rounded-full">🏢 الشركات والمؤسسات</span>
          <span className="bg-white border border-navy/10 px-3 py-1 rounded-full">🎓 المدارس والجامعات</span>
          <span className="bg-white border border-navy/10 px-3 py-1 rounded-full">🏷️ كود خصم موظفين 15%</span>
          <span className="bg-white border border-navy/10 px-3 py-1 rounded-full">🚚 توصيل سريع</span>
        </div>
      </div>
    </div>
  );
}
