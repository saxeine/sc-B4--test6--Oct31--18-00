/**
 * IBC Autoscan Codemod
 * ====================
 * Scans the whole application for UI elements that are NOT yet wired into the
 * Interactive Button Customizer (IBC) engine and converts them:
 *
 *   raw <button>      -> <CustomizableButton  buttonId="..."  defaultLabel/Icon>
 *   raw <h1..h6>      -> <CustomizableLabel   labelId="..."   as="hN">
 *   raw <label>       -> <CustomizableLabel   labelId="..."   as="label">
 *
 * Elements that already carry a `buttonId` / `labelId` / `data-ibc-id`
 * attribute are skipped. Elements inside the IBC primitives themselves
 * (CustomizableButton / CustomizableLabel / CustomizableLogo /
 * CustomizableContainer, HoldButton) and the main.tsx error boundary (which
 * renders outside the ButtonCustomizationProvider) are excluded.
 *
 * Every converted element receives:
 *   - a stable, unique id (minted from file + visible label, global de-dup)
 *   - a default label (its existing visible text, if any)
 *   - a default icon  (its existing lucide icon child, or a registry default)
 *
 * Registry entries are appended to
 *   src/types/ibcAutoscanDefinitions.generated.ts
 * which is merged into BUTTON_DEFINITIONS.
 *
 *   npx tsx scripts/ibcAutoscan.ts             # apply
 *   npx tsx scripts/ibcAutoscan.ts --dry-run   # report only
 */

import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const ROOT = process.cwd();
const SRC = path.join(ROOT, "src");
const OUT_FILE = path.join(SRC, "types/ibcAutoscanDefinitions.generated.ts");
const DRY_RUN = process.argv.includes("--dry-run");

/* ------------------------------------------------------------------ */
/* Existing ids (registry + already-minted ids in the codebase)        */
/* ------------------------------------------------------------------ */

function collectExistingIds(): Set<string> {
  const ids = new Set<string>();
  const addIdPattern = (text: string, re: RegExp) => {
    let m: RegExpExecArray | null;
    while ((m = re.exec(text))) ids.add(m[1]);
  };
  // 1. Every id declared in the registry sources.
  for (const regFile of [
    "types/buttonCustomization.ts",
    "types/componentRegistry.ts",
    "types/atomicComponentManifest.ts",
  ]) {
    const full = path.join(SRC, regFile);
    if (fs.existsSync(full)) {
      addIdPattern(fs.readFileSync(full, "utf8"), /id:\s*"([^"]+)"/g);
    }
  }
  // 2. buttonId="..." / labelId="..." / data-ibc-id="..." literals anywhere in src.
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(tsx|ts)$/.test(entry.name)) {
        addIdPattern(fs.readFileSync(full, "utf8"), /(?:buttonId|labelId|data-ibc-id)=["']([^"']+)["']/g);
      }
    }
  };
  walk(SRC);
  return ids;
}

const usedIds = collectExistingIds();

/* Icon names that really exist in the Lucide registry — PascalCase children
   of other kinds (FxIcon, IconComponent, ConfigLabel, CustomizableLabel…)
   must stay in place, not be mistaken for icons. */
const LUCIDE_NAMES = new Set<string>();
{
  const mapFile = path.join(SRC, "utils/lucideIconMap.generated.ts");
  if (fs.existsSync(mapFile)) {
    const text = fs.readFileSync(mapFile, "utf8");
    const block = text.slice(text.indexOf("LUCIDE_ICON_MAP"));
    const body = block.slice(block.indexOf("{") + 1, block.indexOf("};"));
    for (const line of body.split("\n")) {
      const m = line.trim().match(/^"?([A-Za-z0-9_]+)"?\s*,?\s*$/);
      if (m) LUCIDE_NAMES.add(m[1]);
    }
  }
}

