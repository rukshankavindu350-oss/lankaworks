# LankaWorks Phase 03 — Firestore Security Specification

## 1. Core Data Invariants
1. No user may self-assign `support`, `admin`, or `super_admin` in `/users/{userId}` or `/staff_roles/{userId}`.
2. No user may modify their own `role` or `status` after account creation.
3. No worker may set `approvalStatus` to `approved` or modify `ratingAvg`/`reviewCount` via client SDK.
4. Worker creation and updates require `request.auth.token.email_verified == true`.
5. PII (`email`, `phone`, `address`) is strictly isolated to `/users/{userId}/private/{docId}` and readable only by the owner or verified Admin.
6. Public queries on `/workers` may never read `pending`, `rejected`, or `suspended` profiles belonging to other users.
7. `/audit_logs/{logId}` is append-only by admins and immutable (`update`/`delete` always denied).

## 2. Adversarial "Dirty Dozen" Attack Payloads (Expected: PERMISSION_DENIED)
1. **Self-Assigned Super Admin**: Unprivileged user creates `/users/{uid}` with `role: 'super_admin'`.
2. **Self-Role Escalation**: Existing `customer` updates `/users/{uid}` changing `role` to `'admin'`.
3. **Self-Staff Role Write**: Authenticated user writes `/staff_roles/{uid}` with `role: 'super_admin'`.
4. **Shadow Field Injection on User**: User creates `/users/{uid}` with extra ghost field `isVerifiedAdmin: true`.
5. **Unverified Email Spoof**: User with `email_verified: false` attempts admin/worker write.
6. **Cross-User PII Read**: Authenticated User A reads `/users/{userB}/private/info`.
7. **Blanket User List Scraping**: Non-admin user calls `list` on `/users`.
8. **Worker Self-Approval on Create**: Worker creates `/workers/{uid}` with `approvalStatus: 'approved'`.
9. **Worker Self-Approval on Update**: Pending worker updates `/workers/{uid}` changing `approvalStatus` to `'approved'`.
10. **Rating Tampering**: Worker updates `/workers/{uid}` setting `ratingAvg: 5, reviewCount: 999`.
11. **Oversized String Poisoning**: User submits a 10KB string for `displayName` or `workerId` > 128 chars.
12. **Audit Log Tampering**: Admin attempts to `update` or `delete` an existing `/audit_logs/{logId}` record.
