# Security Specification: FriendPay Laos

## 1. Data Invariants

1. **Authentication & Identity Invariant**: An unauthenticated request can never read or write any private data (users, groups, expenses, settlements, notifications). Users can only write their own profile (`users/{userId}` where `userId == request.auth.uid`).
2. **Group Access Invariant**: Only members of a group can read expenses, expenseItems, and settlements belonging to that `groupId`.
3. **Immutability of Author & CreatedAt**: `ownerId`, `createdBy`, `payerId`, `createdAt` cannot be modified once set.
4. **Expense Modification Invariant**: Only the payer or the group owner can edit or delete an expense record.
5. **Settlement Transition Invariant**:
   - Payer (`fromUserId`) can create settlement or mark it as `awaiting_confirmation` with proof attachment.
   - Recipient (`toUserId`) is the ONLY user authorized to confirm receipt and transition status to `paid`.
   - Once a settlement is marked `paid`, it cannot be altered by anyone.
6. **Invitation Invariant**: Invitations can be looked up by inviteCode to join a group, but only authenticated users can join.

## 2. The "Dirty Dozen" Vulnerability Test Payloads

1. **Unauthenticated Profile Injection**: Attempt to write to `/users/attackerUid` without auth token. (Expect: PERMISSION_DENIED)
2. **Cross-User Profile Hijack**: Authenticated as `userA`, attempt to update `/users/userB` to change bank account. (Expect: PERMISSION_DENIED)
3. **Ghost Field Poisoning**: Authenticated user attempts to write unknown fields like `isAdmin: true` to a user document. (Expect: PERMISSION_DENIED)
4. **Non-Member Expense Snoop**: Authenticated user attempts to read expenses of a private group they are not a member of. (Expect: PERMISSION_DENIED)
5. **Unauthorized Expense Deletion**: Member B attempts to delete an expense created and paid by Member A. (Expect: PERMISSION_DENIED)
6. **False Settlement Self-Confirmation**: Payer `fromUserId` attempts to update settlement status directly to `paid` without recipient consent. (Expect: PERMISSION_DENIED)
7. **Negative or Zero Amount Poisoning**: User attempts to create an expense with totalAmount <= 0. (Expect: PERMISSION_DENIED)
8. **Forged Payer Identity**: User A creates an expense with `payerId: "userB"` without being user B or owner. (Expect: PERMISSION_DENIED)
9. **Tampering with Terminal Paid Settlement**: User attempts to revert a `paid` settlement back to `pending`. (Expect: PERMISSION_DENIED)
10. **Huge Junk ID Path Attack**: Attacker uses a 500-character malicious path ID to exhaust resource limits. (Expect: PERMISSION_DENIED)
11. **Client Notification Interception**: User A attempts to list notifications where `userId == userB`. (Expect: PERMISSION_DENIED)
12. **Group Hijack**: Regular member attempts to change the `ownerId` of the group to themselves. (Expect: PERMISSION_DENIED)