function uniqueId(candidate: string): string {
  if (!usedIds.has(candidate)) {
    usedIds.add(candidate);
    return candidate;
  }
  let n = 2;
  while (usedIds.has(`${candidate}_${n}`)) n += 1;
  const id = `${candidate}_${n}`;
  usedIds.add(id);
  return id;
}

/* ------------------------------------------------------------------ */
/* File classification                                                 */
/* ------------------------------------------------------------------ */

const SKIP_FILES = new Set([
  "components/CustomizableButton.tsx",
  "components/CustomizableLabel.tsx",
  "components/CustomizableLogo.tsx",
  "components/CustomizableContainer.tsx",
  "components/HoldButton.tsx",
  "utils/customIconRegistry.tsx",
  "main.tsx", // error boundary renders outside ButtonCustomizationProvider
]);

const CATEGORY_BY_FILE: Record<string, string> = {
  "App.tsx": "canvas",
  "components/AdvModal.tsx": "adv_modal",
  "components/AdvertPanelFullScreenModal.tsx": "front_page_ad_panels",
  "components/AdvertPanelPaletteWheel.tsx": "front_page_ad_panels",
  "components/AniComper4StudioModal.tsx": "anicomper4",
  "components/AniComposerModal.tsx": "adv_modal",
  "components/AppLogModal.tsx": "the_log",
  "components/AutoSliceModal.tsx": "adv_modal",
  "components/Bubba1StudioModal.tsx": "creative_studio",
  "components/BulkRenameModal.tsx": "modals",
  "components/BulkRenamePanel.tsx": "modals",
  "components/ButtonContextMenu.tsx": "button_customizer",
  "components/ButtonCustomizationModal.tsx": "button_customizer",
  "components/CanvasHistoryVisualizer.tsx": "canvas",
  "components/CloudConfigEditorModal.tsx": "utility_modal",
  "components/ControlDeckModal.tsx": "control_deck",
  "components/CreativeStudioMenu.tsx": "creative_studio",
  "components/CropMeshOverlay.tsx": "crop",
  "components/CropSidebar.tsx": "crop",
  "components/CustomLayoutPresetsModal.tsx": "utility_modal",
  "components/CustomSpreadModal.tsx": "spread_studio",
  "components/DialControl.tsx": "button_customizer",
  "components/ExpandViewModal.tsx": "modals",
  "components/ExportJsonModal.tsx": "modals",
  "components/FourByFourModal.tsx": "front_page_ad_panels",
  "components/FramePlayerModal.tsx": "aniplayer",
  "components/FullScreenCropControlPanel.tsx": "crop",
  "components/FreestyleSlicePreview.tsx": "multicrop",
  "components/GridMeshStudioModal.tsx": "adv_modal",
  "components/IbcInspectorOverlay.tsx": "button_customizer",
  "components/ImageSharpenerModal.tsx": "sharpener_studio",
  "components/ImgDescStudioModal.tsx": "creative_studio",
  "components/JoinImagesModal.tsx": "utility_modal",
  "components/KrumsStudioModal.tsx": "krums_studio",
  "components/MaskingCanvas.tsx": "crop",
  "components/MesshiStudioModal.tsx": "adv_modal",
  "components/MouseOverStudioModal.tsx": "utility_modal",
  "components/Neo1StudioModal.tsx": "neo1_studio",
  "components/ParallaxStudioModal.tsx": "front_page_ad_panels",
  "components/RadialColorPicker.tsx": "button_customizer",
  "components/ResampleStudioModal.tsx": "resample_studio",
  "components/RotationSeriesModal.tsx": "header",
  "components/ScreenplayWriter.tsx": "creative_studio",
  "components/ShapeStudioModal.tsx": "creative_studio",
  "components/ShortcutManagerModal.tsx": "utility_modal",
  "components/SmartContourAutoSlicerModal.tsx": "adv_modal",
  "components/SmartTrimModal.tsx": "adv_modal",
  "components/SplitsPreviewDock.tsx": "canvas",
  "components/StoryboardAssetSorterBar.tsx": "asset_pool",
  "components/StoryboardOperationsModal.tsx": "storyboard",
  "components/TileLinkModal.tsx": "front_page_ad_panels",
  "components/TraceStudioModal.tsx": "creative_studio",
  "components/TxtStudioModal.tsx": "creative_studio",
  "components/UICopyRegistryPanel.tsx": "utility_modal",
  "components/UtilityModal.tsx": "utility_modal",
  "components/VariationsStudioModal.tsx": "creative_studio",
  "components/WholePanelStyleDialModal.tsx": "button_customizer",
  "components/ZipNameModal.tsx": "modals",
  "components/ZoomImageStudioModal.tsx": "zoom_studio",
  "components/system/SystemView.tsx": "button_customizer",
  "components/system/ComponentCheatSheet.tsx": "button_customizer",
  "components/system/StudioDeepLinkBridge.tsx": "button_customizer",
};

