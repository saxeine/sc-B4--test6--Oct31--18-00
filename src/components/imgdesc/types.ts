export interface Modifier {
  id: string;
  name: string;
  category: string;
  value: string;
  year?: number;
}

export interface SavedPrompt {
  id: string;
  name: string;
  basePrompt: string;
  negativePrompt?: string;
  characterConsistencyRules?: string[];
  speechText?: string;
  captions?: { speaker: string; text: string; panel?: string }[];
  panelAssignments?: Record<string, string[]>;
  finalPrompt: string;
  modifiers: string[];
  frameCount: number;
  largePanelPosition: "first" | "middle" | "last" | "none";
  folderId?: string;
  timestamp: number;
  uid?: string;
}

export interface SavedAsset {
  id: string;
  url: string;
  base64?: string;
  mimeType?: string;
  coordinates?: string;
  name: string;
  prompt: string;
  folderId?: string;
  timestamp: number;
  uid?: string;
}

export interface Character {
  id: string;
  name: string;
  description: string;
  referenceImages?: string[];
  timestamp: number;
  isUsedInScene?: boolean;
  autoNumber?: number;
}

export interface BibleEntry {
  id: string;
  name: string;
  type: "character" | "location";
  description: string;
  timestamp: number;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  bio?: string;
  role?: "user" | "admin";
  createdAt: number;
  updatedAt: number;
}

export interface Folder {
  id: string;
  uid: string;
  name: string;
  type: "prompt" | "asset";
  createdAt: number;
}

export interface GenerationHistory {
  id: string;
  basePrompt: string;
  negativePrompt?: string;
  characterConsistencyRules?: string[];
  speechText: string;
  captions: { speaker: string; text: string; panel?: string }[];
  panelAssignments: Record<string, string[]>;
  finalPrompt: string;
  modifiers: string[];
  frameCount: number;
  largePanelPosition: "first" | "middle" | "last" | "none";
  imageUrl: string;
  timestamp: number;
}

export interface PanelLayoutTemplate {
  id: string;
  name: string;
  frameCount: number;
  largePanelPosition: "first" | "middle" | "last" | "none";
  description: string;
}

export interface TextOverlay {
  id: string;
  type: "speech" | "thought" | "scream" | "whisper" | "action-fx";
  text: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  width: number; // percentage 10-100
  height: number; // percentage 10-100
  rotation?: number;
  scale?: number;
  fontSize?: number;
  color?: string;
  bgColor?: string;
}

export interface GridPanel {
  id: string;
  name: string;
  row: number;
  col: number;
  rowSpan: number;
  colSpan: number;
  aspectRatio: string;
  prompt?: string;
  image?: string;
}

export interface PageLayout {
  id: string;
  name: string;
  rows: number;
  cols: number;
  margin: number;
  borderColor: string;
  bgColor?: string;
  panels: GridPanel[];
}

export interface ParsedScriptPanel {
  panelNumber: number;
  title?: string;
  aspectRatio: string;
  prompt: string;
  dialogue?: string;
  speaker?: string;
}

export interface PanelConfig {
  id: string;
  label: string;
  icon: any;
  color: string;
  buttons: string[];
  colSpan?: number;
}

export const LAYOUT_TEMPLATES: PanelLayoutTemplate[] = [
  {
    id: "classic-quad",
    name: "Classic 4-Panel Grid",
    frameCount: 4,
    largePanelPosition: "none",
    description: "Traditional 2x2 grid with four balanced, equally sized comic panels."
  },
  {
    id: "action-finale",
    name: "Action Climax Finale",
    frameCount: 4,
    largePanelPosition: "last",
    description: "Three rapid setup panels building suspense toward an oversized climax splash panel."
  },
  {
    id: "dramatic-intro",
    name: "Dramatic Wide Intro",
    frameCount: 3,
    largePanelPosition: "first",
    description: "Sweeping widescreen establishing intro followed by dynamic reaction shots."
  },
  {
    id: "centerpiece-reveal",
    name: "Centerpiece Reveal",
    frameCount: 5,
    largePanelPosition: "middle",
    description: "Heroic double-height centerpiece panel surrounded by narrative sequences."
  },
  {
    id: "horizontal-strip",
    name: "Newspaper 3-Strip",
    frameCount: 3,
    largePanelPosition: "none",
    description: "Classic 3-panel horizontal syndicate gag or narrative progression."
  },
  {
    id: "manga-dynamic",
    name: "Manga 6-Frame Flow",
    frameCount: 6,
    largePanelPosition: "last",
    description: "Fast-paced manga narrative structure with a high-impact final panel."
  }
];

