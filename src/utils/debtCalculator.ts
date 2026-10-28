/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Expense, ExpenseItem, GroupMember, Settlement, DebtTransfer, MemberBalance } from '../types';

/**
 * Calculates individual breakdown for a bill given line items, shared fees, and participants.
 */
export function calculateItemizedBillShares(
  items: Array<{ name: string; price: number; quantity: number; assignedMemberIds: string[] }>,
  participantIds: string[],
  sharedTotal: number = 0
): {
  foodTotal: number;
  totalAmount: number;
  memberShares: Record<string, { foodShare: number; sharedFeeShare: number; totalShare: number }>;
} {
  const memberShares: Record<string, { foodShare: number; sharedFeeShare: number; totalShare: number }> = {};

  participantIds.forEach(id => {
    memberShares[id] = { foodShare: 0, sharedFeeShare: 0, totalShare: 0 };
  });

  let foodTotal = 0;

  // 1. Calculate food items share
  items.forEach(item => {
    const itemTotal = item.price * (item.quantity || 1);
    foodTotal += itemTotal;

    const assigned = item.assignedMemberIds && item.assignedMemberIds.length > 0
      ? item.assignedMemberIds.filter(id => participantIds.includes(id))
      : participantIds;

    const count = assigned.length > 0 ? assigned.length : 1;
    const splitPerPerson = Math.floor(itemTotal / count);
    const remainder = itemTotal - splitPerPerson * count;

    assigned.forEach((memberId, idx) => {
      if (!memberShares[memberId]) {
        memberShares[memberId] = { foodShare: 0, sharedFeeShare: 0, totalShare: 0 };
      }
      // Give 1 extra kip for remainder to the first eaters
      const bonus = idx < remainder ? 1 : 0;
      memberShares[memberId].foodShare += splitPerPerson + bonus;
    });
  });

  // 2. Calculate shared extras (e.g. water, service charge, tip) evenly among all active participants
  const totalAmount = foodTotal + sharedTotal;
  const numParticipants = participantIds.length;

  if (numParticipants > 0 && sharedTotal > 0) {
    const baseSharedPerPerson = Math.floor(sharedTotal / numParticipants);
    const sharedRemainder = sharedTotal - baseSharedPerPerson * numParticipants;

    participantIds.forEach((id, idx) => {
      const bonus = idx < sharedRemainder ? 1 : 0;
      memberShares[id].sharedFeeShare = baseSharedPerPerson + bonus;
    });
  }

  // 3. Compute total per person and ensure sum equals totalAmount
  let calculatedSum = 0;
  participantIds.forEach(id => {
    const item = memberShares[id];
    item.totalShare = item.foodShare + item.sharedFeeShare;
    calculatedSum += item.totalShare;
  });

  // Reconcile any rounding diff
  const diff = totalAmount - calculatedSum;
  if (diff !== 0 && participantIds.length > 0) {
    memberShares[participantIds[0]].totalShare += diff;
  }

  return {
    foodTotal,
    totalAmount,
    memberShares,
  };
}

/**
 * Calculates net balance for every member in the group.
 * Net Balance = Total Paid Upfront - Total Fair Share + Confirmed Sent Payments - Confirmed Received Payments
 */