const CATEGORY_BY_DIR: Record<string, string> = {
  imgdesc: "creative_studio",
  neo1: "neo1_studio",
  system: "button_customizer",
  ui: "button_customizer",
};

function categoryFor(relPath: string): string {
  if (CATEGORY_BY_FILE[relPath]) return CATEGORY_BY_FILE[relPath];
  const parts = relPath.split("/");
  for (const key of Object.keys(CATEGORY_BY_DIR)) {
    if (parts.includes(key)) return CATEGORY_BY_DIR[key];
  }
  return "modals";
}

function filePrefix(relPath: string): string {
  const parts = relPath.replace(/\.tsx$/, "").split("/");
  const base = parts[parts.length - 1].replace(/([a-z0-9])([A-Z])/g, "$1_$2").toLowerCase();
  if (parts.length === 1) return base;
  const dir = parts.slice(0, -1).filter((p) => p !== "components").join("_");
  return dir ? `${dir}_${base}` : base;
}

function componentName(relPath: string): string {
  return relPath.split("/").pop()!.replace(/\.tsx$/, "");
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 34);
}

function collapse(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

function textIndent(source: string, start: number): string {
  let i = start - 1;
  while (i >= 0 && source[i] !== "\n") i -= 1;
  const lineStart = i + 1;
  return source.slice(lineStart, start).match(/^[ \t]*/)?.[0] ?? "";
}

/* ------------------------------------------------------------------ */
/* AST helpers                                                         */
/* ------------------------------------------------------------------ */

function openingOf(node: ts.JsxElement | ts.JsxSelfClosingElement) {
  return ts.isJsxElement(node) ? node.openingElement : node;
}

function attrName(attr: ts.JsxAttribute): string {
  return attr.name.getText();
}

function staticAttrValue(attr: ts.JsxAttribute): string | undefined {
  if (attr.initializer && ts.isStringLiteral(attr.initializer)) return attr.initializer.text;
  return undefined;
}

function isTargetNode(sf: ts.SourceFile, node: ts.Node): boolean {
  if (!(ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node))) return false;
  const tag = openingOf(node as ts.JsxElement | ts.JsxSelfClosingElement).tagName.getText(sf);
  if (tag !== "button" && tag !== "label" && !/^h[1-6]$/.test(tag)) return false;
  const opening = openingOf(node as ts.JsxElement | ts.JsxSelfClosingElement);
  return !opening.attributes.properties.some(
    (p) => ts.isJsxAttribute(p) && ["buttonId", "labelId", "data-ibc-id"].includes(attrName(p))
  );
}

type IconNode = ts.JsxSelfClosingElement | ts.JsxElement;

function isIconNode(sf: ts.SourceFile, child: ts.Node): child is IconNode {
  if (ts.isJsxSelfClosingElement(child)) {
    const name = child.tagName.getText(sf);
    return /^[A-Z][A-Za-z0-9_]*$/.test(name) && LUCIDE_NAMES.has(name);
  }
  if (ts.isJsxElement(child)) {
    return child.openingElement.tagName.getText(sf) === "svg";
  }
  return false;
}

