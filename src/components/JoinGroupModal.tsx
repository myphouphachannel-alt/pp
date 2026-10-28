/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Users, ArrowRight, AlertCircle, Check } from 'lucide-react';
import { useGroup } from '../context/GroupContext';

interface JoinGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCode?: string;
}

export const JoinGroupModal: React.FC<JoinGroupModalProps> = ({
  isOpen,
  onClose,
  initialCode = '',
}) => {
  const { joinGroupByCode } = useGroup();

  const [code, setCode] = useState(initialCode);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setErrorMsg('ກະລຸນາປ້ອນລະຫັດເຊີນ');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    try {
      await joinGroupByCode(code.trim());
      setCode('');
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'ບໍ່ສາມາດເຂົ້າຮ່ວມກຸ່ມໄດ້ ກະລຸນາກວດສອບລະຫັດ');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-emerald-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-slate-900">ເຂົ້າຮ່ວມກຸ່ມດ້ວຍລະຫັດເຊີນ</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-slate-200 text-slate-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              ລະຫັດເຊີນ (Invite Code)
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="ເຊັ່ນ: FP-XXXXXX"
              required
              className="w-full px-3.5 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-center font-mono font-bold text-base tracking-widest text-emerald-800 uppercase"
            />
            <p className="text-[11px] text-slate-400 mt-1.5 text-center">
              ຂໍລະຫັດເຊີນຈາກໝູ່ທີ່ເປັນເຈົ້າຂອງກຸ່ມ
            </p>
          </div>

          <div className="pt-2 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium"
            >
              ຍົກເລີກ
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/20 disabled:opacity-50 flex items-center gap-1.5"
            >
              <span>{isLoading ? 'ກຳລັງເຂົ້າຮ່ວມ...' : 'ເຂົ້າຮ່ວມກຸ່ມ'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
