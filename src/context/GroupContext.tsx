/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  deleteDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { handleFirestoreError, OperationType } from '../firebase/errors';
import { useAuth } from './AuthContext';
import {
  Group,
  GroupMember,
  Expense,
  ExpenseItem,
  Settlement,
  DebtTransfer,
  MemberBalance,
  UserProfile,
} from '../types';
import { calculateGroupBalances, simplifyDebts } from '../utils/debtCalculator';

interface GroupContextType {
  groups: Group[];
  activeGroup: Group | null;
  members: GroupMember[];
  expenses: Expense[];
  settlements: Settlement[];
  balances: MemberBalance[];
  debts: DebtTransfer[];
  loadingGroups: boolean;
  loadingData: boolean;
  setActiveGroupId: (id: string) => void;
  createGroup: (name: string, description?: string) => Promise<string>;
  joinGroupByCode: (code: string) => Promise<boolean>;
  addExpense: (
    expenseData: Omit<Expense, 'id' | 'createdAt' | 'groupId' | 'createdBy'>,
    lineItems: Array<{ name: string; price: number; quantity: number; assignedMemberIds: string[] }>
  ) => Promise<string>;
  updateExpense: (
    expenseId: string,
    expenseData: Partial<Expense>,
    lineItems?: Array<{ name: string; price: number; quantity: number; assignedMemberIds: string[] }>
  ) => Promise<void>;
  getExpenseItems: (expenseId: string) => Promise<ExpenseItem[]>;
  deleteExpense: (expenseId: string) => Promise<void>;
  createSettlementPayment: (
    toUserId: string,
    toUserName: string,
    amount: number,
    proofUrl?: string,
    note?: string
  ) => Promise<string>;
  confirmPaymentReceived: (settlementId: string) => Promise<void>;
  addMemberByName: (displayName: string) => Promise<GroupMember>;
  removeMemberFromGroup: (memberUserId: string) => Promise<void>;
  getMemberProfile: (userId: string) => Promise<UserProfile | null>;
  copyInviteLink: () => string;
}

const GroupContext = createContext<GroupContextType | undefined>(undefined);