function iconTagText(sf: ts.SourceFile, node: IconNode): string {
  return ts.isJsxSelfClosingElement(node)
    ? node.tagName.getText(sf)
    : node.openingElement.tagName.getText(sf);
}

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface Conversion {
  origStart: number;
  origEnd: number;
  newText: string;
  id: string;
  tag: string;
  needsImport: "CustomizableButton" | "CustomizableLabel";
  definition: {
    id: string;
    category: string;
    defaultLabel: string;
    defaultIconName: string;
    defaultTooltip: string;
    description: string;
    supportsZeroText: boolean;
    componentType: "button" | "label";
  };
}

const DEFAULT_ICON_BY_TAG: Record<string, string> = {
  button: "Zap",
  h1: "Type",
  h2: "Type",
  h3: "Type",
  h4: "Type",
  h5: "Type",
  h6: "Type",
  label: "Info",
};

/* ------------------------------------------------------------------ */
/* Per-file driver                                                     */
/* ------------------------------------------------------------------ */

function walk(dir: string, acc: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, acc);
    else if (full.endsWith(".tsx")) acc.push(full);
  }
  return acc;
}

interface FileReport {
  file: string;
  buttons: number;
  labels: number;
  headings: number;
}

const reports: FileReport[] = [];
const allDefinitions: Conversion["definition"][] = [];
let totalButtons = 0;
let totalLabels = 0;
let totalHeadings = 0;
let skippedAlreadyWired = 0;

