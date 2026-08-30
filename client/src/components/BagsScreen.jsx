import React from 'react';
import { ArrowRight, Backpack, Clock } from 'lucide-react';

export default function BagsScreen({ onBack }) {
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
          🎒 شنط مدرسية
        </span>
      </div>

      {/* Minimalist Coming Soon Card */}
      <div className="bg-white rounded-3xl p-10 border border-navy/10 shadow-card text-center space-y-5">
        <div className="w-20 h-20 bg-yellow-soft border border-yellow/40 rounded-3xl flex items-center justify-center mx-auto text-yellow-dark shadow-sm">
          <Backpack className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 bg-navy text-yellow px-3.5 py-1 rounded-full text-xs font-bold shadow-sm">
            <Clock className="w-3.5 h-3.5" />
            <span>قريباً • Coming Soon</span>
          </div>

          <h1 className="text-2xl font-black text-navy pt-2">
            تشكيلة الشنط المدرسية
          </h1>

          <p className="text-xs sm:text-sm text-navy/65 max-w-xs mx-auto leading-relaxed">
            قسم الشنط المدرسية وأحدث الموديلات قيد التجهيز وسيتاح قريباً.
          </p>
        </div>
      </div>
    </div>
  );
}
