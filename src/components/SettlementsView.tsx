/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  ArrowLeftRight,
  CheckCircle2,
  Clock,
  Upload,
  QrCode,
  CreditCard,
  X,
  ExternalLink,
  AlertCircle,
  FileText,
  User,
  ShieldCheck,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import { useGroup } from '../context/GroupContext';
import { formatLAK } from '../utils/currency';
import { DebtTransfer, Settlement, UserProfile } from '../types';

interface SettlementsViewProps {
  initialPaymentDebt?: DebtTransfer | null;
  onClearInitialPaymentDebt?: () => void;
}

export const SettlementsView: React.FC<SettlementsViewProps> = ({
  initialPaymentDebt,
  onClearInitialPaymentDebt,
}) => {
  const { currentUser } = useAuth();
  const {
    debts,
    settlements,
    createSettlementPayment,
    confirmPaymentReceived,
    getMemberProfile,
    activeGroup,
  } = useGroup();

  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');

  // Modal states for Pay Transfer
  const [selectedDebt, setSelectedDebt] = useState<DebtTransfer | null>(null);
  const [recipientProfile, setRecipientProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [slipUrl, setSlipUrl] = useState('');
  const [transferNote, setTransferNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Modal state for View Slip & Confirm
  const [viewingSettlement, setViewingSettlement] = useState<Settlement | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  // Auto trigger modal if initialPaymentDebt is passed
  useEffect(() => {
    if (initialPaymentDebt) {
      handleOpenPaymentModal(initialPaymentDebt);
      onClearInitialPaymentDebt?.();
    }
  }, [initialPaymentDebt]);

  const handleOpenPaymentModal = async (debt: DebtTransfer) => {
    setSelectedDebt(debt);
    setSlipUrl('');
    setTransferNote('');
    setErrorMsg('');
    setLoadingProfile(true);

    try {
      const profile = await getMemberProfile(debt.toUserId);
      setRecipientProfile(profile);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleUploadSlip = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg('ຂະໜາດຮູບໃຫຍ່ເກີນໄປ (ກະລຸນາເລືອກຮູບບໍ່ເກີນ 2MB)');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSlipUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleConfirmSent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDebt) return;

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      await createSettlementPayment(
        selectedDebt.toUserId,
        selectedDebt.toUserName,
        selectedDebt.amount,
        slipUrl,
        transferNote
      );

      setSelectedDebt(null);
      // Switch to history tab to see status
      setActiveTab('history');
    } catch (err: any) {
      setErrorMsg(err.message || 'ເກີດຂໍ້ຜິດພາດໃນການບັນທຶກການໂອນ');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmReceived = async (settlementId: string) => {
    setIsConfirming(true);
    try {
      await confirmPaymentReceived(settlementId);
      // Trigger confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
      setViewingSettlement(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
          <ArrowLeftRight className="w-6 h-6 text-emerald-600" />
          ການຊຳລະເງິນ & ເຄຼຍໜີ້
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          ຕິດຕາມຍອດຄ້າງ, ໂອນເງິນຜ່ານແອັບທະນາຄານ, ແນບສະລິບ ແລະ ຢືນຢັນການຮັບເງິນ
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-4">
        <button
          onClick={() => setActiveTab('pending')}
          className={`pb-3 text-sm font-semibold transition-all relative ${
            activeTab === 'pending'
              ? 'text-emerald-700 border-b-2 border-emerald-600'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          ຍອດທີ່ຕ້ອງຊຳລະ ({debts.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`pb-3 text-sm font-semibold transition-all relative ${
            activeTab === 'history'
              ? 'text-emerald-700 border-b-2 border-emerald-600'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          ປະຫວັດການຊຳລະ ({settlements.length})
        </button>
      </div>

      {/* Pending Debts Tab */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          {debts.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800 mb-1">ທຸກຄົນເຄຼຍຍອດຮຽບຮ້ອຍແລ້ວ!</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                ບໍ່ມີຍອດໜີ້ຄ້າງຊຳລະໃນກຸ່ມ {activeGroup?.name}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {debts.map((debt, idx) => {
                const isMePayer = debt.fromUserId === currentUser?.uid;
                const isMeReceiver = debt.toUserId === currentUser?.uid;

                return (
                  <div
                    key={idx}
                    className={`p-5 rounded-2xl border transition-all flex flex-col justify-between gap-4 ${
                      isMePayer
                        ? 'bg-amber-50/50 border-amber-200'
                        : isMeReceiver
                        ? 'bg-emerald-50/50 border-emerald-200'
                        : 'bg-white border-slate-200 shadow-sm'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {debt.status === 'awaiting_confirmation'
                            ? '⏳ ລໍຖ້າຜູ້ຮັບຢືນຢັນ'
                            : '🔴 ຍັງຄ້າງຊຳລະ'}
                        </span>
                        <span className="text-base font-extrabold text-slate-900">
                          {formatLAK(debt.amount)}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-700 text-sm shrink-0">
                          {debt.fromUserName[0]}
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-slate-500">ຜູ້ຕ້ອງໂອນ:</p>
                          <p className="text-sm font-bold text-slate-900">
                            {debt.fromUserName} {isMePayer && '(ຂ້ອຍ)'}
                          </p>
                        </div>
                        <div className="text-slate-400">➔</div>
                        <div className="flex-1 text-right">
                          <p className="text-xs text-slate-500">ຜູ້ຮັບເງິນ:</p>
                          <p className="text-sm font-bold text-emerald-800">
                            {debt.toUserName} {isMeReceiver && '(ຂ້ອຍ)'}
                          </p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center font-bold text-emerald-800 text-sm shrink-0">
                          {debt.toUserName[0]}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between">
                      <span className="text-[11px] text-slate-500">
                        {isMePayer
                          ? 'ກະລຸນາໂອນເງິນ ແລະ ກົດຢືນຢັນ'
                          : isMeReceiver
                          ? 'ລໍຖ້າໝູ່ໂອນເງິນ'
                          : 'ຍອດໜີ້ລະຫວ່າງໝູ່'}
                      </span>

                      {isMePayer && (
                        <button
                          onClick={() => handleOpenPaymentModal(debt)}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>ຂ້ອຍໄດ້ໂອນເງິນແລ້ວ</span>
                        </button>
                      )}

                      {isMeReceiver && debt.status === 'awaiting_confirmation' && (
                        <button
                          onClick={() => {
                            const matching = settlements.find((s) => s.id === debt.settlementId);
                            if (matching) setViewingSettlement(matching);
                          }}
                          className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-sm transition-colors"
                        >
                          ກວດສອບສະລິບ & ຢືນຢັນ
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="space-y-3">
          {settlements.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
              <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800 mb-1">ຍັງບໍ່ມີປະຫວັດການຊຳລະ</h3>
              <p className="text-xs text-slate-400">
                ເມື່ອມີການໂອນເງິນ ແລະ ຢືນຢັນ ປະຫວັດຈະປາກົດຢູ່ນີ້
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {settlements.map((settle) => {
                const isReceiver = settle.toUserId === currentUser?.uid;

                return (
                  <div
                    key={settle.id}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                          settle.status === 'paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {settle.status === 'paid' ? '✓' : '⏳'}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-900 flex items-center gap-1.5 flex-wrap">
                          <span>{settle.fromUserName}</span>
                          <span className="text-xs text-slate-400">ໂອນໃຫ້</span>
                          <span className="text-emerald-700">{settle.toUserName}</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {new Date(settle.createdAt).toLocaleString('lo-LA')}
                          {settle.note && ` • "${settle.note}"`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      <div className="text-right">
                        <span className="text-base font-extrabold text-slate-900 block">
                          {formatLAK(settle.amount)}
                        </span>
                        <span
                          className={`text-[11px] font-semibold ${
                            settle.status === 'paid'
                              ? 'text-emerald-600'
                              : 'text-amber-600'
                          }`}
                        >
                          {settle.status === 'paid'
                            ? 'ຊຳລະແລ້ວ (Confirmed)'
                            : 'ລໍຖ້າຢືນຢັນ (Awaiting Confirmation)'}
                        </span>
                      </div>

                      {/* View slip / Confirm button */}
                      <button
                        onClick={() => setViewingSettlement(settle)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-medium transition-colors"
                      >
                        ເບິ່ງລາຍລະອຽດ
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: Payer "ຂ້ອຍໄດ້ໂອນເງິນແລ້ວ" (with Bank Details & Slip Upload) */}
      {selectedDebt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-emerald-50/60">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">
                  ໂອນເງິນໃຫ້ {selectedDebt.toUserName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedDebt(null)}
                className="p-1 rounded-full hover:bg-slate-200 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleConfirmSent} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              {errorMsg && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700">
                  {errorMsg}
                </div>
              )}

              {/* Amount to pay */}
              <div className="p-4 rounded-2xl bg-slate-900 text-white text-center">
                <span className="text-[11px] text-slate-400">ຈຳນວນເງິນທີ່ຕ້ອງໂອນ</span>
                <div className="text-2xl font-extrabold text-emerald-400 mt-0.5">
                  {formatLAK(selectedDebt.amount)}
                </div>
              </div>

              {/* Recipient Bank Information */}
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-950 flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    ຂໍ້ມູນບັນຊີຮັບເງິນຂອງໝູ່
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-200 text-emerald-800 font-semibold">
                    {recipientProfile?.bankName || 'BCEL One'}
                  </span>
                </div>

                <div className="space-y-1.5 text-slate-700">
                  <div className="flex justify-between">
                    <span className="text-slate-500">ທະນາຄານ:</span>
                    <span className="font-semibold">{recipientProfile?.bankName || 'BCEL One (ທະນາຄານການຄ້າ)'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">ເລກບັນຊີ:</span>
                    <span className="font-mono font-bold text-emerald-800 text-sm select-all">
                      {recipientProfile?.bankAccountNumber || 'ຍັງບໍ່ໄດ້ລະບຸເລກບັນຊີ'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">ຊື່ບັນຊີ:</span>
                    <span className="font-semibold">{recipientProfile?.bankAccountName || selectedDebt.toUserName}</span>
                  </div>
                </div>

                {/* QR Code preview if uploaded by recipient */}
                {recipientProfile?.qrCodeUrl && (
                  <div className="pt-2 border-t border-emerald-200/60 text-center">
                    <p className="text-[10px] text-emerald-800 font-semibold mb-1">
                      ສະແກນ QR Code OnePay / BCEL One:
                    </p>
                    <img
                      src={recipientProfile.qrCodeUrl}
                      alt="Bank QR Code"
                      className="w-36 h-36 object-contain mx-auto rounded-xl border border-emerald-300 bg-white p-1 shadow-sm"
                    />
                  </div>
                )}
              </div>

              <p className="text-[11px] text-slate-500">
                💡 ເປີດແອັບທະນາຄານ (ເຊັ່ນ BCEL One) ແລ້ວໂອນເງິນຕາມລາຍລະອຽດຂ້າງເທິງ.
                ຫຼັງຈາກນັ້ນແນບຮູບສະລິບຢືນຢັນຂ້າງລຸ່ມ.
              </p>

              {/* Upload Slip */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-slate-400" />
                  ແນບຮູບໃບສະລິບການໂອນເງິນ
                </label>

                {slipUrl ? (
                  <div className="relative rounded-xl border border-slate-200 overflow-hidden">
                    <img src={slipUrl} alt="Slip" className="w-full h-36 object-contain bg-slate-100" />
                    <button
                      type="button"
                      onClick={() => setSlipUrl('')}
                      className="absolute top-2 right-2 p-1 rounded-full bg-red-600 text-white shadow-md hover:bg-red-700"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-24 rounded-xl border-2 border-dashed border-slate-200 hover:border-emerald-400 cursor-pointer bg-slate-50 hover:bg-emerald-50/30 transition-all">
                    <Upload className="w-5 h-5 text-slate-400 mb-1" />
                    <span className="text-slate-600 font-medium">ເລືອກຮູບໃບສະລິບ</span>
                    <input type="file" accept="image/*" onChange={handleUploadSlip} className="hidden" />
                  </label>
                )}
              </div>

              {/* Note */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">ໝາຍເຫດ</label>
                <input
                  type="text"
                  value={transferNote}
                  onChange={(e) => setTransferNote(e.target.value)}
                  placeholder="ເຊັ່ນ: ຄ່າເຂົ້າທ່ຽງວານນີ້"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Submit */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? 'ກຳລັງບັນທຶກ...' : '✓ ຂ້ອຍໄດ້ໂອນເງິນແລ້ວ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: View Slip & Recipient Confirmation "ຢືນຢັນວ່າໄດ້ຮັບເງິນ" */}
      {viewingSettlement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-base font-bold text-slate-900">ລາຍລະອຽດການຊຳລະເງິນ</h3>
              <button
                onClick={() => setViewingSettlement(null)}
                className="p-1 rounded-full hover:bg-slate-200 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">ຜູ້ໂອນ:</span>
                  <span className="font-bold text-slate-900">{viewingSettlement.fromUserName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">ຜູ້ຮັບ:</span>
                  <span className="font-bold text-emerald-800">{viewingSettlement.toUserName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">ຈຳນວນເງິນ:</span>
                  <span className="font-extrabold text-slate-900 text-sm">
                    {formatLAK(viewingSettlement.amount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">ສະຖານະ:</span>
                  <span
                    className={`font-semibold ${
                      viewingSettlement.status === 'paid' ? 'text-emerald-600' : 'text-amber-600'
                    }`}
                  >
                    {viewingSettlement.status === 'paid' ? '✓ ຊຳລະແລ້ວ' : '⏳ ລໍຖ້າຜູ້ຮັບຢືນຢັນ'}
                  </span>
                </div>
                {viewingSettlement.note && (
                  <div className="pt-2 border-t border-slate-200 text-slate-600">
                    <span className="text-slate-400">ໝາຍເຫດ: </span>
                    {viewingSettlement.note}
                  </div>
                )}
              </div>

              {/* Slip Image */}
              {viewingSettlement.proofUrl ? (
                <div>
                  <span className="font-semibold text-slate-700 block mb-1">
                    ຮູບໃບສະລິບການໂອນ:
                  </span>
                  <div className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-100 max-h-64 flex items-center justify-center">
                    <img
                      src={viewingSettlement.proofUrl}
                      alt="Transfer Slip"
                      className="w-full h-auto max-h-64 object-contain"
                    />
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center text-slate-400">
                  ບໍ່ມີຮູບໃບສະລິບແນບມາ
                </div>
              )}

              {/* If current user is the Recipient and status is awaiting_confirmation: Show CONFIRM BUTTON */}
              {viewingSettlement.toUserId === currentUser?.uid &&
                viewingSettlement.status !== 'paid' && (
                  <div className="pt-2">
                    <button
                      onClick={() => handleConfirmReceived(viewingSettlement.id)}
                      disabled={isConfirming}
                      className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      <span>{isConfirming ? 'ກຳລັງຢືນຢັນ...' : 'ຢືນຢັນວ່າໄດ້ຮັບເງິນແລ້ວ'}</span>
                    </button>
                    <p className="text-[10px] text-slate-400 text-center mt-1.5">
                      ກວດສອບຍອດເງິນໃນແອັບທະນາຄານຂອງທ່ານກ່ອນກົດຢືນຢັນ
                    </p>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
