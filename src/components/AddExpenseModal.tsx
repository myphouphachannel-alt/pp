/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
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
  UserPlus,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useGroup } from '../context/GroupContext';
import { calculateItemizedBillShares } from '../utils/debtCalculator';
import { formatLAK, parseLAK } from '../utils/currency';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TempLineItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  assignedMemberIds: string[];
}

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, userProfile } = useAuth();
  const { members, activeGroup, addExpense, addMemberByName } = useGroup();

  const [title, setTitle] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [payerId, setPayerId] = useState(currentUser?.uid || '');
  const [sharedTotalInput, setSharedTotalInput] = useState<number | ''>(0);
  const [receiptUrl, setReceiptUrl] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

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
      // Auto-assign new friend to all existing line items
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

  // Default initial line item
  const [items, setItems] = useState<TempLineItem[]>(() => [
    {
      id: '1',
      name: 'ຕຳໝາກຫຸ່ງ',
      price: 35000,
      quantity: 1,
      assignedMemberIds: members.map((m) => m.userId),
    },
  ]);

  // Keep all members list
  const memberList = useMemo(() => {
    return members.length > 0
      ? members
      : currentUser
      ? [
          {
            id: 'm1',
            groupId: activeGroup?.id || '',
            userId: currentUser.uid,
            role: 'owner' as const,
            displayName: userProfile?.displayName || 'ຂ້ອຍ',
            joinedAt: new Date().toISOString(),
          },
        ]
      : [];
  }, [members, currentUser, userProfile, activeGroup]);

  // Participant IDs (all group members involved)
  const participantIds = useMemo(() => {
    return memberList.map((m) => m.userId);
  }, [memberList]);

  // Live calculation of itemized shares + shared water/fee
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

  if (!isOpen) return null;

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
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, ...updates } : i))
    );
  };

  const handleToggleMember = (itemId: string, memberId: string) => {
    setItems((prev) =>
      prev.map((i) => {
        if (i.id !== itemId) return i;
        const exists = i.assignedMemberIds.includes(memberId);
        let updated: string[];
        if (exists) {
          updated = i.assignedMemberIds.filter((id) => id !== memberId);
          // Don't allow empty
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

  // Receipt image upload handler with compression to base64
  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg('ຂະໜາດຮູບໃຫຍ່ເກີນໄປ (ກະລຸນາເລືອກຮູບບໍ່ເກີນ 2MB)');
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

    const payer = memberList.find((m) => m.userId === payerId);
    const payerName = payer?.displayName || 'ສະມາຊິກ';

    // Format memberShares as userId -> amount
    const finalMemberShares: Record<string, number> = {};
    Object.entries(splitResult.memberShares).forEach(([uid, share]) => {
      finalMemberShares[uid] = share.totalShare;
    });

    setIsSubmitting(true);
    try {
      await addExpense(
        {
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
          splitType: 'itemized',
          memberShares: finalMemberShares,
        },
        items.map((i) => ({
          name: i.name.trim() || 'ລາຍການອາຫານ',
          price: i.price,
          quantity: i.quantity || 1,
          assignedMemberIds: i.assignedMemberIds,
        }))
      );

      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'ເກີດຂໍ້ຜິດພາດໃນການບັນທຶກ');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-50/50 to-teal-50/30">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">ເພີ່ມລາຍຈ່າຍ & ແບ່ງຄ່າອາຫານ</h2>
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

          {/* 1. General Info (Title, Restaurant, Date, Payer) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ຊື່ລາຍຈ່າຍ / ໂອກາດ *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="ເຊັ່ນ: ກິນເຂົ້າທ່ຽງ, ໝູກະທະ, ກິນລ້ຽງ"
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
                placeholder="ເຊັ່ນ: ຮ້ານ ຕຳແຊບ, Amazon, ຮ້ານປີ້ງໄກ່"
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
                {memberList.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.displayName} {m.userId === currentUser?.uid ? '(ຂ້ອຍ)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 2. Itemized Food Items (ລະບົບແບ່ງຕາມລາຄາອາຫານ) */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Utensils className="w-4 h-4 text-emerald-600" />
                  ລາຍການອາຫານ & ຜູ້ທີ່ກິນ
                </h3>
                <p className="text-xs text-slate-500">
                  ໃສ່ລາຄາແຕ່ລະຢ່າງ ແລະ ເລືອກໝູ່ທີ່ກິນເພື່ອແບ່ງຖືກຕ້ອງ
                </p>
              </div>

              {/* Preset quick buttons */}
              <div className="hidden sm:flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleAddItem('ຕຳໝາກຫຸ່ງ', 35000)}
                  className="px-2 py-1 text-[11px] rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                >
                  + ຕຳຫຸ່ງ
                </button>
                <button
                  type="button"
                  onClick={() => handleAddItem('ໄກ່ປິ້ງ', 50000)}
                  className="px-2 py-1 text-[11px] rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                >
                  + ໄກ່ປິ້ງ
                </button>
                <button
                  type="button"
                  onClick={() => handleAddItem('ເບຍລາວ', 25000)}
                  className="px-2 py-1 text-[11px] rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                >
                  + ເບຍລາວ
                </button>
              </div>
            </div>

            {/* Quick Add Friend By Name */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-200/80">
              <span className="text-xs text-emerald-950 font-medium flex items-center gap-1.5">
                <UserPlus className="w-3.5 h-3.5 text-emerald-600" />
                ມີໝູ່ກິນນຳແຕ່ຍັງບໍ່ມີຊື່ໃນກຸ່ມບໍ? (ເພີ່ມໄດ້ເລີຍບໍ່ຕ້ອງເຊີນ)
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
                  <span>+ ເພີ່ມຊື່ໝູ່ໃສ່ບິນ</span>
                </button>
              )}
            </div>

            {/* Line Items List */}
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

                    {/* Assigned Eaters for this item */}
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

                      {memberList.map((m) => {
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

            <button
              type="button"
              onClick={() => handleAddItem()}
              className="w-full py-2.5 rounded-xl border-2 border-dashed border-emerald-200 hover:border-emerald-400 text-emerald-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors bg-emerald-50/30 hover:bg-emerald-50"
            >
              <Plus className="w-4 h-4" />
              ເພີ່ມລາຍການອາຫານອື່ນ
            </button>
          </div>

          {/* 3. Shared Extras (ຄ່ານ້ຳດື່ມ, ຄ່າບໍລິການ, ຄ່າທິບ) - หารเท่ากัน */}
          <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-teal-900 flex items-center gap-1.5">
                  <span>ຄ່ານ້ຳດື່ມ / ຄ່າບໍລິການ / ຄ່າທິບ (ຫານເທົ່າກັນ)</span>
                </h4>
                <p className="text-[11px] text-teal-700">
                  ຍອດນີ້ຈະຖືກຫານສະເລ່ຍເທົ່າກັນໃຫ້ທຸກຄົນໃນກຸ່ມ ({participantIds.length} ຄົນ)
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

          {/* 4. Live Calculation Breakdown Preview (ຕົວຢ່າງສູດຄິດໄລ່) */}
          <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-3 shadow-inner">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                ສະຫຼຸບຍອດແບ່ງຈ່າຍຂອງແຕ່ລະຄົນ
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
                const member = memberList.find((m) => m.userId === uid);
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
                        ຄ່າອາຫານ: {formatLAK(share.foodShare)} + ຄ່ານ້ຳ: {formatLAK(share.sharedFeeShare)}
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

          {/* 5. Bill Receipt Photo & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {/* Receipt Image Upload */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5 text-slate-400" />
                ແນບຮູບໃບບິນ / ໃບເຊັກບິນ (ຖ້າມີ)
              </label>

              {receiptUrl ? (
                <div className="relative rounded-xl border border-slate-200 overflow-hidden group">
                  <img
                    src={receiptUrl}
                    alt="Receipt"
                    className="w-full h-28 object-cover rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => setReceiptUrl('')}
                    className="absolute top-2 right-2 p-1 rounded-full bg-red-600 text-white shadow-md hover:bg-red-700 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center h-28 rounded-xl border-2 border-dashed border-slate-200 hover:border-emerald-400 cursor-pointer bg-slate-50/50 hover:bg-emerald-50/30 transition-all">
                  <Upload className="w-6 h-6 text-slate-400 mb-1" />
                  <span className="text-xs text-slate-500 font-medium">ເລືອກຮູບໃບບິນ</span>
                  <span className="text-[10px] text-slate-400">PNG, JPG ບໍ່ເກີນ 2MB</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleReceiptUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ໝາຍເຫດເພີ່ມເຕີມ
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="ບັນທຶກເພີ່ມເຕີມ ເຊັ່ນ ໂຕະ 5, ອາຫານຫຼັກ, ຕັດໂປຣ..."
                className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none"
              />
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <span className="text-xs text-slate-500">ຍອດລວມທັງໝົດ:</span>
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
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>ກຳລັງບັນທຶກ...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>ບັນທຶກ & ແບ່ງເງິນ</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
