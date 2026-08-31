import React from 'react';
import { User, LogOut, ClipboardList, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ onNavigate, currentScreen }) {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-navy/10 shadow-sm">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Brand Logo - Clear and natural size */}
        <div 
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2.5 cursor-pointer select-none group"
        >
          <img 
            src="/logo.png" 
            alt="Proviea Logo" 
            className="h-11 sm:h-12 w-auto object-contain transition-transform group-hover:scale-105" 
          />
        </div>

        {/* Navigation & User Menu */}
        <div className="flex items-center gap-2">
          {user ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigate('orders')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  currentScreen === 'orders' 
                    ? 'bg-navy text-yellow' 
                    : 'bg-navy-soft text-navy hover:bg-navy/15'
                }`}
                title="طلباتي السابقة"
              >
                <ClipboardList className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">طلباتي</span>
              </button>

              <button
                onClick={() => onNavigate('account')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  currentScreen === 'account'
                    ? 'bg-navy text-yellow'
                    : 'bg-yellow-soft border border-yellow/40 text-navy hover:bg-yellow/30'
                }`}
                title="الملف الشخصي وحسابي"
              >
                <User className="w-3.5 h-3.5 text-yellow-dark" />
                <span className="max-w-[100px] truncate">{user.name || user.phone}</span>
              </button>

              <button
                onClick={logout}
                className="p-1.5 rounded-full text-navy/60 hover:text-red-600 hover:bg-red-50 transition-colors"
                title="تسجيل الخروج"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => onNavigate('auth')}
              className="flex items-center gap-1.5 bg-navy text-yellow hover:bg-navy-light px-4 py-2 rounded-full text-xs font-bold shadow-sm transition-all"
            >
              <User className="w-3.5 h-3.5" />
              <span>تسجيل الدخول</span>
            </button>
          )}

          {/* Admin link - ONLY visible for Admin accounts */}
          {(user?.isAdmin || user?.role === 'admin') && (
            <button
              onClick={() => onNavigate('admin')}
              className={`p-2 rounded-full transition-colors ${
                currentScreen === 'admin' 
                  ? 'bg-navy text-yellow shadow' 
                  : 'bg-yellow text-navy hover:bg-yellow-dark shadow-sm'
              }`}
              title="لوحة تحكم المعرض (الإدارة)"
            >
              <ShieldCheck className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
