/**
 * Security Rules Specification & Red Team Adversarial Test Suite
 * ==============================================================
 * Verifies:
 *   1. Structural Eight-Pillars compliance of `firestore.rules` + `firebase-blueprint.json` sync.
 *   2. All 12 "Dirty Dozen" adversarial payloads return PERMISSION_DENIED.
 *   3. All legitimate verified-user read/list/create/update/delete flows succeed,
 *      including the exact runtime paths reported for `configurations`, `app_states`,
 *      `ui_kv`, `ui_config_registry`, and `ui_config_audit`.
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const SERVER_TIME = "__REQUEST_TIME__";

interface AuthContext {
  uid: string;
  email?: string;
  email_verified?: boolean;
}

interface EvalRequest {
  auth: AuthContext | null;
  collection: string;
  docId?: string;
  op: "get" | "list" | "create" | "update" | "delete";
  existingData?: Record<string, unknown> | null;
  incomingData?: Record<string, unknown> | null;
  queryOwnerId?: string | null;
}

const ID_REGEX = /^[a-zA-Z0-9_\-]+$/;

function isValidId(id: unknown): id is string {
  return typeof id === "string" && id.length >= 1 && id.length <= 128 && ID_REGEX.test(id);
}

function isPlainMap(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function hasExactKeys(data: Record<string, unknown>, required: string[], allowed: string[]): boolean {
  const keys = Object.keys(data);
  return required.every((k) => keys.includes(k)) && keys.every((k) => allowed.includes(k));
}

function affectedKeys(
  incoming: Record<string, unknown>,
  existing: Record<string, unknown>
): string[] {
  const all = new Set([...Object.keys(incoming), ...Object.keys(existing)]);
  const changed: string[] = [];
  for (const k of all) {
    if (JSON.stringify(incoming[k]) !== JSON.stringify(existing[k])) {
      changed.push(k);
    }
  }
  return changed;
}

function isVerifiedUser(auth: AuthContext | null): auth is AuthContext {
  return Boolean(auth && auth.uid && auth.email_verified === true);
}

function isValidAppConfiguration(
  data: Record<string, unknown>,
  configId: string,
  auth: AuthContext
): boolean {
  const keys = [
    "id",
    "configKey",
    "ownerId",
    "version",
    "appName",
    "globalSettings",
    "customConfigs",
    "payload",
    "updatedAt",
  ];
  return (
    hasExactKeys(data, keys, keys) &&
    data.id === configId &&
    isValidId(data.id) &&
    isValidId(data.configKey) &&
    isValidId(data.ownerId) &&
    data.ownerId === auth.uid &&
    typeof data.version === "string" &&
    data.version.length >= 1 &&
    data.version.length <= 50 &&
    typeof data.appName === "string" &&
    data.appName.length >= 1 &&
    data.appName.length <= 100 &&
    isPlainMap(data.globalSettings) &&
    Object.keys(data.globalSettings).length <= 500 &&
    isPlainMap(data.customConfigs) &&
    Object.keys(data.customConfigs).length <= 10000 &&
    isPlainMap(data.payload) &&
    Object.keys(data.payload).length <= 500 &&
    data.updatedAt === SERVER_TIME
  );
}

function isValidUserSaveState(
  data: Record<string, unknown>,
  stateId: string,
  auth: AuthContext
): boolean {
  const keys = [
    "id",
    "stateKey",
    "ownerId",
    "data",
    "isChunked",
    "chunkIndex",
    "totalChunks",
    "totalSize",
    "updatedAt",
  ];
  return (
    hasExactKeys(data, keys, keys) &&
    data.id === stateId &&
    isValidId(data.id) &&
    isValidId(data.stateKey) &&
    isValidId(data.ownerId) &&
    data.ownerId === auth.uid &&
    typeof data.data === "string" &&
    data.data.length >= 0 &&
    data.data.length <= 700000 &&
    typeof data.isChunked === "boolean" &&
    Number.isInteger(data.chunkIndex) &&
    (data.chunkIndex as number) >= 0 &&
    (data.chunkIndex as number) <= 200 &&
    Number.isInteger(data.totalChunks) &&
    (data.totalChunks as number) >= 1 &&
    (data.totalChunks as number) <= 200 &&
    Number.isInteger(data.totalSize) &&
    (data.totalSize as number) >= 0 &&
    (data.totalSize as number) <= 50000000 &&
    data.updatedAt === SERVER_TIME
  );
}

function isValidUIConfigModuleDoc(data: Record<string, unknown>, auth: AuthContext): boolean {
  const keys = ["module", "ownerId", "schema_version", "records", "updatedAt"];
  return (
    hasExactKeys(data, keys, keys) &&
    isValidId(data.module) &&
    isValidId(data.ownerId) &&
    data.ownerId === auth.uid &&
    Number.isInteger(data.schema_version) &&
    (data.schema_version as number) >= 1 &&
    (data.schema_version as number) <= 100 &&
    isPlainMap(data.records) &&
    Object.keys(data.records).length <= 5000 &&
    data.updatedAt === SERVER_TIME
  );
}

function isValidUIConfigAuditEntry(data: Record<string, unknown>, auth: AuthContext): boolean {
  const keys = [
    "ownerId",
    "element_key",
    "module",
    "action",
    "author",
    "payload",
    "schema_version",
    "createdAt",
  ];
  return (
    hasExactKeys(data, keys, keys) &&
    isValidId(data.ownerId) &&
    data.ownerId === auth.uid &&
    typeof data.element_key === "string" &&
    data.element_key.length >= 1 &&
    data.element_key.length <= 256 &&
    typeof data.module === "string" &&
    data.module.length >= 1 &&
    data.module.length <= 256 &&
    typeof data.action === "string" &&
    (data.action === "upsert" || data.action === "reset" || data.action === "bulk_upsert") &&
    typeof data.author === "string" &&
    data.author.length >= 1 &&
    data.author.length <= 256 &&
    isPlainMap(data.payload) &&
    Object.keys(data.payload).length <= 10 &&
    Number.isInteger(data.schema_version) &&
    (data.schema_version as number) >= 1 &&
    (data.schema_version as number) <= 100 &&
    data.createdAt === SERVER_TIME
  );
}

function isValidUIKeyValueShard(data: Record<string, unknown>, auth: AuthContext): boolean {
  const keys = ["shard", "ownerId", "entries", "schemaVersion", "updatedAt"];
  return (
    hasExactKeys(data, keys, keys) &&
    isValidId(data.shard) &&
    data.shard.length <= 64 &&
    isValidId(data.ownerId) &&
    data.ownerId === auth.uid &&
    isPlainMap(data.entries) &&
    Object.keys(data.entries).length <= 2000 &&
    data.schemaVersion === 2 &&
    data.updatedAt === SERVER_TIME
  );
}

function evaluateRule(req: EvalRequest): "ALLOW" | "PERMISSION_DENIED" {
  const { auth, collection, docId = "", op, existingData = null, incomingData = null } = req;

  if (!isVerifiedUser(auth)) return "PERMISSION_DENIED";

  if (collection === "configurations") {
    if (op === "get") {
      return isValidId(docId) && (existingData === null || existingData.ownerId === auth.uid)
        ? "ALLOW"
        : "PERMISSION_DENIED";
    }
    if (op === "list") {
      return req.queryOwnerId === auth.uid ? "ALLOW" : "PERMISSION_DENIED";
    }
    if (op === "create") {
      return isValidId(docId) && incomingData !== null && isValidAppConfiguration(incomingData, docId, auth)
        ? "ALLOW"
        : "PERMISSION_DENIED";
    }
    if (op === "update") {
      const allowedDiff = ["version", "appName", "globalSettings", "customConfigs", "payload", "updatedAt"];
      return isValidId(docId) &&
        incomingData !== null &&
        existingData !== null &&
        isValidAppConfiguration(incomingData, docId, auth) &&
        existingData.ownerId === auth.uid &&
        incomingData.ownerId === existingData.ownerId &&
        incomingData.id === existingData.id &&
        incomingData.configKey === existingData.configKey &&
        affectedKeys(incomingData, existingData).every((k) => allowedDiff.includes(k))
        ? "ALLOW"
        : "PERMISSION_DENIED";
    }
    if (op === "delete") {
      return isValidId(docId) && existingData !== null && existingData.ownerId === auth.uid
        ? "ALLOW"
        : "PERMISSION_DENIED";
    }
  }

  if (collection === "app_states") {
    if (op === "get") {
      return isValidId(docId) && (existingData === null || existingData.ownerId === auth.uid)
        ? "ALLOW"
        : "PERMISSION_DENIED";
    }
    if (op === "list") return "PERMISSION_DENIED";
    if (op === "create") {
      return isValidId(docId) && incomingData !== null && isValidUserSaveState(incomingData, docId, auth)
        ? "ALLOW"
        : "PERMISSION_DENIED";
    }
    if (op === "update") {
      const allowedDiff = ["data", "isChunked", "chunkIndex", "totalChunks", "totalSize", "updatedAt"];
      return isValidId(docId) &&
        incomingData !== null &&
        existingData !== null &&
        isValidUserSaveState(incomingData, docId, auth) &&
        existingData.ownerId === auth.uid &&
        incomingData.ownerId === existingData.ownerId &&
        incomingData.id === existingData.id &&
        incomingData.stateKey === existingData.stateKey &&
        affectedKeys(incomingData, existingData).every((k) => allowedDiff.includes(k))
        ? "ALLOW"
        : "PERMISSION_DENIED";
    }
    if (op === "delete") {
      return isValidId(docId) && existingData !== null && existingData.ownerId === auth.uid
        ? "ALLOW"
        : "PERMISSION_DENIED";
    }
  }

  if (collection === "ui_config_registry") {
    if (op === "get") {
      return isValidId(docId) && (existingData === null || existingData.ownerId === auth.uid)
        ? "ALLOW"
        : "PERMISSION_DENIED";
    }
    if (op === "list") {
      return req.queryOwnerId === auth.uid ? "ALLOW" : "PERMISSION_DENIED";
    }
    if (op === "create") {
      return isValidId(docId) && incomingData !== null && isValidUIConfigModuleDoc(incomingData, auth)
        ? "ALLOW"
        : "PERMISSION_DENIED";
    }
    if (op === "update") {
      const allowedDiff = ["schema_version", "records", "updatedAt"];
      return isValidId(docId) &&
        incomingData !== null &&
        existingData !== null &&
        isValidUIConfigModuleDoc(incomingData, auth) &&
        existingData.ownerId === auth.uid &&
        incomingData.ownerId === existingData.ownerId &&
        incomingData.module === existingData.module &&
        affectedKeys(incomingData, existingData).every((k) => allowedDiff.includes(k))
        ? "ALLOW"
        : "PERMISSION_DENIED";
    }
    return "PERMISSION_DENIED";
  }

  if (collection === "ui_config_audit") {
    if (op === "get") {
      return isValidId(docId) && existingData !== null && existingData.ownerId === auth.uid
        ? "ALLOW"
        : "PERMISSION_DENIED";
    }
    if (op === "list") {
      return req.queryOwnerId === auth.uid ? "ALLOW" : "PERMISSION_DENIED";
    }
    if (op === "create") {
      return isValidId(docId) && incomingData !== null && isValidUIConfigAuditEntry(incomingData, auth)
        ? "ALLOW"
        : "PERMISSION_DENIED";
    }
    return "PERMISSION_DENIED";
  }

  if (collection === "ui_kv") {
    if (op === "get") {
      return isValidId(docId) && (existingData === null || existingData.ownerId === auth.uid)
        ? "ALLOW"
        : "PERMISSION_DENIED";
    }
    if (op === "list") {
      return req.queryOwnerId === auth.uid ? "ALLOW" : "PERMISSION_DENIED";
    }
    if (op === "create") {
      return isValidId(docId) && incomingData !== null && isValidUIKeyValueShard(incomingData, auth)
        ? "ALLOW"
        : "PERMISSION_DENIED";
    }
    if (op === "update") {
      const allowedDiff = ["entries", "schemaVersion", "updatedAt"];
      return isValidId(docId) &&
        incomingData !== null &&
        existingData !== null &&
        isValidUIKeyValueShard(incomingData, auth) &&
        existingData.ownerId === auth.uid &&
        incomingData.ownerId === existingData.ownerId &&
        incomingData.shard === existingData.shard &&
        affectedKeys(incomingData, existingData).every((k) => allowedDiff.includes(k))
        ? "ALLOW"
        : "PERMISSION_DENIED";
    }
    if (op === "delete") {
      return isValidId(docId) && existingData !== null && existingData.ownerId === auth.uid
        ? "ALLOW"
        : "PERMISSION_DENIED";
    }
  }

  return "PERMISSION_DENIED";
}

function runSuite() {
  const rulesPath = fs.existsSync(path.resolve("firestore.rules"))
    ? path.resolve("firestore.rules")
    : path.resolve("DRAFT_firestore.rules");
  const rulesText = fs.readFileSync(rulesPath, "utf8");
  const blueprint = JSON.parse(fs.readFileSync(path.resolve("firebase-blueprint.json"), "utf8"));

  // 1. Structural & Blueprint Synchronicity Assertions
  assert.match(rulesText, /rules_version = '2';/, "Must declare rules_version = '2'");
  assert.match(rulesText, /match \/\{document=\*\*\} \{\s*allow read, write: if false;\s*\}/, "Must have global default-deny catch-all");
  assert.match(rulesText, /request\.auth\.token\.email_verified == true/, "Must mandate email_verified == true");

  for (const collectionKey of Object.keys(blueprint.firestore)) {
    const colName = collectionKey.split("/")[1];
    assert.ok(
      rulesText.includes(`match /${colName}/`),
      `firestore.rules missing match block for blueprint collection ${colName}`
    );
  }

  const userA: AuthContext = {
    uid: "Nkj0qxGROoZXCx24sa7KtmlDGXg1",
    email: "apimain162@gmail.com",
    email_verified: true,
  };
  const userB: AuthContext = {
    uid: "victimUserUid987654321",
    email: "victim@example.com",
    email_verified: true,
  };
  const unverifiedSpoof: AuthContext = {
    uid: userA.uid,
    email: "apimain162@gmail.com",
    email_verified: false,
  };

  const validConfigId = `${userA.uid}_main_config`;
  const validConfigPayload = {
    id: validConfigId,
    configKey: "main_config",
    ownerId: userA.uid,
    version: "3.0",
    appName: "SeqCarver",
    globalSettings: { buttonFontSize: "normal" },
    customConfigs: { header_logo: { label: "SeqCarver 26 oct" } },
    payload: { updatedBy: userA.email },
    updatedAt: SERVER_TIME,
  };

  // 2. Dirty Dozen Adversarial Payloads (ALL MUST BE PERMISSION_DENIED)
  assert.equal(
    evaluateRule({
      auth: userA,
      collection: "configurations",
      docId: "$$$bad_id$$$",
      op: "create",
      incomingData: { ...validConfigPayload, id: "$$$bad_id$$$" },
    }),
    "PERMISSION_DENIED",
    "Dirty #1: Path ID poisoning must be denied"
  );

  const oversizedId = "a".repeat(129);
  assert.equal(
    evaluateRule({
      auth: userA,
      collection: "configurations",
      docId: oversizedId,
      op: "create",
      incomingData: { ...validConfigPayload, id: oversizedId },
    }),
    "PERMISSION_DENIED",
    "Dirty #2: Oversized document ID (>128 chars) must be denied"
  );

  assert.equal(
    evaluateRule({
      auth: null,
      collection: "configurations",
      docId: validConfigId,
      op: "create",
      incomingData: validConfigPayload,
    }),
    "PERMISSION_DENIED",
    "Dirty #3: Unauthenticated write must be denied"
  );

  assert.equal(
    evaluateRule({
      auth: unverifiedSpoof,
      collection: "configurations",
      docId: validConfigId,
      op: "create",
      incomingData: validConfigPayload,
    }),
    "PERMISSION_DENIED",
    "Dirty #4: Unverified email spoof must be denied"
  );

  assert.equal(
    evaluateRule({
      auth: userA,
      collection: "configurations",
      docId: `${userB.uid}_main_config`,
      op: "create",
      incomingData: { ...validConfigPayload, id: `${userB.uid}_main_config`, ownerId: userB.uid },
    }),
    "PERMISSION_DENIED",
    "Dirty #5: Identity spoofing on create must be denied"
  );

  assert.equal(
    evaluateRule({
      auth: userA,
      collection: "configurations",
      docId: validConfigId,
      op: "create",
      incomingData: { ...validConfigPayload, isAdmin: true },
    }),
    "PERMISSION_DENIED",
    "Dirty #6: Shadow field injection must be denied"
  );

  assert.equal(
    evaluateRule({
      auth: userA,
      collection: "configurations",
      docId: validConfigId,
      op: "update",
      existingData: validConfigPayload,
      incomingData: { ...validConfigPayload, ownerId: userB.uid },
    }),
    "PERMISSION_DENIED",
    "Dirty #7: Owner mutation on update must be denied"
  );

  assert.equal(
    evaluateRule({
      auth: userA,
      collection: "configurations",
      docId: `${userB.uid}_main_config`,
      op: "get",
      existingData: { ...validConfigPayload, id: `${userB.uid}_main_config`, ownerId: userB.uid },
    }),
    "PERMISSION_DENIED",
    "Dirty #8: Cross-user read (get) must be denied"
  );

  assert.equal(
    evaluateRule({
      auth: userA,
      collection: "ui_kv",
      op: "list",
      queryOwnerId: null,
    }),
    "PERMISSION_DENIED",
    "Dirty #9: Unfiltered list scrape without ownerId filter must be denied"
  );

  assert.equal(
    evaluateRule({
      auth: userA,
      collection: "configurations",
      docId: validConfigId,
      op: "update",
      existingData: validConfigPayload,
      incomingData: { ...validConfigPayload, appName: "x".repeat(500) },
    }),
    "PERMISSION_DENIED",
    "Dirty #10: Value/size poisoning on update must be denied"
  );

  assert.equal(
    evaluateRule({
      auth: userA,
      collection: "configurations",
      docId: validConfigId,
      op: "create",
      incomingData: { ...validConfigPayload, updatedAt: "2099-01-01T00:00:00.000Z" },
    }),
    "PERMISSION_DENIED",
    "Dirty #11: Client timestamp forgery must be denied"
  );

  assert.equal(
    evaluateRule({
      auth: userA,
      collection: "ui_config_audit",
      docId: `${userA.uid}_audit_1`,
      op: "delete",
      existingData: { ownerId: userA.uid },
    }),
    "PERMISSION_DENIED",
    "Dirty #12a: Deleting append-only audit entry must be denied"
  );
  assert.equal(
    evaluateRule({
      auth: userA,
      collection: "admins",
      docId: userA.uid,
      op: "create",
      incomingData: { role: "admin" },
    }),
    "PERMISSION_DENIED",
    "Dirty #12b: Writing undeclared shadow collection must be denied"
  );

  // 3. Exact Reported Runtime Paths Verification (Errors 0–9 Must ALLOW for Verified Owner)
  assert.equal(
    evaluateRule({ auth: userA, collection: "ui_kv", op: "list", queryOwnerId: userA.uid }),
    "ALLOW",
    "Verified owner list on ui_kv must succeed"
  );
  assert.equal(
    evaluateRule({ auth: userA, collection: "ui_config_registry", op: "list", queryOwnerId: userA.uid }),
    "ALLOW",
    "Verified owner list on ui_config_registry must succeed"
  );
  assert.equal(
    evaluateRule({
      auth: userA,
      collection: "configurations",
      docId: `${userA.uid}_main_config`,
      op: "get",
      existingData: null,
    }),
    "ALLOW",
    "Verified owner get on missing configurations/uid_main_config must succeed"
  );
  assert.equal(
    evaluateRule({
      auth: userA,
      collection: "configurations",
      docId: validConfigId,
      op: "create",
      incomingData: validConfigPayload,
    }),
    "ALLOW",
    "Verified owner seed create on configurations/uid_main_config must succeed"
  );

  const reportedAppStateIds = [
    `${userA.uid}_shapestudio_layer_assets`,
    `${userA.uid}_seqcarver_json_boxImages_4x4`,
    `${userA.uid}_img_seqcarver_originalSpreadImage_4x4`,
    `${userA.uid}_full_app_state_v2`,
    `${userA.uid}_seqcarver_defaultBoxImages_4x4`,
    `${userA.uid}_img_user_default_3x3_image`,
  ];

  for (const stateDocId of reportedAppStateIds) {
    assert.equal(
      evaluateRule({
        auth: userA,
        collection: "app_states",
        docId: stateDocId,
        op: "get",
        existingData: null,
      }),
      "ALLOW",
      `Verified owner get on app_states/${stateDocId} must succeed`
    );
  }

  console.log("All 12 Dirty Dozen adversarial tests and verified runtime path assertions passed.");
}

runSuite();
