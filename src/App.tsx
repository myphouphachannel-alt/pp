/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { GroupProvider, useGroup } from './context/GroupContext';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { DashboardView } from './components/DashboardView';
import { ExpensesView } from './components/ExpensesView';
import { SettlementsView } from './components/SettlementsView';
import { GroupsView } from './components/GroupsView';
import { ProfileView } from './components/ProfileView';
import { AddExpenseModal } from './components/AddExpenseModal';
import { EditExpenseModal } from './components/EditExpenseModal';
import { ExpenseDetailModal } from './components/ExpenseDetailModal';
import { CreateGroupModal } from './components/CreateGroupModal';
import { JoinGroupModal } from './components/JoinGroupModal';
import { BankQrModal } from './components/BankQrModal';
import { AuthModal } from './components/AuthModal';
import { Expense, DebtTransfer } from './types';
import {
  Receipt,
  Users,
  PlusCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  DollarSign,
  TrendingUp,
} from 'lucide-react';

function MainApp() {
  const { currentUser, loading: authLoading } = useAuth();
  const {
    groups,
    activeGroup,
    loadingGroups,
    createGroup,
    addExpense,
    members,
  } = useGroup();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'expenses' | 'settlements' | 'groups' | 'profile'>('dashboard');

  // Modals state
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isJoinGroupOpen, setIsJoinGroupOpen] = useState(false);
  const [inviteCodeFromUrl, setInviteCodeFromUrl] = useState('');
  const [initialPaymentDebt, setInitialPaymentDebt] = useState<DebtTransfer | null>(null);
  const [isSeedingSample, setIsSeedingSample] = useState(false);

  // Check URL query param ?invite=CODE on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const inviteParam = params.get('invite');
    if (inviteParam) {
      setInviteCodeFromUrl(inviteParam);
      if (currentUser) {
        setIsJoinGroupOpen(true);
      }
    }
  }, [currentUser]);

  // Loading state
  if (authLoading || (currentUser && loadingGroups)) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-xl shadow-emerald-500/20 animate-bounce mb-4">
          <Receipt className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-bold text-slate-800">FriendPay Laos</h2>
        <p className="text-xs text-slate-500 mt-1">ກຳລັງເຊື່ອມຕໍ່ລະບົບ...</p>
      </div>
    );
  }

  // Not logged in: Show Modern Landing Page with Login & Register
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-900 via-emerald-800 to-teal-950 text-white flex flex-col">
        {/* Top Header */}
        <header className="px-6 py-5 flex items-center justify-between max-w-6xl mx-auto w-full">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                FriendPay
                <span className="text-[11px] px-1.5 py-0.5 rounded-md bg-emerald-400/20 text-emerald-300 font-semibold border border-emerald-400/30">
                  ລາວ (LAK)
                </span>
              </span>
            </div>
          </div>

          <AuthModal isOpen={true} />
        </header>

        {/* Hero Content */}
        <main className="flex-1 max-w-5xl mx-auto px-6 py-12 flex flex-col items-center text-center justify-center space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-700/60 border border-emerald-500/30 text-emerald-200 text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
            ແອັບແບ່ງຄ່າອາຫານອັນດັບ 1 ສຳລັບຄົນລາວ
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight max-w-3xl leading-tight">
            ກິນເຂົ້າກັບໝູ່ ແບ່ງຄ່າອາຫານງ່າຍໆ <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-emerald-300 to-teal-200 bg-clip-text text-transparent">
              ດ້ວຍເງິນກີບ (LAK) ບໍ່ມີຜິດໃຈກັນ
            </span>
          </h1>

          <p className="text-emerald-100/90 text-sm sm:text-base max-w-2xl leading-relaxed">
            ໃສ່ລາຄາອາຫານແຕ່ລະຢ່າງ, ເລືອກໝູ່ທີ່ກິນ, ຫານຄ່ານ້ຳເທົ່າກັນ,
            ແລະ ລະບົບຈະຄິດໄລ່ການໂອນເງິນໃຫ້ໜ້ອຍຄັ້ງທີ່ສຸດ ພ້ອມສະແກນ QR Code BCEL One ໂອນໄດ້ທັນທີ!
          </p>

          {/* 3 Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl pt-6 text-left">
            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
              <DollarSign className="w-6 h-6 text-emerald-400 mb-2" />
              <h3 className="font-bold text-sm text-white">ແບ່ງຕາມທີ່ກິນຈິງ</h3>
              <p className="text-xs text-emerald-200/80 mt-1">
                ຄົນ A ກິນ 40k, ຄົນ B ກິນ 30k, ຄົນ C ກິນ 20k + ຄ່ານ້ຳ 9k ຫານເທົ່າກັນ ຄິດໄລ່ຖືກຕ້ອງ 100%
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
              <TrendingUp className="w-6 h-6 text-teal-400 mb-2" />
              <h3 className="font-bold text-sm text-white">ຄິດໄລ່ຍອດໂອນໜ້ອຍສຸດ</h3>
              <p className="text-xs text-emerald-200/80 mt-1">
                ລະບົບຄຳນວນຈັບຄູ່ການໂອນເງິນໃຫ້ໜ້ອຍຄັ້ງທີ່ສຸດ ບໍ່ຕ້ອງໂອນໄປມາຫຼາຍຮອບ
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
              <ShieldCheck className="w-6 h-6 text-emerald-300 mb-2" />
              <h3 className="font-bold text-sm text-white">ຮອງຮັບ BCEL One</h3>
              <p className="text-xs text-emerald-200/80 mt-1">
                ແນບສະລິບການໂອນ, ສະແກນ QR Code OnePay, ແລະ ກົດຢືນຢັນການຮັບເງິນປອດໄພ
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Quick Seed Sample Data helper for first-time onboarding (creates demo restaurant with prompt's exact numbers!)
  const handleSeedPromptSampleData = async () => {
    setIsSeedingSample(true);
    try {
      let targetGroupId = activeGroup?.id;
      if (!targetGroupId) {
        targetGroupId = await createGroup('ໝູ່ກິນເຂົ້າທ່ຽງ', 'ກຸ່ມແບ່ງຄ່າອາຫານປະຈຳວັນ');
      }

      // Add sample expense:
      // Item 1: ຕຳໝາກຫຸ່ງ + ໄກ່ປິ້ງ (Person A eat 40,000 LAK)
      // Item 2: ເຂົ້າປຸ້ນນ້ຳແຈ່ວ (Person B eat 30,000 LAK)
      // Item 3: ເຂົ້າຜັດໝູ (Person C eat 20,000 LAK)
      // Shared Water: 9,000 LAK divided equally (3,000 LAK each)
      // Total: 99,000 LAK (A: 43k, B: 33k, C: 23k)
      const uids = members.length > 0 ? members.map((m) => m.userId) : [currentUser.uid];
      const uidA = uids[0] || currentUser.uid;
      const uidB = uids[1] || currentUser.uid;
      const uidC = uids[2] || currentUser.uid;

      await addExpense(
        {
          title: 'ອາຫານທ່ຽງຮ້ານຕຳແຊບ (ຕົວຢ່າງ)',
          restaurantName: 'ຮ້ານ ຕຳແຊບປາກເຊ',
          date: new Date().toISOString().split('T')[0],
          payerId: uidA,
          payerName: members.find((m) => m.userId === uidA)?.displayName || 'ຄົນ A (ຜູ້ຈ່າຍກ່ອນ)',
          totalAmount: 99000,
          foodTotal: 90000,
          sharedTotal: 9000,
          notes: 'ຕົວຢ່າງຕາມໂຈດ: ຄົນ A ກິນ 40k, ຄົນ B ກິນ 30k, ຄົນ C ກິນ 20k, ຄ່ານ້ຳ 9k ຫານ 3 ຄົນລະ 3k',
          splitType: 'itemized',
          memberShares: {
            [uidA]: 43000,
            [uidB]: 33000,
            [uidC]: 23000,
          },
        },
        [
          { name: 'ຕຳໝາກຫຸ່ງ + ໄກ່ປິ້ງ (ຄົນ A)', price: 40000, quantity: 1, assignedMemberIds: [uidA] },
          { name: 'ເຂົ້າປຸ້ນນ້ຳແຈ່ວ (ຄົນ B)', price: 30000, quantity: 1, assignedMemberIds: [uidB] },
          { name: 'ເຂົ້າຜັດໝູ (ຄົນ C)', price: 20000, quantity: 1, assignedMemberIds: [uidC] },
        ]
      );
    } catch (e) {
      console.error('Error seeding sample data:', e);
    } finally {
      setIsSeedingSample(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-20 md:pb-8 selection:bg-emerald-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        onOpenCreateGroup={() => setIsCreateGroupOpen(true)}
        onOpenJoinGroup={() => setIsJoinGroupOpen(true)}
        onOpenQrModal={() => setIsQrModalOpen(true)}
        onNavigateTab={(tab) => setActiveTab(tab)}
        activeTab={activeTab}
      />

      {/* Main View Router */}
      <main className="flex-1">
        {/* Onboarding Banner if user has 0 groups */}
        {groups.length === 0 ? (
          <div className="max-w-xl mx-auto mt-12 p-8 bg-white rounded-3xl border border-slate-200 shadow-sm text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto font-bold">
              <Users className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">ຍິນດີຕ້ອນຮັບສູ່ FriendPay Laos!</h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
              ທ່ານຍັງບໍ່ທັນມີກຸ່ມໝູ່. ເລີ່ມຕົ້ນດ້ວຍການສ້າງກຸ່ມໃໝ່ ຫຼື ເຂົ້າຮ່ວມກຸ່ມດ້ວຍລະຫັດເຊີນ
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setIsCreateGroupOpen(true)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                ສ້າງກຸ່ມທຳອິດຂອງທ່ານ
              </button>
              <button
                onClick={() => setIsJoinGroupOpen(true)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold transition-colors"
              >
                ເຂົ້າຮ່ວມດ້ວຍລະຫັດ
              </button>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <button
                onClick={handleSeedPromptSampleData}
                disabled={isSeedingSample}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1.5 underline"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {isSeedingSample ? 'ກຳລັງສ້າງ...' : 'ສ້າງກຸ່ມຕົວຢ່າງພ້ອມບິນອາຫານ 99,000 LAK (1-Click)'}
              </button>
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <DashboardView
                onOpenAddExpense={() => setIsAddExpenseOpen(true)}
                onOpenInvite={() => setActiveTab('groups')}
                onNavigateTab={(tab) => setActiveTab(tab)}
                onSelectExpense={(exp) => setSelectedExpense(exp)}
                onEditExpense={(exp) => setEditingExpense(exp)}
                onOpenQrModal={() => setIsQrModalOpen(true)}
                onPayDebt={(debt) => {
                  setInitialPaymentDebt(debt);
                  setActiveTab('settlements');
                }}
              />
            )}

            {activeTab === 'expenses' && (
              <ExpensesView
                onOpenAddExpense={() => setIsAddExpenseOpen(true)}
                onSelectExpense={(exp) => setSelectedExpense(exp)}
                onEditExpense={(exp) => setEditingExpense(exp)}
              />
            )}

            {activeTab === 'settlements' && (
              <SettlementsView
                initialPaymentDebt={initialPaymentDebt}
                onClearInitialPaymentDebt={() => setInitialPaymentDebt(null)}
              />
            )}

            {activeTab === 'groups' && (
              <GroupsView
                onOpenCreateGroup={() => setIsCreateGroupOpen(true)}
                onOpenJoinGroup={() => setIsJoinGroupOpen(true)}
              />
            )}

            {activeTab === 'profile' && <ProfileView />}
          </>
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        onNavigateTab={(tab) => setActiveTab(tab)}
        onOpenAddExpense={() => setIsAddExpenseOpen(true)}
      />

      {/* Global Modals */}
      <AddExpenseModal
        isOpen={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
      />

      <EditExpenseModal
        expense={editingExpense}
        isOpen={!!editingExpense}
        onClose={() => setEditingExpense(null)}
        onUpdated={(updated) => {
          if (selectedExpense?.id === updated.id) {
            setSelectedExpense(updated);
          }
        }}
      />

      <ExpenseDetailModal
        expense={selectedExpense}
        onClose={() => setSelectedExpense(null)}
        onEdit={(exp) => setEditingExpense(exp)}
      />

      <BankQrModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
      />

      <CreateGroupModal
        isOpen={isCreateGroupOpen}
        onClose={() => setIsCreateGroupOpen(false)}
      />

      <JoinGroupModal
        isOpen={isJoinGroupOpen}
        initialCode={inviteCodeFromUrl}
        onClose={() => {
          setIsJoinGroupOpen(false);
          setInviteCodeFromUrl('');
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <GroupProvider>
        <MainApp />
      </GroupProvider>
    </AuthProvider>
  );
}
