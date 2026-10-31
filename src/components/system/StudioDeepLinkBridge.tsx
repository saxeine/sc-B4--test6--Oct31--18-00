/**
 * StudioDeepLinkBridge
 * ====================
 * Mounted once inside the ButtonCustomizationProvider. If the page was opened
 * with a `?studio=…` deep link (for example from the System cheat sheet), the
 * bridge opens the optimizer modal on the requested component and then cleans
 * the URL. No state is persisted locally.
 */

import { useEffect, useRef } from "react";
import { useButtonCustomization } from "../../context/ButtonCustomizationContext";
import {
  clearStudioDeepLinkFromUrl,
  parseStudioDeepLink,
  requestStudioDeepLink,
} from "../../services/studioDeepLink";

export function StudioDeepLinkBridge() {
  const { openStudioModal } = useButtonCustomization();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const link = parseStudioDeepLink(window.location.search);
    if (!link) return;

    requestStudioDeepLink(link);
    openStudioModal(link.buttonId);
    clearStudioDeepLinkFromUrl();
  }, [openStudioModal]);

  return null;
}

export default StudioDeepLinkBridge;
