# Security Specification — Mailbox & Feedback System

## 1. Data Invariants
1. **Admin Authority**: Only an authenticated Google user with `request.auth.token.email == 'ruiqishi59@gmail.com'` AND `request.auth.token.email_verified == true` has admin privileges (reading all feedbacks, replying/updating feedbacks, composing/sending mailbox messages, broadcasting notices).
2. **Feedback Identity Integrity**: On `/feedbacks/{feedbackId}` creation, `senderUid` MUST equal `request.auth.uid`, `senderEmail` MUST equal `request.auth.token.email`, `status` MUST be `'unread'`, `adminReply` MUST be `''`, and `createdAt`/`updatedAt` MUST equal `request.time`.
3. **Mailbox Write Restriction**: Only `isAdmin()` (`ruiqishi59@gmail.com`) may create `/mailbox/{messageId}` documents (`senderEmail` must match `ruiqishi59@gmail.com`). Regular players can never spoof system/admin mailbox messages.
4. **PII Isolation**: Feedback documents contain `senderEmail` and are readable ONLY by `senderUid == request.auth.uid` or `isAdmin()`. Direct mailbox messages are readable ONLY by the addressed `recipientUid`/`recipientEmail` or `isAdmin()`.
5. **Strict Key & Size Guards**: Every document enforces `hasAll` + `hasOnly` and strict `.size()` bounds on all strings, plus `isValidId()` regex validation on document IDs.

## 2. The Dirty Dozen Adversarial Payloads (Must Return PERMISSION_DENIED)
1. Unauthenticated write to `/feedbacks/fb1`
2. Verified user spoofing `senderUid` of another user in `/feedbacks/fb2`
3. Verified user spoofing `senderEmail` to `ruiqishi59@gmail.com` in `/feedbacks/fb3`
4. Verified user pre-setting `status: 'replied'` or non-empty `adminReply` on feedback creation
5. Verified user injecting ghost field `{ isAdmin: true }` on `/feedbacks/fb4`
6. Non-admin user listing `/feedbacks` without `senderUid == auth.uid` filter
7. Non-admin user reading another player's `/feedbacks/{id}` document
8. Spoofed admin token with `email == 'ruiqishi59@gmail.com'` and `email_verified == false` reading `/feedbacks` or creating `/mailbox/m1`
9. Non-admin user creating a broadcast or direct message in `/mailbox/m2`
10. Non-admin user updating `body` or `title` on a direct `/mailbox/{id}` message (exceeding `affectedKeys().hasOnly(['isRead', 'updatedAt'])`)
11. Oversized `message` (> 2000 chars) or poisoned document ID (`../../etc/passwd`)
12. Client forging past/future `createdAt` timestamp instead of `request.time`
