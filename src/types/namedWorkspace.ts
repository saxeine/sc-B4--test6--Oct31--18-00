import type { SequencerPanelState } from "../components/SequencerPanel";
import type { TileLinkConfig } from "../components/TileLinkModal";
import type { FourByFourWholePanelStyle } from "../components/FourByFourModal";

export interface NamedWorkspaceSnapshot {
  version: 1;
  buttonConfig: string;
  frontPageGridMode: "3x3" | "4x4";
  fourByFourPanelStyle: FourByFourWholePanelStyle;
  originalSpreadImage: string;
  userDefault3x3Image: string;
  boxImages: Record<number, string>;
  defaultBoxImages: Record<number, string>;
  boxRotationSeries: Record<number, string[]>;
  boxRotationIntervals: Record<number, number>;
  boxRotationActive: Record<number, boolean>;
  boxLinkConfigs: Record<number, TileLinkConfig>;
  sequencerPanelState: SequencerPanelState;
  disableBoxActions: boolean;
  isBottomControlBarVisible: boolean;
}
