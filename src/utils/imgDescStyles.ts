export interface StylePreset {
  id: string;
  label: string;
  icon: string;
  color: string;
  badge: string;
  promptSuffix: string;
  description: string;
}

export const STYLE_PRESETS: StylePreset[] = [
  {
    id: "film-noir",
    label: "Film Noir",
    icon: "🕵️",
    color: "slate",
    badge: "1940s B&W",
    promptSuffix: "film noir aesthetic, deep moody shadows, high contrast chiaroscuro lighting, venetian blind cast shadows, vintage 1940s atmosphere, grainy monochrome tones",
    description: "Classic high-contrast monochrome mystery look",
  },
  {
    id: "cyberpunk",
    label: "Cyberpunk",
    icon: "🌆",
    color: "cyan",
    badge: "Neon Sci-Fi",
    promptSuffix: "cyberpunk aesthetic, vibrant neon cyan and magenta lighting, rain-slicked reflective surfaces, holographic signs, futuristic dark urban atmosphere, high-tech textures",
    description: "Futuristic neon-drenched dystopian cityscapes",
  },
  {
    id: "35mm-vintage",
    label: "35mm Vintage",
    icon: "📷",
    color: "amber",
    badge: "Kodak Portra",
    promptSuffix: "vintage 35mm film photography, Kodak Portra 400 color science, subtle natural film grain, warm nostalgic tones, soft lens flare, shallow depth of field",
    description: "Authentic retro analog film camera aesthetic",
  },
  {
    id: "anime",
    label: "Anime",
    icon: "✨",
    color: "pink",
    badge: "Shinkai Style",
    promptSuffix: "Japanese anime art style, Makoto Shinkai aesthetic, vibrant luminous colors, detailed sky with fluffy clouds, crisp cel-shaded lighting, beautiful painterly background",
    description: "Luminous anime visuals with painterly skies",
  },
  {
    id: "dark-fantasy",
    label: "Dark Fantasy",
    icon: "⚔️",
    color: "purple",
    badge: "Elden Gothic",
    promptSuffix: "dark fantasy aesthetic, Elden Ring style, ethereal glowing fog, gothic architecture, dramatic cinematic volumetric light, intricate textures, ominous atmospheric depth",
    description: "Atmospheric, gothic, and mystical worldbuilding",
  },
  {
    id: "photorealistic",
    label: "Photorealistic",
    icon: "📸",
    color: "emerald",
    badge: "8K Octane",
    promptSuffix: "photorealistic 8k octane render, Hasselblad medium format camera, natural studio lighting, ultra-detailed micro-textures, perfect sharp focus, true-to-life materials",
    description: "Ultra-crisp studio realism with true-to-life textures",
  },
  {
    id: "isometric-3d",
    label: "Isometric 3D",
    icon: "🧊",
    color: "indigo",
    badge: "Blender 3D",
    promptSuffix: "isometric 3D diorama, stylized clay render, Blender 3D style, soft ambient occlusion, cute miniature lighting, clean pastel accents, crisp edges",
    description: "Stylized isometric miniature model view",
  },
  {
    id: "oil-painting",
    label: "Oil Painting",
    icon: "🎨",
    color: "yellow",
    badge: "Fine Art",
    promptSuffix: "classical oil painting, textured heavy impasto brushstrokes, rich warm palette, Rembrandt chiaroscuro lighting, museum canvas texture, masterwork fine art",
    description: "Richly textured canvas with classical brushwork",
  },
  {
    id: "concept-art",
    label: "Concept Art",
    icon: "🚀",
    color: "blue",
    badge: "ArtStation",
    promptSuffix: "epic concept art, trending on ArtStation, dynamic wide cinematic composition, matte painting technique, detailed environment design, atmospheric lighting",
    description: "High-production video game and movie concept art",
  },
];

/**
 * Helper to append or toggle a style suffix onto a prompt
 */
export function toggleStyleInPrompt(currentPrompt: string, styleSuffix: string): string {
  const trimmed = currentPrompt.trim();
  if (!trimmed) {
    return styleSuffix;
  }
  // If the prompt already contains this suffix, remove it
  if (trimmed.includes(styleSuffix)) {
    let removed = trimmed.replace(styleSuffix, "").replace(/,\s*,/g, ",").replace(/\s*,\s*$/, "").trim();
    return removed;
  }
  // Otherwise append cleanly with a comma separator
  const hasComma = trimmed.endsWith(",");
  return `${trimmed}${hasComma ? " " : ", "}${styleSuffix}`;
}
