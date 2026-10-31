#!/usr/bin/env node
/**
 * Phase 3 codemod — bind every hardcoded user-facing string to the
 * Button & Layout Optimizer Studio registry.
 *
 * Transformations (TypeScript AST driven, rendering-equivalent):
 *
 *   <h2>Crop & Carve</h2>
 *     → <h2>{uiText("crop_sidebar.h2.crop_and_carve", "Crop & Carve")}</h2>
 *
 *   <input placeholder="Search assets" />
 *     → <input placeholder={uiText("adv_modal.input.search_assets.placeholder", "Search assets")} />
 *
 * Why a function call and not a <UIText/> wrapper?
 *   Injecting an element would add a DOM node inside flex/grid containers and
 *   change the rendered layout. A string expression renders the *identical*
 *   text node, honouring the "preserve styling" tenet.
 *
 * Guarantees
 *   • JSX whitespace semantics are reproduced exactly (Babel's algorithm).
 *   • HTML entities are decoded; unknown entities cause the node to be skipped.
 *   • Idempotent — a migrated file has no remaining JSX text to rewrite.
 *   • Emits src/types/generatedCopyRegistry.ts so the studio can enumerate
 *     every slot with its compile-time fallback.
 *
 * Usage:
 *   node scripts/migrateHardcodedStrings.cjs --dry-run
 *   node scripts/migrateHardcodedStrings.cjs --apply
 *   node scripts/migrateHardcodedStrings.cjs --apply --file src/components/CropSidebar.tsx
 *   node scripts/migrateHardcodedStrings.cjs --apply --limit 10      # first N files only
 */

const fs = require("fs");
const path = require("path");
const ts = require("typescript");

const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "src");
const REGISTRY_OUT = path.join(SRC, "types", "generatedCopyRegistry.ts");
const HOOK_MODULE = path.join(SRC, "hooks", "useUIConfig");

/** Files that must never be rewritten (infrastructure + data catalogues). */
const EXCLUDED = new Set(
  [
    "src/hooks/useUIConfig.ts",
    "src/services/uiConfigStore.ts",
    "src/services/uiConfigRepository.ts",
    "src/services/remoteKeyValueStore.ts",
    "src/context/UIConfigProvider.tsx",
    "src/types/uiConfigSchema.ts",
    "src/types/generatedCopyRegistry.ts",
    "src/types/componentRegistry.ts",
    "src/types/buttonCustomization.ts",
    "src/types/hardcodedDefaultConfig.ts",
    "src/types/hardcodedMouseOverSetup.ts",
    "src/types/layoutPresets.ts",
  ].map((p) => p.replace(/\\/g, "/"))
);

/** Elements whose children must stay raw text / must not be reflowed. */
const SKIP_PARENT_TAGS = new Set(["pre", "script", "style", "textarea"]);

/** Attributes migrated to studio slots. */
const ATTRIBUTE_SLOTS = new Map([
  ["placeholder", "placeholder"],
  ["title", "title"],
  ["alt", "alt"],
  ["aria-label", "aria_label"],
  ["description", "description"],
  ["subtitle", "sub_label"],
]);

/** Components already bound to the studio — their own props must not be re-bound. */
const STUDIO_COMPONENT_RE = /^(Customizable(Button|Label|Container|Logo)|UIText)$/;

const IGNORED_EXACT = new Set(["", "-", "–", "—", "·", "•", "|", "/", "\\", ":", "×", "✓", "+", "...", "…"]);

/* ------------------------------------------------------------------ *
 * JSX semantics helpers
 * ------------------------------------------------------------------ */

const NAMED_ENTITIES = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: "\u00A0",
  copy: "©",
  reg: "®",
  trade: "™",
  hellip: "…",
  mdash: "—",
  ndash: "–",
  times: "×",
  divide: "÷",
  rarr: "→",
  larr: "←",
  uarr: "↑",
  darr: "↓",
  harr: "↔",
  bull: "•",
  middot: "·",
  deg: "°",
  euro: "€",
  pound: "£",
  yen: "¥",
  cent: "¢",
  sect: "§",
  para: "¶",
  dagger: "†",
  laquo: "«",
  raquo: "»",
  lsquo: "‘",
  rsquo: "’",
  ldquo: "“",
  rdquo: "”",
  check: "✓",
  cross: "✗",
  infin: "∞",
  ne: "≠",
  le: "≤",
  ge: "≥",
  plusmn: "±",
  frac12: "½",
  frac14: "¼",
  sup2: "²",
  sup3: "³",
  ensp: "\u2002",
  emsp: "\u2003",
  thinsp: "\u2009",
  zwnj: "\u200C",
  shy: "\u00AD",
};

