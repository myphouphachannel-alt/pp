/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  User,
  CreditCard,
  QrCode,
  Check,
  LogOut,
  Upload,
  AlertCircle,
  Building,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const ProfileView: React.FC = () => {
  const { currentUser, userProfile, updateProfileDetails, logout } = useAuth();

  const [displayName, setDisplayName] = useState(userProfile?.displayName || '');
  const [bankName, setBankName] = useState(userProfile?.bankName || 'BCEL One');
  const [bankAccountNumber, setBankAccountNumber] = useState(userProfile?.bankAccountNumber || '');
  const [bankAccountName, setBankAccountName] = useState(userProfile?.bankAccountName || '');
  const [qrCodeUrl, setQrCodeUrl] = useState(userProfile?.qrCodeUrl || '');

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleUploadQr = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg('ຂະໜາດຮູບ QR ໃຫຍ່ເກີນໄປ (ບໍ່ເກີນ 2MB)');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setQrCodeUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSaveSuccess(false);

    if (!displayName.trim()) {
      setErrorMsg('ກະລຸນາປ້ອນຊື່ສະແດງຂອງທ່ານ');
      return;
    }

    setIsSaving(true);
    try {
      await updateProfileDetails({
        displayName: displayName.trim(),
        bankName,
        bankAccountNumber: bankAccountNumber.trim(),
        bankAccountName: bankAccountName.trim() || displayName.trim(),
        qrCodeUrl,
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'ເກີດຂໍ້ຜິດພາດໃນການບັນທຶກ');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
          <User className="w-6 h-6 text-emerald-600" />
          ໂປຣໄຟລ໌ & ຂໍ້ມູນບັນຊີທະນາຄານ
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          ຕັ້ງຄ່າຊື່ຂອງທ່ານ ແລະ ເລກບັນຊີທະນາຄານລາວ (BCEL One) ເພື່ອໃຫ້ໝູ່ໂອນເງິນຄືນໄດ້ສະດວກ
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Status Alerts */}
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        {saveSuccess && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>ບັນທຶກຂໍ້ມູນໂປຣໄຟລ໌ສຳເລັດແລ້ວ!</span>
          </div>
        )}

        {/* Section 1: User Profile */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-5">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <User className="w-4 h-4 text-emerald-600" />
            ຂໍ້ມູນສ່ວນຕົວ
          </h2>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <img
              src={
                userProfile?.photoURL ||
                currentUser?.photoURL ||
                `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser?.uid}`
              }
              alt="Avatar"
              className="w-16 h-16 rounded-full border-2 border-emerald-500/30 object-cover bg-emerald-50"
            />
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-700">ອີເມວບັນຊີ:</span>
              <p className="text-sm font-mono text-slate-500">{currentUser?.email}</p>
              <p className="text-[11px] text-slate-400">UID: {currentUser?.uid}</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              ຊື່ສະແດງ (Display Name) *
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="ປ້ອນຊື່ຫຼິ້ນ ຫຼື ຊື່ແທ້ຂອງທ່ານ"
              required
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>
        </div>

        {/* Section 2: Banking & QR Code Details */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              ຂໍ້ມູນບັນຊີຮັບເງິນ (BCEL One / ທະນາຄານລາວ)
            </h2>
            <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
              ໝູ່ຈະເຫັນຕອນໂອນເງິນ
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                ທະນາຄານ
              </label>
              <select
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-white"
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

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ເລກບັນຊີທະນາຄານ
              </label>
              <input
                type="text"
                value={bankAccountNumber}
                onChange={(e) => setBankAccountNumber(e.target.value)}
                placeholder="ເຊັ່ນ: 160-12-00-12345678-001"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-mono"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ຊື່ເຈົ້າຂອງບັນຊີ (Account Holder Name)
              </label>
              <input
                type="text"
                value={bankAccountName}
                onChange={(e) => setBankAccountName(e.target.value)}
                placeholder="ເຊັ່ນ: SOUKPHASONE KEO... ຫຼື ຊື່ໃນແອັບ"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          {/* QR Code Upload */}
          <div className="pt-2 border-t border-slate-100">
            <label className="block text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
              <QrCode className="w-3.5 h-3.5 text-emerald-600" />
              ຮູບ OnePay QR Code ຮັບເງິນ (ຖ້າມີ)
            </label>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              {qrCodeUrl ? (
                <div className="relative rounded-2xl border border-slate-200 p-2 bg-slate-50">
                  <img
                    src={qrCodeUrl}
                    alt="OnePay QR"
                    className="w-32 h-32 object-contain rounded-xl bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setQrCodeUrl('')}
                    className="absolute -top-2 -right-2 p-1 rounded-full bg-red-600 text-white shadow-md hover:bg-red-700"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <label className="w-full sm:w-48 h-32 rounded-2xl border-2 border-dashed border-slate-200 hover:border-emerald-400 cursor-pointer bg-slate-50 flex flex-col items-center justify-center p-3 text-center transition-all">
                  <Upload className="w-5 h-5 text-slate-400 mb-1" />
                  <span className="text-xs font-medium text-slate-600">ອັບໂຫຼດຮູບ QR</span>
                  <span className="text-[10px] text-slate-400 mt-0.5">ຮູບ QR ຈາກ BCEL One</span>
                  <input type="file" accept="image/*" onChange={handleUploadQr} className="hidden" />
                </label>
              )}

              <p className="text-xs text-slate-400 flex-1">
                ຖ້າອັບໂຫຼດ QR Code, ເວລາໝູ່ກົດຊຳລະເງິນ ໝູ່ຈະສາມາດສະແກນ QR ຜ່ານ BCEL One ໄດ້ທັນທີ
                ໂດຍບໍ່ຕ້ອງພິມເລກບັນຊີເອງ.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={logout}
            className="px-4 py-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold flex items-center gap-2 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            ອອກຈາກລະບົບ
          </button>

          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {isSaving ? 'ກຳລັງບັນທຶກ...' : 'ບັນທຶກການປ່ຽນແປງ'}
          </button>
        </div>
      </form>
    </div>
  );
};