for (const file of walk(SRC).sort()) {
  const relPath = path.relative(SRC, file).split(path.sep).join("/");
  if (SKIP_FILES.has(relPath) || relPath.endsWith(".generated.ts")) continue;
  const source = fs.readFileSync(file, "utf8");

  const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

  /* Pass 1 — discover targets (innermost sorted by start). */
  const targets: (ts.JsxElement | ts.JsxSelfClosingElement)[] = [];
  let rawSeen = 0;
  const visit = (node: ts.Node) => {
    if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tag = openingOf(node as ts.JsxElement | ts.JsxSelfClosingElement).tagName.getText(sf);
      if (tag === "button" || tag === "label" || /^h[1-6]$/.test(tag)) {
        if (isTargetNode(sf, node)) targets.push(node as ts.JsxElement | ts.JsxSelfClosingElement);
        else rawSeen += 1;
        // keep descending: nested raw targets inside (e.g. a button inside a
        // label) are separate elements and must be converted too.
      }
    }
    node.forEachChild(visit);
  };
  visit(sf);
  if (rawSeen) skippedAlreadyWired += rawSeen;

  if (targets.length === 0) continue;

  /* Build the conversion list. Process innermost-first (descending start)
     so that when a parent's children are materialised, every nested
     conversion already has its final markup. */
  const ordered = [...targets].sort((a, b) => b.getStart(sf) - a.getStart(sf));
  const conversions: Conversion[] = [];
  const seq = { noLabel: 0 };

  const materialize = (start: number, end: number): string => {
    let out = "";
    let cursor = start;
    for (const c of [...conversions].sort((a, b) => a.origStart - b.origStart)) {
      if (c.origStart >= start && c.origEnd <= end) {
        out += source.slice(cursor, c.origStart) + c.newText;
        cursor = c.origEnd;
      }
      if (c.origStart >= end) break;
    }
    out += source.slice(cursor, end);
    return out;
  };

  for (const element of ordered) {
    const isSelfClosing = ts.isJsxSelfClosingElement(element);
    const opening = openingOf(element);
    const tag = opening.tagName.getText(sf);
    const prefix = filePrefix(relPath);
    const isButton = tag === "button";

    /* Attributes */
    const keepAttrs: ts.JsxAttribute[] = [];
    let titleValue: string | undefined;
    let ariaValue: string | undefined;
    for (const attr of opening.attributes.properties) {
      if (!ts.isJsxAttribute(attr)) continue;
      const name = attrName(attr);
      if (name === "onContextMenu") continue; // IBC handler takes over
      if (name === "title") titleValue = staticAttrValue(attr);
      if (name === "aria-label") ariaValue = staticAttrValue(attr);
      keepAttrs.push(attr);
    }
    const attrsText = keepAttrs
      .map((a) => materialize(a.getStart(sf), a.getEnd()))
      .join("\n");

    /* Children — original order, whitespace-only text dropped. */
    const childrenNodes: ts.Node[] = isSelfClosing
      ? []
      : (element as ts.JsxElement).children.filter(
          (c) => !(ts.isJsxText(c) && c.getText(sf).trim().length === 0)
        );
    const textNodes = childrenNodes.filter((c) => ts.isJsxText(c));
    const iconNodes = childrenNodes.filter((c) => isIconNode(sf, c));

    const singleIcon = iconNodes.length === 1 ? iconNodes[0] : undefined;
    // A single text node becomes the editable IBC label (rendered live from
    // the customization config). Multiple text nodes keep their original
    // markup verbatim so visible output is preserved exactly.
    const singleText =
      textNodes.length === 1 && iconNodes.length <= 1 ? textNodes[0] : undefined;
    const extractText = singleText;
    const extractIcon = singleIcon;

    const visibleText = extractText ? collapse(extractText.getText(sf)) : "";
    const idSourceText = extractText
      ? visibleText
      : collapse(textNodes.map((t) => t.getText(sf)).join(" "));

    /* id */
    let base = idSourceText ? slugify(idSourceText) : "";
    if (!base) base = slugify(titleValue || ariaValue || "");
    if (!base) {
      seq.noLabel += 1;
      base = `${tag === "button" ? "btn" : "item"}_${seq.noLabel}`;
    }
    const id = uniqueId(`${prefix}_${base}`);

    /* Registry label — never inject text that was not originally visible. */
    const registryLabel = extractText
      ? visibleText
      : isButton
        ? ""
        : ariaValue || titleValue || "";
    const iconName = singleIcon
      ? /svg/i.test(iconTagText(sf, singleIcon))
        ? "Zap"
        : iconTagText(sf, singleIcon)
      : DEFAULT_ICON_BY_TAG[tag] || "Zap";
    const description = `${componentName(relPath)} — ${registryLabel || titleValue || ariaValue || `Element ${id.slice(-8)}`}`;
    const tooltip = titleValue || description;

    /* JSX body */
    const keptNodes = childrenNodes.filter((c) => c !== extractText && c !== extractIcon);
    const simpleCase = !isSelfClosing && keptNodes.length === 0;
    const indent = textIndent(source, element.getStart(sf));
    const inner = indent + "  ";
    const name = isButton ? "CustomizableButton" : "CustomizableLabel";
    const idProp = isButton ? `buttonId=${JSON.stringify(id)}` : `labelId=${JSON.stringify(id)}`;

    const props: string[] = [idProp];
    // JSX string attributes do not honour backslash escapes — emit the label
    // as a JS string expression instead.
    if (extractText) props.push(`defaultLabel={${JSON.stringify(visibleText)}}`);
    if (extractIcon) props.push(`defaultIcon={${materialize(extractIcon.getStart(sf), extractIcon.getEnd())}}`);
    if (!isButton) props.push(`as=${JSON.stringify(tag)}`);
    if (attrsText) props.push(attrsText);
    const propsBlock = props.join("\n" + inner);

    let body: string;
    if (isSelfClosing || simpleCase) {
      body = `<${name}\n${inner}${propsBlock}\n${indent}/>`;
    } else {
      // Function children keep the original child order; the extracted text
      // node is replaced by the live IBC label. `ibcProps` is a reserved,
      // collision-safe parameter name.
      const parts = childrenNodes
        .map((c) => {
          if (c === extractIcon) return "";
          if (c === extractText) return `{!ibcProps.isTextHidden ? ibcProps.label : null}`;
          return materialize(c.getStart(sf), c.getEnd());
        })
        .filter((s) => s.length > 0);
      const fnBody = parts.join("\n" + inner + "      ") || "null";
      const arrow = extractText
        ? `{(ibcProps) => (\n${inner}      <>\n${inner}        ${fnBody}\n${inner}      </>\n${inner}    )}`
        : `{() => (\n${inner}      <>\n${inner}        ${fnBody}\n${inner}      </>\n${inner}    )}`;
      body = `<${name}\n${inner}${propsBlock}\n${indent}>\n${inner}  ${arrow}\n${indent}</${name}>`;
    }

    const conversion: Conversion = {
      origStart: element.getStart(sf),
      origEnd: element.getEnd(),
      newText: body,
      id,
      tag,
      needsImport: isButton ? "CustomizableButton" : "CustomizableLabel",
      definition: {
        id,
        category: categoryFor(relPath),
        defaultLabel: registryLabel,
        defaultIconName: iconName,
        defaultTooltip: tooltip,
        description,
        supportsZeroText: isButton,
        componentType: isButton ? "button" : "label",
      },
    };
    conversions.push(conversion);
  }

  /* Apply innermost-first. A splice at position p only shifts positions
     after p, so a conversion's start is never shifted by already-applied
     (later-starting) splices; its end is shifted only by splices that
     begin inside it (nested conversions). */
  let working = source;
  const applied: { start: number; lenDelta: number }[] = [];
  for (const c of [...conversions].sort((a, b) => b.origStart - a.origStart)) {
    const nestedDelta = applied.reduce(
      (acc, a) => (a.start >= c.origStart && a.start < c.origEnd ? acc + a.lenDelta : acc),
      0
    );
    const s = c.origStart;
    const e = c.origEnd + nestedDelta;
    working = working.slice(0, s) + c.newText + working.slice(e);
    applied.push({ start: c.origStart, lenDelta: c.newText.length - (c.origEnd - c.origStart) });
  }

  /* Imports — one per primitive, at the file-relative module path. */
  const needed = [...new Set(conversions.map((c) => c.needsImport))];
  for (const name of needed) {
    const moduleFile = path.join(SRC, "components", `${name}.tsx`);
    let rel = path
      .relative(path.dirname(file), moduleFile)
      .split(path.sep)
      .join("/")
      .replace(/\.tsx$/, "");
    if (!rel.startsWith(".")) rel = `./${rel}`;
    working = insertImports(working, sf, [name], rel);
  }

  if (!DRY_RUN) fs.writeFileSync(file, working, "utf8");

  const report: FileReport = {
    file: relPath,
    buttons: conversions.filter((c) => c.tag === "button").length,
    labels: conversions.filter((c) => c.tag === "label").length,
    headings: conversions.filter((c) => /^h[1-6]$/.test(c.tag)).length,
  };
  reports.push(report);
  totalButtons += report.buttons;
  totalLabels += report.labels;
  totalHeadings += report.headings;
  for (const c of conversions) allDefinitions.push(c.definition);
}

