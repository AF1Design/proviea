import React from 'react';
import { Home, ClipboardList, Backpack, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function BottomNav({ currentScreen, onNavigate }) {
  const { user } = useAuth();

  const navItems = [
    {
      id: 'home',
      label: 'الرئيسية',
      icon: Home,
      badge: null
    },
    {
      id: 'orders',
      label: 'طلباتي',
      icon: ClipboardList,
      badge: null
    },
    {
      id: 'bags',
      label: 'شنط مدرسية',
      icon: Backpack,
      badge: 'قريباً'
    },
    {
      id: 'account',
      label: 'حسابي',
      icon: User,
      badge: null
    }
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-lg border-t border-navy/10 shadow-[0_-4px_20px_rgba(18,48,74,0.06)] select-none">
      <div className="max-w-md mx-auto px-3 py-2 flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = currentScreen === item.id || (item.id === 'home' && currentScreen === 'form');
          const IconComponent = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-200 ${
                isActive
                  ? 'text-navy font-bold scale-105'
                  : 'text-navy/50 hover:text-navy/80 hover:bg-navy-soft/50 font-medium'
              }`}
            >
              {/* Badge for Coming Soon */}
              {item.badge && (
                <span className="absolute -top-1.5 right-1 bg-yellow text-navy font-black text-[9px] px-1.5 py-0.2 rounded-full shadow-sm animate-pulse">
                  {item.badge}
                </span>
              )}

              {/* Icon Container */}
              <div
                className={`p-1.5 rounded-xl transition-all ${
                  isActive
                    ? 'bg-navy text-yellow shadow-sm'
                    : 'bg-transparent text-current'
                }`}
              >
                <IconComponent className="w-5 h-5" />
              </div>

              {/* Label */}
              <span className={`text-[11px] mt-1 ${isActive ? 'text-navy font-extrabold' : ''}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
