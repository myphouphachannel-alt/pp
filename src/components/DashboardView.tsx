/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Users,
  PlusCircle,
  Receipt,
  ArrowRight,
  Sparkles,
  TrendingUp,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Share2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useGroup } from '../context/GroupContext';
import { formatLAK } from '../utils/currency';
import { Expense } from '../types';

interface DashboardViewProps {
  onOpenAddExpense: () => void;
  onOpenInvite: () => void;
  onNavigateTab: (tab: 'dashboard' | 'expenses' | 'settlements' | 'groups' | 'profile') => void;
  onSelectExpense: (expense: Expense) => void;
  onPayDebt: (debt: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenAddExpense,
  onOpenInvite,
  onNavigateTab,
  onSelectExpense,
  onPayDebt,
}) => {
  const { currentUser, userProfile } = useAuth();
  const {
    activeGroup,
    groups,
    members,
    expenses,
    balances,
    debts,
    loadingData,
  } = useGroup();

  // Calculate stats for current user
  const myStats = useMemo(() => {
    if (!currentUser) {
      return { totalGroupExpense: 0, myPaid: 0, myShare: 0, owedToMe: 0, iOwe: 0, netBalance: 0 };
    }

    const totalGroupExpense = expenses.reduce((acc, exp) => acc + exp.totalAmount, 0);
    const myBalance = balances.find((b) => b.userId === currentUser.uid);

    let owedToMe = 0;
    let iOwe = 0;

    // From simplified debts
    debts.forEach((d) => {
      if (d.toUserId === currentUser.uid && d.status !== 'paid') {
        owedToMe += d.amount;
      }
      if (d.fromUserId === currentUser.uid && d.status !== 'paid') {
        iOwe += d.amount;
      }
    });

    return {
      totalGroupExpense,
      myPaid: myBalance?.totalPaid || 0,
      myShare: myBalance?.totalShare || 0,
      owedToMe,
      iOwe,
      netBalance: myBalance?.netBalance || 0,
    };
  }, [currentUser, expenses, balances, debts]);

  // Breakdown by restaurant / title
  const topExpenses = useMemo(() => {
    const list = [...expenses];
    list.sort((a, b) => b.totalAmount - a.totalAmount);
    return list.slice(0, 4);
  }, [expenses]);

  if (!activeGroup) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Users className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">ຍັງບໍ່ມີກຸ່ມທີ່ເລືອກ</h2>
        <p className="text-sm text-slate-500 mb-6 max-w-md mx-auto">
          ເລີ່ມຕົ້ນດ້ວຍການສ້າງກຸ່ມໝູ່ໃໝ່ ຫຼື ເຂົ້າຮ່ວມກຸ່ມດ້ວຍລະຫັດເຊີນ ເພື່ອແບ່ງຄ່າອາຫານນຳກັນ
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => onNavigateTab('groups')}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors shadow-md shadow-emerald-600/20"
          >
            ສ້າງກຸ່ມ ຫຼື ເຂົ້າຮ່ວມ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Group Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-800 text-white p-6 sm:p-8 shadow-xl shadow-emerald-900/10">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-600/60 backdrop-blur-sm border border-emerald-400/20 text-emerald-100 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                {members.length} ສະມາຊິກ
              </span>
              <span className="text-xs text-emerald-200">
                ລະຫັດເຊີນ: <strong className="text-white font-mono">{activeGroup.inviteCode}</strong>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {activeGroup.name}
            </h1>
            {activeGroup.description && (
              <p className="text-emerald-100 text-sm mt-1 max-w-xl line-clamp-2">
                {activeGroup.description}
              </p>
            )}
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={onOpenAddExpense}
              className="px-4 py-2.5 rounded-xl bg-white text-emerald-900 font-semibold text-sm hover:bg-emerald-50 transition-all flex items-center gap-2 shadow-md hover:scale-[1.02] active:scale-95"
            >
              <PlusCircle className="w-4 h-4 text-emerald-600" />
              ເພີ່ມລາຍຈ່າຍ
            </button>
            <button
              onClick={onOpenInvite}
              className="px-4 py-2.5 rounded-xl bg-emerald-600/70 hover:bg-emerald-600 text-white font-medium text-sm transition-all flex items-center gap-2 border border-emerald-400/30"
            >
              <Share2 className="w-4 h-4" />
              ເຊີນໝູ່
            </button>
            <button
              onClick={() => onNavigateTab('settlements')}
              className="px-4 py-2.5 rounded-xl bg-teal-900/60 hover:bg-teal-900 text-emerald-100 font-medium text-sm transition-all flex items-center gap-2 border border-teal-400/20"
            >
              <CreditCard className="w-4 h-4" />
              ຊຳລະເງິນ
            </button>
          </div>
        </div>
      </div>

      {/* Fintech Summary Cards (5 Key Metrics) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {/* 1. Total Group Spending */}
        <div className="col-span-2 sm:col-span-1 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">ລາຍຈ່າຍລວມຂອງກຸ່ມ</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-bold text-slate-900">
            {formatLAK(myStats.totalGroupExpense)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">ຈາກ {expenses.length} ບິນອາຫານ</p>
        </div>

        {/* 2. My Paid Upfront */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">ຂ້ອຍຈ່າຍໄປແລ້ວ</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-bold text-slate-900">
            {formatLAK(myStats.myPaid)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">ຈ່າຍອອກກ່ອນ</p>
        </div>

        {/* 3. My Fair Share */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">ຂ້ອຍຄວນຈ່າຍ</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-bold text-slate-900">
            {formatLAK(myStats.myShare)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">ຍອດອາຫານທີ່ຂ້ອຍກິນ</p>
        </div>

        {/* 4. Owed to me (Friends owe me) */}
        <div className="bg-emerald-50/70 p-4 sm:p-5 rounded-2xl border border-emerald-200/80 shadow-sm transition-all">
          <div className="flex items-center justify-between text-emerald-700 mb-2">
            <span className="text-xs font-semibold">ໝູ່ຕ້ອງຈ່າຍຄືນຂ້ອຍ</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-bold text-emerald-700">
            +{formatLAK(myStats.owedToMe)}
          </div>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">ລໍຖ້າຮັບເງິນ</p>
        </div>

        {/* 5. I owe others */}
        <div className="bg-amber-50/70 p-4 sm:p-5 rounded-2xl border border-amber-200/80 shadow-sm transition-all">
          <div className="flex items-center justify-between text-amber-700 mb-2">
            <span className="text-xs font-semibold">ຂ້ອຍຍັງຄ້າງຈ່າຍ</span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-bold text-amber-800">
            {myStats.iOwe > 0 ? `-${formatLAK(myStats.iOwe)}` : '0 LAK'}
          </div>
          <p className="text-[11px] text-amber-700 font-medium mt-1">
            {myStats.iOwe > 0 ? 'ຕ້ອງໂອນຄືນໃຫ້ໝູ່' : 'ເຄຼຍໝົດແລ້ວ'}
          </p>
        </div>
      </div>

      {/* Main Grid: Who owes whom & Recent Expenses */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols): Simplified Debts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Who Owes Whom */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <span>ໃຜຕ້ອງຈ່າຍໃຫ້ໃຜ</span>
                  <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    ຄິດໄລ່ຍອດໂອນໜ້ອຍທີ່ສຸດ
                  </span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  ລະບົບຄຳນວນຈັບຄູ່ການໂອນເງິນໃຫ້ໜ້ອຍຄັ້ງທີ່ສຸດ ໂດຍບໍ່ເຮັດໃຫ້ຍອດປ່ຽນແປງ
                </p>
              </div>

              <button
                onClick={() => onNavigateTab('settlements')}
                className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1"
              >
                ເບິ່ງທັງໝົດ
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {debts.length === 0 ? (
              <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
                <p className="text-sm font-semibold text-slate-700">ບໍ່ມີຍອດໜີ້ຄ້າງຊຳລະ</p>
                <p className="text-xs text-slate-400 mt-1">
                  ທຸກຄົນເຄຼຍຄ່າອາຫານຄົບຖ້ວນ ຫຼື ຍັງບໍ່ທັນມີລາຍຈ່າຍໃໝ່
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {debts.map((debt, index) => {
                  const isMeDebtor = debt.fromUserId === currentUser?.uid;
                  const isMeCreditor = debt.toUserId === currentUser?.uid;

                  return (
                    <div
                      key={index}
                      className={`p-3.5 sm:p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isMeDebtor
                          ? 'bg-amber-50/60 border-amber-200'
                          : isMeCreditor
                          ? 'bg-emerald-50/60 border-emerald-200'
                          : 'bg-white border-slate-200/70 hover:border-slate-300'
                      }`}
                    >
                      {/* Debt Pair */}
                      <div className="flex items-center gap-3">
                        <div className="flex items-center -space-x-1.5">
                          <div className="w-8 h-8 rounded-full bg-amber-100 border-2 border-white flex items-center justify-center text-xs font-bold text-amber-800">
                            {debt.fromUserName.substring(0, 2)}
                          </div>
                          <div className="w-8 h-8 rounded-full bg-emerald-100 border-2 border-white flex items-center justify-center text-xs font-bold text-emerald-800">
                            {debt.toUserName.substring(0, 2)}
                          </div>
                        </div>

                        <div>
                          <div className="text-sm font-medium text-slate-900 flex items-center gap-1.5 flex-wrap">
                            <span className="font-semibold text-slate-800">
                              {debt.fromUserName} {isMeDebtor && '(ເຈົ້າ)'}
                            </span>
                            <span className="text-xs text-slate-400">ຕ້ອງໂອນໃຫ້</span>
                            <span className="font-semibold text-emerald-700">
                              {debt.toUserName} {isMeCreditor && '(ເຈົ້າ)'}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            {debt.status === 'awaiting_confirmation' && (
                              <span className="inline-flex items-center gap-1 text-amber-700 font-medium">
                                <AlertCircle className="w-3 h-3" />
                                ໂອນແລ້ວ • ລໍຖ້າຜູ້ຮັບຢືນຢັນ
                              </span>
                            )}
                            {debt.status === 'pending' && (
                              <span className="text-slate-500">ຍັງບໍ່ໄດ້ໂອນ</span>
                            )}
                            {debt.status === 'paid' && (
                              <span className="text-emerald-700 font-medium">ຊຳລະຮຽບຮ້ອຍ</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Amount & Action Button */}
                      <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/40">
                        <span className="text-base font-bold text-slate-900">
                          {formatLAK(debt.amount)}
                        </span>

                        {isMeDebtor && debt.status === 'pending' && (
                          <button
                            onClick={() => onPayDebt(debt)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-colors"
                          >
                            ໂອນເງິນດຽວນີ້
                          </button>
                        )}

                        {isMeCreditor && debt.status === 'awaiting_confirmation' && (
                          <button
                            onClick={() => onNavigateTab('settlements')}
                            className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-sm transition-colors"
                          >
                            ກວດສອບ & ຢືນຢັນ
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent Expenses List */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900">ລາຍຈ່າຍຫຼ້າສຸດ</h2>
                <p className="text-xs text-slate-500 mt-0.5">ບິນອາຫານທີ່ເພີ່ມໃນກຸ່ມ</p>
              </div>
              <button
                onClick={() => onNavigateTab('expenses')}
                className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1"
              >
                ເບິ່ງທັງໝົດ
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {expenses.length === 0 ? (
              <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <Receipt className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">ຍັງບໍ່ມີລາຍຈ່າຍໃນກຸ່ມນີ້</p>
                <p className="text-xs text-slate-400 mt-1 mb-4">
                  ກິນເຂົ້າຮ່ວມກັນແລ້ວບໍ? ກົດເພີ່ມບິນອາຫານເພື່ອແບ່ງເງິນ
                </p>
                <button
                  onClick={onOpenAddExpense}
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700"
                >
                  + ເພີ່ມລາຍຈ່າຍທຳອິດ
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {expenses.slice(0, 5).map((exp) => (
                  <div
                    key={exp.id}
                    onClick={() => onSelectExpense(exp)}
                    className="py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/80 -mx-2 px-2 rounded-xl cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100/70 text-emerald-800 flex items-center justify-center font-bold text-sm shrink-0">
                        🍴
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 line-clamp-1">
                          {exp.title}
                        </h3>
                        <p className="text-xs text-slate-500">
                          ຮ້ານ: <span className="font-medium text-slate-700">{exp.restaurantName}</span> •{' '}
                          ຜູ້ຈ່າຍ: <span className="font-medium text-emerald-700">{exp.payerName}</span>
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-sm font-bold text-slate-900 block">
                        {formatLAK(exp.totalAmount)}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(exp.date).toLocaleDateString('lo-LA')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (1 col): Member Balances & Spending Chart */}
        <div className="space-y-6">
          {/* Member Balance Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 mb-1">ສະຖານະຍອດເງິນສະມາຊິກ</h2>
            <p className="text-xs text-slate-500 mb-4">ຍອດທີ່ຈ່າຍຈິງ ທຽບກັບ ຍອດທີ່ຄວນຈ່າຍ</p>

            <div className="space-y-3">
              {balances.map((b) => {
                const isPositive = b.netBalance > 1;
                const isNegative = b.netBalance < -1;

                return (
                  <div
                    key={b.userId}
                    className="p-3 rounded-xl bg-slate-50 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <img
                        src={b.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${b.userId}`}
                        alt={b.userName}
                        className="w-8 h-8 rounded-full border border-slate-200 object-cover bg-white"
                      />
                      <div>
                        <p className="font-semibold text-slate-800 line-clamp-1">
                          {b.userName} {b.userId === currentUser?.uid && '(ຂ້ອຍ)'}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          ຈ່າຍ: {formatLAK(b.totalPaid)} • ກິນ: {formatLAK(b.totalShare)}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className={`font-bold block ${
                          isPositive
                            ? 'text-emerald-600'
                            : isNegative
                            ? 'text-amber-600'
                            : 'text-slate-500'
                        }`}
                      >
                        {isPositive && '+'}
                        {formatLAK(b.netBalance)}
                      </span>
                      <span className="text-[9px] text-slate-400">
                        {isPositive ? 'ຮັບເງິນຄືນ' : isNegative ? 'ຍັງຄ້າງ' : 'ພໍດີ'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Restaurant Spending Breakdown */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 mb-1">ບິນອາຫານຍອດສູງສຸດ</h2>
            <p className="text-xs text-slate-500 mb-4">ຮ້ານທີ່ກິນ ແລະ ຈຳນວນເງິນ</p>

            {topExpenses.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">ຍັງບໍ່ມີຂໍ້ມູນ</p>
            ) : (
              <div className="space-y-3">
                {topExpenses.map((exp, idx) => {
                  const maxAmount = topExpenses[0].totalAmount || 1;
                  const percentage = Math.min(100, Math.round((exp.totalAmount / maxAmount) * 100));

                  return (
                    <div key={exp.id} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium text-slate-800 truncate max-w-[160px]">
                          {exp.restaurantName} - {exp.title}
                        </span>
                        <span className="font-bold text-slate-900">
                          {formatLAK(exp.totalAmount)}
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
