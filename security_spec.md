# Security Specification for SeqCarver Cloud Database

## 1. Data Invariants & Master Source of Truth
- **Identity & Ownership Master Gate**: Every persistent document across all 5 collections (`configurations`, `app_states`, `ui_config_registry`, `ui_config_audit`, `ui_kv`) belongs strictly to a single verified Google-authenticated user (`request.auth != null && request.auth.token.email_verified == true` and `ownerId == request.auth.uid`).
- **No Unauthenticated or Blanket Access**: Unauthenticated sessions operate locally in memory/IndexedDB. Cloud reads (`get`, `list`) and mutations (`create`, `update`, `delete`) require verified authentication (`email_verified == true`) and `ownerId == request.auth.uid`.
- **Collection Invariants**:
  - `configurations/{configId}`: Valid ID (`1..128`, `^[a-zA-Z0-9_\-]+$`), exact 9 keys, `id == configId`, `ownerId == request.auth.uid` (immutable), `globalSettings` map `<= 500`, `customConfigs` map `<= 10000`, `payload` map `<= 500`, `updatedAt == request.time`.
  - `app_states/{stateId}`: Valid ID (`1..128`), exact 9 keys, `id == stateId`, `data` string `<= 700,000` chars, `ownerId == request.auth.uid` (immutable), `updatedAt == request.time`, `list` disabled.
  - `ui_config_registry/{moduleId}`: Valid ID (`1..128`), exact 5 keys, `isValidId(module)`, `ownerId == request.auth.uid` (immutable), `records` map `<= 5000`, `updatedAt == request.time`, `delete` disabled.
  - `ui_config_audit/{auditId}`: Valid ID (`1..128`), exact 8 keys, `ownerId == request.auth.uid`, `action in ['upsert', 'reset', 'bulk_upsert']`, `createdAt == request.time`, append-only (`update, delete: if false`).
  - `ui_kv/{shardId}`: Valid ID (`1..128`), exact 5 keys, `ownerId == request.auth.uid` (immutable), `entries` map `<= 2000`, `schemaVersion == 2`, `updatedAt == request.time`.

## 2. The "Dirty Dozen" Payloads (Adversarial Verification)
1. **Path ID Poisoning**: `configurations/$$$bad_id$$$` -> `PERMISSION_DENIED`.
2. **Oversized Document ID**: `configurations/<129-char-id>` -> `PERMISSION_DENIED`.
3. **Unauthenticated Write**: `setDoc` on `configurations/uid_main_config` with `auth == null` -> `PERMISSION_DENIED`.
4. **Unverified Email Spoof**: Authenticated write with `email_verified: false` -> `PERMISSION_DENIED`.
5. **Identity Spoofing on Create**: `ownerId: "victim_uid"` while authenticated as `"attacker_uid"` -> `PERMISSION_DENIED`.
6. **Shadow Field Injection**: Valid `AppConfiguration` + ghost field `isAdmin: true` -> `PERMISSION_DENIED` (`hasOnly` gate).
7. **Owner Mutation on Update**: Updating `ownerId` from `"attacker_uid"` to `"victim_uid"` -> `PERMISSION_DENIED`.
8. **Cross-User Read (`get`)**: User A reading User B's `configurations/userB_main_config` -> `PERMISSION_DENIED`.
9. **Unfiltered Query Scrape (`list`)**: `getDocs(collection(db, "ui_kv"))` without `where("ownerId", "==", uid)` -> `PERMISSION_DENIED`.
10. **Value / Size Poisoning**: Updating `appName` with a 500-char string or boolean -> `PERMISSION_DENIED` (`isValidAppConfiguration` wraps update).
11. **Client Timestamp Forgery**: Providing past/future timestamp instead of `serverTimestamp()` (`request.time`) -> `PERMISSION_DENIED`.
12. **Audit Log Tampering / Shadow Collection**: Updating/deleting `ui_config_audit/{id}` or writing `/admins/hack` -> `PERMISSION_DENIED`.

## 3. Executable Test Runner
See `/firestore.rules.test.ts` (runnable via `npx tsx firestore.rules.test.ts`), which validates structural invariants in `firestore.rules` and executes all 12 Dirty Dozen adversarial payloads plus positive user-scoped read/write assertions across all 5 collections.
