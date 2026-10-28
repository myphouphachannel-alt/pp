/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Receipt,
  Mail,
  Lock,
  User,
  ArrowRight,
  AlertCircle,
  Sparkles,
  CheckCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      if (mode === 'signup') {
        if (!displayName.trim()) {
          setErrorMsg('ກະລຸນາປ້ອນຊື່ຂອງທ່ານ');
          setIsLoading(false);
          return;
        }
        await signUpWithEmail(email.trim(), password, displayName.trim());
      } else {
        await signInWithEmail(email.trim(), password);
      }
      onClose?.();
    } catch (err: any) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setErrorMsg('ອີເມວ ຫຼື ລະຫັດຜ່ານບໍ່ຖືກຕ້ອງ');
      } else if (err.code === 'auth/email-already-in-use') {
        setErrorMsg('ອີເມວນີ້ຖືກນຳໃຊ້ແລ້ວ');
      } else if (err.code === 'auth/weak-password') {
        setErrorMsg('ລະຫັດຜ່ານຕ້ອງມີຢ່າງໜ້ອຍ 6 ຕົວອັກສອນ');
      } else {
        setErrorMsg(err.message || 'ເກີດຂໍ້ຜິດພາດໃນການເຂົ້າສູ່ລະບົບ');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    setIsLoading(true);
    try {
      await signInWithGoogle();
      onClose?.();
    } catch (err: any) {
      setErrorMsg(err.message || 'Google Sign-In ບໍ່ສຳເລັດ');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoSignIn = async (demoName: string, demoNum: number) => {
    setErrorMsg('');
    setIsLoading(true);
    const demoEmail = `friend${demoNum}@friendpay.la`;
    const demoPass = 'friendpay123';
    try {
      try {
        await signInWithEmail(demoEmail, demoPass);
      } catch (signInErr) {
        // Create demo account if not exists
        await signUpWithEmail(demoEmail, demoPass, demoName);
      }
      onClose?.();
    } catch (err: any) {
      setErrorMsg(err.message || 'Demo Login error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Brand Header */}
        <div className="bg-gradient-to-br from-emerald-700 to-teal-800 text-white p-6 text-center">
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center mx-auto mb-3 border border-white/20 shadow-md">
            <Receipt className="w-6 h-6 text-emerald-300" />
          </div>
          <h2 className="text-xl font-extrabold tracking-tight">FriendPay Laos</h2>
          <p className="text-xs text-emerald-100 mt-1">
            ເວັບໄຊແບ່ງຄ່າອາຫານ & ຈັດການລາຍຈ່າຍຮ່ວມກັນ (ສະກຸນເງິນ LAK)
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex border-b border-slate-100 bg-slate-50/50">
          <button
            onClick={() => {
              setMode('signin');
              setErrorMsg('');
            }}
            className={`flex-1 py-3 text-xs font-bold transition-colors ${
              mode === 'signin'
                ? 'bg-white text-emerald-700 border-b-2 border-emerald-600'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            ເຂົ້າສູ່ລະບົບ (Login)
          </button>
          <button
            onClick={() => {
              setMode('signup');
              setErrorMsg('');
            }}
            className={`flex-1 py-3 text-xs font-bold transition-colors ${
              mode === 'signup'
                ? 'bg-white text-emerald-700 border-b-2 border-emerald-600'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            ສະໝັກສະມາຊິກ (Register)
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Google Sign-In */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center justify-center gap-2.5 transition-all shadow-2xs"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>ເຂົ້າສູ່ລະບົບດ້ວຍ Google</span>
          </button>

          <div className="relative flex items-center justify-center my-3">
            <div className="border-t border-slate-200 w-full" />
            <span className="bg-white px-2.5 text-[11px] text-slate-400 absolute font-medium">
              ຫຼື ໃຊ້ອີເມວ
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3 text-xs">
            {mode === 'signup' && (
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  ຊື່ ແລະ ນາມສະກຸນ (Display Name)
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="ເຊັ່ນ: ໂຊກໄຊ, ອາລຸນ..."
                    required
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block font-semibold text-slate-700 mb-1">ອີເມວ</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="yourname@gmail.com"
                  required
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">ລະຫັດຜ່ານ</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="ຢ່າງໜ້ອຍ 6 ຕົວອັກສອນ"
                  required
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 mt-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                'ກຳລັງດຳເນີນການ...'
              ) : mode === 'signin' ? (
                <>
                  <span>ເຂົ້າສູ່ລະບົບ</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  <span>ສະໝັກສະມາຊິກ</span>
                  <CheckCircle className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Test Buttons */}
          <div className="pt-2 border-t border-slate-100">
            <span className="text-[10px] text-slate-400 font-semibold uppercase block mb-1.5 text-center">
              ທົດລອງເຂົ້າລະບົບດ່ວນ (Demo Accounts):
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDemoSignIn('ທ້າວ ສົມພອນ', 1)}
                disabled={isLoading}
                className="py-1.5 px-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-semibold transition-colors"
              >
                👤 ສົມພອນ (Demo A)
              </button>
              <button
                type="button"
                onClick={() => handleDemoSignIn('ນາງ ມະນີວັນ', 2)}
                disabled={isLoading}
                className="py-1.5 px-2 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 text-[11px] font-semibold transition-colors"
              >
                👤 ມະນີວັນ (Demo B)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
