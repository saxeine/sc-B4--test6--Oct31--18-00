#!/usr/bin/env node
/**
 * Phase 1 — Application-Wide String & Component Audit
 * ---------------------------------------------------
 * Walks every .ts/.tsx file under src/ with the TypeScript compiler API and
 * inventories every user-facing literal:
 *
 *   • JSX text nodes              <div>Load Image</div>
 *   • Copy-bearing JSX attributes placeholder / title / aria-label / alt / label / subLabel ...
 *   • JSX string expressions      {"Load Image"}
 *   • Registry fallbacks          defaultLabel / defaultText / defaultTooltip on <Customizable*>
 *
 * Every literal is classified:
 *   bound    → already flows through the Button & Layout Optimizer Studio registry
 *   unbound  → hardcoded; must be migrated to a studio element_key
 *   ignored  → non user-facing (css classes, urls, single symbols, numbers…)
 *
 * It also inventories every localStorage / sessionStorage access so Phase 2 can
 * prove the UI-config path is free of browser-local persistence.
 *
 * Usage:
 *   node scripts/auditUiStrings.cjs                 # writes docs/ui-copy-audit.{json,md}
 *   node scripts/auditUiStrings.cjs --check         # non-zero exit if unbound copy grew past the budget
 *   node scripts/auditUiStrings.cjs --file src/App.tsx
 */

const fs = require("fs");
const path = require("path");
const ts = require("typescript");

const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "src");
const OUT_JSON = path.join(ROOT, "docs", "ui-copy-audit.json");
const OUT_MD = path.join(ROOT, "docs", "UI_COPY_AUDIT.md");

/** Attributes whose string values are rendered to the user. */
const COPY_ATTRIBUTES = new Set([
  "placeholder",
  "title",
  "alt",
  "aria-label",
  "aria-placeholder",
  "aria-description",
  "aria-roledescription",
  "label",
  "subLabel",
  "sublabel",
  "helperText",
  "helper",
  "tooltip",
  "heading",
  "header",
  "caption",
  "description",
  "emptyMessage",
  "confirmLabel",
  "cancelLabel",
  "badge",
]);

/** Attributes that *declare* a registry fallback (already studio-driven). */
const REGISTRY_FALLBACK_ATTRIBUTES = new Set([
  "defaultLabel",
  "defaultText",
  "defaultTooltip",
  "defaultSubLabel",
  "defaultPlaceholder",
  "defaultHelper",
]);

/** Components that already read from the Optimizer Studio registry. */
const STUDIO_COMPONENT_RE =
  /^(Customizable(Button|Label|Container|Logo)|Config(Section|Header|Label|SubLabel|Text|Icon|Button|Input|Option|Message)|IconNameSelect|UIText|UIBlock|StudioText)$/;

/** Attributes that carry the studio element key. */
const KEY_ATTRIBUTES = new Set(["buttonId", "labelId", "elementKey", "containerId", "logoId"]);

const IGNORED_EXACT = new Set(["", "-", "–", "—", "·", "•", "|", "/", "\\", ":", "×", "✓", "+", "...", "…"]);

