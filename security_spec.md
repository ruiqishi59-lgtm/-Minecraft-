# Security Specification — Account Hardening, Cloud World Saves, Mailbox & Feedback System

## 1. Data Invariants
1. **Verified Google Identity Only**: Every privileged or personal operation requires `request.auth != null`, `request.auth.token.email_verified == true`, AND `request.auth.token.firebase.sign_in_provider == 'google.com'`.
2. **Admin Authority**: Only an authenticated Google user with `request.auth.token.email.lower() == 'ruiqishi59@gmail.com'` AND `request.auth.token.email_verified == true` AND `google.com` provider has admin privileges.
3. **Owner-Isolated Security Profile & No Enumeration**: `/users/{userId}` can ONLY be read (`get`) or written by `request.auth.uid == userId`; `list` on `/users` is strictly forbidden (`false`) to prevent account enumeration.
4. **Append-Only Security Logs**: `/users/{userId}/security_logs/{logId}` requires parent `/users/{userId}` existence (`Master Gate`) on create, enforces `uid == request.auth.uid` and `createdAt == request.time`, and permanently forbids `update` and `delete` (`if false`) so attackers cannot erase audit history.
5. **Owner-Isolated Cloud World Saves**: `/users/{userId}/worlds/{worldId}` requires verified Google Auth (`request.auth.uid == userId`), parent `/users/{userId}` Master Gate check on create, `uid == request.auth.uid` & `id == worldId`, immutable `uid`/`id`/`createdAt`, bounded `player` map & `inventory` (`<= 36`), bounded `modifiedBlocks` (`<= 15000`), and server `request.time` timestamps.
6. **Feedback & Mailbox Integrity**: `/feedbacks` and `/mailbox` enforce strict `hasAll`/`hasOnly`, `isValidId()`, email format checks, server `request.time` timestamps, and exclusive admin send permissions for `ruiqishi59@gmail.com`.

## 2. The Dirty Dozen Adversarial Payloads (Must Return PERMISSION_DENIED)
1. Unauthenticated read or write to `/users/{uid}`, `/users/{uid}/worlds/{worldId}`, `/feedbacks/{id}`, or `/mailbox/{id}`
2. Non-Google auth provider or unverified email (`email_verified == false`) attempting to write `/users/{uid}` or `/users/{uid}/worlds/{worldId}`
3. Authenticated user attempting `list` on `/users` to enumerate accounts/emails
4. Authenticated user reading, listing, modifying, or deleting another user's `/users/{otherUid}/worlds/{worldId}`
5. Authenticated user attempting to `update` or `delete` a record in `/users/{uid}/security_logs/{logId}` to cover tracks
6. Creating `/users/{uid}/worlds/{worldId}` with forged `uid`, mismatched `id`, or client-backdated `createdAt`
7. Updating `/users/{uid}/worlds/{worldId}` with ghost field `{ isVipUnlocked: true }` or oversized `inventory` (`> 36` items)
8. Verified user injecting >15,000 keys into `modifiedBlocks` or invalid `worldType` / `gameMode` on `/users/{uid}/worlds/{worldId}`
9. Spoofed admin token with `email == 'ruiqishi59@gmail.com'` and `email_verified == false` (or non-google.com provider) accessing `/feedbacks` or `/mailbox`
10. Non-admin user creating a broadcast or direct message in `/mailbox/{id}`
11. Non-admin user modifying `body` or `title` on a direct `/mailbox/{id}` message
12. Poisoned document ID (`../../etc/passwd`) or oversized payload (`> maxLength`) on any collection
