/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Users,
  Plus,
  Share2,
  Check,
  Copy,
  Trash2,
  Crown,
  ShieldAlert,
  MessageCircle,
  ExternalLink,
  Sparkles,
  UserPlus,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useGroup } from '../context/GroupContext';
import { GroupMember } from '../types';

interface GroupsViewProps {
  onOpenCreateGroup: () => void;
  onOpenJoinGroup: () => void;
}

export const GroupsView: React.FC<GroupsViewProps> = ({
  onOpenCreateGroup,
  onOpenJoinGroup,
}) => {
  const { currentUser } = useAuth();
  const {
    groups,
    activeGroup,
    setActiveGroupId,
    members,
    addMemberByName,
    removeMemberFromGroup,
    copyInviteLink,
  } = useGroup();

  const [copied, setCopied] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<GroupMember | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  // Direct add friend state
  const [directFriendName, setDirectFriendName] = useState('');
  const [isAddingDirect, setIsAddingDirect] = useState(false);
  const [directAddError, setDirectAddError] = useState('');
  const [directAddSuccess, setDirectAddSuccess] = useState('');

  const handleAddDirectFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!directFriendName.trim()) return;
    setIsAddingDirect(true);
    setDirectAddError('');
    setDirectAddSuccess('');
    try {
      await addMemberByName(directFriendName.trim());
      setDirectAddSuccess(`ເພີ່ມ "${directFriendName.trim()}" ເຂົ້າກຸ່ມສຳເລັດແລ້ວ!`);
      setDirectFriendName('');
      setTimeout(() => setDirectAddSuccess(''), 3000);
    } catch (err: any) {
      setDirectAddError(err.message || 'ເກີດຂໍ້ຜິດພາດ');
    } finally {
      setIsAddingDirect(false);
    }
  };

  const inviteLink = copyInviteLink();

  const handleCopy = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleShareWhatsApp = () => {
    if (!inviteLink || !activeGroup) return;
    const text = `ສະບາຍດີ! ເຂົ້າຮ່ວມກຸ່ມ "${activeGroup.name}" ໃນ FriendPay Laos ເພື່ອແບ່ງຄ່າອາຫານນຳກັນ: ${inviteLink}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleShareMessenger = () => {
    if (!inviteLink) return;
    // Fallback: Copy link and inform user
    handleCopy();
  };

  const isOwner = activeGroup && currentUser && activeGroup.ownerId === currentUser.uid;

  const handleConfirmRemove = async () => {
    if (!memberToRemove) return;
    setIsRemoving(true);
    try {
      await removeMemberFromGroup(memberToRemove.userId);
      setMemberToRemove(null);
    } catch (e) {
      console.error(e);
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-600" />
            ຈັດການກຸ່ມໝູ່
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            ສ້າງກຸ່ມ, ເຊີນໝູ່ເຂົ້າຮ່ວມ, ແລະ ຈັດການສະມາຊິກ
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenJoinGroup}
            className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs sm:text-sm font-semibold transition-colors"
          >
            ເຂົ້າຮ່ວມດ້ວຍລະຫັດ
          </button>
          <button
            onClick={onOpenCreateGroup}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            ສ້າງກຸ່ມໃໝ່
          </button>
        </div>
      </div>

      {/* Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: List of Groups */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
            ກຸ່ມທັງໝົດຂອງທ່ານ ({groups.length})
          </h2>

          <div className="space-y-2.5">
            {groups.map((group) => {
              const isActive = activeGroup?.id === group.id;
              const isGroupOwner = group.ownerId === currentUser?.uid;

              return (
                <div
                  key={group.id}
                  onClick={() => setActiveGroupId(group.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isActive
                      ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-500/20'
                      : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                        isActive
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 line-clamp-1">
                        {group.name}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                        <span>{group.memberCount || 1} ສະມາຊິກ</span>
                        {isGroupOwner && (
                          <span className="text-[10px] text-amber-700 font-semibold bg-amber-100 px-1.5 py-0.2 rounded">
                            ຫົວໜ້າກຸ່ມ
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {isActive && (
                    <span className="text-xs font-semibold text-emerald-700 bg-white px-2 py-0.5 rounded-full border border-emerald-200 shadow-2xs">
                      ກຳລັງເລືອກ
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column (2 cols): Active Group Detail, Invite Links, Members */}
        {activeGroup && (
          <div className="md:col-span-2 space-y-6">
            {/* Invite Sharing Card */}
            <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-emerald-50 via-teal-50/40 to-slate-50 border border-emerald-100 shadow-sm space-y-4">
              <div>
                <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Share2 className="w-3.5 h-3.5" />
                  ເຊີນໝູ່ເຂົ້າກຸ່ມ "{activeGroup.name}"
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">
                  ສົ່ງລິ້ງ ຫຼື ລະຫັດເຊີນໃຫ້ໝູ່ຜ່ານແຊັດ
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  ເມື່ອໝູ່ເປີດລິ້ງ ລະບົບຈະພາເຂົ້າກຸ່ມອັດຕະໂນມັດ ໂດຍບໍ່ຕ້ອງພິມລະຫັດເອງ
                </p>
              </div>

              {/* Invite Code & Link Box */}
              <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-inner flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400">ລະຫັດເຊີນ:</span>
                  <span className="font-mono font-extrabold text-base text-emerald-800 tracking-wider bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                    {activeGroup.inviteCode}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-colors flex items-center justify-center gap-1.5"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'ຄັດລອກລິ້ງແລ້ວ!' : 'ຄັດລອກລິ້ງ'}</span>
                  </button>

                  <button
                    onClick={handleShareWhatsApp}
                    className="px-3 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-semibold shadow-sm transition-colors flex items-center gap-1"
                    title="ສົ່ງຜ່ານ WhatsApp"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">WhatsApp</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Members List */}
            <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <span>ລາຍຊື່ສະມາຊິກໃນກຸ່ມ</span>
                    <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {members.length} ຄົນ
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {isOwner ? 'ທ່ານເປັນຫົວໜ້າກຸ່ມ ສາມາດຈັດການສະມາຊິກໄດ້' : 'ສະມາຊິກໃນກຸ່ມນີ້'}
                  </p>
                </div>
              </div>

              {/* Add friend directly by name (ບໍ່ຜ່ານການເຊີນ) */}
              <form
                onSubmit={handleAddDirectFriend}
                className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50/80 to-teal-50/60 border border-emerald-200/80 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                    <UserPlus className="w-4 h-4 text-emerald-600" />
                    ເພີ່ມຊື່ໝູ່ໃສ່ກຸ່ມໂດຍກົງ (ບໍ່ຕ້ອງເຊີນ)
                  </span>
                  <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-100 px-2 py-0.5 rounded-full">
                    ໝູ່ບໍ່ຈຳເປັນຕ້ອງມີບັນຊີ
                  </span>
                </div>

                {directAddError && (
                  <p className="text-xs text-red-600">{directAddError}</p>
                )}
                {directAddSuccess && (
                  <p className="text-xs text-emerald-700 font-semibold">{directAddSuccess}</p>
                )}

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={directFriendName}
                    onChange={(e) => setDirectFriendName(e.target.value)}
                    placeholder="ປ້ອນຊື່ໝູ່ ເຊັ່ນ: ສົມສັກ, ບຸນມີ, ນາງ ນ້ອຍ..."
                    className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-emerald-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                  <button
                    type="submit"
                    disabled={isAddingDirect || !directFriendName.trim()}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isAddingDirect ? 'ກຳລັງເພີ່ມ...' : 'ເພີ່ມເຂົ້າກຸ່ມ'}</span>
                  </button>
                </div>
              </form>

              <div className="divide-y divide-slate-100">
                {members.map((member) => {
                  const isMemberOwner = member.role === 'owner' || member.userId === activeGroup.ownerId;
                  const isMe = member.userId === currentUser?.uid;

                  return (
                    <div
                      key={member.id}
                      className="py-3 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            member.photoURL ||
                            `https://api.dicebear.com/7.x/bottts/svg?seed=${member.userId}`
                          }
                          alt={member.displayName}
                          className="w-10 h-10 rounded-full border border-slate-200 object-cover bg-emerald-50"
                        />
                        <div>
                          <div className="font-semibold text-slate-900 flex items-center gap-1.5 text-sm">
                            <span>{member.displayName}</span>
                            {isMe && <span className="text-slate-400 text-xs">(ຂ້ອຍ)</span>}
                            {isMemberOwner && (
                              <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded-md flex items-center gap-0.5">
                                <Crown className="w-2.5 h-2.5" />
                                ຫົວໜ້າກຸ່ມ
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400">
                            ເຂົ້າຮ່ວມ: {new Date(member.joinedAt).toLocaleDateString('lo-LA')}
                          </span>
                        </div>
                      </div>

                      {/* Owner can remove non-owner members */}
                      {isOwner && !isMemberOwner && !isMe && (
                        <button
                          onClick={() => setMemberToRemove(member)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="ລຶບສະມາຊິກອອກຈາກກຸ່ມ"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Remove Member Modal */}
      {memberToRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900">
                ລຶບ {memberToRemove.displayName} ອອກຈາກກຸ່ມ?
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                ສະມາຊິກຄົນນີ້ຈະບໍ່ສາມາດເຂົ້າເບິ່ງລາຍຈ່າຍຂອງກຸ່ມນີ້ໄດ້ອີກຕໍ່ໄປ
              </p>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => setMemberToRemove(null)}
                className="flex-1 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                ຍົກເລີກ
              </button>
              <button
                onClick={handleConfirmRemove}
                disabled={isRemoving}
                className="flex-1 py-2 rounded-xl bg-red-600 text-white text-xs font-semibold hover:bg-red-700 disabled:opacity-50"
              >
                {isRemoving ? 'ກຳລັງລຶບ...' : 'ຢືນຢັນລຶບ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