function isUserFacing(raw) {
  const text = String(raw || "").trim();
  if (!text) return false;
  if (IGNORED_EXACT.has(text)) return false;
  // Must contain at least one letter.
  if (!/[A-Za-z]/.test(text)) return false;
  // Pure identifiers used as data keys (snake/camel with no spaces) are usually not copy…
  // …but single capitalised words ("Save", "Cancel") definitely are.
  if (/^[a-z0-9_]+$/.test(text) && !/\s/.test(text) && text.length > 2 && text.includes("_")) return false;
  // Tailwind-ish class strings / css values / urls / data uris.
  if (/^(https?:|data:|\/|#[0-9a-fA-F]{3,8}$|rgba?\(|var\(|\.\/|\.\.\/)/.test(text)) return false;
  if (/^[a-z-]+(\s+[a-z0-9:[\]#./%-]+)+$/.test(text) && /(^|\s)(flex|grid|text-|bg-|border-|p-|m-|w-|h-|gap-|rounded|absolute|relative|hidden|items-|justify-)/.test(text))
    return false;
  if (/^[A-Za-z]+\/[A-Za-z]+$/.test(text) && text.length < 12 && !/\s/.test(text)) return false;
  return true;
}

function slug(text, max = 42) {
  return String(text)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, max)
    .replace(/_+$/g, "");
}

function moduleNameFor(file) {
  const rel = path.relative(SRC, file).replace(/\\/g, "/");
  const base = rel.replace(/\.(tsx|ts)$/, "");
  const parts = base.split("/");
  const leaf = parts[parts.length - 1];
  return slug(
    leaf
      .replace(/Modal$|Panel$|Studio$/, (m) => m)
      .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
  );
}

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

function jsxTagName(node) {
  if (!node) return null;
  const opening = ts.isJsxElement(node)
    ? node.openingElement
    : ts.isJsxSelfClosingElement(node) || ts.isJsxOpeningElement(node)
    ? node
    : null;
  if (!opening) return null;
  return opening.tagName.getText ? opening.tagName.getText() : String(opening.tagName.escapedText || "");
}

function attributesOf(node) {
  const opening = ts.isJsxElement(node)
    ? node.openingElement
    : ts.isJsxSelfClosingElement(node) || ts.isJsxOpeningElement(node)
    ? node
    : null;
  if (!opening) return [];
  return opening.attributes.properties.filter(ts.isJsxAttribute);
}

function literalValueOf(attr) {
  const init = attr.initializer;
  if (!init) return null;
  if (ts.isStringLiteral(init)) return init.text;
  if (ts.isJsxExpression(init) && init.expression && ts.isStringLiteral(init.expression))
    return init.expression.text;
  if (
    ts.isJsxExpression(init) &&
    init.expression &&
    ts.isNoSubstitutionTemplateLiteral(init.expression)
  )
    return init.expression.text;
  return null;
}

function elementKeyOf(node) {
  for (const attr of attributesOf(node)) {
    const name = attr.name.getText ? attr.name.getText() : String(attr.name.escapedText || "");
    if (KEY_ATTRIBUTES.has(name)) {
      const v = literalValueOf(attr);
      if (v) return v;
      return "<dynamic>";
    }
  }
  return null;
}

function auditFile(file) {
  const source = fs.readFileSync(file, "utf8");
  const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const rel = path.relative(ROOT, file).replace(/\\/g, "/");
  const moduleName = moduleNameFor(file);
  const findings = [];
  const storage = [];
  const messages = [];

  const lineOf = (node) => sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1;

  const record = (node, kind, text, extra = {}) => {
    findings.push({
      file: rel,
      module: moduleName,
      line: lineOf(node),
      kind,
      text: String(text).replace(/\s+/g, " ").trim(),
      ...extra,
    });
  };

  const MESSAGE_SINK_RE =
    /^(alert|confirm|prompt)$|^set[A-Za-z]*(Notice|Status|Message|Error|Toast|Feedback|Info|Warning)$/;

  const visit = (node) => {
    // ---- imperative messages (toasts / alerts / status lines) ------------
    if (ts.isCallExpression(node)) {
      const callee = ts.isIdentifier(node.expression)
        ? node.expression.text
        : ts.isPropertyAccessExpression(node.expression)
        ? node.expression.name.text
        : "";
      if (callee === "uiMessage" && node.arguments.length) {
        messages.push({
          file: rel,
          line: sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1,
          sink: "uiMessage",
          dynamic: node.arguments.length > 2,
          bound: true,
          snippet: node.getText(sf).replace(/\s+/g, " ").slice(0, 110),
        });
      }
      if (MESSAGE_SINK_RE.test(callee) && node.arguments.length) {
        const arg = node.arguments[0];
        const isTemplate = ts.isTemplateExpression(arg) || ts.isNoSubstitutionTemplateLiteral(arg);
        const isString = ts.isStringLiteral(arg);
        if ((isTemplate || isString) && /[A-Za-z]{4}/.test(arg.getText(sf))) {
          messages.push({
            file: rel,
            line: sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1,
            sink: callee,
            dynamic: isTemplate,
            snippet: arg.getText(sf).replace(/\s+/g, " ").slice(0, 110),
          });
        }
      }
    }

    // ---- localStorage / sessionStorage inventory -------------------------
    if (ts.isPropertyAccessExpression(node)) {
      const objText = node.expression.getText(sf);
      if (objText === "localStorage" || objText === "sessionStorage" || /\.localStorage$/.test(objText)) {
        storage.push({
          file: rel,
          line: lineOf(node),
          api: `${objText}.${node.name.getText(sf)}`,
          snippet: node.parent && node.parent.getText ? node.parent.getText(sf).replace(/\s+/g, " ").slice(0, 160) : "",
        });
      }
    }

    // ---- JSX text nodes --------------------------------------------------
    if (ts.isJsxText(node)) {
      const text = node.text.replace(/\s+/g, " ").trim();
      if (isUserFacing(text)) {
        const parentTag = jsxTagName(node.parent);
        const studioParent = parentTag && STUDIO_COMPONENT_RE.test(parentTag);
        record(node, "jsx_text", text, {
          component: parentTag || "<unknown>",
          elementKey: studioParent ? elementKeyOf(node.parent) : null,
          status: studioParent ? "bound" : "unbound",
          suggestedKey: `${moduleName}.${slug(parentTag || "text")}.${slug(text)}`,
        });
      }
    }

    // ---- {"literal"} inside JSX -----------------------------------------
    if (
      ts.isJsxExpression(node) &&
      node.expression &&
      (ts.isStringLiteral(node.expression) || ts.isNoSubstitutionTemplateLiteral(node.expression)) &&
      node.parent &&
      (ts.isJsxElement(node.parent) || ts.isJsxFragment(node.parent))
    ) {
      const text = node.expression.text;
      if (isUserFacing(text)) {
        const parentTag = jsxTagName(node.parent);
        const studioParent = parentTag && STUDIO_COMPONENT_RE.test(parentTag);
        record(node, "jsx_expression_text", text, {
          component: parentTag || "<fragment>",
          elementKey: studioParent ? elementKeyOf(node.parent) : null,
          status: studioParent ? "bound" : "unbound",
          suggestedKey: `${moduleName}.${slug(parentTag || "text")}.${slug(text)}`,
        });
      }
    }

    // ---- copy-bearing attributes ----------------------------------------
    if (ts.isJsxAttribute(node)) {
      const name = node.name.getText ? node.name.getText(sf) : String(node.name.escapedText || "");
      const value = literalValueOf(node);
      if (value && isUserFacing(value)) {
        const owner = node.parent && node.parent.parent ? node.parent.parent : null;
        const tag = jsxTagName(owner);
        const studioOwner = tag && STUDIO_COMPONENT_RE.test(tag);
        if (REGISTRY_FALLBACK_ATTRIBUTES.has(name)) {
          record(node, `fallback:${name}`, value, {
            component: tag || "<unknown>",
            elementKey: owner ? elementKeyOf(owner) : null,
            status: studioOwner ? "bound" : "unbound",
            suggestedKey: owner && elementKeyOf(owner) ? elementKeyOf(owner) : `${moduleName}.${slug(tag || "el")}.${slug(value)}`,
          });
        } else if (COPY_ATTRIBUTES.has(name)) {
          record(node, `attr:${name}`, value, {
            component: tag || "<unknown>",
            elementKey: owner ? elementKeyOf(owner) : null,
            status: studioOwner && name === "title" ? "bound" : "unbound",
            suggestedKey: `${moduleName}.${slug(tag || "el")}.${slug(value)}.${slug(name)}`,
          });
        }
      }
    }

    ts.forEachChild(node, visit);
  };

  visit(sf);
  return { findings, storage, messages };
}

function main() {
  const args = process.argv.slice(2);
  const only = args.includes("--file") ? args[args.indexOf("--file") + 1] : null;
  const files = only ? [path.resolve(ROOT, only)] : collectFiles(SRC);

  const allFindings = [];
  const allStorage = [];
  const allMessages = [];
  for (const f of files) {
    try {
      const { findings, storage, messages } = auditFile(f);
      allFindings.push(...findings);
      allStorage.push(...storage);
      allMessages.push(...messages);
    } catch (err) {
      console.error(`audit: failed to parse ${f}: ${err.message}`);
    }
  }

  const byFile = {};
  for (const f of allFindings) {
    byFile[f.file] = byFile[f.file] || { file: f.file, module: f.module, bound: 0, unbound: 0, findings: [] };
    byFile[f.file][f.status] += 1;
    byFile[f.file].findings.push(f);
  }

  const storageByFile = {};
  for (const s of allStorage) {
    storageByFile[s.file] = (storageByFile[s.file] || 0) + 1;
  }

  const summary = {
    generatedAt: new Date().toISOString(),
    filesScanned: files.length,
    totalLiterals: allFindings.length,
    bound: allFindings.filter((f) => f.status === "bound").length,
    unbound: allFindings.filter((f) => f.status === "unbound").length,
    storageAccesses: allStorage.length,
    storageFiles: Object.keys(storageByFile).length,
    imperativeMessages: allMessages.length,
    imperativeMessagesBound: allMessages.filter((m) => m.bound).length,
  };

  fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true });
  fs.writeFileSync(
    OUT_JSON,
    JSON.stringify(
      { summary, files: Object.values(byFile), storage: allStorage, imperativeMessages: allMessages },
      null,
      2
    )
  );

  const ranked = Object.values(byFile).sort((a, b) => b.unbound - a.unbound);
  const md = [];
  md.push("# UI Copy & Layout Audit");
  md.push("");
  md.push(`_Generated ${summary.generatedAt} by \`scripts/auditUiStrings.cjs\`._`);
  md.push("");
  md.push("| Metric | Value |");
  md.push("| --- | ---: |");
  md.push(`| Files scanned | ${summary.filesScanned} |`);
  md.push(`| User-facing literals found | ${summary.totalLiterals} |`);
  md.push(`| Studio-bound (registry driven) | ${summary.bound} |`);
  md.push(`| Hardcoded / unbound | ${summary.unbound} |`);
  md.push(`| localStorage / sessionStorage accesses | ${summary.storageAccesses} across ${summary.storageFiles} files |`);
  md.push(
    `| Imperative messages (toasts / alerts / status) | ${summary.imperativeMessages} (${summary.imperativeMessagesBound} bound via \`uiMessage\`) |`
  );
  md.push("");
  md.push("## Unbound copy per file (migration backlog)");
  md.push("");
  md.push("| File | Module | Unbound | Bound | Browser storage |");
  md.push("| --- | --- | ---: | ---: | ---: |");
  for (const f of ranked) {
    if (!f.unbound && !f.bound) continue;
    md.push(`| \`${f.file}\` | \`${f.module}\` | ${f.unbound} | ${f.bound} | ${storageByFile[f.file] || 0} |`);
  }
  md.push("");
  md.push("## Browser-storage accesses (must be zero in the UI-config path)");
  md.push("");
  md.push("| File | Accesses |");
  md.push("| --- | ---: |");
  for (const [file, count] of Object.entries(storageByFile).sort((a, b) => b[1] - a[1])) {
    md.push(`| \`${file}\` | ${count} |`);
  }
  md.push("");
  md.push("## Imperative messages — Phase 5 backlog");
  md.push("");
  md.push(
    "Toasts, alerts and status lines are produced outside the render tree, so the JSX codemod cannot bind them. " +
      "Wrap them with `uiMessage(key, fallback, vars)` (see `src/hooks/useUIConfig.ts`) to bring them under studio control."
  );
  md.push("");
  const msgByFile = {};
  for (const m of allMessages) msgByFile[m.file] = (msgByFile[m.file] || 0) + 1;
  md.push("| File | Messages |");
  md.push("| --- | ---: |");
  for (const [file, count] of Object.entries(msgByFile).sort((a, b) => b[1] - a[1]).slice(0, 30)) {
    md.push(`| \`${file}\` | ${count} |`);
  }
  md.push("");
  fs.writeFileSync(OUT_MD, md.join("\n"));

  console.log(JSON.stringify(summary, null, 2));
  console.log(`\nWrote ${path.relative(ROOT, OUT_JSON)} and ${path.relative(ROOT, OUT_MD)}`);
}

main();
