/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Plus,
  Trash2,
  Upload,
  Receipt,
  Users,
  Calendar,
  Utensils,
  DollarSign,
  AlertCircle,
  Check,
  Sparkles,
  Edit3,
  UserPlus,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useGroup } from '../context/GroupContext';
import { calculateItemizedBillShares } from '../utils/debtCalculator';
import { formatLAK, parseLAK } from '../utils/currency';
import { Expense } from '../types';

interface EditExpenseModalProps {
  expense: Expense | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated?: (updatedExpense: Expense) => void;
}

interface TempLineItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  assignedMemberIds: string[];
}

export const EditExpenseModal: React.FC<EditExpenseModalProps> = ({
  expense,
  isOpen,
  onClose,
  onUpdated,
}) => {
  const { currentUser } = useAuth();
  const { members, activeGroup, updateExpense, getExpenseItems, addMemberByName } = useGroup();

  const [title, setTitle] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const [date, setDate] = useState('');
  const [payerId, setPayerId] = useState('');
  const [sharedTotalInput, setSharedTotalInput] = useState<number | ''>(0);
  const [receiptUrl, setReceiptUrl] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [items, setItems] = useState<TempLineItem[]>([]);

  // Quick add friend by name
  const [showAddFriendInput, setShowAddFriendInput] = useState(false);
  const [quickFriendName, setQuickFriendName] = useState('');
  const [isAddingFriend, setIsAddingFriend] = useState(false);

  const handleQuickAddFriend = async () => {
    if (!quickFriendName.trim()) return;
    setIsAddingFriend(true);
    try {
      const newMem = await addMemberByName(quickFriendName.trim());
      setQuickFriendName('');
      setShowAddFriendInput(false);
      setItems((prev) =>
        prev.map((item) => ({
          ...item,
          assignedMemberIds: [...item.assignedMemberIds, newMem.userId],
        }))
      );
    } catch (e: any) {
      setErrorMsg(e.message || 'ເກີດຂໍ້ຜິດພາດໃນການເພີ່ມຊື່ໝູ່');
    } finally {
      setIsAddingFriend(false);
    }
  };

  // Initialize data when expense changes
  useEffect(() => {
    if (!expense) return;

    setTitle(expense.title || '');
    setRestaurantName(expense.restaurantName || '');
    setDate(expense.date || new Date().toISOString().split('T')[0]);
    setPayerId(expense.payerId || currentUser?.uid || '');
    setSharedTotalInput(expense.sharedTotal || 0);
    setReceiptUrl(expense.receiptUrl || '');
    setNotes(expense.notes || '');
    setErrorMsg('');

    // Fetch existing line items or create fallback
    let isMounted = true;
    getExpenseItems(expense.id).then((fetchedItems) => {
      if (!isMounted) return;
      if (fetchedItems && fetchedItems.length > 0) {
        setItems(
          fetchedItems.map((i) => ({
            id: i.id,
            name: i.name,
            price: i.price,
            quantity: i.quantity || 1,
            assignedMemberIds: i.assignedMemberIds || members.map((m) => m.userId),
          }))
        );
      } else {
        // Fallback default single item with foodTotal
        setItems([
          {
            id: 'item_1',
            name: expense.title,
            price: expense.foodTotal || expense.totalAmount,
            quantity: 1,
            assignedMemberIds: Object.keys(expense.memberShares || {}).length > 0
              ? Object.keys(expense.memberShares)
              : members.map((m) => m.userId),
          },
        ]);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [expense]);

  const participantIds = useMemo(() => {
    return members.map((m) => m.userId);
  }, [members]);

  const splitResult = useMemo(() => {
    const cleanItems = items.map((i) => ({
      name: i.name,
      price: i.price,
      quantity: i.quantity || 1,
      assignedMemberIds: i.assignedMemberIds,
    }));
    return calculateItemizedBillShares(
      cleanItems,
      participantIds,
      typeof sharedTotalInput === 'number' ? sharedTotalInput : 0
    );
  }, [items, participantIds, sharedTotalInput]);

  if (!isOpen || !expense) return null;

  const handleAddItem = (presetName = '', presetPrice = 0) => {
    setItems((prev) => [
      ...prev,
      {
        id: Math.random().toString(),
        name: presetName,
        price: presetPrice,
        quantity: 1,
        assignedMemberIds: participantIds,
      },
    ]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleUpdateItem = (id: string, updates: Partial<TempLineItem>) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...updates } : i)));
  };

  const handleToggleMember = (itemId: string, memberId: string) => {
    setItems((prev) =>
      prev.map((i) => {
        if (i.id !== itemId) return i;
        const exists = i.assignedMemberIds.includes(memberId);
        let updated: string[];
        if (exists) {
          updated = i.assignedMemberIds.filter((id) => id !== memberId);
          if (updated.length === 0) updated = [memberId];
        } else {
          updated = [...i.assignedMemberIds, memberId];
        }
        return { ...i, assignedMemberIds: updated };
      })
    );
  };

  const handleToggleAllMembers = (itemId: string) => {
    setItems((prev) =>
      prev.map((i) => {
        if (i.id !== itemId) return i;
        const allAssigned = i.assignedMemberIds.length === participantIds.length;
        return {
          ...i,
          assignedMemberIds: allAssigned ? (currentUser ? [currentUser.uid] : []) : participantIds,
        };
      })
    );
  };

  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg('ຂະໜາດຮູບໃຫຍ່ເກີນໄປ (ບໍ່ເກີນ 2MB)');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setReceiptUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!title.trim()) {
      setErrorMsg('ກະລຸນາປ້ອນຊື່ລາຍຈ່າຍ');
      return;
    }

    if (splitResult.totalAmount <= 0) {
      setErrorMsg('ຍອດລວມຕ້ອງຫຼາຍກວ່າ 0 ກີບ');
      return;
    }

    const payer = members.find((m) => m.userId === payerId);
    const payerName = payer?.displayName || expense.payerName || 'ສະມາຊິກ';

    const finalMemberShares: Record<string, number> = {};
    Object.entries(splitResult.memberShares).forEach(([uid, share]) => {
      finalMemberShares[uid] = share.totalShare;
    });

    setIsSubmitting(true);
    try {
      const updatedExpenseData: Partial<Expense> = {
        title: title.trim(),
        restaurantName: restaurantName.trim() || 'ຮ້ານອາຫານທົ່ວໄປ',
        date,
        payerId,
        payerName,
        totalAmount: splitResult.totalAmount,
        foodTotal: splitResult.foodTotal,
        sharedTotal: typeof sharedTotalInput === 'number' ? sharedTotalInput : 0,
        receiptUrl: receiptUrl || '',
        notes: notes.trim(),
        memberShares: finalMemberShares,
      };

      await updateExpense(
        expense.id,
        updatedExpenseData,
        items.map((i) => ({
          name: i.name.trim() || 'ລາຍການອາຫານ',
          price: i.price,
          quantity: i.quantity || 1,
          assignedMemberIds: i.assignedMemberIds,
        }))
      );

      onUpdated?.({
        ...expense,
        ...updatedExpenseData,
      } as Expense);

      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'ເກີດຂໍ້ຜິດພາດໃນການອັບເດດ');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-emerald-50/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">ແກ້ໄຂລາຍຈ່າຍ</h2>
              <p className="text-xs text-slate-500">
                ກຸ່ມ: <span className="font-semibold text-emerald-700">{activeGroup?.name}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* General Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ຊື່ລາຍຈ່າຍ *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ຊື່ຮ້ານອາຫານ
              </label>
              <input
                type="text"
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                ວັນທີ
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                ຜູ້ຈ່າຍເງິນກ່ອນ
              </label>
              <select
                value={payerId}
                onChange={(e) => setPayerId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-white"
              >
                {members.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.displayName} {m.userId === currentUser?.uid ? '(ຂ້ອຍ)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Itemized Food Items */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Utensils className="w-4 h-4 text-emerald-600" />
                  ລາຍການອາຫານ & ຜູ້ທີ່ກິນ
                </h3>
                <p className="text-xs text-slate-500">
                  ແກ້ໄຂລາຄາ ແລະ ເລືອກໝູ່ທີ່ກິນແຕ່ລະລາຍການ
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleAddItem()}
                className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                ເພີ່ມລາຍການ
              </button>
            </div>

            {/* Quick Add Friend By Name */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-200/80">
              <span className="text-xs text-emerald-950 font-medium flex items-center gap-1.5">
                <UserPlus className="w-3.5 h-3.5 text-emerald-600" />
                ເພີ່ມໝູ່ຄົນໃໝ່ໃສ່ກຸ່ມ (ບໍ່ຕ້ອງເຊີນ)
              </span>

              {showAddFriendInput ? (
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={quickFriendName}
                    onChange={(e) => setQuickFriendName(e.target.value)}
                    placeholder="ປ້ອນຊື່ໝູ່..."
                    className="px-2.5 py-1 text-xs rounded-lg border border-emerald-300 bg-white focus:outline-none"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleQuickAddFriend}
                    disabled={isAddingFriend || !quickFriendName.trim()}
                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold disabled:opacity-50"
                  >
                    {isAddingFriend ? '...' : '+ ເພີ່ມ'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddFriendInput(false)}
                    className="p-1 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowAddFriendInput(true)}
                  className="self-start sm:self-auto px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1 shadow-2xs"
                >
                  <Plus className="w-3 h-3" />
                  <span>+ ເພີ່ມຊື່ໝູ່ໃສ່ກຸ່ມ</span>
                </button>
              )}
            </div>

            <div className="space-y-3">
              {items.map((item, index) => {
                const isAllAssigned = item.assignedMemberIds.length === participantIds.length;

                return (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-2.5"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold flex items-center justify-center shrink-0">
                        {index + 1}
                      </span>
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => handleUpdateItem(item.id, { name: e.target.value })}
                        placeholder="ຊື່ລາຍການອາຫານ"
                        className="flex-1 px-3 py-1.5 text-xs sm:text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                      <div className="relative w-28 sm:w-36">
                        <input
                          type="number"
                          value={item.price || ''}
                          onChange={(e) =>
                            handleUpdateItem(item.id, { price: parseLAK(e.target.value) })
                          }
                          placeholder="ລາຄາ (LAK)"
                          className="w-full px-2.5 py-1.5 text-xs sm:text-sm rounded-lg border border-slate-200 bg-white font-semibold text-right pr-10 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                        <span className="absolute right-2.5 top-2 text-[10px] text-slate-400 font-medium pointer-events-none">
                          LAK
                        </span>
                      </div>

                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Assigned Eaters */}
                    <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-slate-200/50">
                      <span className="text-[11px] text-slate-500 font-medium mr-1 flex items-center gap-1">
                        <Users className="w-3 h-3 text-slate-400" />
                        ໃຜກິນ:
                      </span>

                      <button
                        type="button"
                        onClick={() => handleToggleAllMembers(item.id)}
                        className={`px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors ${
                          isAllAssigned
                            ? 'bg-emerald-600 text-white'
                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        ທຸກຄົນ
                      </button>

                      {members.map((m) => {
                        const isSelected = item.assignedMemberIds.includes(m.userId);
                        return (
                          <button
                            key={m.userId}
                            type="button"
                            onClick={() => handleToggleMember(item.id, m.userId)}
                            className={`px-2 py-0.5 rounded-full text-[11px] transition-colors flex items-center gap-1 ${
                              isSelected
                                ? 'bg-emerald-100 text-emerald-800 font-semibold border border-emerald-300'
                                : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-100'
                            }`}
                          >
                            <span>{m.displayName}</span>
                            {isSelected && <Check className="w-2.5 h-2.5 text-emerald-700" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Shared Extras (ค่าน้ำ/บริการ) */}
          <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-teal-900">
                  ຄ່ານ້ຳດື່ມ / ຄ່າບໍລິການ (ຫານເທົ່າກັນ)
                </h4>
                <p className="text-[11px] text-teal-700">
                  ຍອດນີ້ຈະຫານສະເລ່ຍໃຫ້ທຸກຄົນໃນກຸ່ມ ({participantIds.length} ຄົນ)
                </p>
              </div>

              <div className="relative w-36">
                <input
                  type="number"
                  value={sharedTotalInput || ''}
                  onChange={(e) => setSharedTotalInput(parseLAK(e.target.value))}
                  placeholder="0"
                  className="w-full px-3 py-1.5 text-sm rounded-lg border border-teal-300 bg-white font-bold text-right pr-12 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
                <span className="absolute right-2.5 top-2 text-[10px] text-slate-400 font-semibold pointer-events-none">
                  LAK
                </span>
              </div>
            </div>
          </div>

          {/* Live Breakdown Preview */}
          <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                ສະຫຼຸບຍອດໃໝ່ຫຼັງແກ້ໄຂ
              </span>
              <div className="text-right">
                <span className="text-xs text-slate-400 mr-2">ຍອດລວມ:</span>
                <span className="text-base font-extrabold text-emerald-400">
                  {formatLAK(splitResult.totalAmount)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {Object.entries(splitResult.memberShares).map(([uid, share]) => {
                const member = members.find((m) => m.userId === uid);
                return (
                  <div
                    key={uid}
                    className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-between"
                  >
                    <div>
                      <span className="font-semibold text-slate-100 block">
                        {member?.displayName || 'ສະມາຊິກ'} {uid === payerId && '👑 (ຜູ້ຈ່າຍກ່ອນ)'}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        ອາຫານ: {formatLAK(share.foodShare)} + ຄ່ານ້ຳ: {formatLAK(share.sharedFeeShare)}
                      </span>
                    </div>
                    <span className="font-bold text-emerald-400 text-sm">
                      {formatLAK(share.totalShare)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Receipt and Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5 text-slate-400" />
                ປ່ຽນຮູບໃບບິນ (ຖ້າມີ)
              </label>

              {receiptUrl ? (
                <div className="relative rounded-xl border border-slate-200 overflow-hidden group">
                  <img src={receiptUrl} alt="Receipt" className="w-full h-28 object-cover" />
                  <button
                    type="button"
                    onClick={() => setReceiptUrl('')}
                    className="absolute top-2 right-2 p-1 rounded-full bg-red-600 text-white shadow-md hover:bg-red-700"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center h-28 rounded-xl border-2 border-dashed border-slate-200 hover:border-emerald-400 cursor-pointer bg-slate-50 hover:bg-emerald-50/30 transition-all">
                  <Upload className="w-6 h-6 text-slate-400 mb-1" />
                  <span className="text-xs text-slate-500 font-medium">ເລືອກຮູບໃໝ່</span>
                  <input type="file" accept="image/*" onChange={handleReceiptUpload} className="hidden" />
                </label>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ໝາຍເຫດ
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
              />
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <span className="text-xs text-slate-500">ຍອດລວມໃໝ່:</span>
            <div className="text-lg font-extrabold text-emerald-700">
              {formatLAK(splitResult.totalAmount)}
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-sm font-medium transition-colors"
            >
              ຍົກເລີກ
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2"
            >
              {isSubmitting ? 'ກຳລັງບັນທຶກ...' : '✓ ບັນທຶກການແກ້ໄຂ'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
