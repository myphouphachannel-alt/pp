/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Search,
  PlusCircle,
  Receipt,
  Calendar,
  Filter,
  DollarSign,
  User,
  ArrowUpDown,
  Utensils,
  Edit3,
} from 'lucide-react';
import { useGroup } from '../context/GroupContext';
import { useAuth } from '../context/AuthContext';
import { formatLAK } from '../utils/currency';
import { Expense } from '../types';

interface ExpensesViewProps {
  onOpenAddExpense: () => void;
  onSelectExpense: (expense: Expense) => void;
  onEditExpense?: (expense: Expense) => void;
}

export const ExpensesView: React.FC<ExpensesViewProps> = ({
  onOpenAddExpense,
  onSelectExpense,
  onEditExpense,
}) => {
  const { expenses, activeGroup, members } = useGroup();
  const { currentUser } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterMemberId, setFilterMemberId] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'highest' | 'lowest'>('newest');

  // Filter and sort expenses
  const filteredExpenses = useMemo(() => {
    let result = [...expenses];

    // Search query
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (exp) =>
          exp.title.toLowerCase().includes(q) ||
          exp.restaurantName.toLowerCase().includes(q) ||
          exp.payerName.toLowerCase().includes(q)
      );
    }

    // Filter by member involved
    if (filterMemberId !== 'all') {
      result = result.filter(
        (exp) =>
          exp.payerId === filterMemberId ||
          (exp.memberShares && exp.memberShares[filterMemberId] !== undefined)
      );
    }

    // Sort
    if (sortBy === 'newest') {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === 'highest') {
      result.sort((a, b) => b.totalAmount - a.totalAmount);
    } else if (sortBy === 'lowest') {
      result.sort((a, b) => a.totalAmount - b.totalAmount);
    }

    return result;
  }, [expenses, searchTerm, filterMemberId, sortBy]);

  const totalExpenseSum = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + e.totalAmount, 0);
  }, [filteredExpenses]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Receipt className="w-6 h-6 text-emerald-600" />
            ປະຫວັດລາຍຈ່າຍ
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            ບິນອາຫານທັງໝົດໃນກຸ່ມ {activeGroup?.name} • ລວມ {formatLAK(totalExpenseSum)}
          </p>
        </div>

        <button
          onClick={onOpenAddExpense}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
        >
          <PlusCircle className="w-4 h-4" />
          ເພີ່ມລາຍຈ່າຍໃໝ່
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ຄົ້ນຫາຊື່ລາຍຈ່າຍ, ຮ້ານອາຫານ, ຫຼື ຜູ້ຈ່າຍ..."
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
          />
        </div>

        {/* Filter by Member */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-600">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>ສະມາຊິກ:</span>
            <select
              value={filterMemberId}
              onChange={(e) => setFilterMemberId(e.target.value)}
              className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="all">ທຸກຄົນ</option>
              {members.map((m) => (
                <option key={m.userId} value={m.userId}>
                  {m.displayName}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-600">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <span>ຮຽງຕາມ:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="newest">ໃໝ່ສຸດ</option>
              <option value="highest">ຍອດຫຼາຍສຸດ</option>
              <option value="lowest">ຍອດໜ້ອຍສຸດ</option>
            </select>
          </div>
        </div>
      </div>

      {/* Expenses Table / Cards */}
      {filteredExpenses.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
          <Utensils className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 mb-1">ບໍ່ພົບລາຍຈ່າຍ</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
            {searchTerm || filterMemberId !== 'all'
              ? 'ບໍ່ມີລາຍຈ່າຍທີ່ກົງກັບເງື່ອນໄຂການຄົ້ນຫາ'
              : 'ເລີ່ມຕົ້ນບັນທຶກຄ່າອາຫານທຳອິດເພື່ອແບ່ງເງິນນຳກັນ'}
          </p>
          <button
            onClick={onOpenAddExpense}
            className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors"
          >
            + ເພີ່ມລາຍຈ່າຍໃໝ່
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredExpenses.map((exp) => {
            const isPayer = exp.payerId === currentUser?.uid;
            const myShare = exp.memberShares?.[currentUser?.uid || ''] || 0;
            const eaterCount = Object.keys(exp.memberShares || {}).length;

            return (
              <div
                key={exp.id}
                onClick={() => onSelectExpense(exp)}
                className="bg-white rounded-2xl border border-slate-200/90 p-4.5 hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center gap-1">
                      <Utensils className="w-3 h-3" />
                      {exp.restaurantName}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(exp.date).toLocaleDateString('lo-LA')}
                      </span>
                      {onEditExpense && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditExpense(exp);
                          }}
                          className="p-1 rounded-md text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                          title="ແກ້ໄຂລາຍຈ່າຍ"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-1 mb-1">
                    {exp.title}
                  </h3>

                  <p className="text-xs text-slate-500 mb-3">
                    ຜູ້ຈ່າຍ: <strong className="text-slate-800">{exp.payerName}</strong> {isPayer && '(ຂ້ອຍ)'}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">
                      ຫານ {eaterCount} ຄົນ
                    </span>
                    {currentUser && myShare > 0 && (
                      <span className="font-semibold text-emerald-700 text-xs">
                        ສ່ວນຂອງຂ້ອຍ: {formatLAK(myShare)}
                      </span>
                    )}
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">ຍອດລວມ</span>
                    <span className="text-sm font-extrabold text-slate-900">
                      {formatLAK(exp.totalAmount)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