export const DEFAULT_CHARACTERS: Character[] = [
  {
    id: "char-1",
    name: "Cyra",
    description: "A cyberpunk renegade hacker with neon cyan undercut hair, mechanical left eye optic, and a reflective chrome trench coat.",
    timestamp: Date.now() - 100000,
  },
  {
    id: "char-2",
    name: "Kaelen",
    description: "An armored detective in a battered leather duster, cybernetic arm with brass gears, and a stoic expression.",
    timestamp: Date.now() - 50000,
  }
];

export const DEFAULT_SAVED_PROMPTS: SavedPrompt[] = [
  {
    id: "prompt-default-1",
    name: "01: Cyberpunk Alley Infiltration",
    basePrompt: "In rain-slicked Neo-Tokyo, a cybernetic operative in a dark hooded coat stalks through holographic neon reflections, illuminated by flickering advertisements.",
    finalPrompt: "Text style: Classic Comic, color: #00f0ff, size: medium, applied to: speech, In rain-slicked Neo-Tokyo, a cybernetic operative in a dark hooded coat stalks through holographic neon reflections, comic strip format, 4 panels, first panels smaller, Panel 4 is the large Finale panel placed last. Never add the name to the panels.",
    modifiers: ["cam-wide", "stg-neon", "sty-cyberpunk"],
    frameCount: 4,
    largePanelPosition: "last",
    timestamp: Date.now() - 86400000,
  },
  {
    id: "prompt-default-2",
    name: "02: Vintage Noir Detective Case",
    basePrompt: "A gritty 1940s private investigator inspects a mysterious glowing artifact in a smoky office while heavy rain pours against venetian blinds.",
    finalPrompt: "Text style: Action Red, color: #f50505, size: medium, applied to: captions, A gritty 1940s private investigator inspects a mysterious glowing artifact in a smoky office, high contrast film noir chiaroscuro, comic strip format, 3 panels, all panels equal size.",
    modifiers: ["cam-dutch", "stg-chiaroscuro", "sty-noir"],
    frameCount: 3,
    largePanelPosition: "none",
    timestamp: Date.now() - 43200000,
  }
];

