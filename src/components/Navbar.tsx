/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Users,
  ChevronDown,
  Plus,
  Share2,
  Check,
  LogOut,
  User as UserIcon,
  Receipt,
  QrCode,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useGroup } from '../context/GroupContext';

interface NavbarProps {
  onOpenCreateGroup: () => void;
  onOpenJoinGroup: () => void;
  onNavigateTab: (tab: 'dashboard' | 'expenses' | 'settlements' | 'groups' | 'profile') => void;
  activeTab: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenCreateGroup,
  onOpenJoinGroup,
  onNavigateTab,
  activeTab,
}) => {
  const { currentUser, userProfile, logout } = useAuth();
  const { groups, activeGroup, setActiveGroupId, copyInviteLink } = useGroup();

  const [groupDropdownOpen, setGroupDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    const link = copyInviteLink();
    if (link) {
      navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigateTab('dashboard')}
              className="flex items-center gap-2.5 text-left group transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xl font-bold bg-gradient-to-r from-emerald-700 to-teal-600 bg-clip-text text-transparent flex items-center gap-1.5">
                  FriendPay
                  <span className="text-xs px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-semibold">
                    ລາວ (LAK)
                  </span>
                </span>
                <p className="text-[11px] text-slate-500 font-medium -mt-1 hidden sm:block">
                  ແບ່ງຄ່າອາຫານ & ຈັດການລາຍຈ່າຍ
                </p>
              </div>
            </button>

            {/* Group Selector Dropdown */}
            {currentUser && (
              <div className="relative ml-2 sm:ml-6">
                <button
                  onClick={() => setGroupDropdownOpen(!groupDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition-colors border border-slate-200/70"
                >
                  <Users className="w-4 h-4 text-emerald-600" />
                  <span className="max-w-[130px] sm:max-w-[180px] truncate">
                    {activeGroup ? activeGroup.name : 'ເລືອກກຸ່ມ'}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {groupDropdownOpen && (
                  <div
                    className="absolute left-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                    onMouseLeave={() => setGroupDropdownOpen(false)}
                  >
                    <div className="px-3 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      ກຸ່ມຂອງເຈົ້າ ({groups.length})
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                      {groups.map((g) => (
                        <button
                          key={g.id}
                          onClick={() => {
                            setActiveGroupId(g.id);
                            setGroupDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3.5 py-2.5 text-sm flex items-center justify-between transition-colors ${
                            activeGroup?.id === g.id
                              ? 'bg-emerald-50 text-emerald-800 font-medium'
                              : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <span className="truncate">{g.name}</span>
                          {activeGroup?.id === g.id && (
                            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                          )}
                        </button>
                      ))}
                    </div>

                    <div className="border-t border-slate-100 my-1 pt-1">
                      <button
                        onClick={() => {
                          setGroupDropdownOpen(false);
                          onOpenCreateGroup();
                        }}
                        className="w-full text-left px-3.5 py-2 text-sm text-emerald-700 hover:bg-emerald-50 flex items-center gap-2 font-medium"
                      >
                        <Plus className="w-4 h-4" />
                        ສ້າງກຸ່ມໃໝ່
                      </button>
                      <button
                        onClick={() => {
                          setGroupDropdownOpen(false);
                          onOpenJoinGroup();
                        }}
                        className="w-full text-left px-3.5 py-2 text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <Users className="w-4 h-4" />
                        ເຂົ້າຮ່ວມດ້ວຍລະຫັດ
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => onNavigateTab('dashboard')}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'dashboard'
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              ໜ້າຫຼັກ
            </button>
            <button
              onClick={() => onNavigateTab('expenses')}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'expenses'
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              ລາຍຈ່າຍ
            </button>
            <button
              onClick={() => onNavigateTab('settlements')}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'settlements'
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              ການຊຳລະເງິນ
            </button>
            <button
              onClick={() => onNavigateTab('groups')}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'groups'
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              ກຸ່ມໝູ່
            </button>
          </nav>

          {/* Right Header Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {activeGroup && (
              <button
                onClick={handleCopyLink}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors border border-emerald-200"
                title="ຄັດລອກລິ້ງເຊີນໝູ່ເຂົ້າກຸ່ມ"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                {copied ? 'ຄັດລອກແລ້ວ!' : 'ເຊີນໝູ່'}
              </button>
            )}

            {/* Profile Menu */}
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-emerald-400 transition-all"
                >
                  <img
                    src={
                      userProfile?.photoURL ||
                      currentUser.photoURL ||
                      `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.uid}`
                    }
                    alt={userProfile?.displayName || 'User'}
                    className="w-9 h-9 rounded-full object-cover border border-slate-200 bg-emerald-100"
                  />
                </button>

                {profileDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-50 animate-in fade-in duration-150"
                    onMouseLeave={() => setProfileDropdownOpen(false)}
                  >
                    <div className="px-4 py-2.5 border-b border-slate-100">
                      <p className="text-sm font-semibold text-slate-800 truncate">
                        {userProfile?.displayName || currentUser.displayName || 'ຜູ້ໃຊ້ FriendPay'}
                      </p>
                      <p className="text-xs text-slate-500 truncate">{currentUser.email}</p>
                      {userProfile?.bankAccountNumber ? (
                        <span className="inline-block mt-1 text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-medium">
                          {userProfile.bankName || 'BCEL One'}: {userProfile.bankAccountNumber}
                        </span>
                      ) : (
                        <span className="inline-block mt-1 text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-medium">
                          ຍັງບໍ່ໃສ່ເລກບັນຊີທະນາຄານ
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        onNavigateTab('profile');
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2.5"
                    >
                      <UserIcon className="w-4 h-4 text-slate-400" />
                      ແກ້ໄຂໂປຣໄຟລ໌ & ບັນຊີ
                    </button>

                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        logout();
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2.5 border-t border-slate-100"
                    >
                      <LogOut className="w-4 h-4 text-red-400" />
                      ອອກຈາກລະບົບ
                    </button>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
};
