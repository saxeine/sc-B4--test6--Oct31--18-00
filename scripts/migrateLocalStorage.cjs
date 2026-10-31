#!/usr/bin/env node
/**
 * Phase 2 codemod — remove browser-local persistence from the configuration path.
 *
 *   localStorage.getItem(K)    → remoteStore.getItem(K)
 *   localStorage.setItem(K, V) → remoteStore.setItem(K, V)
 *   sessionStorage.*           → remoteStore.*
 *
 * `remoteStore` (src/services/remoteKeyValueStore.ts) exposes the identical
 * synchronous surface but is backed by the Firestore `ui_kv` collection:
 * hydrated from the database before the React tree mounts, written back with
 * optimistic batching, rollback on failure and live cross-tab snapshots.
 *
 * Deliberate exception: `src/services/firebase.ts` caches the *auth session*
 * identity locally. That is neither layout nor copy configuration, and the
 * shared configuration database must not become a cross-browser session store.
 *
 * Usage:
 *   node scripts/migrateLocalStorage.cjs --dry-run
 *   node scripts/migrateLocalStorage.cjs --apply
 */

const fs = require("fs");
const path = require("path");
const ts = require("typescript");

const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "src");
const STORE_MODULE = path.join(SRC, "services", "remoteKeyValueStore");

const EXCLUDED = new Set(
  [
    "src/services/remoteKeyValueStore.ts",
    "src/services/firebase.ts", // auth-session cache — documented exception
    "src/utils/idbStorage.ts", // hand-migrated: Firestore primary + IndexedDB binary cache
  ].map((p) => p.replace(/\\/g, "/"))
);

const STORAGE_OBJECTS = new Set(["localStorage", "sessionStorage"]);

function collectFiles(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (/node_modules|\.git|dist|build/.test(entry.name)) continue;
      collectFiles(full, acc);
    } else if (/\.(tsx|ts)$/.test(entry.name) && !/\.d\.ts$/.test(entry.name)) {
      acc.push(full);
    }
  }
  return acc;
}

function importSpecifierFor(file) {
  let rel = path.relative(path.dirname(file), STORE_MODULE).replace(/\\/g, "/");
  if (!rel.startsWith(".")) rel = `./${rel}`;
  return rel;
}

function processFile(file, options) {
  const rel = path.relative(ROOT, file).replace(/\\/g, "/");
  if (EXCLUDED.has(rel)) return null;

  const original = fs.readFileSync(file, "utf8");
  if (!/\b(localStorage|sessionStorage)\b/.test(original)) return null;

  const sf = ts.createSourceFile(file, original, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const edits = [];
  const notes = [];

  const visit = (node) => {
    // `localStorage.foo` / `window.localStorage.foo`
    if (ts.isPropertyAccessExpression(node)) {
      const target = node.expression;
      if (ts.isIdentifier(target) && STORAGE_OBJECTS.has(target.text)) {
        edits.push({ start: target.getStart(sf), end: target.getEnd(), text: "remoteStore" });
      } else if (
        ts.isPropertyAccessExpression(target) &&
        STORAGE_OBJECTS.has(target.name.text) &&
        ts.isIdentifier(target.expression) &&
        target.expression.text === "window"
      ) {
        edits.push({ start: target.getStart(sf), end: target.getEnd(), text: "remoteStore" });
      }
    }

    // Bare references such as `Object.keys(localStorage)`.
    if (
      ts.isIdentifier(node) &&
      STORAGE_OBJECTS.has(node.text) &&
      node.parent &&
      !ts.isPropertyAccessExpression(node.parent) &&
      !ts.isPropertyAssignment(node.parent) &&
      !ts.isImportSpecifier(node.parent)
    ) {
      notes.push({
        line: sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1,
        snippet: node.parent.getText(sf).replace(/\s+/g, " ").slice(0, 120),
      });
    }

    ts.forEachChild(node, visit);
  };

  visit(sf);
  if (!edits.length) return { rel, changed: false, count: 0, notes };

  edits.sort((a, b) => b.start - a.start);
  let output = original;
  for (const edit of edits) {
    output = output.slice(0, edit.start) + edit.text + output.slice(edit.end);
  }

  if (!/from\s+["'][^"']*services\/remoteKeyValueStore["']/.test(output)) {
    const importLine = `import { remoteStore } from "${importSpecifierFor(file)}";`;
    const importNodes = sf.statements.filter((s) => ts.isImportDeclaration(s));
    if (importNodes.length) {
      const last = importNodes[importNodes.length - 1];
      const importText = original.slice(last.getStart(sf), last.getEnd());
      const idx = output.indexOf(importText);
      if (idx !== -1) {
        output = output.slice(0, idx + importText.length) + "\n" + importLine + output.slice(idx + importText.length);
      } else {
        output = `${importLine}\n${output}`;
      }
    } else {
      output = `${importLine}\n${output}`;
    }
  }

  if (options.apply) fs.writeFileSync(file, output, "utf8");
  return { rel, changed: true, count: edits.length, notes };
}

function main() {
  const args = process.argv.slice(2);
  const apply = args.includes("--apply");
  const fileArg = args.includes("--file") ? args[args.indexOf("--file") + 1] : null;
  const files = fileArg ? [path.resolve(ROOT, fileArg)] : collectFiles(SRC);

  const results = [];
  for (const file of files) {
    try {
      const result = processFile(file, { apply });
      if (result) results.push(result);
    } catch (err) {
      console.error(`localStorage codemod: ${file} failed — ${err.message}`);
    }
  }

  const changed = results.filter((r) => r.changed);
  const notes = results.flatMap((r) => r.notes.map((n) => ({ file: r.rel, ...n })));

  console.log(
    JSON.stringify(
      {
        mode: apply ? "apply" : "dry-run",
        filesChanged: changed.length,
        accessesRewritten: changed.reduce((n, r) => n + r.count, 0),
        manualReview: notes.length,
      },
      null,
      2
    )
  );
  if (notes.length) {
    console.log("\nNon-member references needing manual review:");
    notes.forEach((n) => console.log(`  ${n.file}:${n.line}  ${n.snippet}`));
  }
  if (changed.length) {
    console.log("\nFiles:");
    changed
      .sort((a, b) => b.count - a.count)
      .forEach((r) => console.log(`  ${String(r.count).padStart(4)}  ${r.rel}`));
  }
}

main();
