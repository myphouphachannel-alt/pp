/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface UserProfile {
  id: string; // Auth UID
  email: string;
  displayName: string;
  photoURL?: string;
  bankName?: string; // e.g. "BCEL One", "LDB Trust", "JDB Yes", "Kasikornthai"
  bankAccountNumber?: string;
  bankAccountName?: string;
  qrCodeUrl?: string; // OnePay / BCEL QR code image URL or data
  createdAt?: string;
  updatedAt?: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  inviteCode: string;
  memberCount: number;
  memberIds?: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface GroupMember {
  id: string; // usually `${groupId}_${userId}`
  groupId: string;
  userId: string;
  role: 'owner' | 'member';
  displayName: string;
  photoURL?: string;
  email?: string;
  joinedAt: string;
}

export interface ExpenseItem {
  id: string;
  expenseId: string;
  groupId: string;
  name: string;
  price: number; // LAK
  quantity: number;
  assignedMemberIds: string[]; // List of userIds who ate this item
  createdAt?: string;
}

export interface MemberShare {
  userId: string;
  userName: string;
  foodShare: number;
  sharedExtraShare: number; // water, tips, service fee
  totalShare: number;
}

export interface Expense {
  id: string;
  groupId: string;
  title: string; // e.g. "ຕຳແຊບປາກເຊ ອາຫານທ່ຽງ"
  restaurantName: string; // e.g. "ຮ້ານ ນາງນ້ອຍ"
  date: string; // YYYY-MM-DD or ISO
  payerId: string;
  payerName: string;
  totalAmount: number; // LAK
  foodTotal: number;
  sharedTotal: number; // water, service fee, tips
  receiptUrl?: string;
  notes?: string;
  splitType: 'itemized' | 'equal' | 'custom';
  memberShares: Record<string, number>; // userId -> totalShare in LAK
  items?: ExpenseItem[];
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Settlement {
  id: string;
  groupId: string;
  fromUserId: string; // Debtor
  fromUserName: string;
  toUserId: string; // Creditor
  toUserName: string;
  amount: number; // LAK
  status: 'pending' | 'awaiting_confirmation' | 'paid';
  proofUrl?: string; // Transfer slip image
  note?: string;
  createdAt: string;
  updatedAt?: string;
  paidAt?: string; // when payer marked as paid
  confirmedAt?: string; // when receiver confirmed
}

export interface DebtTransfer {
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  amount: number;
  settlementId?: string;
  status: 'pending' | 'awaiting_confirmation' | 'paid';
  proofUrl?: string;
}

export interface MemberBalance {
  userId: string;
  userName: string;
  photoURL?: string;
  totalPaid: number; // What they actually paid upfront
  totalShare: number; // What their fair share is
  netBalance: number; // totalPaid - totalShare (positive = owed money, negative = owes money)
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'expense_added' | 'payment_sent' | 'payment_confirmed' | 'group_invite';
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export interface Invitation {
  id: string;
  groupId: string;
  groupName: string;
  inviteCode: string;
  createdBy: string;
  createdAt: string;
}
