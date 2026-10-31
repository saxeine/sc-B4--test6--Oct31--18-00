/**
 * Component Lookup
 * ================
 * Synchronous access to the committed numeric Component ID index.
 *
 * Kept separate from `componentIndex.ts` so the build-time generator can import
 * the pure types/helpers before the generated map exists.
 */

import {
  COMPONENT_ID_MAP,
  COMPONENT_ID_ALLOCATED,
} from "./componentIdMap.generated";
import {
  componentKeyForButton,
  componentKeyForElementKey,
  isComponentId,
} from "./componentIndex";

export { COMPONENT_ID_MAP };

/** Total number of IDs allocated by the committed index. */
export const COMPONENT_ID_COUNT = Object.keys(COMPONENT_ID_MAP).length;

/** Highest allocated numeric ID (`"4571"`). */
export const COMPONENT_ID_MAX = String(COMPONENT_ID_ALLOCATED).padStart(4, "0");

/** Numeric ID for a raw `element_key` (copy / atomic slot), if registered. */
export function getComponentIdForElementKey(elementKey: string): string | undefined {
  if (!elementKey) return undefined;
  return COMPONENT_ID_MAP[componentKeyForElementKey(elementKey)];
}

/** Numeric ID for a registered button / label in `BUTTON_DEFINITIONS`. */
export function getComponentIdForButton(buttonId: string): string | undefined {
  if (!buttonId) return undefined;
  return COMPONENT_ID_MAP[componentKeyForButton(buttonId)];
}

/** Numeric ID for an already-prefixed canonical key. */
export function getComponentId(componentKey: string): string | undefined {
  return COMPONENT_ID_MAP[componentKey];
}

let reverseIndex: Map<string, string> | null = null;

/** Canonical key for a numeric ID. Built lazily once; O(n) on first call. */
export function getComponentKeyForId(componentId: string): string | undefined {
  if (!isComponentId(componentId)) return undefined;
  if (!reverseIndex) {
    reverseIndex = new Map();
    for (const [key, id] of Object.entries(COMPONENT_ID_MAP)) reverseIndex.set(id, key);
  }
  return reverseIndex.get(componentId);
}
