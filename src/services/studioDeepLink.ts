/**
 * Studio deep links
 * =================
 * The System cheat sheet lives at `/system` while the Button & Layout Optimizer
 * Studio is a modal owned by the main `/` application. These helpers carry a
 * precise target (component ID, element key or button id) between the two
 * without any browser storage:
 *
 *   cheat sheet → `/??studio=copy&elementKey=…&componentId=0034`
 *   main app    → opens the studio modal on the matching tab, then removes the
 *                 query string with `history.replaceState`.
 *
 * A transient in-memory pending link bridges the navigation (the studio modal
 * mounts a frame after the bridge reads the URL).
 */

import { getComponentKeyForId } from "../types/componentLookup";
import { parseComponentKey } from "../types/componentIndex";

export type StudioTab =
  | "customize"
  | "registry"
  | "copy"
  | "styles"
  | "groups"
  | "optimizer"
  | "snapshots"
  | "model"
  | "modals";

export interface StudioDeepLink {
  tab: StudioTab;
  buttonId?: string;
  elementKey?: string;
  componentId?: string;
}

const STUDIO_DEEP_LINK_EVENT = "ui-config:studio-deep-link";

let pendingLink: StudioDeepLink | null = null;

/** Builds an absolute-in-app href that opens the studio on a target component. */
export function buildStudioHref(link: StudioDeepLink): string {
  const params = new URLSearchParams();
  params.set("studio", "1");
  params.set("tab", link.tab);
  if (link.buttonId) params.set("buttonId", link.buttonId);
  if (link.elementKey) params.set("elementKey", link.elementKey);
  if (link.componentId) params.set("componentId", link.componentId);
  return `/?${params.toString()}`;
}

/** Href for a component index entry. */
export function studioHrefForComponent(entry: {
  source: "button" | "copy" | "atomic";
  button_id?: string;
  element_key?: string;
  component_id: string;
}): string {
  if (entry.source === "button" && entry.button_id) {
    return buildStudioHref({
      tab: "customize",
      buttonId: entry.button_id,
      componentId: entry.component_id,
    });
  }
  return buildStudioHref({
    tab: "copy",
    elementKey: entry.element_key,
    componentId: entry.component_id,
  });
}

/** Parses `?studio=1&tab=copy&elementKey=…` from a location search string. */
export function parseStudioDeepLink(search: string): StudioDeepLink | null {
  if (!search) return null;
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  if (params.get("studio") !== "1") return null;

  const rawTab = (params.get("tab") || "customize") as StudioTab;
  const allowedTabs: StudioTab[] = [
    "customize",
    "registry",
    "copy",
    "styles",
    "groups",
    "optimizer",
    "snapshots",
    "model",
    "modals",
  ];
  const tab = allowedTabs.includes(rawTab) ? rawTab : "customize";
  let buttonId = params.get("buttonId") || undefined;
  let elementKey = params.get("elementKey") || undefined;
  const componentId = params.get("componentId") || undefined;

  // A bare Component ID is a valid deep link: resolve it through the committed
  // index to its canonical button id / element key.
  if (!buttonId && !elementKey && componentId) {
    const parsed = parseComponentKey(getComponentKeyForId(componentId));
    if (parsed?.kind === "button") buttonId = parsed.id;
    else if (parsed?.kind === "element") elementKey = parsed.id;
  }

  if (!buttonId && !elementKey && !componentId) return { tab };
  return {
    tab,
    buttonId,
    elementKey,
    componentId,
    ...(elementKey && !buttonId ? { tab: "copy" as StudioTab } : {}),
  };
}

/** Queues a link for the studio modal and notifies any live subscriber. */
export function requestStudioDeepLink(link: StudioDeepLink) {
  pendingLink = link;
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent<StudioDeepLink>(STUDIO_DEEP_LINK_EVENT, { detail: link }));
  }
}

/** Returns and clears the queued link (called once by the studio modal). */
export function consumePendingStudioDeepLink(): StudioDeepLink | null {
  const link = pendingLink;
  pendingLink = null;
  return link;
}

/** Subscribes to links requested while the studio modal is already mounted. */
export function subscribeStudioDeepLink(
  handler: (link: StudioDeepLink) => void
): () => void {
  if (typeof window === "undefined") return () => {};
  const listener = (event: Event) => handler((event as CustomEvent<StudioDeepLink>).detail);
  window.addEventListener(STUDIO_DEEP_LINK_EVENT, listener);
  return () => window.removeEventListener(STUDIO_DEEP_LINK_EVENT, listener);
}

/** Removes the deep-link query string without adding a history entry. */
export function clearStudioDeepLinkFromUrl() {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (!url.searchParams.has("studio")) return;
  url.searchParams.delete("studio");
  url.searchParams.delete("tab");
  url.searchParams.delete("buttonId");
  url.searchParams.delete("elementKey");
  url.searchParams.delete("componentId");
  window.history.replaceState({}, document.title, `${url.pathname}${url.search}${url.hash}`);
}