function insertImports(
  working: string,
  sf: ts.SourceFile,
  names: string[],
  importPath: string
): string {
  // Imports may be interleaved with other statements (rare, but present),
  // so scan every statement and track the last import in the file.
  let lastImportEnd = -1;
  let existingFromPath: ts.ImportDeclaration | undefined;
  for (const stmt of sf.statements) {
    if (ts.isImportDeclaration(stmt)) {
      lastImportEnd = Math.max(lastImportEnd, stmt.getEnd());
      const mod = (stmt.moduleSpecifier as ts.StringLiteral).text;
      if (path.normalize(mod) === path.normalize(importPath)) existingFromPath = stmt;
    }
  }
  if (existingFromPath) {
    const clause = existingFromPath.importClause;
    if (clause && clause.namedBindings && ts.isNamedImports(clause.namedBindings)) {
      const have = new Set(clause.namedBindings.elements.map((e) => e.name.text));
      const missing = names.filter((n) => !have.has(n));
      if (missing.length === 0) return working;
      const openBrace = clause.namedBindings.getStart();
      return (
        working.slice(0, openBrace + 1) + ` ${missing.join(", ")},` + working.slice(openBrace + 1)
      );
    }
  }
  if (lastImportEnd === -1) {
    return `import { ${names.join(", ")} } from "${importPath}";\n${working}`;
  }
  const insertion = `\nimport { ${names.join(", ")} } from "${importPath}";`;
  return working.slice(0, lastImportEnd) + insertion + working.slice(lastImportEnd);
}

