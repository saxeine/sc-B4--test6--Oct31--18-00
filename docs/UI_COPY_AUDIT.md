# UI Copy & Layout Audit

_Generated 2026-10-27T10:32:51.316Z by `scripts/auditUiStrings.cjs`._

| Metric | Value |
| --- | ---: |
| Files scanned | 144 |
| User-facing literals found | 864 |
| Studio-bound (registry driven) | 847 |
| Hardcoded / unbound | 17 |
| localStorage / sessionStorage accesses | 0 across 0 files |
| Imperative messages (toasts / alerts / status) | 327 (21 bound via `uiMessage`) |

## Unbound copy per file (migration backlog)

| File | Module | Unbound | Bound | Browser storage |
| --- | --- | ---: | ---: | ---: |
| `src/components/SequencerPanel.tsx` | `sequencer_panel` | 16 | 4 | 0 |
| `src/App.tsx` | `app` | 1 | 115 | 0 |
| `src/components/AdvModal.tsx` | `adv_modal` | 0 | 6 | 0 |
| `src/components/AdvertPanelFullScreenModal.tsx` | `advert_panel_full_screen_modal` | 0 | 49 | 0 |
| `src/components/AniComper4StudioModal.tsx` | `ani_comper4_studio_modal` | 0 | 53 | 0 |
| `src/components/AppLogModal.tsx` | `app_log_modal` | 0 | 28 | 0 |
| `src/components/ButtonCustomizationModal.tsx` | `button_customization_modal` | 0 | 62 | 0 |
| `src/components/ControlDeckModal.tsx` | `control_deck_modal` | 0 | 63 | 0 |
| `src/components/CreativeStudioMenu.tsx` | `creative_studio_menu` | 0 | 7 | 0 |
| `src/components/CropSidebar.tsx` | `crop_sidebar` | 0 | 58 | 0 |
| `src/components/CustomSpreadModal.tsx` | `custom_spread_modal` | 0 | 44 | 0 |
| `src/components/ExpandViewModal.tsx` | `expand_view_modal` | 0 | 25 | 0 |
| `src/components/FourByFourModal.tsx` | `four_by_four_modal` | 0 | 3 | 0 |
| `src/components/FramePlayerModal.tsx` | `frame_player_modal` | 0 | 16 | 0 |
| `src/components/ImageSharpenerModal.tsx` | `image_sharpener_modal` | 0 | 38 | 0 |
| `src/components/KrumsStudioModal.tsx` | `krums_studio_modal` | 0 | 75 | 0 |
| `src/components/Neo1StudioModal.tsx` | `neo1_studio_modal` | 0 | 17 | 0 |
| `src/components/ResampleStudioModal.tsx` | `resample_studio_modal` | 0 | 36 | 0 |
| `src/components/UtilityModal.tsx` | `utility_modal` | 0 | 6 | 0 |
| `src/components/ZoomImageStudioModal.tsx` | `zoom_image_studio_modal` | 0 | 87 | 0 |
| `src/components/neo1-app/components/AddTextModal.tsx` | `add_text_modal` | 0 | 6 | 0 |
| `src/components/neo1-app/components/CanvasArea.tsx` | `canvas_area` | 0 | 7 | 0 |
| `src/components/neo1-app/components/ExportModal.tsx` | `export_modal` | 0 | 6 | 0 |
| `src/components/neo1-app/components/Navbar.tsx` | `navbar` | 0 | 30 | 0 |
| `src/components/neo1-app/components/ShortcutsModal.tsx` | `shortcuts_modal` | 0 | 4 | 0 |
| `src/components/neo1-app/components/Sidebar.tsx` | `sidebar` | 0 | 2 | 0 |

## Browser-storage accesses (must be zero in the UI-config path)

| File | Accesses |
| --- | ---: |

## Imperative messages — Phase 5 backlog

Toasts, alerts and status lines are produced outside the render tree, so the JSX codemod cannot bind them. Wrap them with `uiMessage(key, fallback, vars)` (see `src/hooks/useUIConfig.ts`) to bring them under studio control.

| File | Messages |
| --- | ---: |
| `src/App.tsx` | 129 |
| `src/components/ShapeStudioModal.tsx` | 86 |
| `src/components/ButtonCustomizationModal.tsx` | 16 |
| `src/components/ZoomImageStudioModal.tsx` | 16 |
| `src/components/MesshiStudioModal.tsx` | 11 |
| `src/components/GridMeshStudioModal.tsx` | 10 |
| `src/components/neo1-app/Neo1App.tsx` | 10 |
| `src/components/AutoSliceModal.tsx` | 7 |
| `src/components/FullScreenCropControlPanel.tsx` | 7 |
| `src/context/ButtonCustomizationContext.tsx` | 5 |
| `src/components/ExportJsonModal.tsx` | 4 |
| `src/components/CropSidebar.tsx` | 3 |
| `src/components/AppLogModal.tsx` | 2 |
| `src/components/Bubba1StudioModal.tsx` | 2 |
| `src/components/BulkRenameModal.tsx` | 2 |
| `src/components/CloudConfigEditorModal.tsx` | 2 |
| `src/components/FramePlayerModal.tsx` | 2 |
| `src/components/neo1-app/components/panels/BackgroundPanel.tsx` | 2 |
| `src/components/AdvModal.tsx` | 1 |
| `src/components/BulkRenamePanel.tsx` | 1 |
| `src/components/CreativeStudioMenu.tsx` | 1 |
| `src/components/KrumsStudioModal.tsx` | 1 |
| `src/components/MouseOverStudioModal.tsx` | 1 |
| `src/components/TileLinkModal.tsx` | 1 |
| `src/components/UtilityModal.tsx` | 1 |
| `src/components/imgdesc/PageBuilderModal.tsx` | 1 |
| `src/components/neo1-app/components/ExportModal.tsx` | 1 |
| `src/components/system/ComponentCheatSheet.tsx` | 1 |
| `src/utils/useSpeechRecognition.ts` | 1 |
