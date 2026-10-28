/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  Calendar,
  Utensils,
  Receipt,
  User,
  Trash2,
  AlertCircle,
  ExternalLink,
  Users,
  Edit3,
} from 'lucide-react';
import { Expense } from '../types';
import { useAuth } from '../context/AuthContext';
import { useGroup } from '../context/GroupContext';
import { formatLAK } from '../utils/currency';

interface ExpenseDetailModalProps {
  expense: Expense | null;
  onClose: () => void;
  onEdit?: (expense: Expense) => void;
}

export const ExpenseDetailModal: React.FC<ExpenseDetailModalProps> = ({ expense, onClose, onEdit }) => {
  const { currentUser } = useAuth();
  const { members, activeGroup, deleteExpense } = useGroup();

  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  if (!expense) return null;

  const canDelete =
    currentUser &&
    (expense.payerId === currentUser.uid ||
      expense.createdBy === currentUser.uid ||
      activeGroup?.ownerId === currentUser.uid);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteExpense(expense.id);
      onClose();
    } catch (e) {
      console.error(e);
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              🧾
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 line-clamp-1">
                {expense.title}
              </h2>
              <p className="text-xs text-slate-500">
                ຮ້ານ: <span className="font-semibold text-slate-700">{expense.restaurantName}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-200/70 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Top metadata grid */}
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-100 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">ຜູ້ຈ່າຍເງິນກ່ອນ</span>
              <span className="font-bold text-slate-800 text-sm flex items-center gap-1 mt-0.5">
                <User className="w-3.5 h-3.5 text-emerald-600" />
                {expense.payerName}
              </span>
            </div>
            <div className="text-right">
              <span className="text-slate-400 block text-[11px]">ຍອດລວມທັງໝົດ</span>
              <span className="font-extrabold text-emerald-700 text-base block mt-0.5">
                {formatLAK(expense.totalAmount)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">ວັນທີ</span>
              <span className="font-medium text-slate-700 flex items-center gap-1 mt-0.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {new Date(expense.date).toLocaleDateString('lo-LA')}
              </span>
            </div>
            <div className="text-right">
              <span className="text-slate-400 block text-[11px]">ຄ່ານ້ຳ/ຄ່າບໍລິການ</span>
              <span className="font-medium text-slate-700 block mt-0.5">
                {formatLAK(expense.sharedTotal)}
              </span>
            </div>
          </div>

          {/* Breakdown per person */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-emerald-600" />
              ຍອດສ່ວນແບ່ງຂອງແຕ່ລະຄົນ
            </h3>
            <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 overflow-hidden bg-white">
              {Object.entries(expense.memberShares || {}).map(([uid, share]) => {
                const member = members.find((m) => m.userId === uid);
                const isPayer = uid === expense.payerId;

                return (
                  <div
                    key={uid}
                    className="p-3 flex items-center justify-between text-xs hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-[10px]">
                        {(member?.displayName || 'ສ')[0]}
                      </div>
                      <div>
                        <span className="font-semibold text-slate-900 block">
                          {member?.displayName || 'ສະມາຊິກ'}
                        </span>
                        {isPayer && (
                          <span className="text-[10px] text-emerald-700 font-medium">
                            👑 ຈ່າຍອອກກ່ອນ {formatLAK(expense.totalAmount)}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="font-bold text-slate-900 text-sm">{formatLAK(share)}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Receipt Image Preview */}
          {expense.receiptUrl && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5 text-slate-500" />
                ຮູບໃບບິນ
              </h3>
              <div className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-100 max-h-60 flex items-center justify-center">
                <img
                  src={expense.receiptUrl}
                  alt="Receipt"
                  className="w-full h-auto max-h-60 object-contain hover:scale-105 transition-transform"
                />
              </div>
            </div>
          )}

          {/* Notes */}
          {expense.notes && (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
              <span className="font-semibold text-slate-700 block mb-0.5">ໝາຍເຫດ:</span>
              <p>{expense.notes}</p>
            </div>
          )}

          {/* Edit and Delete section */}
          {canDelete && (
            <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
              <button
                onClick={() => {
                  onClose();
                  onEdit?.(expense);
                }}
                className="w-full py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border border-emerald-200"
              >
                <Edit3 className="w-4 h-4 text-emerald-600" />
                ແກ້ໄຂລາຍຈ່າຍນີ້
              </button>

              {showConfirmDelete ? (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 space-y-2">
                  <p className="text-xs text-red-800 font-medium">
                    ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການລຶບລາຍຈ່າຍນີ້? (ຍອດເງິນຈະຖືກຄຳນວນໃໝ່ທັນທີ)
                  </p>
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => setShowConfirmDelete(false)}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-600 bg-white"
                    >
                      ຍົກເລີກ
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 disabled:opacity-50"
                    >
                      {isDeleting ? 'ກຳລັງລຶບ...' : 'ຢືນຢັນລຶບ'}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowConfirmDelete(true)}
                  className="w-full py-2.5 rounded-xl text-red-600 hover:bg-red-50 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-transparent hover:border-red-200"
                >
                  <Trash2 className="w-4 h-4" />
                  ລຶບລາຍຈ່າຍນີ້
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