export function calculateGroupBalances(
  expenses: Expense[],
  members: GroupMember[],
  settlements: Settlement[]
): MemberBalance[] {
  const memberMap = new Map<string, GroupMember>();
  members.forEach(m => memberMap.set(m.userId, m));

  const totalPaidMap: Record<string, number> = {};
  const totalShareMap: Record<string, number> = {};
  const paymentsSentMap: Record<string, number> = {};
  const paymentsReceivedMap: Record<string, number> = {};

  members.forEach(m => {
    totalPaidMap[m.userId] = 0;
    totalShareMap[m.userId] = 0;
    paymentsSentMap[m.userId] = 0;
    paymentsReceivedMap[m.userId] = 0;
  });

  // Accumulate expense paid vs share
  expenses.forEach(exp => {
    if (totalPaidMap[exp.payerId] !== undefined) {
      totalPaidMap[exp.payerId] += exp.totalAmount;
    } else {
      totalPaidMap[exp.payerId] = exp.totalAmount;
    }

    if (exp.memberShares) {
      Object.entries(exp.memberShares).forEach(([userId, shareAmount]) => {
        if (totalShareMap[userId] !== undefined) {
          totalShareMap[userId] += shareAmount;
        } else {
          totalShareMap[userId] = shareAmount;
        }
      });
    }
  });

  // Factor in settlements (paid or confirmed)
  settlements.forEach(settle => {
    if (settle.status === 'paid') {
      if (paymentsSentMap[settle.fromUserId] !== undefined) {
        paymentsSentMap[settle.fromUserId] += settle.amount;
      }
      if (paymentsReceivedMap[settle.toUserId] !== undefined) {
        paymentsReceivedMap[settle.toUserId] += settle.amount;
      }
    }
  });

  // Compute final net balances
  const balances: MemberBalance[] = [];
  const allUserIds = new Set([
    ...members.map(m => m.userId),
    ...Object.keys(totalPaidMap),
    ...Object.keys(totalShareMap),
  ]);

  allUserIds.forEach(userId => {
    const member = memberMap.get(userId);
    const userName = member?.displayName || 'ສະມາຊິກ';
    const photoURL = member?.photoURL;
    const paid = totalPaidMap[userId] || 0;
    const share = totalShareMap[userId] || 0;
    const sent = paymentsSentMap[userId] || 0;
    const received = paymentsReceivedMap[userId] || 0;

    // Net balance:
    // positive: is owed money
    // negative: owes money
    const netBalance = (paid - share) + sent - received;

    balances.push({
      userId,
      userName,
      photoURL,
      totalPaid: paid,
      totalShare: share,
      netBalance,
    });
  });

  return balances;
}

/**
 * Greedy minimum cash flow settlement algorithm:
 * Matches biggest debtor with biggest creditor repeatedly to minimize total transfers.
 */
export function simplifyDebts(
  balances: MemberBalance[],
  settlements: Settlement[]
): DebtTransfer[] {
  // Create mutable balance tracking
  const net: { userId: string; userName: string; amount: number }[] = balances
    .map(b => ({
      userId: b.userId,
      userName: b.userName,
      amount: Math.round(b.netBalance),
    }))
    .filter(b => Math.abs(b.amount) > 1); // ignore negligible rounding differences (< 1 LAK)

  const transfers: DebtTransfer[] = [];

  while (true) {
    // Find member with max credit (amount > 0) and max debit (amount < 0)
    let maxCreditIndex = -1;
    let maxDebitIndex = -1;
    let maxCredit = 0;
    let maxDebit = 0;

    for (let i = 0; i < net.length; i++) {
      if (net[i].amount > maxCredit) {
        maxCredit = net[i].amount;
        maxCreditIndex = i;
      }
      if (net[i].amount < maxDebit) {
        maxDebit = net[i].amount;
        maxDebitIndex = i;
      }
    }

    // If no one owes or is owed money, we are done
    if (maxCreditIndex === -1 || maxDebitIndex === -1 || maxCredit <= 1 || maxDebit >= -1) {
      break;
    }

    const debtor = net[maxDebitIndex];
    const creditor = net[maxCreditIndex];

    const transferAmount = Math.min(-debtor.amount, creditor.amount);

    // Check if there is an active settlement pending or awaiting_confirmation for this pair
    const matchingSettlement = settlements.find(
      s => s.fromUserId === debtor.userId && s.toUserId === creditor.userId && s.status !== 'paid'
    );

    transfers.push({
      fromUserId: debtor.userId,
      fromUserName: debtor.userName,
      toUserId: creditor.userId,
      toUserName: creditor.userName,
      amount: transferAmount,
      settlementId: matchingSettlement?.id,
      status: matchingSettlement?.status || 'pending',
      proofUrl: matchingSettlement?.proofUrl,
    });

    debtor.amount += transferAmount;
    creditor.amount -= transferAmount;
  }

  return transfers;
}
