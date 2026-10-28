/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { LayoutDashboard, Receipt, PlusCircle, ArrowLeftRight, User } from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  onNavigateTab: (tab: 'dashboard' | 'expenses' | 'settlements' | 'groups' | 'profile') => void;
  onOpenAddExpense: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onNavigateTab,
  onOpenAddExpense,
}) => {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1 safe-area-pb">
      <div className="grid grid-cols-5 items-center justify-items-center">
        {/* Dashboard */}
        <button
          onClick={() => onNavigateTab('dashboard')}
          className={`flex flex-col items-center py-1.5 px-2 rounded-xl transition-colors ${
            activeTab === 'dashboard' ? 'text-emerald-600 font-semibold' : 'text-slate-500'
          }`}
        >
          <LayoutDashboard className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">ໜ້າຫຼັກ</span>
        </button>

        {/* Expenses */}
        <button
          onClick={() => onNavigateTab('expenses')}
          className={`flex flex-col items-center py-1.5 px-2 rounded-xl transition-colors ${
            activeTab === 'expenses' ? 'text-emerald-600 font-semibold' : 'text-slate-500'
          }`}
        >
          <Receipt className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">ລາຍຈ່າຍ</span>
        </button>

        {/* Prominent Add Button */}
        <button
          onClick={onOpenAddExpense}
          className="flex flex-col items-center -mt-4 group"
        >
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 group-active:scale-95 transition-transform">
            <PlusCircle className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-semibold text-emerald-700 mt-0.5">ເພີ່ມບິນ</span>
        </button>

        {/* Settlements */}
        <button
          onClick={() => onNavigateTab('settlements')}
          className={`flex flex-col items-center py-1.5 px-2 rounded-xl transition-colors ${
            activeTab === 'settlements' ? 'text-emerald-600 font-semibold' : 'text-slate-500'
          }`}
        >
          <ArrowLeftRight className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">ຊຳລະເງິນ</span>
        </button>

        {/* Profile */}
        <button
          onClick={() => onNavigateTab('profile')}
          className={`flex flex-col items-center py-1.5 px-2 rounded-xl transition-colors ${
            activeTab === 'profile' ? 'text-emerald-600 font-semibold' : 'text-slate-500'
          }`}
        >
          <User className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">ໂປຣໄຟລ໌</span>
        </button>
      </div>
    </div>
  );
};