/** Decodes HTML entities. Returns `null` when an unknown entity is present. */
function decodeEntities(input) {
  let unknown = false;
  const out = input.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z][a-zA-Z0-9]*);/g, (match, body) => {
    if (body[0] === "#") {
      const isHex = body[1] === "x" || body[1] === "X";
      const code = parseInt(isHex ? body.slice(2) : body.slice(1), isHex ? 16 : 10);
      if (!Number.isFinite(code)) {
        unknown = true;
        return match;
      }
      return String.fromCodePoint(code);
    }
    if (Object.prototype.hasOwnProperty.call(NAMED_ENTITIES, body)) return NAMED_ENTITIES[body];
    unknown = true;
    return match;
  });
  return unknown ? null : out;
}

/**
 * Reproduces Babel/TypeScript JSX text semantics:
 *   • leading whitespace is stripped from every line except the first
 *   • trailing whitespace is stripped from every line except the last
 *   • whitespace-only lines are dropped
 *   • remaining lines are joined with a single space
 */
function jsxTextToRenderedString(raw) {
  const lines = raw.split(/\r\n|\n|\r/);
  const kept = [];
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    const isFirst = i === 0;
    const isLast = i === lines.length - 1;
    if (!isFirst) line = line.replace(/^[ \t]+/, "");
    if (!isLast) line = line.replace(/[ \t]+$/, "");
    if (line.length === 0) continue;
    kept.push(line);
  }
  return kept.join(" ");
}

