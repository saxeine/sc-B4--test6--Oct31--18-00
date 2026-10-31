/**
 * useUIConfig — the single consumer API for studio-driven copy & layout
 * =====================================================================
 *
 *   import { uiText } from "../hooks/useUIConfig";
 *   <h2>{uiText("crop_sidebar.header.crop_and_carve", "Crop & Carve")}</h2>
 *
 *   const slot = useUIConfig("crop_sidebar.export_button", "Export");
 *   <button title={slot.tooltip} hidden={!slot.visible}>{slot.label}</button>
 *
 * `uiText` is a plain function so it is legal in attribute expressions, inside
 * `.map()` callbacks and conditional branches — places where React forbids
 * hooks. Reactivity comes from `UIConfigProvider`, whose context value changes
 * on every store mutation and re-renders the tree beneath it.
 *
 * `useUIConfig` / `useUIText` additionally subscribe to the store directly, so
 * they stay correct even inside memoised subtrees.
 */

import { useCallback, useEffect, useState } from "react";
import {
  getUIConfigRevision,
  resolveSlot,
  subscribeToUIConfigStore,
  uiLayout,
  uiIconName,
  uiMessage as uiMessageRaw,
  uiText as uiTextRaw,
  uiVisible,
  type ResolvedUISlot,
} from "../services/uiConfigStore";
import { useOptionalUIConfigContext } from "../context/UIConfigProvider";
import type { UIConfigPatch, UIConfigSyncStatus, UILayoutProperties } from "../types/uiConfigSchema";

/* ------------------------------------------------------------------ *
 * Non-hook accessors (safe everywhere)
 * ------------------------------------------------------------------ */

/** Resolve a slot's rendered copy: database → registry default → inline fallback. */
export const uiText = uiTextRaw;

/**
 * Resolve an imperative message (toast / alert / validation error) with
 * `{token}` interpolation — the special hook for dynamic copy that never
 * appears as JSX.
 */
export const uiMessage = uiMessageRaw;

/** Resolve a slot's layout configuration. */
export const uiLayoutFor = uiLayout;

/** `false` when the studio hid the slot. */
export const uiIsVisible = uiVisible;

/** Database icon override for a slot (falls back to the supplied name). */
export function uiIcon(elementKey: string, fallback = ""): string {
  return uiIconName(elementKey) || fallback;
}

/* ------------------------------------------------------------------ *
 * Hooks
 * ------------------------------------------------------------------ */

/** Subscribes to the store and returns its revision — the re-render trigger. */
export function useUIConfigRevision(): number {
  const [, force] = useState(0);
  useEffect(() => subscribeToUIConfigStore(() => force((n) => n + 1)), []);
  return getUIConfigRevision();
}

/**
 * Unified selector for one UI slot.
 * Returns resolved copy, layout, visibility and the edit helpers bound to the
 * Button & Layout Optimizer Studio.
 */
export function useUIConfig(
  elementKey: string,
  fallback = ""
): ResolvedUISlot & {
  setText: (value: string) => Promise<boolean>;
  update: (patch: UIConfigPatch) => Promise<boolean>;
  reset: () => Promise<boolean>;
  syncStatus: UIConfigSyncStatus | null;
} {
  useUIConfigRevision();
  const ctx = useOptionalUIConfigContext();
  const slot = resolveSlot(elementKey, fallback);

  const setText = useCallback(
    (value: string) => ctx?.setText(elementKey, value, fallback) ?? Promise.resolve(false),
    [ctx, elementKey, fallback]
  );
  const update = useCallback(
    (patch: UIConfigPatch) => ctx?.updateSlot(elementKey, patch, fallback) ?? Promise.resolve(false),
    [ctx, elementKey, fallback]
  );
  const reset = useCallback(
    () => ctx?.resetSlot(elementKey) ?? Promise.resolve(false),
    [ctx, elementKey]
  );

  return { ...slot, setText, update, reset, syncStatus: ctx?.syncStatus ?? null };
}

/**
 * Returns a reactive `t(key, fallback)` resolver — the i18n-style ergonomic
 * form for components that read many slots.
 */
export function useUIText(): (elementKey: string, fallback?: string) => string {
  useUIConfigRevision();
  return useCallback((elementKey: string, fallback = "") => uiTextRaw(elementKey, fallback), []);
}

/** Layout-only selector (order / visibility / variant / dimensions). */
export function useUILayout(elementKey: string): UILayoutProperties {
  useUIConfigRevision();
  return uiLayout(elementKey);
}

/** Database sync indicator for status badges inside the studio. */
export function useUIConfigSyncStatus(): { registry: UIConfigSyncStatus | null; kv: UIConfigSyncStatus | null } {
  const ctx = useOptionalUIConfigContext();
  return { registry: ctx?.syncStatus ?? null, kv: ctx?.kvStatus ?? null };
}

export type { ResolvedUISlot };
