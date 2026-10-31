import React from "react";
import { AniComper4StudioModal } from "./AniComper4StudioModal";

export interface AniComposerFrame {
  id: string;
  url: string;
  name: string;
  pivotX: number;
  pivotY: number;
  delayMs: number;
}

export interface AniComposerModalProps {
  isOpen: boolean;
  onClose: () => void;
  slices: { url: string; name?: string }[];
  storyboardSlots?: { url: string | null; name?: string }[];
  onApplyToStoryboard?: (frames: any[]) => void;
}

/**
 * AniComposerModal / AniComper4 Studio:
 * Keyframed Timeline, Onion-Skinning, Multi-Track Studio with instant speed ramping.
 */
export const AniComposerModal: React.FC<AniComposerModalProps> = ({
  isOpen,
  onClose,
  slices,
  storyboardSlots,
  onApplyToStoryboard,
}) => {
  return (
    <AniComper4StudioModal
      isOpen={isOpen}
      onClose={onClose}
      slices={slices}
      storyboardSlots={storyboardSlots}
      onApplyToStoryboard={onApplyToStoryboard}
    />
  );
};

export default AniComposerModal;