export const MODIFIERS: Modifier[] = [
  // Scene: Background, SolidColor, Weather
  { id: "bg-city", name: "Cyberpunk Cityscape", category: "Background", value: "sprawling futuristic cyberpunk cityscape with towering mega-skyscrapers and elevated highways" },
  { id: "bg-dungeon", name: "Ancient Stone Ruins", category: "Background", value: "ancient crumbling stone dungeon ruins with ivy and mystical blue glowing moss" },
  { id: "bg-space", name: "Deep Space Nebula", category: "Background", value: "deep cosmic starfield with swirling violet and turquoise celestial nebulae" },
  { id: "bg-nature", name: "Dense Pine Forest", category: "Background", value: "mist-shrouded ancient pine forest with sunbeams filtering through canopies" },
  { id: "bg-desert", name: "Dune Ocean", category: "Background", value: "endless orange sand dunes under two blazing desert suns" },
  { id: "bg-interior", name: "Retro Tech Lab", category: "Background", value: "cluttered retro-futuristic laboratory with CRT monitors and exposed vacuum tubes" },
  { id: "sc-chroma", name: "Chromakey Green", category: "SolidColor", value: "solid vibrant chromakey green screen background #00FF00" },
  { id: "sc-white", name: "Studio Clean White", category: "SolidColor", value: "seamless pure minimalist white photography cyclorama studio background" },
  { id: "sc-black", name: "Vantablack Void", category: "SolidColor", value: "pitch black infinite void background with absolute zero light bleed" },
  { id: "wth-rain", name: "Torrential Downpour", category: "Weather", value: "heavy cinematic rainstorm with water ripples and wet reflective ground" },
  { id: "wth-fog", name: "Thick Ethereal Fog", category: "Weather", value: "dense atmospheric ground fog swirling around subject legs" },
  { id: "wth-snow", name: "Blizzard Snowfall", category: "Weather", value: "swirling winter blizzard with frosty snowflakes caught in the light" },

  // Camera: Camera, Film Stock, Perspective
  { id: "cam-wide", name: "Ultra-Wide Establishing", category: "Camera", value: "ultra-wide 16mm lens panoramic establishing shot with immense environmental scale" },
  { id: "cam-close", name: "Intense Macro Close-Up", category: "Camera", value: "85mm macro lens extreme close-up capturing micro pupil details and sweat" },
  { id: "cam-dutch", name: "Dramatic Dutch Tilt", category: "Camera", value: "steep 25-degree tilted Dutch angle camera creating disorienting psychological tension" },
  { id: "cam-low", name: "Worm's-Eye Low Angle", category: "Camera", value: "ground-level extreme low angle looking up to make subject appear towering and majestic" },
  { id: "cam-high", name: "Bird's-Eye Drone View", category: "Camera", value: "high elevation overhead bird's-eye perspective looking straight down" },
  { id: "cam-tele", name: "Telephoto Compression", category: "Camera", value: "200mm telephoto lens with compressed depth of field and beautiful creamy background bokeh" },
  { id: "flm-portra", name: "Kodak Portra 400", category: "Film Stock", value: "shot on Kodak Portra 400 35mm film stock with warm nostalgic natural skin tones" },
  { id: "flm-cinestill", name: "CineStill 800T", category: "Film Stock", value: "CineStill 800T tungsten film stock with glowing red halation blooms around practical lights" },
  { id: "flm-tri-x", name: "Kodak Tri-X 400 B&W", category: "Film Stock", value: "Kodak Tri-X black and white silver halide 35mm film with rich gritty grain and deep blacks" },
  { id: "flm-polaroid", name: "Vintage Polaroid 600", category: "Film Stock", value: "authentic vintage Polaroid 600 instant film aesthetic with muted soft pastels and frame vignette" },
  { id: "psp-isometric", name: "Orthographic Isometric", category: "Perspective", value: "crisp 30-degree orthographic isometric axonometric perspective" },
  { id: "psp-fisheye", name: "180° Curved Fisheye", category: "Perspective", value: "180-degree spherical fisheye distortion with barrel curvature at the edges" },

  // Stage: Lighting
  { id: "stg-chiaroscuro", name: "Chiaroscuro Drama", category: "Lighting", value: "Caravaggio chiaroscuro high contrast dramatic illumination with profound deep shadows" },
  { id: "stg-neon", name: "Neon Cyber Rim Lights", category: "Lighting", value: "dual-tone neon magenta and cyan sharp edge rim lighting with atmospheric haze" },
  { id: "stg-godrays", name: "Volumetric God Rays", category: "Lighting", value: "dramatic heavenly volumetric crepuscular light beams slicing through airborne dust" },
  { id: "stg-golden", name: "Golden Hour Warmth", category: "Lighting", value: "low-angled warm amber golden hour sunset glow with elongated soft shadows" },
  { id: "stg-studio", name: "3-Point Studio Softbox", category: "Lighting", value: "professional 3-point softbox studio lighting with subtle fill and crisp key light" },
  { id: "stg-biolum", name: "Bioluminescent Glow", category: "Lighting", value: "deep ethereal bioluminescent emerald and cyan fungal light pulsating in darkness" },

  // Style: Styles, Color Palette, Material
  { id: "sty-comic", name: "Modern Graphic Novel", category: "Styles", value: "high-end comic book illustration, dynamic ink crosshatching, vibrant digital flats, Image Comics style" },
  { id: "sty-manga", name: "Shonen Manga Ink", category: "Styles", value: "classic Japanese manga style, bold G-pen speed lines, screentone shading, monochrome ink art" },
  { id: "sty-cyberpunk", name: "Cyberpunk 2077", category: "Styles", value: "hyper-detailed cyberpunk aesthetic, wet tarmac reflections, octane render, hard surface details" },
  { id: "sty-noir", name: "1940s Graphic Noir", category: "Styles", value: "Sin City graphic novel style, stark black and white silhouettes with single splash accent color" },
  { id: "sty-anime", name: "Makoto Shinkai Anime", category: "Styles", value: "Makoto Shinkai anime aesthetic, luminous hyper-detailed painted sky, vibrant emotional atmosphere" },
  { id: "sty-retro80s", name: "1980s Retro Anime Cel", category: "Styles", value: "1980s vintage hand-painted anime animation cel on acetate, VHS tape scanline texture" },
  { id: "pal-synthwave", name: "Synthwave Palette", category: "Color Palette", value: "synthwave color palette: deep purples, electric blues, hot pinks, and sunset orange gradients" },
  { id: "pal-monochrome", name: "Monochrome & Red", category: "Color Palette", value: "stark high-contrast grayscale palette punctuated by striking crimson red focal elements" },
  { id: "pal-pastel", name: "Soft Pastel Dream", category: "Color Palette", value: "gentle pastel watercolor palette: soft lavender, mint green, powder blue, and peach" },
  { id: "mat-chrome", name: "Mirror Liquid Chrome", category: "Material", value: "polished liquid chrome reflective metallic armor with sharp environment reflections" },
  { id: "mat-clay", name: "Handcrafted Claymation", category: "Material", value: "stop-motion claymation plasticine texture with subtle fingerprint impressions and matte finish" },

  // Vibe: Mood, Detail Level, Genre
  { id: "vib-epic", name: "Grand Cinematic Epic", category: "Mood", value: "monumental cinematic grandeur, emotional tension, breathtaking epic scale" },
  { id: "vib-eerie", name: "Ominous Psychological", category: "Mood", value: "subtle psychological dread, unsettling stillness, chilling surreal atmosphere" },
  { id: "vib-action", name: "High-Octane Kinetic", category: "Mood", value: "frenetic explosive energy, motion blur on fast limbs, flying debris, dynamic impact" },
  { id: "det-8k", name: "Micro-Textured 8K", category: "Detail Level", value: "hyper-refined micro textures, pores, fabric weave, dust particles, 8k crisp definition" },
  { id: "gen-scifi", name: "Hard Science Fiction", category: "Genre", value: "grounded hard science fiction aesthetic, realistic functional astronautics and telemetry" },
  { id: "gen-fantasy", name: "Dark High Fantasy", category: "Genre", value: "grim dark fantasy world with weathered chainmail, rusted iron swords, and ancient runes" },
  { id: "gen-cyberpunk", name: "Cyberpunk Tech", category: "Genre", value: "cyberpunk dystopia with holographic signage, chrome prosthetics, and neural jacks" },
  { id: "gen-horror", name: "Cosmic Eldritch Horror", category: "Genre", value: "Lovecraftian cosmic horror with sanity-bending non-Euclidean geometry and ominous shadows" },

  // Directors (DirCut)
  { id: "dir-villeneuve", name: "Denis Villeneuve", category: "DirCut", value: "directed by Denis Villeneuve, brutalist monolithic architecture, grand scale, muted desert palettes", year: 1967 },
  { id: "dir-nolan", name: "Christopher Nolan", category: "DirCut", value: "directed by Christopher Nolan, practical IMAX cinematography, crisp cool tones, complex in-camera realism", year: 1970 },
  { id: "dir-fincher", name: "David Fincher", category: "DirCut", value: "directed by David Fincher, precision camera tracking, low-key desaturated green/yellow tint, sterile perfection", year: 1962 },
  { id: "dir-anderson", name: "Wes Anderson", category: "DirCut", value: "directed by Wes Anderson, strict central symmetrical framing, bespoke pastel color palette, miniature diorama quality", year: 1969 },
  { id: "dir-scott", name: "Ridley Scott", category: "DirCut", value: "directed by Ridley Scott (Blade Runner era), practical atmospheric smoke, anamorphic lens flares, industrial grit", year: 1937 },
  { id: "dir-tarantino", name: "Quentin Tarantino", category: "DirCut", value: "directed by Quentin Tarantino, bold saturated 70s technicolor palette, dramatic crash zooms, intense confrontation angles", year: 1963 },
  { id: "dir-bong", name: "Bong Joon-ho", category: "DirCut", value: "directed by Bong Joon-ho, masterfully staged multi-plane compositions, razor-sharp thematic tonal shifts", year: 1969 },
  { id: "dir-park", name: "Park Chan-wook", category: "DirCut", value: "directed by Park Chan-wook, baroque visual flair, intricate wallpaper patterns, symmetrical violence and elegance", year: 1963 },
  { id: "dir-kubrick", name: "Stanley Kubrick", category: "DirCut", value: "directed by Stanley Kubrick, iconic one-point perspective vanishing point, cold hypnotic wide angles, meticulous geometry", year: 1928 },
  { id: "dir-del-toro", name: "Guillermo del Toro", category: "DirCut", value: "directed by Guillermo del Toro, dark fairy-tale gothic mechanism, rich amber and cyan fairy tale contrast, intricate creature craftsmanship", year: 1964 },

  // Artists
  { id: "art-moebius", name: "Jean Giraud (Moebius)", category: "Artist", value: "illustrated by Moebius (Jean Giraud), delicate clean linework, surreal sci-fi vistas, pastel flat colors, bande dessinée", year: 1938 },
  { id: "art-otomo", name: "Katsuhiro Otomo", category: "Artist", value: "illustrated by Katsuhiro Otomo (Akira), staggering mechanical detail, exploding urban concrete, hyper-detailed crosshatching", year: 1954 },
  { id: "art-mignola", name: "Mike Mignola", category: "Artist", value: "illustrated by Mike Mignola (Hellboy), heavy black shadow blocks, stylized angular gothic silhouettes, muted earthy palettes", year: 1960 },
  { id: "art-frazetta", name: "Frank Frazetta", category: "Artist", value: "painted by Frank Frazetta, visceral dynamic fantasy action, bold anatomical muscle definition, dramatic impasto oils", year: 1928 },
  { id: "art-hopper", name: "Edward Hopper", category: "Artist", value: "painted in the style of Edward Hopper, quiet urban loneliness, geometric shafts of warm sunlight through windows, clean planes", year: 1882 },
  { id: "art-shinkai", name: "Makoto Shinkai", category: "Artist", value: "visualized in the style of Makoto Shinkai, breathtaking photorealistic anime skies, detailed raindrops, shimmering light reflections", year: 1973 },
  { id: "art-giger", name: "H.R. Giger", category: "Artist", value: "sculpted in the biomechanical style of H.R. Giger, monochromatic airbrushed chitin, bone, cables, and dark alien architecture", year: 1940 },

  // Typography
  { id: "txt-comicfont", name: "Classic Comic Lettering", category: "Text", value: "with clean professional hand-lettered comic book sound effects and dialog typography" },
  { id: "txt-actionfx", name: "Bold Impact Sound FX", category: "Text", value: "with dynamic explosive stylized onomatopoeia sound effect lettering (WHAM, CRASH, BZZT) integrated into the art" },
  { id: "txt-japanese", name: "Manga Katakana FX", category: "Text", value: "with stylized Japanese Katakana sound effect characters dynamic slicing across the frame" },

  // Effects
  { id: "efx-speedlines", name: "Kinetic Manga Speed Lines", category: "Special Effects", value: "dramatic directional manga speed lines and focal zoom lines emphasizing sudden intense acceleration" },
  { id: "efx-halftone", name: "Vintage Halftone Ben-Day Dots", category: "Special Effects", value: "classic comic book offset printing CMYK halftone Ben-Day dot pattern visible in shading" },
  { id: "efx-sparks", name: "Shower of Welding Sparks", category: "Special Effects", value: "bright glowing showers of orange electrical sparks and fiery embers floating across foreground" },
  { id: "efx-bloom", name: "Optical Anamorphic Bloom", category: "Special Effects", value: "horizontal blue anamorphic streak flares and soft dreamy lens bloom on highlights" },

  // Video
  { id: "vid-cinematic", name: "24fps 2.39:1 Cinemascope", category: "Video Style", value: "2.39:1 ultra-widescreen cinematic aspect ratio, letterboxed, 24fps motion cadence feeling" },
  { id: "vid-flow", name: "Storyboard Match Cut Flow", category: "Story Flow", value: "deliberate graphic match cut flow between frames for seamless cinematic progression" }
];