/* ------------------------------------------------------------------ */
/* Registry output                                                     */
/* ------------------------------------------------------------------ */

if (!DRY_RUN && allDefinitions.length > 0) {
  let existingDefs: Conversion["definition"][] = [];
  if (fs.existsSync(OUT_FILE)) {
    try {
      const prevText = fs.readFileSync(OUT_FILE, "utf8");
      const arrMatch = prevText.match(/IBC_AUTOSCAN_DEFINITIONS:\s*ButtonDefinition\[\]\s*=\s*(\[[\s\S]*\]);/);
      if (arrMatch) {
        // Safely evaluate literal array body
        existingDefs = Function(`"use strict"; return (${arrMatch[1]});`)();
      }
    } catch {
      existingDefs = [];
    }
  }
  const seenIds = new Set<string>();
  const mergedDefs: Conversion["definition"][] = [];
  for (const d of [...existingDefs, ...allDefinitions]) {
    if (!seenIds.has(d.id)) {
      seenIds.add(d.id);
      mergedDefs.push(d);
    }
  }
  const lines = mergedDefs.map((d) =>
    [
      `  {`,
      `    id: ${JSON.stringify(d.id)},`,
      `    category: ${JSON.stringify(d.category)},`,
      `    defaultLabel: ${JSON.stringify(d.defaultLabel)},`,
      `    defaultIconName: ${JSON.stringify(d.defaultIconName)},`,
      `    defaultTooltip: ${JSON.stringify(d.defaultTooltip)},`,
      `    description: ${JSON.stringify(d.description)},`,
      `    supportsZeroText: ${d.supportsZeroText},`,
      `    componentType: ${JSON.stringify(d.componentType)},`,
      `  },`,
    ].join("\n")
  );
  const out = `// @ts-nocheck — generated artefact (IBC autoscan codemod output).
/**
 * GENERATED FILE — DO NOT EDIT BY HAND
 * ------------------------------------
 * Produced by \`npx tsx scripts/ibcAutoscan.ts\`.
 *
 * Registry entries minted for UI elements (buttons, headings, sub-headings,
 * labels and logos) that previously rendered without an IBC dialog. Each
 * entry supplies the default icon & label used by the Button & Layout
 * Optimizer Studio.
 */
import type { ButtonDefinition } from "./buttonCustomization";

export const IBC_AUTOSCAN_DEFINITIONS: ButtonDefinition[] = [
${lines.join("\n")}
];
`;
  fs.writeFileSync(OUT_FILE, out, "utf8");
}

/* ------------------------------------------------------------------ */
/* Report                                                              */
/* ------------------------------------------------------------------ */

console.log(DRY_RUN ? "DRY RUN — no files modified" : "IBC autoscan complete");
for (const r of reports) {
  console.log(
    `  ${r.file.padEnd(56)} buttons=${r.buttons} labels=${r.labels} headings=${r.headings}`
  );
}
console.log(
  `\nTotal converted: ${totalButtons + totalLabels + totalHeadings}` +
    ` (buttons=${totalButtons}, labels=${totalLabels}, headings=${totalHeadings})` +
    ` · already wired (skipped): ${skippedAlreadyWired}` +
    ` · files touched: ${reports.length}`
);