function isUserFacing(text) {
  const trimmed = String(text || "").trim();
  if (!trimmed) return false;
  if (IGNORED_EXACT.has(trimmed)) return false;
  if (!/[A-Za-z]/.test(trimmed)) return false;
  if (/^(https?:|data:|mailto:|tel:|\/|#[0-9a-fA-F]{3,8}$|rgba?\(|var\(|\.\/|\.\.\/)/.test(trimmed)) return false;
  // Tailwind-ish class soup.
  if (
    /^[a-z0-9-]+(\s+[a-z0-9:[\]#./%()-]+)+$/.test(trimmed) &&
    /(^|\s)(flex|grid|text-|bg-|border-|p-|m-|w-|h-|gap-|rounded|absolute|relative|hidden|items-|justify-|space-|overflow-|z-|opacity-)/.test(
      trimmed
    )
  )
    return false;
  return true;
}

/* ------------------------------------------------------------------ *
 * Key generation
 * ------------------------------------------------------------------ */

function slug(text, max = 44) {
  const s = String(text)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, max)
    .replace(/_+$/g, "");
  return s || "x";
}

function moduleNameFor(file) {
  const rel = path.relative(SRC, file).replace(/\\/g, "/").replace(/\.(tsx|ts)$/, "");
  return slug(rel.replace(/\//g, "_").replace(/([a-z0-9])([A-Z])/g, "$1_$2"), 60);
}

function tagSlug(tagName) {
  if (!tagName) return "el";
  return slug(tagName.replace(/\./g, "_").replace(/([a-z0-9])([A-Z])/g, "$1_$2"), 28);
}

/* ------------------------------------------------------------------ *
 * File processing
 * ------------------------------------------------------------------ */

function collectFiles(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (/node_modules|\.git|dist|build/.test(entry.name)) continue;
      collectFiles(full, acc);
    } else if (/\.tsx$/.test(entry.name)) {
      acc.push(full);
    }
  }
  return acc;
}

function openingElementOf(node) {
  if (!node) return null;
  if (ts.isJsxElement(node)) return node.openingElement;
  if (ts.isJsxSelfClosingElement(node)) return node;
  if (ts.isJsxOpeningElement(node)) return node;
  return null;
}

/**
 * Splits a JSX text node into the whitespace JSX would discard (kept verbatim
 * in the source so indentation survives) and the rendered core.
 * Whitespace that does *not* contain a newline is significant and therefore
 * travels inside the resolved string.
 */
function splitInsignificantWhitespace(raw) {
  const leadMatch = raw.match(/^\s*/);
  const trailMatch = raw.match(/\s*$/);
  const lead = leadMatch ? leadMatch[0] : "";
  const trail = trailMatch ? trailMatch[0] : "";
  return {
    keepLead: lead.includes("\n") ? lead : "",
    keepTrail: trail.includes("\n") && trail !== lead ? trail : "",
  };
}

function tagNameOf(node) {
  const opening = openingElementOf(node);
  if (!opening) return null;
  return opening.tagName.getText ? opening.tagName.getText() : String(opening.tagName.escapedText || "");
}

function importSpecifierFor(file) {
  let rel = path.relative(path.dirname(file), HOOK_MODULE).replace(/\\/g, "/");
  if (!rel.startsWith(".")) rel = `./${rel}`;
  return rel;
}

function processFile(file, slots, options) {
  const rel = path.relative(ROOT, file).replace(/\\/g, "/");
  if (EXCLUDED.has(rel)) return null;

  const original = fs.readFileSync(file, "utf8");
  const sf = ts.createSourceFile(file, original, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const moduleName = moduleNameFor(file);

  /** @type {{start:number,end:number,text:string}[]} */
  const edits = [];
  const usedKeys = new Map();
  const skipped = [];

  const makeKey = (parts) => {
    const base = parts.filter(Boolean).join(".");
    const count = usedKeys.get(base) || 0;
    usedKeys.set(base, count + 1);
    return count === 0 ? base : `${base}_${count + 1}`;
  };

  const lineOf = (node) => sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1;

  const visit = (node) => {
    /* ---------- already-migrated call sites (keeps re-runs idempotent) ------ */
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === "uiText" &&
      node.arguments.length >= 1 &&
      ts.isStringLiteral(node.arguments[0])
    ) {
      const key = node.arguments[0].text;
      const fallback =
        node.arguments[1] && ts.isStringLiteral(node.arguments[1]) ? node.arguments[1].text : "";
      usedKeys.set(key.replace(/_\d+$/, ""), (usedKeys.get(key.replace(/_\d+$/, "")) || 0) + 1);
      slots.push({
        element_key: key,
        module: key.split(".")[0] || moduleName,
        component_id: key.split(".")[1] || "el",
        kind: /\.placeholder$/.test(key)
          ? "placeholder"
          : /\.title$/.test(key)
          ? "tooltip"
          : /\.alt$/.test(key)
          ? "alt"
          : /\.aria_label$/.test(key)
          ? "label"
          : "text",
        default_text: fallback,
        source_file: rel,
        source_line: lineOf(node),
      });
    }

    /* ---------- JSX text ---------- */
    if (ts.isJsxText(node)) {
      const rendered = jsxTextToRenderedString(node.text);
      if (isUserFacing(rendered)) {
        const parentTag = tagNameOf(node.parent);
        if (parentTag && SKIP_PARENT_TAGS.has(parentTag)) {
          skipped.push({ reason: `inside <${parentTag}>`, text: rendered, line: lineOf(node) });
        } else {
          const decoded = decodeEntities(rendered);
          if (decoded === null) {
            skipped.push({ reason: "unknown html entity", text: rendered, line: lineOf(node) });
          } else {
            const key = makeKey([moduleName, tagSlug(parentTag || "text"), slug(decoded)]);
            const { keepLead, keepTrail } = splitInsignificantWhitespace(node.text);
            // JsxText leading whitespace is treated as trivia by getStart(); use
            // the full span so the whitespace we re-emit is not duplicated.
            edits.push({
              start: node.pos,
              end: node.end,
              text: `${keepLead}{uiText(${JSON.stringify(key)}, ${JSON.stringify(decoded)})}${keepTrail}`,
            });
            slots.push({
              element_key: key,
              module: moduleName,
              component_id: parentTag || "text",
              kind: /^h[1-6]$/.test(parentTag || "") ? "heading" : parentTag === "option" ? "option" : "text",
              default_text: decoded,
              source_file: rel,
              source_line: lineOf(node),
            });
          }
        }
      }
    }

    /* ---------- copy-bearing attributes ---------- */
    if (ts.isJsxAttribute(node)) {
      const attrName = node.name.getText ? node.name.getText(sf) : String(node.name.escapedText || "");
      const slotSuffix = ATTRIBUTE_SLOTS.get(attrName);
      let init = node.initializer;
      // `attr={"literal"}` is equivalent to `attr="literal"`.
      if (
        init &&
        ts.isJsxExpression(init) &&
        init.expression &&
        (ts.isStringLiteral(init.expression) || ts.isNoSubstitutionTemplateLiteral(init.expression))
      ) {
        init = init.expression;
      }
      if (slotSuffix && init && (ts.isStringLiteral(init) || ts.isNoSubstitutionTemplateLiteral(init))) {
        const owner = node.parent && node.parent.parent ? node.parent.parent : null;
        const ownerTag = tagNameOf(owner);
        const isStudioOwned = ownerTag && STUDIO_COMPONENT_RE.test(ownerTag);
        if (!isStudioOwned && isUserFacing(init.text)) {
          const decoded = decodeEntities(init.text);
          if (decoded === null) {
            skipped.push({ reason: "unknown html entity", text: init.text, line: lineOf(node) });
          } else {
            const key = makeKey([moduleName, tagSlug(ownerTag || "el"), slug(decoded), slotSuffix]);
            const replaceFrom = node.initializer ? node.initializer.getStart(sf) : init.getStart(sf);
            const replaceTo = node.initializer ? node.initializer.getEnd() : init.getEnd();
            edits.push({
              start: replaceFrom,
              end: replaceTo,
              text: `{uiText(${JSON.stringify(key)}, ${JSON.stringify(decoded)})}`,
            });
            slots.push({
              element_key: key,
              module: moduleName,
              component_id: ownerTag || "el",
              kind:
                slotSuffix === "sub_label"
                  ? "sub_label"
                  : slotSuffix === "description"
                  ? "helper"
                  : slotSuffix === "placeholder"
                  ? "placeholder"
                  : slotSuffix === "title"
                  ? "tooltip"
                  : slotSuffix === "alt"
                  ? "alt"
                  : "label",
              default_text: decoded,
              source_file: rel,
              source_line: lineOf(node),
            });
          }
        }
      }
    }

    ts.forEachChild(node, visit);
  };

  visit(sf);

  if (!edits.length) return { rel, changed: false, count: 0, skipped };

  // Apply edits back-to-front so offsets stay valid.
  edits.sort((a, b) => b.start - a.start);
  let output = original;
  for (const edit of edits) {
    output = output.slice(0, edit.start) + edit.text + output.slice(edit.end);
  }

  // Ensure the uiText import exists.
  if (!/\buiText\b/.test(original) || !/from\s+["'][^"']*hooks\/useUIConfig["']/.test(original)) {
    const spec = importSpecifierFor(file);
    const importLine = `import { uiText } from "${spec}";\n`;
    const importNodes = sf.statements.filter((s) => ts.isImportDeclaration(s));
    if (importNodes.length) {
      const last = importNodes[importNodes.length - 1];
      const insertAt = last.getEnd();
      // Offsets above are from the *original* text; recompute by locating the
      // same import statement inside the edited output.
      const importText = original.slice(last.getStart(sf), insertAt);
      const idx = output.indexOf(importText);
      if (idx !== -1) {
        output = output.slice(0, idx + importText.length) + "\n" + importLine.trimEnd() + output.slice(idx + importText.length);
      } else {
        output = importLine + output;
      }
    } else {
      output = importLine + output;
    }
  }

  if (options.apply) {
    fs.writeFileSync(file, output, "utf8");
  }
  return { rel, changed: true, count: edits.length, skipped };
}

/* ------------------------------------------------------------------ *
 * Registry emission
 * ------------------------------------------------------------------ */

function writeRegistry(slots) {
  const byKey = new Map();
  for (const slot of slots) byKey.set(slot.element_key, slot);
  const sorted = Array.from(byKey.values()).sort((a, b) => a.element_key.localeCompare(b.element_key));

  const header = `/**
 * GENERATED FILE — DO NOT EDIT BY HAND
 * ------------------------------------
 * Produced by \`node scripts/migrateHardcodedStrings.cjs --apply\`.
 *
 * Every user-facing string the codemod bound to the Button & Layout Optimizer
 * Studio is catalogued here with its compile-time fallback. The studio reads
 * this registry to enumerate editable slots; the *rendered* value always comes
 * from the database-backed record when one exists.
 *
 * Slots: ${sorted.length}
 * Generated: ${new Date().toISOString()}
 */

import type { UICopySlotDefinition } from "./uiConfigSchema";

export const GENERATED_COPY_SLOTS: UICopySlotDefinition[] = ${JSON.stringify(sorted, null, 0)
    .replace(/\},\{/g, "},\n  {")
    .replace(/^\[/, "[\n  ")
    .replace(/\]$/, ",\n]")};

export const GENERATED_COPY_SLOT_MAP: Record<string, UICopySlotDefinition> =
  Object.fromEntries(GENERATED_COPY_SLOTS.map((slot) => [slot.element_key, slot]));

export const GENERATED_COPY_MODULES: string[] = Array.from(
  new Set(GENERATED_COPY_SLOTS.map((slot) => slot.module))
).sort();

export default GENERATED_COPY_SLOTS;
`;
  fs.writeFileSync(REGISTRY_OUT, header, "utf8");
}

/* ------------------------------------------------------------------ *
 * Entry point
 * ------------------------------------------------------------------ */

function main() {
  const args = process.argv.slice(2);
  const apply = args.includes("--apply");
  const fileArg = args.includes("--file") ? args[args.indexOf("--file") + 1] : null;
  const limitArg = args.includes("--limit") ? parseInt(args[args.indexOf("--limit") + 1], 10) : null;

  let files = fileArg ? [path.resolve(ROOT, fileArg)] : collectFiles(SRC);
  files.sort();
  if (limitArg) files = files.slice(0, limitArg);

  const slots = [];
  const results = [];
  for (const file of files) {
    try {
      const result = processFile(file, slots, { apply });
      if (result) results.push(result);
    } catch (err) {
      console.error(`codemod: ${file} failed — ${err.message}`);
    }
  }

  const changed = results.filter((r) => r.changed);
  const total = changed.reduce((sum, r) => sum + r.count, 0);
  const skipped = results.flatMap((r) => r.skipped.map((s) => ({ file: r.rel, ...s })));

  if (apply && !fileArg) writeRegistry(slots);
  else if (apply && fileArg) {
    // Single-file runs merge into the existing registry instead of truncating it.
    let existing = [];
    if (fs.existsSync(REGISTRY_OUT)) {
      const src = fs.readFileSync(REGISTRY_OUT, "utf8");
      const match = src.match(/GENERATED_COPY_SLOTS: UICopySlotDefinition\[\] = (\[[\s\S]*?\]);/);
      if (match) {
        try {
          existing = JSON.parse(match[1].replace(/,\n\]$/, "\n]"));
        } catch {
          existing = [];
        }
      }
    }
    writeRegistry([...existing, ...slots]);
  }

  console.log(
    JSON.stringify(
      {
        mode: apply ? "apply" : "dry-run",
        filesScanned: files.length,
        filesChanged: changed.length,
        stringsBound: total,
        slotsRegistered: new Set(slots.map((s) => s.element_key)).size,
        skipped: skipped.length,
      },
      null,
      2
    )
  );

  if (skipped.length) {
    console.log("\nSkipped (needs manual review):");
    for (const s of skipped.slice(0, 40)) {
      console.log(`  ${s.file}:${s.line}  [${s.reason}]  ${JSON.stringify(s.text).slice(0, 90)}`);
    }
    if (skipped.length > 40) console.log(`  … ${skipped.length - 40} more`);
  }

  if (changed.length) {
    console.log("\nTop files:");
    for (const r of changed.sort((a, b) => b.count - a.count).slice(0, 15)) {
      console.log(`  ${String(r.count).padStart(5)}  ${r.rel}`);
    }
  }
}

main();