export function GroupProvider({ children }: { children: React.ReactNode }) {
  const { currentUser, userProfile } = useAuth();

  const [groups, setGroups] = useState<Group[]>([]);
  const [activeGroupId, setActiveGroupIdState] = useState<string | null>(() => {
    return localStorage.getItem('friendpay_active_group_id') || null;
  });
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loadingGroups, setLoadingGroups] = useState<boolean>(true);
  const [loadingData, setLoadingData] = useState<boolean>(false);

  // Set active group and persist
  const setActiveGroupId = (id: string) => {
    setActiveGroupIdState(id);
    localStorage.setItem('friendpay_active_group_id', id);
  };

  const activeGroup = useMemo(() => {
    return groups.find((g) => g.id === activeGroupId) || (groups.length > 0 ? groups[0] : null);
  }, [groups, activeGroupId]);

  // Sync activeGroupId if current selection is invalid
  useEffect(() => {
    if (groups.length > 0 && (!activeGroupId || !groups.find((g) => g.id === activeGroupId))) {
      setActiveGroupId(groups[0].id);
    }
  }, [groups, activeGroupId]);

  // 1. Listen to user's memberships to load groups
  useEffect(() => {
    if (!currentUser) {
      setGroups([]);
      setMembers([]);
      setExpenses([]);
      setSettlements([]);
      setLoadingGroups(false);
      return;
    }

    setLoadingGroups(true);
    const membershipsPath = 'groupMembers';
    const q = query(collection(db, membershipsPath), where('userId', '==', currentUser.uid));

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        try {
          const groupIds = snapshot.docs.map((doc) => doc.data().groupId as string);

          if (groupIds.length === 0) {
            setGroups([]);
            setLoadingGroups(false);
            return;
          }

          // Fetch group docs
          const fetchedGroups: Group[] = [];
          for (const gid of groupIds) {
            try {
              const gDoc = await getDoc(doc(db, 'groups', gid));
              if (gDoc.exists()) {
                fetchedGroups.push({ id: gDoc.id, ...gDoc.data() } as Group);
              }
            } catch (err) {
              console.warn(`Could not load group ${gid}:`, err);
            }
          }

          setGroups(fetchedGroups);
          setLoadingGroups(false);
        } catch (err) {
          handleFirestoreError(err, OperationType.LIST, membershipsPath);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, membershipsPath);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // 2. Listen to active group's data (members, expenses, settlements)
  useEffect(() => {
    if (!currentUser || !activeGroup) {
      setMembers([]);
      setExpenses([]);
      setSettlements([]);
      setLoadingData(false);
      return;
    }

    setLoadingData(true);
    const gid = activeGroup.id;

    // Listen to members
    const membersPath = 'groupMembers';
    const membersQuery = query(collection(db, membersPath), where('groupId', '==', gid));
    const unsubMembers = onSnapshot(
      membersQuery,
      (snapshot) => {
        const mems: GroupMember[] = [];
        snapshot.forEach((doc) => {
          mems.push({ id: doc.id, ...doc.data() } as GroupMember);
        });
        setMembers(mems);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, membersPath);
      }
    );

    // Listen to expenses
    const expensesPath = 'expenses';
    const expensesQuery = query(
      collection(db, expensesPath),
      where('groupId', '==', gid)
    );
    const unsubExpenses = onSnapshot(
      expensesQuery,
      (snapshot) => {
        const exps: Expense[] = [];
        snapshot.forEach((doc) => {
          exps.push({ id: doc.id, ...doc.data() } as Expense);
        });
        // Sort newest first
        exps.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setExpenses(exps);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, expensesPath);
      }
    );

    // Listen to settlements
    const settlementsPath = 'settlements';
    const settlementsQuery = query(
      collection(db, settlementsPath),
      where('groupId', '==', gid)
    );
    const unsubSettlements = onSnapshot(
      settlementsQuery,
      (snapshot) => {
        const settles: Settlement[] = [];
        snapshot.forEach((doc) => {
          settles.push({ id: doc.id, ...doc.data() } as Settlement);
        });
        settles.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setSettlements(settles);
        setLoadingData(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, settlementsPath);
      }
    );

    return () => {
      unsubMembers();
      unsubExpenses();
      unsubSettlements();
    };
  }, [currentUser, activeGroup?.id]);

  // Compute Balances and Simplified Debts
  const balances = useMemo(() => {
    if (!members.length) return [];
    return calculateGroupBalances(expenses, members, settlements);
  }, [expenses, members, settlements]);

  const debts = useMemo(() => {
    if (!balances.length) return [];
    return simplifyDebts(balances, settlements);
  }, [balances, settlements]);

  // Create new Group
  const createGroup = async (name: string, description: string = ''): Promise<string> => {
    if (!currentUser) throw new Error('ຕ້ອງເຂົ້າສູ່ລະບົບກ່ອນ');

    const groupId = 'grp_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
    const inviteCode = 'FP-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    const now = new Date().toISOString();

    const newGroup: Group = {
      id: groupId,
      name: name.trim(),
      description: description.trim(),
      ownerId: currentUser.uid,
      inviteCode,
      memberCount: 1,
      createdAt: now,
      updatedAt: now,
    };

    // 1. Create Group document
    const groupPath = `groups/${groupId}`;
    try {
      await setDoc(doc(db, 'groups', groupId), newGroup);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, groupPath);
    }

    // 2. Create Owner Membership
    const membershipId = `${groupId}_${currentUser.uid}`;
    const memberPath = `groupMembers/${membershipId}`;
    const ownerMember: GroupMember = {
      id: membershipId,
      groupId,
      userId: currentUser.uid,
      role: 'owner',
      displayName: userProfile?.displayName || currentUser.displayName || 'ຂ້ອຍ',
      photoURL: userProfile?.photoURL || currentUser.photoURL || '',
      email: currentUser.email || '',
      joinedAt: now,
    };

    try {
      await setDoc(doc(db, 'groupMembers', membershipId), ownerMember);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, memberPath);
    }

    // 3. Create Invitation record
    const invitePath = `invitations/${inviteCode}`;
    try {
      await setDoc(doc(db, 'invitations', inviteCode), {
        id: inviteCode,
        groupId,
        groupName: name.trim(),
        inviteCode,
        createdBy: currentUser.uid,
        createdAt: now,
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, invitePath);
    }

    // Add to local state & switch
    setGroups((prev) => [newGroup, ...prev]);
    setActiveGroupId(groupId);

    return groupId;
  };

  // Join Group via Invite Code
  const joinGroupByCode = async (code: string): Promise<boolean> => {
    if (!currentUser) throw new Error('ຕ້ອງເຂົ້າສູ່ລະບົບກ່ອນ');
    const cleanCode = code.trim().toUpperCase();

    // Look up invitation
    const inviteDoc = await getDoc(doc(db, 'invitations', cleanCode));
    if (!inviteDoc.exists()) {
      // Also check groups directly if code is groupId or group.inviteCode
      const groupsQuery = query(collection(db, 'groups'), where('inviteCode', '==', cleanCode));
      const groupSnap = await getDocs(groupsQuery);
      if (groupSnap.empty) {
        throw new Error('ບໍ່ພົບກຸ່ມ ຫຼື ລະຫັດເຊີນບໍ່ຖືກຕ້ອງ');
      }
      const targetGroup = groupSnap.docs[0].data() as Group;
      return await joinGroupDirectly(targetGroup.id);
    }

    const { groupId } = inviteDoc.data();
    return await joinGroupDirectly(groupId);
  };

  const joinGroupDirectly = async (groupId: string): Promise<boolean> => {
    if (!currentUser) return false;

    const membershipId = `${groupId}_${currentUser.uid}`;
    const memDoc = await getDoc(doc(db, 'groupMembers', membershipId));

    if (!memDoc.exists()) {
      const now = new Date().toISOString();
      const newMember: GroupMember = {
        id: membershipId,
        groupId,
        userId: currentUser.uid,
        role: 'member',
        displayName: userProfile?.displayName || currentUser.displayName || 'ສະມາຊິກໃໝ່',
        photoURL: userProfile?.photoURL || currentUser.photoURL || '',
        email: currentUser.email || '',
        joinedAt: now,
      };

      await setDoc(doc(db, 'groupMembers', membershipId), newMember);

      // Increment member count
      const gDoc = await getDoc(doc(db, 'groups', groupId));
      if (gDoc.exists()) {
        const count = (gDoc.data().memberCount || 1) + 1;
        await updateDoc(doc(db, 'groups', groupId), {
          memberCount: count,
          updatedAt: now,
        });
      }
    }

    setActiveGroupId(groupId);
    return true;
  };

  // Add Expense with itemized list
  const addExpense = async (
    expenseData: Omit<Expense, 'id' | 'createdAt' | 'groupId' | 'createdBy'>,
    lineItems: Array<{ name: string; price: number; quantity: number; assignedMemberIds: string[] }>
  ): Promise<string> => {
    if (!currentUser || !activeGroup) throw new Error('ບໍ່ມີກຸ່ມທີ່ເລືອກ');

    const expenseId = 'exp_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
    const now = new Date().toISOString();

    const fullExpense: Expense = {
      ...expenseData,
      id: expenseId,
      groupId: activeGroup.id,
      createdBy: currentUser.uid,
      createdAt: now,
      updatedAt: now,
    };

    // 1. Save expense
    const expPath = `expenses/${expenseId}`;
    try {
      await setDoc(doc(db, 'expenses', expenseId), fullExpense);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, expPath);
    }

    // 2. Save line items in expenseItems collection
    for (const item of lineItems) {
      const itemId = 'item_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
      const itemPath = `expenseItems/${itemId}`;
      const fullItem: ExpenseItem = {
        id: itemId,
        expenseId,
        groupId: activeGroup.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        assignedMemberIds: item.assignedMemberIds,
        createdAt: now,
      };
      try {
        await setDoc(doc(db, 'expenseItems', itemId), fullItem);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, itemPath);
      }
    }

    return expenseId;
  };

  // Update existing expense
  const updateExpense = async (
    expenseId: string,
    expenseData: Partial<Expense>,
    lineItems?: Array<{ name: string; price: number; quantity: number; assignedMemberIds: string[] }>
  ): Promise<void> => {
    if (!currentUser || !activeGroup) throw new Error('ບໍ່ມີກຸ່ມທີ່ເລືອກ');

    const expPath = `expenses/${expenseId}`;
    const now = new Date().toISOString();

    const updatedData = {
      ...expenseData,
      updatedAt: now,
    };

    try {
      await updateDoc(doc(db, 'expenses', expenseId), updatedData);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, expPath);
    }

    if (lineItems && lineItems.length > 0) {
      try {
        const itemsQ = query(collection(db, 'expenseItems'), where('expenseId', '==', expenseId));
        const itemSnaps = await getDocs(itemsQ);
        for (const itemDoc of itemSnaps.docs) {
          await deleteDoc(doc(db, 'expenseItems', itemDoc.id));
        }

        for (const item of lineItems) {
          const itemId = 'item_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
          const itemPath = `expenseItems/${itemId}`;
          const fullItem: ExpenseItem = {
            id: itemId,
            expenseId,
            groupId: activeGroup.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            assignedMemberIds: item.assignedMemberIds,
            createdAt: now,
          };
          await setDoc(doc(db, 'expenseItems', itemId), fullItem);
        }
      } catch (err) {
        console.warn('Could not update line items:', err);
      }
    }
  };

  // Fetch expense line items
  const getExpenseItems = async (expenseId: string): Promise<ExpenseItem[]> => {
    try {
      const q = query(collection(db, 'expenseItems'), where('expenseId', '==', expenseId));
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ExpenseItem));
    } catch (e) {
      console.warn('Could not fetch items:', e);
      return [];
    }
  };

  // Delete expense
  const deleteExpense = async (expenseId: string) => {
    if (!currentUser) return;
    const path = `expenses/${expenseId}`;
    try {
      await deleteDoc(doc(db, 'expenses', expenseId));
      // Clean local list
      setExpenses((prev) => prev.filter((e) => e.id !== expenseId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  // Record settlement payment (Payer marks "I have paid")
  const createSettlementPayment = async (
    toUserId: string,
    toUserName: string,
    amount: number,
    proofUrl?: string,
    note?: string
  ): Promise<string> => {
    if (!currentUser || !activeGroup) throw new Error('ບໍ່ມີກຸ່ມທີ່ເລືອກ');

    const settlementId = 'stl_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
    const now = new Date().toISOString();

    const newSettlement: Settlement = {
      id: settlementId,
      groupId: activeGroup.id,
      fromUserId: currentUser.uid,
      fromUserName: userProfile?.displayName || currentUser.displayName || 'ຂ້ອຍ',
      toUserId,
      toUserName,
      amount,
      status: 'awaiting_confirmation',
      proofUrl: proofUrl || '',
      note: note || '',
      createdAt: now,
      updatedAt: now,
      paidAt: now,
    };

    const path = `settlements/${settlementId}`;
    try {
      await setDoc(doc(db, 'settlements', settlementId), newSettlement);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }

    return settlementId;
  };

  // Confirm payment received (Recipient confirms)
  const confirmPaymentReceived = async (settlementId: string) => {
    if (!currentUser) return;
    const path = `settlements/${settlementId}`;
    const now = new Date().toISOString();

    try {
      await updateDoc(doc(db, 'settlements', settlementId), {
        status: 'paid',
        confirmedAt: now,
        updatedAt: now,
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  // Add friend directly by name (without invite link)
  const addMemberByName = async (displayName: string): Promise<GroupMember> => {
    if (!currentUser || !activeGroup) throw new Error('ບໍ່ມີກຸ່ມທີ່ເລືອກ');
    const cleanName = displayName.trim();
    if (!cleanName) throw new Error('ກະລຸນາປ້ອນຊື່ໝູ່');

    const memberCustomId = 'mem_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
    const membershipId = `${activeGroup.id}_${memberCustomId}`;
    const now = new Date().toISOString();

    const newMember: GroupMember = {
      id: membershipId,
      groupId: activeGroup.id,
      userId: memberCustomId,
      role: 'member',
      displayName: cleanName,
      photoURL: `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanName}`,
      joinedAt: now,
    };

    const path = `groupMembers/${membershipId}`;
    try {
      await setDoc(doc(db, 'groupMembers', membershipId), newMember);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }

    // Increment member count on group
    try {
      const gDoc = await getDoc(doc(db, 'groups', activeGroup.id));
      if (gDoc.exists()) {
        const count = (gDoc.data().memberCount || members.length) + 1;
        await updateDoc(doc(db, 'groups', activeGroup.id), {
          memberCount: count,
          updatedAt: now,
        });
      }
    } catch (e) {
      console.warn('Could not increment member count:', e);
    }

    setMembers((prev) => [...prev, newMember]);
    return newMember;
  };

  // Remove member from group (Owner action)
  const removeMemberFromGroup = async (memberUserId: string) => {
    if (!currentUser || !activeGroup) return;
    if (activeGroup.ownerId !== currentUser.uid && memberUserId !== currentUser.uid) {
      throw new Error('ສະເພາະຫົວໜ້າກຸ່ມຈຶ່ງສາມາດລຶບສະມາຊິກໄດ້');
    }

    const membershipId = `${activeGroup.id}_${memberUserId}`;
    const path = `groupMembers/${membershipId}`;
    try {
      await deleteDoc(doc(db, 'groupMembers', membershipId));
      setMembers((prev) => prev.filter((m) => m.userId !== memberUserId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  // Fetch a user profile (e.g. for bank account details & QR code)
  const getMemberProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
      const snap = await getDoc(doc(db, 'users', userId));
      if (snap.exists()) {
        return snap.data() as UserProfile;
      }
    } catch (e) {
      console.warn('Could not fetch user profile:', e);
    }
    return null;
  };

  // Generate invite URL
  const copyInviteLink = (): string => {
    if (!activeGroup) return '';
    const origin = window.location.origin;
    return `${origin}?invite=${activeGroup.inviteCode}`;
  };

  return (
    <GroupContext.Provider
      value={{
        groups,
        activeGroup,
        members,
        expenses,
        settlements,
        balances,
        debts,
        loadingGroups,
        loadingData,
        setActiveGroupId,
        createGroup,
        joinGroupByCode,
        addExpense,
        updateExpense,
        getExpenseItems,
        deleteExpense,
        createSettlementPayment,
        confirmPaymentReceived,
        addMemberByName,
        removeMemberFromGroup,
        getMemberProfile,
        copyInviteLink,
      }}
    >
      {children}
    </GroupContext.Provider>
  );
}

export function useGroup() {
  const ctx = useContext(GroupContext);
  if (!ctx) {
    throw new Error('useGroup must be used within a GroupProvider');
  }
  return ctx;
}
