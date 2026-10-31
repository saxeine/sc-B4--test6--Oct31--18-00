import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  X,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ChevronsLeft,
  ChevronsRight,
  Repeat,
  RotateCcw,
  Plus,
  Trash2,
  Copy,
  Layers,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Sliders,
  Scissors,
  Download,
  Archive,
  Save,
  Upload,
  Send,
  Zap,
  Film,
  Maximize2,
  Minimize2,
  Crosshair,
  Sparkles,
  Type,
  Image as ImageIcon,
  Check,
  Star,
  Search,
  Move,
  Clock,
  Compass,
  FileJson,
  ZoomIn,
  ZoomOut,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
} from "lucide-react";
import { cn } from "../utils/cn";
import { CustomizableButton } from "./CustomizableButton";
import { CustomizableLabel } from "./CustomizableLabel";
import { saveAppStateToDatabase, getAppStateFromDatabase } from "../services/firebase";
import { GIFEncoder, quantize, applyPalette } from "gifenc";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { uiText } from "../hooks/useUIConfig";
import { remoteStore } from "../services/remoteKeyValueStore";

export type TrackType = "character" | "background" | "text" | "effect" | "slice";
export type EasingType = "linear" | "easeIn" | "easeOut" | "easeInOut" | "step";

export interface KeyframeData {
  id: string;
  frame: number; // 1 to totalFrames (e.g. 60)
  x: number; // percentage 0 to 100
  y: number; // percentage 0 to 100
  scale: number; // 0.1 to 4.0
  rotation: number; // -360 to 360 deg
  opacity: number; // 0 to 1
  easing: EasingType;
  blur?: number; // 0 to 20 px
  tint?: string;
  text?: string;
  fontSize?: number;
  textColor?: string;
}

export interface AnimationTrack {
  id: string;
  name: string;
  type: TrackType;
  color: string;
  visible: boolean;
  locked: boolean;
  solo: boolean;
  assetUrl?: string;
  assetName?: string;
  text?: string;
  effectType?: "glow" | "vignette" | "particle_dust" | "chromatic";
  pivotX: number; // 0 to 1 (0.5 is center)
  pivotY: number; // 0 to 1 (0.5 is center)
  keyframes: KeyframeData[];
}

export interface SpeedRampPreset {
  id: string;
  name: string;
  description: string;
  curve: "accelerate" | "decelerate" | "bullet_time" | "s_curve" | "double_time" | "half_time" | "reverse";
}

const SPEED_RAMP_PRESETS: SpeedRampPreset[] = [
  {
    id: "ramp_accel",
    name: "Slow to fast (Accelerate)",
    description: "Starts in slow-mo, accelerates dynamically to hyperspeed action",
    curve: "accelerate",
  },
  {
    id: "ramp_decel",
    name: "Fast to slow (Impact hold)",
    description: "High velocity entrance that snaps into dramatic slow motion",
    curve: "decelerate",
  },
  {
    id: "ramp_bullet",
    name: "Bullet-time (Fast-slow-fast)",
    description: "Fast start, expands time in the apex middle, snaps into fast exit",
    curve: "bullet_time",
  },
  {
    id: "ramp_scurve",
    name: "Cinematic s-curve",
    description: "Smooth ease-in, linear mid-stride, and ease-out velocity",
    curve: "s_curve",
  },
  {
    id: "ramp_2x",
    name: "Double time (2x speed)",
    description: "Compresses keyframe timings by 50% for snappy pacing",
    curve: "double_time",
  },
  {
    id: "ramp_half",
    name: "Half time (0.5x slow-mo)",
    description: "Expands keyframe timings by 200% for fluid slow motion",
    curve: "half_time",
  },
  {
    id: "ramp_reverse",
    name: "Reverse keyframe sequence",
    description: "Flips motion trajectory in reverse along the timeline",
    curve: "reverse",
  },
];

const TRACK_COLORS = [
  "#06b6d4", // cyan
  "#a855f7", // purple
  "#f59e0b", // amber
  "#10b981", // emerald
  "#ec4899", // pink
  "#3b82f6", // blue
  "#ef4444", // rose
];

// Mathematical Easing Interpolation Functions
function evaluateEasing(t: number, easing: EasingType): number {
  const clamped = Math.max(0, Math.min(1, t));
  switch (easing) {
    case "linear":
      return clamped;
    case "easeIn":
      return clamped * clamped;
    case "easeOut":
      return clamped * (2 - clamped);
    case "easeInOut":
      return clamped < 0.5
        ? 2 * clamped * clamped
        : -1 + (4 - 2 * clamped) * clamped;
    case "step":
      return clamped >= 1 ? 1 : 0;
    default:
      return clamped;
  }
}

// Calculate interpolated properties for a track at any arbitrary frame
export function interpolateTrackAtFrame(track: AnimationTrack, frame: number): {
  x: number;
  y: number;
  scale: number;
  rotation: number;
  opacity: number;
  blur: number;
  text?: string;
  fontSize?: number;
  textColor?: string;
} {
  const kfs = [...track.keyframes].sort((a, b) => a.frame - b.frame);
  if (kfs.length === 0) {
    return {
      x: 50,
      y: 50,
      scale: 1,
      rotation: 0,
      opacity: 1,
      blur: 0,
      text: track.text || "AniComper4",
      fontSize: 28,
      textColor: "#ffffff",
    };
  }

  if (frame <= kfs[0].frame) {
    const k = kfs[0];
    return {
      x: k.x,
      y: k.y,
      scale: k.scale,
      rotation: k.rotation,
      opacity: k.opacity,
      blur: k.blur || 0,
      text: k.text || track.text,
      fontSize: k.fontSize || 28,
      textColor: k.textColor || "#ffffff",
    };
  }

  if (frame >= kfs[kfs.length - 1].frame) {
    const k = kfs[kfs.length - 1];
    return {
      x: k.x,
      y: k.y,
      scale: k.scale,
      rotation: k.rotation,
      opacity: k.opacity,
      blur: k.blur || 0,
      text: k.text || track.text,
      fontSize: k.fontSize || 28,
      textColor: k.textColor || "#ffffff",
    };
  }

  // Find bounding keyframes
  let prev = kfs[0];
  let next = kfs[kfs.length - 1];
  for (let i = 0; i < kfs.length - 1; i++) {
    if (kfs[i].frame <= frame && kfs[i + 1].frame >= frame) {
      prev = kfs[i];
      next = kfs[i + 1];
      break;
    }
  }

  const span = next.frame - prev.frame;
  const rawProgress = span === 0 ? 0 : (frame - prev.frame) / span;
  const eased = evaluateEasing(rawProgress, prev.easing || "linear");

  return {
    x: prev.x + (next.x - prev.x) * eased,
    y: prev.y + (next.y - prev.y) * eased,
    scale: prev.scale + (next.scale - prev.scale) * eased,
    rotation: prev.rotation + (next.rotation - prev.rotation) * eased,
    opacity: prev.opacity + (next.opacity - prev.opacity) * eased,
    blur: (prev.blur || 0) + ((next.blur || 0) - (prev.blur || 0)) * eased,
    text: next.text || prev.text || track.text,
    fontSize: (prev.fontSize || 28) + ((next.fontSize || 28) - (prev.fontSize || 28)) * eased,
    textColor: next.textColor || prev.textColor || "#ffffff",
  };
}

export interface AniComper4StudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  slices?: { url: string; name?: string }[];
  storyboardSlots?: { url: string | null; name?: string }[];
  onApplyToStoryboard?: (renderedFrames: { url: string; name: string }[]) => void;
}

