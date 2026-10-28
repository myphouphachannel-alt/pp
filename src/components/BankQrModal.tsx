/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  QrCode,
  Upload,
  Building,
  CreditCard,
  User,
  Check,
  AlertCircle,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface BankQrModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BankQrModal: React.FC<BankQrModalProps> = ({ isOpen, onClose }) => {
  const { userProfile, updateProfileDetails } = useAuth();

  const [bankName, setBankName] = useState(userProfile?.bankName || 'BCEL One');
  const [bankAccountNumber, setBankAccountNumber] = useState(userProfile?.bankAccountNumber || '');
  const [bankAccountName, setBankAccountName] = useState(
    userProfile?.bankAccountName || userProfile?.displayName || ''
  );
  const [qrCodeUrl, setQrCodeUrl] = useState(userProfile?.qrCodeUrl || '');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg('ຂະໜາດຮູບໃຫຍ່ເກີນໄປ (ກະລຸນາເລືອກຮູບບໍ່ເກີນ 2MB)');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setQrCodeUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      await updateProfileDetails({
        bankName,
        bankAccountNumber: bankAccountNumber.trim(),
        bankAccountName: bankAccountName.trim(),
        qrCodeUrl,
      });

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || 'ເກີດຂໍ້ຜິດພາດໃນການບັນທຶກ');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-50 to-teal-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">ຕັ້ງຄ່າ QR Code ຮັບເງິນ</h3>
              <p className="text-xs text-slate-500">BCEL One / OnePay / ທະນາຄານລາວ</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-slate-200 text-slate-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {success && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>ບັນທຶກ QR Code ແລະ ຂໍ້ມູນບັນຊີຮຽບຮ້ອຍແລ້ວ!</span>
            </div>
          )}

          {/* QR Code Upload / Preview */}
          <div className="text-center space-y-2">
            <span className="block font-semibold text-slate-700">
              ຮູບ OnePay / BCEL QR Code ຮັບເງິນ
            </span>

            {qrCodeUrl ? (
              <div className="relative inline-block border-2 border-emerald-500 rounded-2xl p-2 bg-emerald-50/50 shadow-inner">
                <img
                  src={qrCodeUrl}
                  alt="My QR Code"
                  className="w-44 h-44 object-contain mx-auto rounded-xl bg-white p-1"
                />
                <button
                  type="button"
                  onClick={() => setQrCodeUrl('')}
                  className="absolute -top-2 -right-2 p-1.5 rounded-full bg-red-600 text-white shadow-md hover:bg-red-700 transition-colors"
                  title="ລຶບຮູບ QR"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center h-44 rounded-2xl border-2 border-dashed border-slate-300 hover:border-emerald-500 cursor-pointer bg-slate-50 hover:bg-emerald-50/30 transition-all p-4">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2">
                  <Upload className="w-5 h-5" />
                </div>
                <span className="font-semibold text-slate-700 text-xs">
                  ອັບໂຫຼດຮູບ QR Code ຈາກ BCEL One
                </span>
                <span className="text-[10px] text-slate-400 mt-1">
                  ຖ່າຍຮູບໜ້າຈໍ QR ຮັບເງິນໃນແອັບທະນາຄານ ແລ້ວເລືອກໄຟລ໌ (PNG, JPG)
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleQrUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Bank Selection */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-slate-400" />
              ທະນາຄານ
            </label>
            <select
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="BCEL One">BCEL One (ທະນາຄານການຄ້າຕ່າງປະເທດລາວ)</option>
              <option value="LDB Trust">LDB Trust (ທະນາຄານພັດທະນະລາວ)</option>
              <option value="JDB Yes">JDB (ທະນາຄານຮ່ວມພັດທະນາ)</option>
              <option value="APB Bank">APB (ທະນາຄານສົ່ງເສີມກະສິກຳ)</option>
              <option value="Kasikorn Bank">Kasikornthai Lao (ກຸງເທບ/ກສິກອນ)</option>
              <option value="Maruhan Japan">Maruhan Japan Bank Lao</option>
              <option value="Lao-Viet Bank">Lao-Viet Bank</option>
              <option value="BIC Bank">BIC Bank</option>
            </select>
          </div>

          {/* Account Number */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-slate-400" />
              ເລກບັນຊີທະນາຄານ
            </label>
            <input
              type="text"
              value={bankAccountNumber}
              onChange={(e) => setBankAccountNumber(e.target.value)}
              placeholder="160-12-00-XXXXXXXX-001"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Account Name */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" />
              ຊື່ເຈົ້າຂອງບັນຊີ
            </label>
            <input
              type="text"
              value={bankAccountName}
              onChange={(e) => setBankAccountName(e.target.value)}
              placeholder="ເຊັ່ນ: SOUKPHASONE KEO..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Submit */}
          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
            >
              ຍົກເລີກ
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/20 disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'ກຳລັງບັນທຶກ...' : 'ບັນທຶກ QR Code'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
