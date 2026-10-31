/**
 * Lucide Icon Map Generator
 * =========================
 * Emits `src/utils/lucideIconMap.generated.ts` — a tree-shakeable registry of
 * exactly the Lucide icons this application references (JSX usages, button
 * definitions, the atomic manifest and the curated presets).
 *
 * The generated map is what makes `getIconComponent("Check")` resolve without
 * importing the entire Lucide library. When a new icon name is introduced,
 * `npm run ui:icons` appends it.
 *
 *   npm run ui:icons         # regenerate
 *   npm run ui:icons:check   # CI: fails when the committed map is stale
 */

import fs from "node:fs";
import path from "node:path";

import { BUTTON_DEFINITIONS } from "../src/types/buttonCustomization";
import { ATOMIC_COMPONENT_MANIFEST } from "../src/types/atomicComponentManifest";
import { PRESET_ICONS } from "../src/utils/customIconRegistry";

const ROOT = process.cwd();
const SRC = path.join(ROOT, "src");
const OUTPUT = path.join(SRC, "utils/lucideIconMap.generated.ts");
const LUCIDE_ESM = path.join(ROOT, "node_modules/lucide-react/dist/esm/lucide-react.js");
const CHECK = process.argv.includes("--check");

/** All identifiers exported by the installed lucide-react build. */
function lucideExports(): Set<string> {
  const source = fs.readFileSync(LUCIDE_ESM, "utf8");
  const names = new Set<string>();
  const pattern = /default as ([A-Za-z0-9_]+)/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(source))) names.add(match[1]);
  return names;
}

function walk(dir: string, acc: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, acc);
    else if (/\.(ts|tsx)$/.test(entry.name)) acc.push(full);
  }
  return acc;
}

/** Icons imported from `lucide-react` anywhere in the source tree. */
function sourceImports(): Set<string> {
  const names = new Set<string>();
  for (const file of walk(SRC)) {
    if (file.endsWith("lucideIconMap.generated.ts")) continue;
    const source = fs.readFileSync(file, "utf8");
    const importPattern = /import\s*\{([^}]*)\}\s*from\s*["']lucide-react["']/g;
    let match: RegExpExecArray | null;
    while ((match = importPattern.exec(source))) {
      for (const raw of match[1].split(",")) {
        const name = raw.trim().split(/\s+as\s+/).pop()?.trim();
        if (name && /^[A-Za-z_$][\w$]*$/.test(name)) names.add(name);
      }
    }
  }
  return names;
}

const exported = lucideExports();
const required = new Set<string>();
const add = (name?: string) => {
  if (!name || name === "none") return;
  const clean = name.replace(/^lucide[-:]/i, "");
  if (exported.has(clean)) required.add(clean);
};

for (const preset of PRESET_ICONS) add(preset.name);
for (const definition of BUTTON_DEFINITIONS) add(definition.defaultIconName);
for (const seed of ATOMIC_COMPONENT_MANIFEST) add(seed.default_icon);
for (const name of sourceImports()) add(name);
add("Folder");
add("Check");
add("Settings");

const names = Array.from(required).sort((a, b) => a.localeCompare(b));
const body = `// @ts-nocheck — generated artefact; the module's exported names are checked by tsc.
/**
 * GENERATED FILE — DO NOT EDIT BY HAND
 * ------------------------------------
 * Produced by \`npm run ui:icons\` (scripts/generateIconMap.ts).
 *
 * Tree-shakeable Lucide registry for the database-driven icon picker. Only the
 * icons referenced by source code, button definitions and the atomic manifest
 * are imported; unknown custom names render nothing.
 *
 * Icons: ${names.length}
 */

import type { LucideIcon } from "lucide-react";
import {
${names.map((name) => `  ${name},`).join("\n")}
} from "lucide-react";

export const LUCIDE_ICON_MAP: Record<string, LucideIcon> = {
${names.map((name) => `  ${name},`).join("\n")}
};
`;

if (CHECK) {
  const exists = fs.existsSync(OUTPUT);
  const current = exists ? fs.readFileSync(OUTPUT, "utf8") : "";
  if (current !== body) {
    console.error("✗ lucideIconMap.generated.ts is stale — run `npm run ui:icons`.");
    process.exit(1);
  }
  console.log(`✓ Lucide icon map is up to date (${names.length} icons).`);
} else {
  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
  fs.writeFileSync(OUTPUT, body);
  console.log(`✓ Wrote ${names.length} Lucide icons to src/utils/lucideIconMap.generated.ts`);
}