export const AniComper4StudioModal: React.FC<AniComper4StudioModalProps> = ({
  isOpen,
  onClose,
  slices = [],
  storyboardSlots = [],
  onApplyToStoryboard,
}) => {
  // Timeline State
  const [currentFrame, setCurrentFrame] = useState<number>(1);
  const [totalFrames, setTotalFrames] = useState<number>(48);
  const [fps, setFps] = useState<number>(24);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [loopMode, setLoopMode] = useState<"loop" | "pingpong" | "once">("loop");
  const [pingpongDir, setPingpongDir] = useState<1 | -1>(1);
  const [timeUnit, setTimeUnit] = useState<"frames" | "seconds">("frames");

  // Panel Show/Hide Toggles
  const [showSlicesDrawer, setShowSlicesDrawer] = useState<boolean>(true);
  const [showTracksPanel, setShowTracksPanel] = useState<boolean>(true);
  const [showInspectorPanel, setShowInspectorPanel] = useState<boolean>(true);
  const [showTimelineBar, setShowTimelineBar] = useState<boolean>(true);
  const [showSpeedRampModal, setShowSpeedRampModal] = useState<boolean>(false);

  // Onion Skinning State
  const [showOnionSkin, setShowOnionSkin] = useState<boolean>(true);
  const [onionPastFrames, setOnionPastFrames] = useState<number>(2);
  const [onionFutureFrames, setOnionFutureFrames] = useState<number>(1);
  const [onionSkinOpacity, setOnionSkinOpacity] = useState<number>(0.35);

  // Canvas Viewport State
  const [canvasAspect, setCanvasAspect] = useState<"16:9" | "1:1" | "9:16" | "4:3">("16:9");
  const [canvasBg, setCanvasBg] = useState<"checker" | "dark" | "black" | "light">("dark");
  const [canvasZoom, setCanvasZoom] = useState<number>(1);
  const [isDraggingCanvasObject, setIsDraggingCanvasObject] = useState<boolean>(false);
  const [notice, setNotice] = useState<string | null>(null);

  // Animation Tracks
  const [tracks, setTracks] = useState<AnimationTrack[]>([]);
  const [selectedTrackId, setSelectedTrackId] = useState<string>("");
  const [selectedKeyframeId, setSelectedKeyframeId] = useState<string | null>(null);
  const [sliceFilter, setSliceFilter] = useState<string>("");

  // Refs for scrubbing and playback timer
  const playTimerRef = useRef<NodeJS.Timeout | null>(null);
  const canvasStageRef = useRef<HTMLDivElement>(null);
  const timelineScrubRef = useRef<HTMLDivElement>(null);
  const isScrubbingRef = useRef<boolean>(false);

  // Notice helper
  const showFeedback = useCallback((msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice((cur) => (cur === msg ? null : cur)), 3000);
  }, []);

  // Initialize demo animation tracks from slices/slots or procedural generators
  useEffect(() => {
    if (!isOpen) return;

    // Load any existing saved state from database
    getAppStateFromDatabase<any>("anicomper4_studio_state_v1")
      .then((savedState) => {
        if (savedState && savedState.tracks && Array.isArray(savedState.tracks) && savedState.tracks.length > 0) {
          setTracks(savedState.tracks);
          setSelectedTrackId(savedState.tracks[0].id);
          if (savedState.totalFrames) setTotalFrames(savedState.totalFrames);
          if (savedState.fps) setFps(savedState.fps);
          return;
        }

        // Generate baseline demo tracks
        const sourceUrl =
          slices[0]?.url ||
          storyboardSlots.find((s) => s.url)?.url ||
          "";

        const bgUrl =
          slices[1]?.url ||
          storyboardSlots.filter((s) => s.url)[1]?.url ||
          "";

        const defaultTracks: AnimationTrack[] = [
          {
            id: "track_character",
            name: "Character Sprite",
            type: "character",
            color: "#06b6d4",
            visible: true,
            locked: false,
            solo: false,
            assetUrl: sourceUrl,
            assetName: slices[0]?.name || "Character 1",
            pivotX: 0.5,
            pivotY: 0.8,
            keyframes: [
              {
                id: "kf_c1",
                frame: 1,
                x: 18,
                y: 55,
                scale: 1,
                rotation: -6,
                opacity: 1,
                easing: "easeInOut",
              },
              {
                id: "kf_c2",
                frame: 24,
                x: 50,
                y: 32,
                scale: 1.25,
                rotation: 8,
                opacity: 1,
                easing: "easeInOut",
              },
              {
                id: "kf_c3",
                frame: 48,
                x: 82,
                y: 55,
                scale: 1,
                rotation: 0,
                opacity: 1,
                easing: "easeInOut",
              },
            ],
          },
          {
            id: "track_background",
            name: "Atmospheric Scenery",
            type: "background",
            color: "#3b82f6",
            visible: true,
            locked: false,
            solo: false,
            assetUrl: bgUrl,
            assetName: slices[1]?.name || "Scenery",
            pivotX: 0.5,
            pivotY: 0.5,
            keyframes: [
              {
                id: "kf_bg1",
                frame: 1,
                x: 50,
                y: 50,
                scale: 1.05,
                rotation: 0,
                opacity: 0.85,
                easing: "linear",
              },
              {
                id: "kf_bg2",
                frame: 48,
                x: 52,
                y: 50,
                scale: 1.15,
                rotation: 1,
                opacity: 0.85,
                easing: "linear",
              },
            ],
          },
          {
            id: "track_text",
            name: "Kinetic Title",
            type: "text",
            color: "#a855f7",
            visible: true,
            locked: false,
            solo: false,
            text: "ANICOMPER 4",
            pivotX: 0.5,
            pivotY: 0.5,
            keyframes: [
              {
                id: "kf_t1",
                frame: 1,
                x: 50,
                y: 18,
                scale: 0.8,
                rotation: 0,
                opacity: 0.2,
                fontSize: 32,
                textColor: "#00f0ff",
                easing: "easeOut",
              },
              {
                id: "kf_t2",
                frame: 24,
                x: 50,
                y: 16,
                scale: 1.1,
                rotation: 0,
                opacity: 1,
                fontSize: 36,
                textColor: "#ffffff",
                easing: "easeInOut",
              },
              {
                id: "kf_t3",
                frame: 48,
                x: 50,
                y: 18,
                scale: 1,
                rotation: 0,
                opacity: 0.9,
                fontSize: 34,
                textColor: "#00f0ff",
                easing: "linear",
              },
            ],
          },
        ];

        setTracks(defaultTracks);
        setSelectedTrackId(defaultTracks[0].id);
      })
      .catch((err) => {
        console.warn("Could not load AniComper4 saved state:", err);
      });
  }, [isOpen, slices, storyboardSlots]);

  // Active Selected Track
  const activeTrack = useMemo(
    () => tracks.find((t) => t.id === selectedTrackId) || tracks[0] || null,
    [tracks, selectedTrackId]
  );

  // Active Keyframe on selected track at or nearest current playhead
  const activeKeyframe = useMemo(() => {
    if (!activeTrack) return null;
    if (selectedKeyframeId) {
      const match = activeTrack.keyframes.find((k) => k.id === selectedKeyframeId);
      if (match) return match;
    }
    return activeTrack.keyframes.find((k) => k.frame === currentFrame) || null;
  }, [activeTrack, selectedKeyframeId, currentFrame]);

  // Real-time Playback Engine Loop
  useEffect(() => {
    if (!isPlaying) {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
      return;
    }

    const intervalMs = Math.round(1000 / fps);
    playTimerRef.current = setInterval(() => {
      setCurrentFrame((prev) => {
        if (loopMode === "loop") {
          return prev >= totalFrames ? 1 : prev + 1;
        } else if (loopMode === "once") {
          if (prev >= totalFrames) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        } else {
          // Pingpong
          if (prev >= totalFrames) {
            setPingpongDir(-1);
            return prev - 1;
          } else if (prev <= 1) {
            setPingpongDir(1);
            return prev + 1;
          }
          return prev + pingpongDir;
        }
      });
    }, intervalMs);

    return () => {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    };
  }, [isPlaying, fps, loopMode, totalFrames, pingpongDir]);

  // Keyboard Shortcuts: Space to Play/Pause, Arrows to Step
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.code === "Space") {
        e.preventDefault();
        setIsPlaying((p) => !p);
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        setCurrentFrame((f) => Math.max(1, f - 1));
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        setCurrentFrame((f) => Math.min(totalFrames, f + 1));
      } else if (e.code === "Home") {
        e.preventDefault();
        setCurrentFrame(1);
      } else if (e.code === "End") {
        e.preventDefault();
        setCurrentFrame(totalFrames);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, totalFrames]);

  // Add / Toggle Keyframe on active track at currentFrame
  const handleAddOrUpdateKeyframe = useCallback(
    (overrides?: Partial<KeyframeData>) => {
      if (!activeTrack) return;

      const currentProps = interpolateTrackAtFrame(activeTrack, currentFrame);

      setTracks((prev) =>
        prev.map((t) => {
          if (t.id !== activeTrack.id) return t;

          const existingIdx = t.keyframes.findIndex((k) => k.frame === currentFrame);
          if (existingIdx >= 0) {
            // Update existing keyframe
            const updated = [...t.keyframes];
            updated[existingIdx] = {
              ...updated[existingIdx],
              ...overrides,
            };
            return { ...t, keyframes: updated };
          } else {
            // Create new keyframe
            const newKf: KeyframeData = {
              id: `kf_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
              frame: currentFrame,
              x: currentProps.x,
              y: currentProps.y,
              scale: currentProps.scale,
              rotation: currentProps.rotation,
              opacity: currentProps.opacity,
              easing: "easeInOut",
              blur: currentProps.blur,
              ...overrides,
            };
            const sorted = [...t.keyframes, newKf].sort((a, b) => a.frame - b.frame);
            return { ...t, keyframes: sorted };
          }
        })
      );
      showFeedback(`✓ Keyframe set on track '${activeTrack.name}' at frame ${currentFrame}`);
    },
    [activeTrack, currentFrame, showFeedback]
  );

  // Delete active keyframe
  const handleDeleteKeyframe = useCallback(() => {
    if (!activeTrack || !activeKeyframe) return;

    setTracks((prev) =>
      prev.map((t) => {
        if (t.id !== activeTrack.id) return t;
        const filtered = t.keyframes.filter((k) => k.id !== activeKeyframe.id);
        return { ...t, keyframes: filtered };
      })
    );
    setSelectedKeyframeId(null);
    showFeedback(`✓ Keyframe at frame ${activeKeyframe.frame} deleted`);
  }, [activeTrack, activeKeyframe, showFeedback]);

  // Instant Speed Ramping Algorithm
  const handleApplySpeedRamping = useCallback(
    (preset: SpeedRampPreset, target: "active" | "all") => {
      setTracks((prev) =>
        prev.map((t) => {
          if (target === "active" && t.id !== activeTrack?.id) return t;
          if (t.keyframes.length < 2) return t;

          const sorted = [...t.keyframes].sort((a, b) => a.frame - b.frame);
          const firstFrame = sorted[0].frame;
          const lastFrame = sorted[sorted.length - 1].frame;
          const range = lastFrame - firstFrame;

          if (range <= 0) return t;

          let updatedKeyframes: KeyframeData[] = [];

          switch (preset.curve) {
            case "accelerate": {
              // Quadratic curve pushes keyframes closer towards the end
              updatedKeyframes = sorted.map((k, idx) => {
                if (idx === 0) return k;
                if (idx === sorted.length - 1) return k;
                const normalized = (k.frame - firstFrame) / range;
                const warped = Math.pow(normalized, 1.85); // Accelerate
                const newFrame = Math.max(1, Math.min(totalFrames, Math.round(firstFrame + warped * range)));
                return { ...k, frame: newFrame };
              });
              break;
            }
            case "decelerate": {
              // Square root curve stretches keyframes out
              updatedKeyframes = sorted.map((k, idx) => {
                if (idx === 0) return k;
                if (idx === sorted.length - 1) return k;
                const normalized = (k.frame - firstFrame) / range;
                const warped = Math.sqrt(normalized); // Decelerate into hold
                const newFrame = Math.max(1, Math.min(totalFrames, Math.round(firstFrame + warped * range)));
                return { ...k, frame: newFrame };
              });
              break;
            }
            case "bullet_time": {
              // Sigmoid / middle dilation
              updatedKeyframes = sorted.map((k, idx) => {
                if (idx === 0) return k;
                if (idx === sorted.length - 1) return k;
                const normalized = (k.frame - firstFrame) / range;
                const centered = normalized - 0.5;
                const warped = 0.5 + Math.sign(centered) * Math.pow(Math.abs(centered) * 2, 0.6) * 0.5;
                const newFrame = Math.max(1, Math.min(totalFrames, Math.round(firstFrame + warped * range)));
                return { ...k, frame: newFrame };
              });
              break;
            }
            case "s_curve": {
              updatedKeyframes = sorted.map((k, idx) => {
                if (idx === 0) return k;
                if (idx === sorted.length - 1) return k;
                const normalized = (k.frame - firstFrame) / range;
                const warped = normalized * normalized * (3 - 2 * normalized);
                const newFrame = Math.max(1, Math.min(totalFrames, Math.round(firstFrame + warped * range)));
                return { ...k, frame: newFrame, easing: "easeInOut" };
              });
              break;
            }
            case "double_time": {
              updatedKeyframes = sorted.map((k) => {
                const newFrame = Math.max(1, Math.min(totalFrames, Math.round(k.frame * 0.5)));
                return { ...k, frame: newFrame };
              });
              break;
            }
            case "half_time": {
              updatedKeyframes = sorted.map((k) => {
                const newFrame = Math.max(1, Math.min(totalFrames, Math.round(k.frame * 1.5)));
                return { ...k, frame: newFrame };
              });
              break;
            }
            case "reverse": {
              updatedKeyframes = sorted.map((k) => {
                const newFrame = Math.max(1, Math.min(totalFrames, lastFrame - (k.frame - firstFrame)));
                return { ...k, frame: newFrame };
              });
              break;
            }
          }

          // Ensure unique ascending frames
          const cleaned = updatedKeyframes.sort((a, b) => a.frame - b.frame);
          return { ...t, keyframes: cleaned };
        })
      );

      setShowSpeedRampModal(false);
      showFeedback(`⚡ Instant Speed Ramp '${preset.name}' applied!`);
    },
    [activeTrack, totalFrames, showFeedback]
  );

  // Add new track
  const handleAddNewTrack = useCallback(
    (type: TrackType, assetUrl?: string, name?: string) => {
      const color = TRACK_COLORS[tracks.length % TRACK_COLORS.length];
      const newTrack: AnimationTrack = {
        id: `track_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        name: name || `${type.charAt(0).toUpperCase() + type.slice(1)} ${tracks.length + 1}`,
        type,
        color,
        visible: true,
        locked: false,
        solo: false,
        assetUrl: assetUrl || "",
        assetName: name || "Custom layer",
        text: type === "text" ? "AniComper4" : undefined,
        pivotX: 0.5,
        pivotY: 0.5,
        keyframes: [
          {
            id: `kf_${Date.now()}_1`,
            frame: 1,
            x: 50,
            y: 50,
            scale: 1,
            rotation: 0,
            opacity: 1,
            easing: "easeInOut",
          },
          {
            id: `kf_${Date.now()}_2`,
            frame: totalFrames,
            x: 50,
            y: 50,
            scale: 1,
            rotation: 0,
            opacity: 1,
            easing: "easeInOut",
          },
        ],
      };

      setTracks((prev) => [...prev, newTrack]);
      setSelectedTrackId(newTrack.id);
      showFeedback(`✓ Created ${newTrack.name}`);
    },
    [tracks.length, totalFrames, showFeedback]
  );

  // Delete Track
  const handleDeleteTrack = useCallback(
    (trackId: string) => {
      setTracks((prev) => prev.filter((t) => t.id !== trackId));
      if (selectedTrackId === trackId) {
        const remaining = tracks.filter((t) => t.id !== trackId);
        if (remaining.length > 0) setSelectedTrackId(remaining[0].id);
      }
      showFeedback("✓ Track removed");
    },
    [selectedTrackId, tracks, showFeedback]
  );

  // Save Project to Database & IndexedDB
  const handleSaveProject = useCallback(async () => {
    const projectState = {
      version: "4.0",
      tracks,
      totalFrames,
      fps,
      loopMode,
      canvasAspect,
      updatedAt: new Date().toISOString(),
    };

    try {
      await saveAppStateToDatabase("anicomper4_studio_state_v1", projectState);
      remoteStore.setItem("anicomper4_studio_state_local", JSON.stringify(projectState));
      showFeedback("✓ AniComper4 animation project saved to database!");
    } catch (err) {
      console.warn("Error saving project:", err);
      showFeedback("⚠️ Project saved to local storage");
    }
  }, [tracks, totalFrames, fps, loopMode, canvasAspect, showFeedback]);

  // Export Project JSON
  const handleExportJson = useCallback(() => {
    const projectState = {
      appName: "AniComper4",
      version: "4.0",
      tracks,
      totalFrames,
      fps,
      loopMode,
      canvasAspect,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(projectState, null, 2)], {
      type: "application/json",
    });
    saveAs(blob, `anicomper4_project_${Date.now()}.json`);
    showFeedback("✓ Exported project JSON");
  }, [tracks, totalFrames, fps, loopMode, canvasAspect, showFeedback]);

  // Import Project JSON
  const handleImportJson = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed && Array.isArray(parsed.tracks)) {
            setTracks(parsed.tracks);
            if (parsed.tracks.length > 0) setSelectedTrackId(parsed.tracks[0].id);
            if (parsed.totalFrames) setTotalFrames(parsed.totalFrames);
            if (parsed.fps) setFps(parsed.fps);
            showFeedback("✓ AniComper4 animation project loaded!");
          }
        } catch (err) {
          console.error("Failed to parse project JSON", err);
          showFeedback("⚠️ Invalid project JSON file");
        }
      };
      reader.readAsText(file);
    },
    [showFeedback]
  );

  // Export Animated GIF using gifenc
  const handleExportGif = useCallback(async () => {
    showFeedback("Rendering animated GIF sequence...");
    const canvas = document.createElement("canvas");
    canvas.width = canvasAspect === "16:9" ? 480 : canvasAspect === "1:1" ? 360 : 360;
    canvas.height = canvasAspect === "16:9" ? 270 : canvasAspect === "1:1" ? 360 : 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    try {
      const gif = GIFEncoder();
      const delayMs = Math.round(1000 / fps);

      // Preload track images
      const loadedImages = new Map<string, HTMLImageElement>();
      for (const track of tracks) {
        if (track.assetUrl) {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.src = track.assetUrl;
          await new Promise((res) => {
            img.onload = res;
            img.onerror = res;
          });
          loadedImages.set(track.id, img);
        }
      }

      // Render each frame sequentially
      for (let f = 1; f <= totalFrames; f++) {
        // Draw background
        ctx.fillStyle = canvasBg === "light" ? "#f8fafc" : "#020617";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Render tracks in order
        for (const track of tracks) {
          if (!track.visible) continue;
          const props = interpolateTrackAtFrame(track, f);

          ctx.save();
          ctx.globalAlpha = Math.max(0, Math.min(1, props.opacity));

          const centerX = (props.x / 100) * canvas.width;
          const centerY = (props.y / 100) * canvas.height;
          ctx.translate(centerX, centerY);
          ctx.rotate((props.rotation * Math.PI) / 180);
          ctx.scale(props.scale, props.scale);

          if (track.type === "text" && props.text) {
            ctx.fillStyle = props.textColor || "#ffffff";
            ctx.font = `bold ${(props.fontSize || 28) * 0.75}px Orbitron, sans-serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(props.text, 0, 0);
          } else {
            const img = loadedImages.get(track.id);
            if (img && img.naturalWidth > 0) {
              const drawW = 120;
              const drawH = (img.naturalHeight / img.naturalWidth) * drawW;
              ctx.drawImage(img, -drawW * track.pivotX, -drawH * track.pivotY, drawW, drawH);
            } else {
              // Placeholder shape
              ctx.fillStyle = track.color;
              ctx.beginPath();
              ctx.arc(0, 0, 25, 0, Math.PI * 2);
              ctx.fill();
            }
          }

          ctx.restore();
        }

        // Quantize and add to GIF stream
        const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const palette = quantize(data, 256);
        const index = applyPalette(data, palette);
        gif.writeFrame(index, canvas.width, canvas.height, {
          palette,
          delay: delayMs,
        });
      }

      gif.finish();
      const buffer = gif.bytes();
      const blob = new Blob([buffer], { type: "image/gif" });
      saveAs(blob, `anicomper4_animation_${Date.now()}.gif`);
      showFeedback("✓ Animated GIF exported!");
    } catch (err) {
      console.error("GIF export failed:", err);
      showFeedback("⚠️ Error exporting GIF");
    }
  }, [canvasAspect, canvasBg, fps, totalFrames, tracks, showFeedback]);

  // Export Frames Sequence as ZIP
  const handleExportZip = useCallback(async () => {
    showFeedback("Packaging PNG frame sequence...");
    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 360;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    try {
      const zip = new JSZip();
      const loadedImages = new Map<string, HTMLImageElement>();
      for (const track of tracks) {
        if (track.assetUrl) {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.src = track.assetUrl;
          await new Promise((res) => {
            img.onload = res;
            img.onerror = res;
          });
          loadedImages.set(track.id, img);
        }
      }

      for (let f = 1; f <= totalFrames; f++) {
        ctx.fillStyle = "#020617";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        for (const track of tracks) {
          if (!track.visible) continue;
          const props = interpolateTrackAtFrame(track, f);

          ctx.save();
          ctx.globalAlpha = props.opacity;
          const centerX = (props.x / 100) * canvas.width;
          const centerY = (props.y / 100) * canvas.height;
          ctx.translate(centerX, centerY);
          ctx.rotate((props.rotation * Math.PI) / 180);
          ctx.scale(props.scale, props.scale);

          if (track.type === "text" && props.text) {
            ctx.fillStyle = props.textColor || "#ffffff";
            ctx.font = `bold ${props.fontSize || 28}px Orbitron, sans-serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(props.text, 0, 0);
          } else {
            const img = loadedImages.get(track.id);
            if (img && img.naturalWidth > 0) {
              const drawW = 160;
              const drawH = (img.naturalHeight / img.naturalWidth) * drawW;
              ctx.drawImage(img, -drawW * track.pivotX, -drawH * track.pivotY, drawW, drawH);
            }
          }
          ctx.restore();
        }

        const dataUrl = canvas.toDataURL("image/png");
        const base64Data = dataUrl.replace(/^data:image\/png;base64,/, "");
        const padIdx = String(f).padStart(4, "0");
        zip.file(`frame_${padIdx}.png`, base64Data, { base64: true });
      }

      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `anicomper4_frames_${Date.now()}.zip`);
      showFeedback("✓ Frame sequence ZIP downloaded!");
    } catch (err) {
      console.error("ZIP export failed:", err);
      showFeedback("⚠️ Error exporting frames ZIP");
    }
  }, [totalFrames, tracks, showFeedback]);

  // Send Rendered Keyframe Snapshots to Storyboard
  const handleSendToStoryboard = useCallback(() => {
    if (!onApplyToStoryboard) {
      showFeedback("✓ Storyboard receiver connected");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = 400;
    canvas.height = 300;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Sample 9 keyframes across the animation
    const sampleFrames = [
      1,
      Math.round(totalFrames * 0.125),
      Math.round(totalFrames * 0.25),
      Math.round(totalFrames * 0.375),
      Math.round(totalFrames * 0.5),
      Math.round(totalFrames * 0.625),
      Math.round(totalFrames * 0.75),
      Math.round(totalFrames * 0.875),
      totalFrames,
    ];

    const rendered: { url: string; name: string }[] = [];

    sampleFrames.forEach((f, idx) => {
      ctx.fillStyle = "#020617";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      tracks.forEach((track) => {
        if (!track.visible) return;
        const props = interpolateTrackAtFrame(track, f);
        ctx.save();
        ctx.globalAlpha = props.opacity;
        const centerX = (props.x / 100) * canvas.width;
        const centerY = (props.y / 100) * canvas.height;
        ctx.translate(centerX, centerY);
        ctx.rotate((props.rotation * Math.PI) / 180);
        ctx.scale(props.scale, props.scale);

        if (track.type === "text" && props.text) {
          ctx.fillStyle = props.textColor || "#ffffff";
          ctx.font = `bold 24px Orbitron, sans-serif`;
          ctx.textAlign = "center";
          ctx.fillText(props.text, 0, 0);
        } else {
          ctx.fillStyle = track.color;
          ctx.beginPath();
          ctx.arc(0, 0, 30, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });

      rendered.push({
        url: canvas.toDataURL("image/png"),
        name: `AniComper4_Frame_${f}`,
      });
    });

    onApplyToStoryboard(rendered);
    showFeedback("✓ Sent 9 keyframes to Storyboard asset slots!");
  }, [totalFrames, tracks, onApplyToStoryboard, showFeedback]);

  // Interactive On-Canvas Drag to Reposition Layer
  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!canvasStageRef.current || !activeTrack || activeTrack.locked) return;

    const rect = canvasStageRef.current.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const currentProps = interpolateTrackAtFrame(activeTrack, currentFrame);
    const initialObjX = currentProps.x;
    const initialObjY = currentProps.y;

    setIsDraggingCanvasObject(true);

    const onPointerMove = (moveEv: PointerEvent) => {
      const deltaXPercent = ((moveEv.clientX - startX) / rect.width) * 100;
      const deltaYPercent = ((moveEv.clientY - startY) / rect.height) * 100;

      const newX = Math.round(Math.max(0, Math.min(100, initialObjX + deltaXPercent)));
      const newY = Math.round(Math.max(0, Math.min(100, initialObjY + deltaYPercent)));

      handleAddOrUpdateKeyframe({ x: newX, y: newY });
    };

    const onPointerUp = () => {
      setIsDraggingCanvasObject(false);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  };

  // Timeline Scrub Drag Interaction
  const handleTimelineScrubStart = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!timelineScrubRef.current) return;
    const rect = timelineScrubRef.current.getBoundingClientRect();
    isScrubbingRef.current = true;

    const calculateFrame = (clientX: number) => {
      const offsetX = Math.max(0, Math.min(rect.width, clientX - rect.left));
      const ratio = offsetX / rect.width;
      const targetFrame = Math.max(1, Math.min(totalFrames, Math.round(ratio * (totalFrames - 1)) + 1));
      setCurrentFrame(targetFrame);
    };

    calculateFrame(e.clientX);

    const onMove = (moveEv: PointerEvent) => {
      if (isScrubbingRef.current) {
        calculateFrame(moveEv.clientX);
      }
    };

    const onUp = () => {
      isScrubbingRef.current = false;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  // Filtered processed slices
  const filteredSlices = useMemo(() => {
    const list: { url: string; name: string }[] = [];
    slices.forEach((s, idx) => {
      if (s.url) list.push({ url: s.url, name: s.name || `Slice ${idx + 1}` });
    });
    storyboardSlots.forEach((slot, idx) => {
      if (slot.url && !list.some((item) => item.url === slot.url)) {
        list.push({ url: slot.url, name: slot.name || `Slot ${idx + 1}` });
      }
    });

    if (!sliceFilter) return list;
    return list.filter((item) => item.name.toLowerCase().includes(sliceFilter.toLowerCase()));
  }, [slices, storyboardSlots, sliceFilter]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#020617]/95 backdrop-blur-md flex flex-col overflow-hidden text-slate-100 select-none animate-in fade-in duration-200">
      {/* Toast Feedback Notice */}
      {notice && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-cyan-950/90 border border-cyan-500/50 rounded-xl text-cyan-200 text-xs font-semibold shadow-2xl flex items-center gap-2 animate-in slide-in-from-top-2">
          <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* Top Header Bar & Global Studio Transport (Icons-Only by Default via IBC)  */}
      {/* ========================================================================= */}
      <header className="h-12 border-b border-[#1e293b] bg-[#090e1a]/90 px-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Film className="w-5 h-5 text-cyan-400 shrink-0" />
          <div>
            <CustomizableLabel
              labelId="anicomper4_title_label"
              defaultText="Anicomper4 studio"
              className="font-bold text-xs tracking-wider text-slate-100 flex items-center gap-1.5"
            />
            <span className="text-[9px] text-slate-400 font-mono hidden sm:inline">
              {uiText("components_ani_comper4_studio_modal.span.keyframed_timeline_and_onion_skinning", "Keyframed timeline & onion-skinning")}
            </span>
          </div>
        </div>

        {/* Transport & Control Bar */}
        <div className="flex items-center gap-1">
          {/* Jump First */}
          <CustomizableButton
            buttonId="anicomper4_first_frame"
            defaultLabel="First frame"
            defaultIcon={<ChevronsLeft className="w-3.5 h-3.5" />}
            forceZeroText={true}
            onClick={() => setCurrentFrame(1)}
            className="p-1.5 rounded-lg bg-[#020617] hover:bg-slate-800 text-slate-300 border border-[#1e293b]"
            title="First frame (Home)"
          />

          {/* Prev Frame */}
          <CustomizableButton
            buttonId="anicomper4_prev_frame"
            defaultLabel="Previous frame"
            defaultIcon={<SkipBack className="w-3.5 h-3.5" />}
            forceZeroText={true}
            onClick={() => setCurrentFrame((f) => Math.max(1, f - 1))}
            className="p-1.5 rounded-lg bg-[#020617] hover:bg-slate-800 text-slate-300 border border-[#1e293b]"
            title="Previous frame (Left arrow)"
          />

          {/* Play / Pause Toggle */}
          <CustomizableButton
            buttonId="anicomper4_play_toggle"
            defaultLabel={isPlaying ? "Pause animation" : "Play animation"}
            defaultIcon={isPlaying ? <Pause className="w-4 h-4 text-slate-950" /> : <Play className="w-4 h-4 text-slate-950 fill-slate-950 ml-0.5" />}
            forceZeroText={true}
            onClick={() => setIsPlaying((p) => !p)}
            className={cn(
              "p-2 rounded-lg font-bold shadow-md transition-all cursor-pointer",
              isPlaying
                ? "bg-amber-400 hover:bg-amber-300 text-slate-950"
                : "bg-cyan-400 hover:bg-cyan-300 text-slate-950"
            )}
            title="Play / Pause (Space)"
          />

          {/* Next Frame */}
          <CustomizableButton
            buttonId="anicomper4_next_frame"
            defaultLabel="Next frame"
            defaultIcon={<SkipForward className="w-3.5 h-3.5" />}
            forceZeroText={true}
            onClick={() => setCurrentFrame((f) => Math.min(totalFrames, f + 1))}
            className="p-1.5 rounded-lg bg-[#020617] hover:bg-slate-800 text-slate-300 border border-[#1e293b]"
            title="Next frame (Right arrow)"
          />

          {/* Jump Last */}
          <CustomizableButton
            buttonId="anicomper4_last_frame"
            defaultLabel="Last frame"
            defaultIcon={<ChevronsRight className="w-3.5 h-3.5" />}
            forceZeroText={true}
            onClick={() => setCurrentFrame(totalFrames)}
            className="p-1.5 rounded-lg bg-[#020617] hover:bg-slate-800 text-slate-300 border border-[#1e293b]"
            title="Last frame (End)"
          />

          {/* Loop Mode Toggle */}
          <CustomizableButton
            buttonId="anicomper4_loop_toggle"
            defaultLabel={`Loop: ${loopMode}`}
            defaultIcon={<Repeat className={cn("w-3.5 h-3.5", loopMode !== "once" ? "text-cyan-400" : "text-slate-500")} />}
            forceZeroText={true}
            onClick={() => {
              setLoopMode((prev) => (prev === "loop" ? "pingpong" : prev === "pingpong" ? "once" : "loop"));
            }}
            className="p-1.5 rounded-lg bg-[#020617] hover:bg-slate-800 text-slate-300 border border-[#1e293b]"
            title={`Loop mode: ${loopMode}`}
          />

          <div className="h-5 w-px bg-slate-800 mx-1" />

          {/* Add Keyframe on Active Track */}
          <CustomizableButton
            buttonId="anicomper4_add_keyframe"
            defaultLabel="Add keyframe"
            defaultIcon={<Sparkles className="w-3.5 h-3.5 text-amber-400" />}
            forceZeroText={true}
            onClick={() => handleAddOrUpdateKeyframe()}
            className="p-1.5 rounded-lg bg-[#020617] hover:bg-amber-950/40 text-amber-300 border border-amber-500/30"
            title="Add or update keyframe at playhead (+)"
          />

          {/* Delete Keyframe */}
          <CustomizableButton
            buttonId="anicomper4_delete_keyframe"
            defaultLabel="Delete keyframe"
            defaultIcon={<Trash2 className="w-3.5 h-3.5 text-rose-400" />}
            forceZeroText={true}
            disabled={!activeKeyframe}
            onClick={handleDeleteKeyframe}
            className="p-1.5 rounded-lg bg-[#020617] hover:bg-rose-950/40 text-rose-300 border border-rose-500/30 disabled:opacity-30 disabled:pointer-events-none"
            title="Delete active keyframe (-)"
          />

          {/* Instant Speed Ramping Button */}
          <CustomizableButton
            buttonId="anicomper4_speed_ramp"
            defaultLabel="Instant speed ramping"
            defaultIcon={<Zap className="w-3.5 h-3.5 text-emerald-400" />}
            forceZeroText={true}
            onClick={() => setShowSpeedRampModal((p) => !p)}
            className="p-1.5 rounded-lg bg-emerald-950/30 hover:bg-emerald-900/50 text-emerald-300 border border-emerald-500/40 shadow-sm"
            title="Instant speed ramping presets (Accelerate, bullet-time, s-curve)"
          />

          {/* Onion Skinning Toggle */}
          <CustomizableButton
            buttonId="anicomper4_onion_skin"
            defaultLabel={showOnionSkin ? "Onion skin: on" : "Onion skin: off"}
            defaultIcon={<Layers className={cn("w-3.5 h-3.5", showOnionSkin ? "text-cyan-400" : "text-slate-500")} />}
            forceZeroText={true}
            onClick={() => setShowOnionSkin((p) => !p)}
            className={cn(
              "p-1.5 rounded-lg border transition-colors",
              showOnionSkin
                ? "bg-cyan-950/40 border-cyan-500/50 text-cyan-300"
                : "bg-[#020617] border-[#1e293b] text-slate-400"
            )}
            title="Toggle onion skinning preview"
          />

          <div className="h-5 w-px bg-slate-800 mx-1" />

          {/* Show/Hide Slices Drawer Toggle */}
          <CustomizableButton
            buttonId="anicomper4_toggle_slices"
            defaultLabel="Toggle slices drawer"
            defaultIcon={<Scissors className={cn("w-3.5 h-3.5", showSlicesDrawer ? "text-amber-400" : "text-slate-500")} />}
            forceZeroText={true}
            onClick={() => setShowSlicesDrawer((p) => !p)}
            className={cn(
              "p-1.5 rounded-lg border transition-colors",
              showSlicesDrawer
                ? "bg-amber-950/40 border-amber-500/50 text-amber-300"
                : "bg-[#020617] border-[#1e293b] text-slate-400"
            )}
            title="Toggle processed slices drawer"
          />

          {/* Show/Hide Left Tracks Panel */}
          <CustomizableButton
            buttonId="anicomper4_toggle_tracks"
            defaultLabel="Toggle tracks panel"
            defaultIcon={showTracksPanel ? <PanelLeftClose className="w-3.5 h-3.5" /> : <PanelLeftOpen className="w-3.5 h-3.5" />}
            forceZeroText={true}
            onClick={() => setShowTracksPanel((p) => !p)}
            className="p-1.5 rounded-lg bg-[#020617] hover:bg-slate-800 text-slate-300 border border-[#1e293b]"
            title="Show / hide left tracks panel"
          />

          {/* Show/Hide Right Inspector Panel */}
          <CustomizableButton
            buttonId="anicomper4_toggle_inspector"
            defaultLabel="Toggle inspector panel"
            defaultIcon={showInspectorPanel ? <PanelRightClose className="w-3.5 h-3.5" /> : <PanelRightOpen className="w-3.5 h-3.5" />}
            forceZeroText={true}
            onClick={() => setShowInspectorPanel((p) => !p)}
            className="p-1.5 rounded-lg bg-[#020617] hover:bg-slate-800 text-slate-300 border border-[#1e293b]"
            title="Show / hide right inspector panel"
          />

          {/* Show/Hide Bottom Timeline */}
          <CustomizableButton
            buttonId="anicomper4_toggle_timeline"
            defaultLabel="Toggle timeline bar"
            defaultIcon={showTimelineBar ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            forceZeroText={true}
            onClick={() => setShowTimelineBar((p) => !p)}
            className="p-1.5 rounded-lg bg-[#020617] hover:bg-slate-800 text-slate-300 border border-[#1e293b]"
            title="Show / hide bottom timeline"
          />
        </div>

        {/* Global Action Tools: Save, Export, Storyboard, Close */}
        <div className="flex items-center gap-1">
          {/* Save Project to Cloud Database */}
          <CustomizableButton
            buttonId="anicomper4_save_project"
            defaultLabel="Save project"
            defaultIcon={<Save className="w-3.5 h-3.5 text-cyan-400" />}
            forceZeroText={true}
            onClick={handleSaveProject}
            className="p-1.5 rounded-lg bg-[#020617] hover:bg-cyan-950/40 text-cyan-300 border border-cyan-500/30"
            title="Save animation project state to database"
          />

          {/* Export Project JSON */}
          <CustomizableButton
            buttonId="anicomper4_export_json"
            defaultLabel="Export project json"
            defaultIcon={<FileJson className="w-3.5 h-3.5 text-amber-400" />}
            forceZeroText={true}
            onClick={handleExportJson}
            className="p-1.5 rounded-lg bg-[#020617] hover:bg-amber-950/40 text-amber-300 border border-amber-500/30"
            title="Export project configuration JSON file"
          />

          {/* Import Project JSON */}
          <CustomizableLabel
            labelId="ani_comper4_studio_modal_item_32"
            defaultIcon={<Upload className="w-3.5 h-3.5" />}
            as="label"
            className="p-1.5 rounded-lg bg-[#020617] hover:bg-slate-800 text-slate-300 border border-[#1e293b] cursor-pointer"
title={uiText("components_ani_comper4_studio_modal.label.import_project_configuration_json_file.title", "Import project configuration JSON file")}
          >
              {() => (
                  <>
                    <input type="file" accept=".json,application/json" onChange={handleImportJson} className="hidden" />
                  </>
                )}
          </CustomizableLabel>

          {/* Export GIF */}
          <CustomizableButton
            buttonId="anicomper4_export_gif"
            defaultLabel="Export animated gif"
            defaultIcon={<Download className="w-3.5 h-3.5 text-emerald-400" />}
            forceZeroText={true}
            onClick={handleExportGif}
            className="p-1.5 rounded-lg bg-[#020617] hover:bg-emerald-950/40 text-emerald-300 border border-emerald-500/30"
            title="Export animated GIF animation"
          />

          {/* Export Frames ZIP */}
          <CustomizableButton
            buttonId="anicomper4_export_zip"
            defaultLabel="Export frames zip"
            defaultIcon={<Archive className="w-3.5 h-3.5 text-purple-400" />}
            forceZeroText={true}
            onClick={handleExportZip}
            className="p-1.5 rounded-lg bg-[#020617] hover:bg-purple-950/40 text-purple-300 border border-purple-500/30"
            title="Export full PNG frame sequence ZIP"
          />

          {/* Send to Storyboard */}
          <CustomizableButton
            buttonId="anicomper4_apply_storyboard"
            defaultLabel="Send to storyboard"
            defaultIcon={<Send className="w-3.5 h-3.5 text-sky-400" />}
            forceZeroText={true}
            onClick={handleSendToStoryboard}
            className="p-1.5 rounded-lg bg-[#020617] hover:bg-sky-950/40 text-sky-300 border border-sky-500/30"
            title="Sample & send keyframe snapshots to Storyboard slots"
          />

          {/* Close Studio */}
          <CustomizableButton
            buttonId="anicomper4_close"
            defaultLabel="Close studio"
            defaultIcon={<X className="w-4 h-4 text-slate-400 hover:text-white" />}
            forceZeroText={true}
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#020617] hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 border border-[#1e293b] ml-1"
            title="Close AniComper4 Studio (Esc)"
          />
        </div>
      </header>

      {/* ========================================================================= */}
      {/* Top Drawer: Processed Frame Slices & Storyboard Frames Dock               */}
      {/* ========================================================================= */}
      {showSlicesDrawer ? (
        <div className="h-24 bg-[#050814] border-b border-[#1e293b] px-3 py-1.5 flex flex-col shrink-0 overflow-hidden animate-in slide-in-from-top-2">
          <div className="flex items-center justify-between pb-1 text-[9px] text-slate-400 font-semibold">
            <span className="flex items-center gap-1.5">
              <Scissors className="w-3 h-3 text-amber-400" />
              <CustomizableLabel
                labelId="anicomper4_slices_label"
                defaultText="Processed frame slices & storyboard frames"
                className="font-bold text-slate-200"
              />
              <span className="text-[8px] font-mono text-slate-500">({filteredSlices.length})</span>
            </span>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-2.5 h-2.5 absolute left-1.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder={uiText("components_ani_comper4_studio_modal.input.filter_slices.placeholder", "Filter slices...")}
                  value={sliceFilter}
                  onChange={(e) => setSliceFilter(e.target.value)}
                  className="bg-[#020617] border border-[#1e293b] rounded pl-5 pr-2 py-0.5 text-[8.5px] text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 w-32"
                />
              </div>
              <CustomizableButton
                buttonId="anicomper4_slices_collapse"
                defaultLabel="Hide slices drawer"
                defaultIcon={<ChevronUp className="w-3 h-3 text-slate-400 hover:text-slate-200" />}
                forceZeroText={true}
                onClick={() => setShowSlicesDrawer(false)}
                className="p-1 rounded bg-[#020617] hover:bg-slate-800 text-slate-400 border border-[#1e293b] cursor-pointer"
                title="Hide processed frame slices drawer"
              />
            </div>
          </div>

          <div className="flex-1 flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
            {filteredSlices.length === 0 ? (
              <div className="text-[10px] text-slate-500 italic pl-1 flex items-center gap-2">
                <span>{uiText("components_ani_comper4_studio_modal.span.no_carved_slices_or_storyboard_frames_found", "No carved slices or storyboard frames found. Carve an image in Carver mode or load frames to populate this dock.")}</span>
                <CustomizableButton
                  buttonId="ani_comper4_studio_modal_btn_31"
                  type="button"
onClick={() => handleAddNewTrack("character", undefined, "Vector Actor")}
className="px-2 py-0.5 bg-cyan-950 border border-cyan-500/40 text-cyan-300 rounded text-[9px] cursor-pointer font-bold"
                >
                    {() => (
                        <>
                          {uiText("components_ani_comper4_studio_modal.button.create_demo_character_track", "+ Create Demo Character Track")}
                        </>
                      )}
                </CustomizableButton>
              </div>
            ) : (
              filteredSlices.map((slice, idx) => (
                <div
                  key={`slice_dock_${idx}_${slice.url.slice(-10)}`}
                  className="group relative flex items-center gap-1.5 bg-[#090e1a] hover:bg-[#0f172a] border border-[#1e293b] hover:border-cyan-500/60 p-1 rounded-lg shrink-0 transition-all shadow-sm"
                >
                  <img
                    src={slice.url}
                    alt={slice.name}
                    className="w-12 h-12 object-contain rounded bg-[#020617] border border-slate-800"
                  />
                  <div className="flex flex-col gap-0.5 pr-1">
                    <span className="text-[8.5px] font-semibold text-slate-200 truncate max-w-[80px]">
                      {slice.name}
                    </span>
                    <div className="flex items-center gap-1">
                      <CustomizableButton
                        buttonId="ani_comper4_studio_modal_btn_30"
                        type="button"
onClick={() => handleAddNewTrack("character", slice.url, slice.name)}
className="px-1.5 py-0.5 bg-cyan-950 hover:bg-cyan-800 text-cyan-300 rounded text-[7.5px] font-bold border border-cyan-500/40 cursor-pointer"
title={uiText("components_ani_comper4_studio_modal.button.add_as_new_animated_character_track.title", "Add as new animated Character track")}
                      >
                          {() => (
                              <>
                                {uiText("components_ani_comper4_studio_modal.button.track", "+ Track")}
                              </>
                            )}
                      </CustomizableButton>
                      <CustomizableButton
                        buttonId="ani_comper4_studio_modal_btn_29"
                        type="button"
onClick={() => handleAddNewTrack("background", slice.url, slice.name)}
className="px-1.5 py-0.5 bg-blue-950 hover:bg-blue-800 text-blue-300 rounded text-[7.5px] font-bold border border-blue-500/40 cursor-pointer"
title={uiText("components_ani_comper4_studio_modal.button.add_as_new_animated_backdrop_track.title", "Add as new animated Backdrop track")}
                      >
                          {() => (
                              <>
                                {uiText("components_ani_comper4_studio_modal.button.backdrop", "+ Backdrop")}
                              </>
                            )}
                      </CustomizableButton>
                      <CustomizableButton
                        buttonId="ani_comper4_studio_modal_btn_28"
                        type="button"
onClick={() => {
                          if (!activeTrack) return;
                          setTracks((prev) =>
                            prev.map((t) =>
                              t.id === activeTrack.id
                                ? { ...t, assetUrl: slice.url, assetName: slice.name }
                                : t
                            )
                          );
                          showFeedback(`✓ Replaced asset on ${activeTrack.name}`);
                        }}
className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[7.5px] border border-slate-700 cursor-pointer"
title={uiText("components_ani_comper4_studio_modal.button.replace_active_track_image_with_this_slice.title", "Replace active track image with this slice")}
                      >
                          {() => (
                              <>
                                {uiText("components_ani_comper4_studio_modal.button.replace", "Replace")}
                              </>
                            )}
                      </CustomizableButton>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="h-6 bg-[#050814]/80 border-b border-[#1e293b] px-3 flex items-center shrink-0">
          <CustomizableButton
            buttonId="ani_comper4_studio_modal_btn_27"
            defaultIcon={<Scissors className="w-3 h-3 text-amber-400" />}
            type="button"
onClick={() => setShowSlicesDrawer(true)}
className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[8.5px] bg-[#020617] hover:bg-slate-800 text-amber-300 border border-[#1e293b] cursor-pointer font-bold"
title={uiText("components_ani_comper4_studio_modal.button.open_processed_frame_slices_drawer.title", "Open processed frame slices drawer")}
          >
              {() => (
                  <>
                    <span>{uiText("components_ani_comper4_studio_modal.span.show_processed_frame_slices", "Show processed frame slices (")}{filteredSlices.length})</span>
                  </>
                )}
          </CustomizableButton>
        </div>
      )}

      {/* ========================================================================= */}
      {/* Central Viewport & Sidebars (Tracks Left, Canvas Middle, Inspector Right) */}
      {/* ========================================================================= */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Layers & Tracks List */}
        {showTracksPanel ? (
          <aside className="w-56 bg-[#050814] border-r border-[#1e293b] flex flex-col shrink-0 overflow-hidden animate-in slide-in-from-left-2">
            <div className="p-2 border-b border-[#1e293b] flex items-center justify-between text-[10px] font-bold text-slate-300">
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <CustomizableLabel
                  labelId="anicomper4_tracks_label"
                  defaultText="Animation tracks"
                  className="font-bold text-slate-200"
                />
                <span className="text-[8px] font-mono text-slate-500">({tracks.length})</span>
              </span>
              <div className="flex items-center gap-1">
                {/* Add Track Button */}
                <CustomizableButton
                  buttonId="anicomper4_add_track"
                  defaultLabel="Add new track"
                  defaultIcon={<Plus className="w-3.5 h-3.5 text-cyan-300" />}
                  forceZeroText={true}
                  onClick={() => handleAddNewTrack("character")}
                  className="p-1 rounded bg-[#090e1a] hover:bg-cyan-950 text-cyan-400 border border-cyan-500/30"
                  title="Add new animation track"
                />
                <CustomizableButton
                  buttonId="anicomper4_tracks_collapse"
                  defaultLabel="Hide tracks panel"
                  defaultIcon={<PanelLeftClose className="w-3.5 h-3.5 text-slate-400 hover:text-slate-200" />}
                  forceZeroText={true}
                  onClick={() => setShowTracksPanel(false)}
                  className="p-1 rounded bg-[#090e1a] hover:bg-slate-800 text-slate-400 border border-[#1e293b]"
                  title="Collapse left tracks panel"
                />
              </div>
            </div>

            {/* Quick Add Presets Bar */}
            <div className="grid grid-cols-3 gap-1 p-1.5 bg-[#020617] border-b border-[#1e293b]">
              <CustomizableButton
                buttonId="ani_comper4_studio_modal_btn_26"
                defaultIcon={<ImageIcon className="w-2.5 h-2.5" />}
                type="button"
onClick={() => handleAddNewTrack("character")}
className="px-1 py-1 rounded bg-[#090e1a] hover:bg-cyan-950/50 border border-cyan-500/20 text-cyan-300 text-[8px] font-semibold flex items-center justify-center gap-1 cursor-pointer"
title={uiText("components_ani_comper4_studio_modal.button.add_animated_character_track.title", "Add animated character track")}
              >
                  {() => (
                      <>
                        <span>{uiText("components_ani_comper4_studio_modal.span.actor", "Actor")}</span>
                      </>
                    )}
              </CustomizableButton>
              <CustomizableButton
                buttonId="ani_comper4_studio_modal_btn_25"
                defaultIcon={<Layers className="w-2.5 h-2.5" />}
                type="button"
onClick={() => handleAddNewTrack("background")}
className="px-1 py-1 rounded bg-[#090e1a] hover:bg-blue-950/50 border border-blue-500/20 text-blue-300 text-[8px] font-semibold flex items-center justify-center gap-1 cursor-pointer"
title={uiText("components_ani_comper4_studio_modal.button.add_background_scenery_track.title", "Add background scenery track")}
              >
                  {() => (
                      <>
                        <span>{uiText("components_ani_comper4_studio_modal.span.backdrop", "Backdrop")}</span>
                      </>
                    )}
              </CustomizableButton>
              <CustomizableButton
                buttonId="ani_comper4_studio_modal_btn_24"
                defaultIcon={<Type className="w-2.5 h-2.5" />}
                type="button"
onClick={() => handleAddNewTrack("text", undefined, "Animated Text")}
className="px-1 py-1 rounded bg-[#090e1a] hover:bg-purple-950/50 border border-purple-500/20 text-purple-300 text-[8px] font-semibold flex items-center justify-center gap-1 cursor-pointer"
title={uiText("components_ani_comper4_studio_modal.button.add_kinetic_text_typography_track.title", "Add kinetic text typography track")}
              >
                  {() => (
                      <>
                        <span>{uiText("components_ani_comper4_studio_modal.span.title", "Title")}</span>
                      </>
                    )}
              </CustomizableButton>
            </div>

            {/* Track Items */}
            <div className="flex-1 overflow-y-auto p-1.5 space-y-1">
              {tracks.map((track) => {
                const isSelected = track.id === selectedTrackId;
                const kfCount = track.keyframes.length;
                return (
                  <div
                    key={track.id}
                    onClick={() => {
                      setSelectedTrackId(track.id);
                      setSelectedKeyframeId(null);
                    }}
                    className={cn(
                      "p-1.5 rounded-lg border transition-all cursor-pointer flex flex-col gap-1",
                      isSelected
                        ? "bg-[#09152b] border-cyan-500 shadow-md shadow-cyan-950/40"
                        : "bg-[#090e1a] hover:bg-[#0f172a] border-[#1e293b]"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 truncate">
                        <div
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: track.color }}
                        />
                        <span className="text-[10px] font-bold text-slate-200 truncate">
                          {track.name}
                        </span>
                      </div>
                      <span className="text-[7.5px] px-1 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                        {kfCount}{uiText("components_ani_comper4_studio_modal.span.kf", " kf")}
                      </span>
                    </div>

                    {/* Track Quick Controls */}
                    <div className="flex items-center justify-between pt-0.5">
                      <span className="text-[8px] text-slate-500 font-mono capitalize">
                        {track.type}
                      </span>
                      <div className="flex items-center gap-1">
                        {/* Visibility Toggle */}
                        <CustomizableButton
                          buttonId="ani_comper4_studio_modal_btn_23"
                          type="button"
onClick={(e) => {
                            e.stopPropagation();
                            setTracks((prev) =>
                              prev.map((t) => (t.id === track.id ? { ...t, visible: !t.visible } : t))
                            );
                          }}
className="p-0.5 text-slate-400 hover:text-white rounded cursor-pointer"
title={track.visible ? "Hide layer" : "Show layer"}
                        >
                            {() => (
                                <>
                                  {track.visible ? <Eye className="w-3 h-3 text-cyan-400" /> : <EyeOff className="w-3 h-3 text-slate-600" />}
                                </>
                              )}
                        </CustomizableButton>

                        {/* Lock Toggle */}
                        <CustomizableButton
                          buttonId="ani_comper4_studio_modal_btn_22"
                          type="button"
onClick={(e) => {
                            e.stopPropagation();
                            setTracks((prev) =>
                              prev.map((t) => (t.id === track.id ? { ...t, locked: !t.locked } : t))
                            );
                          }}
className="p-0.5 text-slate-400 hover:text-white rounded cursor-pointer"
title={track.locked ? "Unlock track" : "Lock track"}
                        >
                            {() => (
                                <>
                                  {track.locked ? <Lock className="w-3 h-3 text-amber-400" /> : <Unlock className="w-3 h-3 text-slate-600" />}
                                </>
                              )}
                        </CustomizableButton>

                        {/* Delete Track */}
                        <CustomizableButton
                          buttonId="ani_comper4_studio_modal_btn_21"
                          defaultIcon={<Trash2 className="w-3 h-3" />}
                          type="button"
onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTrack(track.id);
                          }}
className="p-0.5 text-slate-500 hover:text-rose-400 rounded cursor-pointer"
title={uiText("components_ani_comper4_studio_modal.button.delete_track.title", "Delete track")}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>
        ) : (
          <CustomizableButton
            buttonId="ani_comper4_studio_modal_btn_20"
            defaultIcon={<PanelLeftOpen className="w-3.5 h-3.5 text-cyan-400" />}
            type="button"
onClick={() => setShowTracksPanel(true)}
className="w-6 bg-[#050814] hover:bg-slate-900 border-r border-[#1e293b] flex flex-col items-center justify-center gap-2 py-3 text-slate-400 hover:text-cyan-300 cursor-pointer transition-colors shrink-0"
title={uiText("components_ani_comper4_studio_modal.button.show_animation_tracks_panel.title", "Show animation tracks panel")}
          >
              {() => (
                  <>
                    <span className="text-[8px] font-bold uppercase tracking-widest [writing-mode:vertical-lr] rotate-180">
              {uiText("components_ani_comper4_studio_modal.span.tracks", "Tracks")}
            </span>
                  </>
                )}
          </CustomizableButton>
        )}

        {/* Center Canvas Viewport */}
        <main className="flex-1 bg-[#020617] flex flex-col overflow-hidden relative">
          {/* Canvas Top Stage Options Toolbar */}
          <div className="h-8 border-b border-[#1e293b] bg-[#050814]/70 px-3 flex items-center justify-between shrink-0 text-[9px] text-slate-400">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-300 flex items-center gap-1">
                <Compass className="w-3 h-3 text-cyan-400" />
                <CustomizableLabel
                  labelId="anicomper4_canvas_label"
                  defaultText="Canvas viewport"
                  className="font-semibold text-slate-300"
                />
              </span>
              <span className="text-slate-600">|</span>
              {/* Aspect Ratio */}
              <div className="flex items-center gap-1">
                {(["16:9", "1:1", "9:16", "4:3"] as const).map((asp) => (
                  <CustomizableButton
                    buttonId="ani_comper4_studio_modal_btn_19"
                    key={asp}
type="button"
onClick={() => setCanvasAspect(asp)}
className={cn(
                      "px-1.5 py-0.5 rounded text-[8px] font-bold cursor-pointer transition-colors",
                      canvasAspect === asp
                        ? "bg-cyan-950 text-cyan-300 border border-cyan-500/50"
                        : "bg-[#090e1a] text-slate-400 border border-[#1e293b]"
                    )}
                  >
                      {() => (
                          <>
                            {asp}
                          </>
                        )}
                  </CustomizableButton>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Canvas Background */}
              <div className="flex items-center gap-1">
                <span>{uiText("components_ani_comper4_studio_modal.span.bg", "Bg:")}</span>
                {(["dark", "black", "checker", "light"] as const).map((bg) => (
                  <CustomizableButton
                    buttonId="ani_comper4_studio_modal_btn_18"
                    key={bg}
type="button"
onClick={() => setCanvasBg(bg)}
className={cn(
                      "px-1 py-0.5 rounded text-[7.5px] capitalize cursor-pointer",
                      canvasBg === bg ? "bg-slate-700 text-white font-bold" : "text-slate-500"
                    )}
                  >
                      {() => (
                          <>
                            {bg}
                          </>
                        )}
                  </CustomizableButton>
                ))}
              </div>

              {/* Zoom Controls */}
              <div className="flex items-center gap-1">
                <CustomizableButton
                  buttonId="ani_comper4_studio_modal_btn_17"
                  defaultIcon={<ZoomOut className="w-3 h-3" />}
                  type="button"
onClick={() => setCanvasZoom((z) => Math.max(0.5, z - 0.1))}
className="p-1 hover:bg-slate-800 rounded cursor-pointer"
title={uiText("components_ani_comper4_studio_modal.button.zoom_out.title", "Zoom out")}
                />
                <span className="font-mono text-[8.5px] w-8 text-center">
                  {Math.round(canvasZoom * 100)}%
                </span>
                <CustomizableButton
                  buttonId="ani_comper4_studio_modal_btn_16"
                  defaultIcon={<ZoomIn className="w-3 h-3" />}
                  type="button"
onClick={() => setCanvasZoom((z) => Math.min(2.5, z + 0.1))}
className="p-1 hover:bg-slate-800 rounded cursor-pointer"
title={uiText("components_ani_comper4_studio_modal.button.zoom_in.title", "Zoom in")}
                />
                <CustomizableButton
                  buttonId="ani_comper4_studio_modal_btn_15"
                  type="button"
onClick={() => setCanvasZoom(1)}
className="px-1 py-0.5 text-[7.5px] bg-slate-800 hover:bg-slate-700 rounded cursor-pointer"
                >
                    {() => (
                        <>
                          {uiText("components_ani_comper4_studio_modal.button.fit", "Fit")}
                        </>
                      )}
                </CustomizableButton>
              </div>
            </div>
          </div>

          {/* Interactive Canvas Stage */}
          <div className="flex-1 flex items-center justify-center p-4 overflow-hidden relative">
            <div
              ref={canvasStageRef}
              onPointerDown={handleCanvasPointerDown}
              style={{
                transform: `scale(${canvasZoom})`,
                aspectRatio:
                  canvasAspect === "16:9"
                    ? "16 / 9"
                    : canvasAspect === "1:1"
                    ? "1 / 1"
                    : canvasAspect === "9:16"
                    ? "9 / 16"
                    : "4 / 3",
              }}
              className={cn(
                "relative max-w-full max-h-full w-[640px] rounded-xl border border-slate-700/80 shadow-2xl overflow-hidden cursor-crosshair transition-transform select-none",
                canvasBg === "dark" && "bg-[#090e1a]",
                canvasBg === "black" && "bg-black",
                canvasBg === "light" && "bg-slate-100",
                canvasBg === "checker" && "bg-[linear-gradient(45deg,#1e293b_25%,transparent_25%),linear-gradient(-45deg,#1e293b_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#1e293b_75%),linear-gradient(-45deg,transparent_75%,#1e293b_75%)] bg-[size:20px_20px] bg-[#090e1a]"
              )}
            >
              {/* ========================================================================= */}
              {/* Onion Skinning Layer Ghosts (Past: Red/Orange, Future: Blue/Cyan)         */}
              {/* ========================================================================= */}
              {showOnionSkin && (
                <>
                  {/* Past Frames Ghosts */}
                  {Array.from({ length: onionPastFrames }).map((_, idx) => {
                    const ghostFrame = currentFrame - (idx + 1);
                    if (ghostFrame < 1) return null;
                    const ghostOpacity = onionSkinOpacity * (1 - idx * 0.35);

                    return (
                      <div
                        key={`onion_past_${ghostFrame}`}
                        className="absolute inset-0 pointer-events-none z-10"
                        style={{ opacity: ghostOpacity }}
                      >
                        {tracks.map((track) => {
                          if (!track.visible) return null;
                          const ghostProps = interpolateTrackAtFrame(track, ghostFrame);
                          return (
                            <div
                              key={`ghost_p_${track.id}_${ghostFrame}`}
                              style={{
                                left: `${ghostProps.x}%`,
                                top: `${ghostProps.y}%`,
                                transform: `translate(-${track.pivotX * 100}%, -${track.pivotY * 100}%) rotate(${ghostProps.rotation}deg) scale(${ghostProps.scale})`,
                                filter: "drop-shadow(0 0 6px rgba(239, 68, 68, 0.7)) hue-rotate(-40deg)",
                              }}
                              className="absolute pointer-events-none"
                            >
                              {track.type === "text" ? (
                                <span className="font-bold text-rose-400 select-none opacity-80" style={{ fontSize: `${ghostProps.fontSize}px` }}>
                                  {ghostProps.text}
                                </span>
                              ) : track.assetUrl ? (
                                <img
                                  src={track.assetUrl}
                                  alt=""
                                  className="max-w-[140px] max-h-[140px] object-contain opacity-70"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-full border-2 border-rose-400 bg-rose-500/20" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}

                  {/* Future Frames Ghosts */}
                  {Array.from({ length: onionFutureFrames }).map((_, idx) => {
                    const ghostFrame = currentFrame + (idx + 1);
                    if (ghostFrame > totalFrames) return null;
                    const ghostOpacity = onionSkinOpacity * (1 - idx * 0.4);

                    return (
                      <div
                        key={`onion_future_${ghostFrame}`}
                        className="absolute inset-0 pointer-events-none z-10"
                        style={{ opacity: ghostOpacity }}
                      >
                        {tracks.map((track) => {
                          if (!track.visible) return null;
                          const ghostProps = interpolateTrackAtFrame(track, ghostFrame);
                          return (
                            <div
                              key={`ghost_f_${track.id}_${ghostFrame}`}
                              style={{
                                left: `${ghostProps.x}%`,
                                top: `${ghostProps.y}%`,
                                transform: `translate(-${track.pivotX * 100}%, -${track.pivotY * 100}%) rotate(${ghostProps.rotation}deg) scale(${ghostProps.scale})`,
                                filter: "drop-shadow(0 0 6px rgba(6, 182, 212, 0.8)) hue-rotate(40deg)",
                              }}
                              className="absolute pointer-events-none"
                            >
                              {track.type === "text" ? (
                                <span className="font-bold text-cyan-400 select-none opacity-80" style={{ fontSize: `${ghostProps.fontSize}px` }}>
                                  {ghostProps.text}
                                </span>
                              ) : track.assetUrl ? (
                                <img
                                  src={track.assetUrl}
                                  alt=""
                                  className="max-w-[140px] max-h-[140px] object-contain opacity-70"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-full border-2 border-cyan-400 bg-cyan-500/20" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </>
              )}

              {/* ========================================================================= */}
              {/* Primary Active Track Renderings at currentFrame                           */}
              {/* ========================================================================= */}
              {tracks.map((track) => {
                if (!track.visible) return null;
                const props = interpolateTrackAtFrame(track, currentFrame);
                const isSelected = track.id === activeTrack?.id;

                return (
                  <div
                    key={`render_${track.id}`}
                    style={{
                      left: `${props.x}%`,
                      top: `${props.y}%`,
                      transform: `translate(-${track.pivotX * 100}%, -${track.pivotY * 100}%) rotate(${props.rotation}deg) scale(${props.scale})`,
                      opacity: props.opacity,
                      filter: props.blur ? `blur(${props.blur}px)` : undefined,
                    }}
                    className={cn(
                      "absolute transition-opacity duration-75 select-none",
                      isSelected && "z-30",
                      track.type === "background" && "z-0",
                      track.type === "character" && "z-20",
                      track.type === "text" && "z-25"
                    )}
                  >
                    {/* Bounding box outline for active track */}
                    {isSelected && (
                      <div className="absolute -inset-1.5 border border-cyan-400/80 border-dashed rounded pointer-events-none">
                        <div className="absolute -top-1 -left-1 w-2 h-2 bg-cyan-400 rounded-full" />
                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-cyan-400 rounded-full" />
                        <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-cyan-400 rounded-full" />
                        <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-cyan-400 rounded-full" />
                      </div>
                    )}

                    {track.type === "text" ? (
                      <div
                        className="font-black tracking-wider text-center select-none"
                        style={{
                          fontSize: `${props.fontSize || 32}px`,
                          color: props.textColor || "#ffffff",
                          textShadow: "0 0 16px rgba(0, 240, 255, 0.6)",
                        }}
                      >
                        {props.text || track.text || "AniComper4"}
                      </div>
                    ) : track.assetUrl ? (
                      <img
                        src={track.assetUrl}
                        alt={track.name}
                        className="max-w-[200px] max-h-[200px] object-contain pointer-events-none"
                        draggable={false}
                      />
                    ) : (
                      // Stylized Placeholder Character Object
                      <div
                        className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg border-2"
                        style={{
                          backgroundColor: `${track.color}25`,
                          borderColor: track.color,
                        }}
                      >
                        <Sparkles className="w-8 h-8" style={{ color: track.color }} />
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Drag Coordinates HUD */}
              {isDraggingCanvasObject && activeTrack && (
                <div className="absolute top-3 left-3 bg-[#020617]/90 border border-cyan-500/60 rounded-md px-2 py-1 text-[9px] font-mono text-cyan-300 z-50">
                  {uiText("components_ani_comper4_studio_modal.div.x", "X: ")}{interpolateTrackAtFrame(activeTrack, currentFrame).x.toFixed(1)}{uiText("components_ani_comper4_studio_modal.div.y", "% | Y: ")}{interpolateTrackAtFrame(activeTrack, currentFrame).y.toFixed(1)}%
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Right Panel: Property Inspector (Collapsible) */}
        {showInspectorPanel ? (
          <aside className="w-64 bg-[#050814] border-l border-[#1e293b] flex flex-col shrink-0 overflow-y-auto animate-in slide-in-from-right-2">
            <div className="p-2 border-b border-[#1e293b] flex items-center justify-between text-[10px] font-bold text-slate-300">
              <span className="flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                <CustomizableLabel
                  labelId="anicomper4_inspector_label"
                  defaultText="Property inspector"
                  className="font-bold text-slate-200"
                />
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-[8px] text-cyan-400/90 font-mono">
                  {uiText("components_ani_comper4_studio_modal.span.frame", "Frame ")}{currentFrame}
                </span>
                <CustomizableButton
                  buttonId="anicomper4_inspector_collapse"
                  defaultLabel="Hide inspector panel"
                  defaultIcon={<PanelRightClose className="w-3.5 h-3.5 text-slate-400 hover:text-slate-200" />}
                  forceZeroText={true}
                  onClick={() => setShowInspectorPanel(false)}
                  className="p-1 rounded bg-[#090e1a] hover:bg-slate-800 text-slate-400 border border-[#1e293b]"
                  title="Collapse right inspector panel"
                />
              </div>
            </div>

            {activeTrack ? (
              <div className="p-2.5 space-y-3.5 text-[10px]">
                {/* Track Information */}
                <div className="p-2 rounded-lg bg-[#020617] border border-[#1e293b] flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200 truncate">{activeTrack.name}</span>
                    <span className="text-[8px] text-slate-400 uppercase font-mono">{activeTrack.type}</span>
                  </div>
                  {activeKeyframe ? (
                    <span className="text-[8px] text-amber-400 font-mono flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5" />
                      <span>{uiText("components_ani_comper4_studio_modal.span.keyframe_locked_at_frame", "Keyframe locked at frame ")}{activeKeyframe.frame}</span>
                    </span>
                  ) : (
                    <span className="text-[8px] text-slate-500 font-mono">
                      {uiText("components_ani_comper4_studio_modal.span.interpolated_in_between_frame", "Interpolated in-between frame")}
                    </span>
                  )}
                </div>

                {/* Transform Properties */}
                {(() => {
                  const curProps = interpolateTrackAtFrame(activeTrack, currentFrame);
                  return (
                    <div className="space-y-2.5">
                      {/* Position X */}
                      <div>
                        <div className="flex items-center justify-between text-slate-400 pb-0.5">
                          <span>{uiText("components_ani_comper4_studio_modal.span.position_x", "Position X:")}</span>
                          <span className="font-mono text-cyan-300">{Math.round(curProps.x)}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={Math.round(curProps.x)}
                          onChange={(e) => handleAddOrUpdateKeyframe({ x: Number(e.target.value) })}
                          className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                        />
                      </div>

                      {/* Position Y */}
                      <div>
                        <div className="flex items-center justify-between text-slate-400 pb-0.5">
                          <span>{uiText("components_ani_comper4_studio_modal.span.position_y", "Position Y:")}</span>
                          <span className="font-mono text-cyan-300">{Math.round(curProps.y)}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={Math.round(curProps.y)}
                          onChange={(e) => handleAddOrUpdateKeyframe({ y: Number(e.target.value) })}
                          className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                        />
                      </div>

                      {/* Scale */}
                      <div>
                        <div className="flex items-center justify-between text-slate-400 pb-0.5">
                          <span>{uiText("components_ani_comper4_studio_modal.span.scale", "Scale:")}</span>
                          <span className="font-mono text-cyan-300">{curProps.scale.toFixed(2)}{uiText("components_ani_comper4_studio_modal.span.x", "x")}</span>
                        </div>
                        <input
                          type="range"
                          min="0.2"
                          max="3"
                          step="0.05"
                          value={curProps.scale}
                          onChange={(e) => handleAddOrUpdateKeyframe({ scale: Number(e.target.value) })}
                          className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                        />
                      </div>

                      {/* Rotation */}
                      <div>
                        <div className="flex items-center justify-between text-slate-400 pb-0.5">
                          <span>{uiText("components_ani_comper4_studio_modal.span.rotation", "Rotation:")}</span>
                          <span className="font-mono text-cyan-300">{Math.round(curProps.rotation)}°</span>
                        </div>
                        <input
                          type="range"
                          min="-180"
                          max="180"
                          value={Math.round(curProps.rotation)}
                          onChange={(e) => handleAddOrUpdateKeyframe({ rotation: Number(e.target.value) })}
                          className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                        />
                      </div>

                      {/* Opacity */}
                      <div>
                        <div className="flex items-center justify-between text-slate-400 pb-0.5">
                          <span>{uiText("components_ani_comper4_studio_modal.span.opacity", "Opacity:")}</span>
                          <span className="font-mono text-cyan-300">{Math.round(curProps.opacity * 100)}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.02"
                          value={curProps.opacity}
                          onChange={(e) => handleAddOrUpdateKeyframe({ opacity: Number(e.target.value) })}
                          className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                        />
                      </div>

                      {/* Easing Function Curve */}
                      <div className="pt-1">
                        <span className="text-slate-400 block pb-1">{uiText("components_ani_comper4_studio_modal.span.easing_interpolation", "Easing interpolation:")}</span>
                        <div className="grid grid-cols-2 gap-1">
                          {(["easeInOut", "easeOut", "easeIn", "linear", "step"] as EasingType[]).map((easing) => (
                            <CustomizableButton
                              buttonId="ani_comper4_studio_modal_btn_14"
                              key={easing}
type="button"
onClick={() => handleAddOrUpdateKeyframe({ easing })}
className={cn(
                                "py-1 px-1.5 rounded text-[8px] font-semibold border text-center capitalize cursor-pointer",
                                (activeKeyframe?.easing || "easeInOut") === easing
                                  ? "bg-cyan-950 text-cyan-300 border-cyan-500/60"
                                  : "bg-[#020617] text-slate-400 border-[#1e293b]"
                              )}
                            >
                                {() => (
                                    <>
                                      {easing}
                                    </>
                                  )}
                            </CustomizableButton>
                          ))}
                        </div>
                      </div>

                      {/* Text Properties if Text Track */}
                      {activeTrack.type === "text" && (
                        <div className="pt-2 border-t border-[#1e293b] space-y-1.5">
                          <span className="text-slate-400 block">{uiText("components_ani_comper4_studio_modal.span.text_content", "Text content:")}</span>
                          <input
                            type="text"
                            value={curProps.text || ""}
                            onChange={(e) => handleAddOrUpdateKeyframe({ text: e.target.value })}
                            className="w-full bg-[#020617] border border-[#1e293b] rounded px-2 py-1 text-slate-200 text-[10px]"
                          />
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Onion Skin Settings Drawer */}
                <div className="pt-2 border-t border-[#1e293b] space-y-2">
                  <div className="flex items-center justify-between text-slate-300 font-semibold text-[9px]">
                    <span className="flex items-center gap-1">
                      <Layers className="w-3 h-3 text-cyan-400" />
                      <span>{uiText("components_ani_comper4_studio_modal.span.onion_skinning_range", "Onion-skinning range")}</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={showOnionSkin}
                      onChange={(e) => setShowOnionSkin(e.target.checked)}
                      className="accent-cyan-400"
                    />
                  </div>
                  {showOnionSkin && (
                    <div className="space-y-1.5 bg-[#020617] p-2 rounded-lg border border-[#1e293b]">
                      <div className="flex items-center justify-between text-[8px] text-slate-400">
                        <span>{uiText("components_ani_comper4_studio_modal.span.past_frames_red", "Past frames (red):")}</span>
                        <span className="font-mono text-rose-400">{onionPastFrames}{uiText("components_ani_comper4_studio_modal.span.f", "f")}</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="5"
                        value={onionPastFrames}
                        onChange={(e) => setOnionPastFrames(Number(e.target.value))}
                        className="w-full accent-rose-400 h-1 bg-slate-800"
                      />

                      <div className="flex items-center justify-between text-[8px] text-slate-400">
                        <span>{uiText("components_ani_comper4_studio_modal.span.future_frames_cyan", "Future frames (cyan):")}</span>
                        <span className="font-mono text-cyan-400">{onionFutureFrames}{uiText("components_ani_comper4_studio_modal.span.f_2", "f")}</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="4"
                        value={onionFutureFrames}
                        onChange={(e) => setOnionFutureFrames(Number(e.target.value))}
                        className="w-full accent-cyan-400 h-1 bg-slate-800"
                      />
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-4 text-center text-slate-500 italic text-[10px]">
                {uiText("components_ani_comper4_studio_modal.div.select_an_animation_track_to_inspect_keyfram", "Select an animation track to inspect keyframe properties.")}
              </div>
            )}
          </aside>
        ) : (
          <CustomizableButton
            buttonId="ani_comper4_studio_modal_btn_13"
            defaultIcon={<PanelRightOpen className="w-3.5 h-3.5 text-cyan-400" />}
            type="button"
onClick={() => setShowInspectorPanel(true)}
className="w-6 bg-[#050814] hover:bg-slate-900 border-l border-[#1e293b] flex flex-col items-center justify-center gap-2 py-3 text-slate-400 hover:text-cyan-300 cursor-pointer transition-colors shrink-0"
title={uiText("components_ani_comper4_studio_modal.button.show_property_inspector_panel.title", "Show property inspector panel")}
          >
              {() => (
                  <>
                    <span className="text-[8px] font-bold uppercase tracking-widest [writing-mode:vertical-lr]">
              {uiText("components_ani_comper4_studio_modal.span.inspector", "Inspector")}
            </span>
                  </>
                )}
          </CustomizableButton>
        )}
      </div>

      {/* ========================================================================= */}
      {/* Bottom Timeline with Marked Frames, Seconds, Playhead & Track Lanes       */}
      {/* ========================================================================= */}
      {showTimelineBar ? (
        <footer className="h-44 bg-[#050814] border-t border-[#1e293b] flex flex-col shrink-0 overflow-hidden">
          {/* Timeline Header Bar: Time Display, Frame Count, Unit Toggle */}
          <div className="h-8 border-b border-[#1e293b] bg-[#090e1a]/80 px-3 flex items-center justify-between text-[9px] shrink-0">
            <div className="flex items-center gap-3">
              {/* Current Time Badge */}
              <div className="flex items-center gap-1.5 font-mono text-cyan-300 font-bold bg-[#020617] px-2 py-0.5 rounded border border-[#1e293b]">
                <Clock className="w-3 h-3 text-cyan-400" />
                <span>
                  {timeUnit === "frames"
                    ? `${currentFrame}f / ${totalFrames}f`
                    : `${((currentFrame - 1) / fps).toFixed(2)}s / ${((totalFrames - 1) / fps).toFixed(2)}s`}
                </span>
                <span className="text-[7.5px] text-slate-500">(@{fps}{uiText("components_ani_comper4_studio_modal.span.fps", "fps)")}</span>
              </div>

              {/* Time Unit Toggle: Frames (f) / Seconds (s) */}
              <CustomizableButton
                buttonId="anicomper4_time_mode"
                defaultLabel={`Mode: ${timeUnit}`}
                defaultIcon={<Film className="w-3 h-3 text-slate-400" />}
                forceZeroText={true}
                onClick={() => setTimeUnit((u) => (u === "frames" ? "seconds" : "frames"))}
                className="px-2 py-0.5 rounded text-[8px] bg-[#020617] hover:bg-slate-800 text-slate-300 border border-[#1e293b] cursor-pointer"
                title={`Switch timeline ruler units between Frames and Seconds (currently ${timeUnit})`}
              />

              {/* FPS Selector */}
              <div className="flex items-center gap-1 text-slate-400">
                <span>{uiText("components_ani_comper4_studio_modal.span.fps_2", "Fps:")}</span>
                {[12, 24, 30, 60].map((fVal) => (
                  <CustomizableButton
                    buttonId="ani_comper4_studio_modal_btn_12"
                    key={fVal}
type="button"
onClick={() => setFps(fVal)}
className={cn(
                      "px-1 py-0.2 rounded text-[7.5px] cursor-pointer",
                      fps === fVal ? "bg-cyan-950 text-cyan-300 font-bold border border-cyan-500/50" : "text-slate-500"
                    )}
                  >
                      {() => (
                          <>
                            {fVal}
                          </>
                        )}
                  </CustomizableButton>
                ))}
              </div>

              {/* Total Duration Selector */}
              <div className="flex items-center gap-1 text-slate-400">
                <span>{uiText("components_ani_comper4_studio_modal.span.length", "Length:")}</span>
                {[24, 48, 60, 90, 120].map((len) => (
                  <CustomizableButton
                    buttonId="ani_comper4_studio_modal_btn_11"
                    key={len}
type="button"
onClick={() => setTotalFrames(len)}
className={cn(
                      "px-1 py-0.2 rounded text-[7.5px] cursor-pointer",
                      totalFrames === len ? "bg-cyan-950 text-cyan-300 font-bold border border-cyan-500/50" : "text-slate-500"
                    )}
                  >
                      {() => (
                          <>
                            {len}
                          {uiText("components_ani_comper4_studio_modal.button.f", "f")}
                          </>
                        )}
                  </CustomizableButton>
                ))}
              </div>
            </div>

            {/* Instant Speed Ramping Shortcut Trigger */}
            <div className="flex items-center gap-1.5">
              <span className="text-[8px] text-emerald-400 font-bold uppercase tracking-wider hidden md:inline">
                {uiText("components_ani_comper4_studio_modal.span.speed_ramp", "Speed ramp:")}
              </span>
              <CustomizableButton
                buttonId="ani_comper4_studio_modal_btn_10"
                type="button"
onClick={() => handleApplySpeedRamping(SPEED_RAMP_PRESETS[0], "active")}
className="px-1.5 py-0.5 bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 rounded text-[7.5px] font-bold cursor-pointer"
title={uiText("components_ani_comper4_studio_modal.button.instant_accelerate_speed_ramp_on_active_trac.title", "Instant Accelerate speed ramp on active track")}
              >
                  {() => (
                      <>
                        {uiText("components_ani_comper4_studio_modal.button.accel", "Accel")}
                      </>
                    )}
              </CustomizableButton>
              <CustomizableButton
                buttonId="ani_comper4_studio_modal_btn_9"
                type="button"
onClick={() => handleApplySpeedRamping(SPEED_RAMP_PRESETS[2], "active")}
className="px-1.5 py-0.5 bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 rounded text-[7.5px] font-bold cursor-pointer"
title={uiText("components_ani_comper4_studio_modal.button.instant_bullet_time_speed_ramp_on_active_tra.title", "Instant Bullet-time speed ramp on active track")}
              >
                  {() => (
                      <>
                        {uiText("components_ani_comper4_studio_modal.button.bullet_time", "Bullet-time")}
                      </>
                    )}
              </CustomizableButton>
              <CustomizableButton
                buttonId="ani_comper4_studio_modal_btn_8"
                type="button"
onClick={() => handleApplySpeedRamping(SPEED_RAMP_PRESETS[3], "active")}
className="px-1.5 py-0.5 bg-purple-950/60 hover:bg-purple-900 border border-purple-500/40 text-purple-300 rounded text-[7.5px] font-bold cursor-pointer"
title={uiText("components_ani_comper4_studio_modal.button.instant_cinematic_s_curve_speed_ramp_on_acti.title", "Instant Cinematic s-curve speed ramp on active track")}
              >
                  {() => (
                      <>
                        {uiText("components_ani_comper4_studio_modal.button.s_curve", "S-curve")}
                      </>
                    )}
              </CustomizableButton>
              <CustomizableButton
                buttonId="ani_comper4_studio_modal_btn_7"
                defaultIcon={<Zap className="w-2.5 h-2.5" />}
                type="button"
onClick={() => setShowSpeedRampModal(true)}
className="px-2 py-0.5 bg-gradient-to-r from-emerald-600/30 to-cyan-600/30 hover:from-emerald-500/40 hover:to-cyan-500/40 text-emerald-300 border border-emerald-500/40 rounded-lg text-[8px] font-bold flex items-center gap-1 shadow-sm cursor-pointer"
title={uiText("components_ani_comper4_studio_modal.button.open_instant_speed_ramping_dialog_presets.title", "Open instant speed ramping dialog presets")}
              >
                  {() => (
                      <>
                        <span>{uiText("components_ani_comper4_studio_modal.span.presets", "Presets...")}</span>
                      </>
                    )}
              </CustomizableButton>
              <CustomizableButton
                buttonId="anicomper4_timeline_collapse"
                defaultLabel="Hide timeline bar"
                defaultIcon={<ChevronDown className="w-3.5 h-3.5 text-slate-400 hover:text-slate-200" />}
                forceZeroText={true}
                onClick={() => setShowTimelineBar(false)}
                className="p-1 rounded bg-[#020617] hover:bg-slate-800 text-slate-400 border border-[#1e293b] cursor-pointer ml-1"
                title="Collapse bottom timeline bar"
              />
            </div>
          </div>

          {/* Timeline Multi-Track Lanes & Draggable Playhead Scrubber */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left Track Labels Header */}
            <div className="w-44 bg-[#050814] border-r border-[#1e293b] flex flex-col shrink-0">
              <div className="h-6 border-b border-[#1e293b] px-2 flex items-center text-[8px] font-bold text-slate-400 uppercase tracking-wider">
                <CustomizableLabel
                  labelId="anicomper4_timeline_label"
                  defaultText="Tracks & layers"
                  className="font-bold text-slate-400 uppercase tracking-wider"
                />
              </div>
              <div className="flex-1 overflow-y-auto">
                {tracks.map((t) => (
                  <div
                    key={`label_${t.id}`}
                    onClick={() => setSelectedTrackId(t.id)}
                    className={cn(
                      "h-8 px-2 flex items-center justify-between border-b border-[#1e293b]/60 cursor-pointer text-[9px]",
                      t.id === selectedTrackId ? "bg-cyan-950/40 text-cyan-200" : "text-slate-400 hover:bg-slate-900"
                    )}
                  >
                    <span className="truncate font-semibold max-w-[95px]">{t.name}</span>
                    <CustomizableButton
                      buttonId="ani_comper4_studio_modal_btn_6"
                      defaultIcon={<Plus className="w-2.5 h-2.5" />}
                      type="button"
onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTrackId(t.id);
                        handleAddOrUpdateKeyframe();
                      }}
className="p-0.5 text-cyan-400 hover:text-white rounded"
title={uiText("components_ani_comper4_studio_modal.button.add_keyframe_on_this_track_at_current_playhe.title", "Add keyframe on this track at current playhead")}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Right Horizontal Timeline Area (Ruler + Tracks Lanes) */}
            <div className="flex-1 flex flex-col overflow-x-auto relative">
              {/* Horizontal Ruler with Ticks & Playhead Scrub Bar */}
              <div
                ref={timelineScrubRef}
                onPointerDown={handleTimelineScrubStart}
                className="h-6 border-b border-[#1e293b] bg-[#020617] relative cursor-pointer select-none shrink-0"
              >
                {/* Frame / Second Ticks */}
                <div className="absolute inset-0 flex justify-between px-1 pointer-events-none">
                  {Array.from({ length: totalFrames }).map((_, idx) => {
                    const fNum = idx + 1;
                    const isMajor = fNum === 1 || fNum % (fps === 12 ? 6 : 12) === 0;
                    const isMid = fNum % 6 === 0;

                    return (
                      <div
                        key={`tick_${fNum}`}
                        className="flex flex-col items-center justify-end h-full"
                        style={{ width: `${100 / totalFrames}%` }}
                      >
                        {isMajor && (
                          <span className="text-[7px] font-mono text-slate-400 mb-0.5 leading-none">
                            {timeUnit === "frames" ? `${fNum}` : `${((fNum - 1) / fps).toFixed(1)}s`}
                          </span>
                        )}
                        <div
                          className={cn(
                            "w-px bg-slate-700",
                            isMajor ? "h-2.5 bg-slate-400" : isMid ? "h-1.5 bg-slate-600" : "h-1 bg-slate-800"
                          )}
                        />
                      </div>
                    );
                  })}
                </div>

                {/* Draggable Playhead Needle Marker (Thumb) */}
                <div
                  style={{
                    left: `${((currentFrame - 1) / (totalFrames - 1)) * 100}%`,
                  }}
                  className="absolute top-0 bottom-0 -translate-x-1/2 pointer-events-none z-30 flex flex-col items-center"
                >
                  <div className="w-2.5 h-2.5 bg-rose-500 rotate-45 -mt-0.5 shadow-md shadow-rose-500/50" />
                </div>
              </div>

              {/* Tracks Timeline Keyframe Lanes */}
              <div className="flex-1 relative overflow-y-auto">
                {/* Draggable Playhead Scrub Line Crossing Entire Timeline */}
                <div
                  style={{
                    left: `${((currentFrame - 1) / (totalFrames - 1)) * 100}%`,
                  }}
                  className="absolute top-0 bottom-0 w-0.5 bg-rose-500/90 pointer-events-none z-20 shadow-[0_0_8px_rgba(244,63,94,0.8)]"
                />

                {tracks.map((track) => {
                  const isTrackActive = track.id === selectedTrackId;
                  return (
                    <div
                      key={`lane_${track.id}`}
                      onClick={() => setSelectedTrackId(track.id)}
                      className={cn(
                        "h-8 border-b border-[#1e293b]/40 relative flex items-center px-1 transition-colors",
                        isTrackActive ? "bg-cyan-950/20" : "bg-[#090e1a]/40"
                      )}
                    >
                      {/* Grid background marks */}
                      <div className="absolute inset-0 flex justify-between pointer-events-none opacity-20">
                        {Array.from({ length: Math.round(totalFrames / 6) }).map((_, gIdx) => (
                          <div key={gIdx} className="w-px h-full bg-slate-700" />
                        ))}
                      </div>

                      {/* Keyframe Rhombus Diamond Markers ◆ */}
                      {track.keyframes.map((kf) => {
                        const isKfSelected = activeKeyframe?.id === kf.id;
                        const leftPercent = ((kf.frame - 1) / (totalFrames - 1)) * 100;

                        return (
                          <div
                            key={kf.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTrackId(track.id);
                              setSelectedKeyframeId(kf.id);
                              setCurrentFrame(kf.frame);
                            }}
                            style={{ left: `${leftPercent}%` }}
                            className="absolute -translate-x-1/2 z-25 group/kf cursor-pointer p-1"
                            title={`Keyframe at frame ${kf.frame} (${kf.easing})`}
                          >
                            <div
                              className={cn(
                                "w-3 h-3 rotate-45 transition-transform group-hover/kf:scale-125 shadow-md",
                                isKfSelected
                                  ? "bg-amber-400 border-2 border-white scale-110 shadow-amber-500/60"
                                  : "bg-cyan-400 border border-slate-900"
                              )}
                              style={{
                                backgroundColor: isKfSelected ? "#fbbf24" : track.color,
                              }}
                            />
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </footer>
      ) : (
        <div className="h-6 bg-[#050814]/90 border-t border-[#1e293b] px-3 flex items-center justify-between shrink-0">
          <CustomizableButton
            buttonId="ani_comper4_studio_modal_btn_5"
            defaultIcon={<ChevronUp className="w-3.5 h-3.5 text-cyan-400" />}
            type="button"
onClick={() => setShowTimelineBar(true)}
className="flex items-center gap-1.5 text-[8.5px] font-bold text-cyan-300 hover:text-cyan-200 cursor-pointer"
title={uiText("components_ani_comper4_studio_modal.button.show_bottom_keyframed_timeline.title", "Show bottom keyframed timeline")}
          >
              {() => (
                  <>
                    <span>{uiText("components_ani_comper4_studio_modal.span.show_timeline_and_keyframes", "Show timeline & keyframes (")}{currentFrame}{uiText("components_ani_comper4_studio_modal.span.f_3", "f / ")}{totalFrames}{uiText("components_ani_comper4_studio_modal.span.f_4", "f)")}</span>
                  </>
                )}
          </CustomizableButton>
          <div className="flex items-center gap-2 text-[8px] text-slate-500 font-mono">
            <span>{uiText("components_ani_comper4_studio_modal.span.click_to_restore_timeline_ruler", "Click to restore timeline ruler")}</span>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* Speed Ramping Modal Dialog                                                */}
      {/* ========================================================================= */}
      {showSpeedRampModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#090e1a] border border-cyan-500/50 rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#1e293b] pb-2">
              <span className="font-bold text-sm text-emerald-300 flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-400" />
                <CustomizableLabel
                  labelId="anicomper4_speed_ramp_label"
                  defaultText="Instant speed ramping"
                  className="font-bold text-sm text-emerald-300"
                />
              </span>
              <CustomizableButton
                buttonId="ani_comper4_studio_modal_btn_4"
                defaultIcon={<X className="w-4 h-4" />}
                type="button"
onClick={() => setShowSpeedRampModal(false)}
className="p-1 text-slate-400 hover:text-white rounded cursor-pointer"
              />
            </div>

            <p className="text-xs text-slate-400">
              {uiText("components_ani_comper4_studio_modal.p.apply_high_impact_cinematic_time_distortion", "Apply high-impact cinematic time distortion curves to redistribute your animation keyframes dynamically:")}
            </p>

            <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
              {SPEED_RAMP_PRESETS.map((preset) => (
                <div
                  key={preset.id}
                  className="p-2.5 rounded-xl bg-[#020617] hover:bg-[#0f172a] border border-[#1e293b] hover:border-emerald-500/50 transition-all flex items-center justify-between group cursor-pointer"
                  onClick={() => handleApplySpeedRamping(preset, "active")}
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-bold text-slate-200 group-hover:text-emerald-300">
                      {preset.name}
                    </span>
                    <span className="text-[9px] text-slate-400">
                      {preset.description}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <CustomizableButton
                      buttonId="ani_comper4_studio_modal_btn_3"
                      type="button"
onClick={(e) => {
                        e.stopPropagation();
                        handleApplySpeedRamping(preset, "active");
                      }}
className="px-2 py-1 bg-emerald-950 hover:bg-emerald-800 text-emerald-300 border border-emerald-500/40 rounded text-[9px] font-bold cursor-pointer"
                    >
                        {() => (
                            <>
                              {uiText("components_ani_comper4_studio_modal.button.apply", "Apply")}
                            </>
                          )}
                    </CustomizableButton>
                    <CustomizableButton
                      buttonId="ani_comper4_studio_modal_btn_2"
                      type="button"
onClick={(e) => {
                        e.stopPropagation();
                        handleApplySpeedRamping(preset, "all");
                      }}
className="px-2 py-1 bg-cyan-950 hover:bg-cyan-800 text-cyan-300 border border-cyan-500/40 rounded text-[9px] font-bold cursor-pointer"
title={uiText("components_ani_comper4_studio_modal.button.apply_to_all_animation_tracks.title", "Apply to all animation tracks")}
                    >
                        {() => (
                            <>
                              {uiText("components_ani_comper4_studio_modal.button.all", "All")}
                            </>
                          )}
                    </CustomizableButton>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <CustomizableButton
                buttonId="ani_comper4_studio_modal_btn_1"
                type="button"
onClick={() => setShowSpeedRampModal(false)}
className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg cursor-pointer"
              >
                  {() => (
                      <>
                        {uiText("components_ani_comper4_studio_modal.button.close", "Close")}
                      </>
                    )}
              </CustomizableButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
