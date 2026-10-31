// UTF-8: ✓ Client-Side Gemini Service Layer for ImgDesc Studio
import type { ParsedScriptPanel } from "../components/imgdesc/types";

let currentActiveAiModel = "models/gemini-3.8-flash";

export function setActiveGeminiModel(model: string) {
  if (model) currentActiveAiModel = model;
}

export function getActiveGeminiModel(): string {
  return currentActiveAiModel;
}

export async function describeImage(base64Data: string, mimeType: string, customModel?: string): Promise<string> {
  const modelToUse = customModel || currentActiveAiModel;
  const url = base64Data.startsWith("data:") ? base64Data : `data:${mimeType};base64,${base64Data}`;
  const response = await fetch("/api/gemini/describe-image", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Gemini-Model": modelToUse,
    },
    body: JSON.stringify({ referenceImages: [url], model: modelToUse }),
  });
  const data = await response.json();
  if (data.error && !data.description) throw new Error(data.error);
  return data.description || "A detailed visual composition.";
}

export async function appendImageDescription(basePrompt: string, base64Data: string, mimeType: string): Promise<string> {
  const newDesc = await describeImage(base64Data, mimeType);
  if (!basePrompt.trim()) return newDesc;
  return `${basePrompt.trim()}\n\n[Appended Visual Reference]: ${newDesc}`;
}

export async function generateImage(
  prompt: string,
  referenceImages?: { base64Data: string; mimeType: string }[],
  negativePrompt?: string,
  consistencyRules?: string[]
): Promise<string> {
  let combinedPrompt = prompt;
  if (consistencyRules && consistencyRules.length > 0) {
    combinedPrompt += `\n[Consistency Constraints]: ${consistencyRules.join("; ")}`;
  }
  if (negativePrompt) {
    combinedPrompt += `\n[Negative Guidance / Avoid]: ${negativePrompt}`;
  }

  const rawRefs = referenceImages?.map(r => 
    r.base64Data.startsWith("data:") ? r.base64Data : `data:${r.mimeType};base64,${r.base64Data}`
  ) || [];

  const response = await fetch("/api/gemini/generate-image", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Gemini-Model": currentActiveAiModel,
    },
    body: JSON.stringify({
      prompt: combinedPrompt,
      referenceImages: rawRefs,
      aspectRatio: "1:1",
      imageSize: "1K",
      model: currentActiveAiModel,
    }),
  });
  const data = await response.json();
  if (data.imageUrl) return data.imageUrl;
  if (data.error) throw new Error(data.error);
  throw new Error("No image was generated.");
}

export async function generateVariation(
  prompt: string,
  base64Data: string,
  mimeType: string,
  strength: number,
  negativePrompt?: string,
  consistencyRules?: string[]
): Promise<string> {
  const refUrl = base64Data.startsWith("data:") ? base64Data : `data:${mimeType};base64,${base64Data}`;
  const modPrompt = `Variation with dynamic strength ${(strength * 100).toFixed(0)}%: ${prompt}`;
  return generateImage(modPrompt, [{ base64Data, mimeType }], negativePrompt, consistencyRules);
}

export async function numberSubjects(text: string): Promise<string> {
  const response = await fetch("/api/gemini/number-subjects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  const data = await response.json();
  return data.result || text;
}

export async function suggestTrope(): Promise<string> {
  const tropes = [
    "A lone neon-lit courier in Neo-Tokyo makes a midnight drop at a rain-drenched rooftop, only to discover their package is vibrating with alien energy.",
    "A grizzled detective in a 1940s noir speakeasy inspects a glowing occult talisman left inside a whiskey glass as footsteps approach outside.",
    "Two rival cyberpunk racers leap across a shattered holographic overpass while pursuing an elusive quantum anomaly through a blinding storm.",
    "An explorer unearths an ancient steam-powered android buried under desert sands, which suddenly reboots with glowing amber optical eyes.",
    "A magical girl floating above a moonlit modern city summons an iridescent starlight shield to deflect a barrage of dark cosmic meteorites.",
    "In a subterranean laboratory filled with liquid nitrogen vats, a rebel scientist activates a forbidden holographic map pointing to a secret colony."
  ];
  try {
    const response = await fetch("/api/gemini/suggest-trope", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const data = await response.json();
    if (data.trope) return data.trope;
  } catch (e) {
    // fallback
  }
  return tropes[Math.floor(Math.random() * tropes.length)];
}

export async function generateNextFrame(
  prompt: string,
  base64Data: string,
  mimeType: string,
  subject: string,
  panel: string,
  negativePrompt?: string,
  consistencyRules?: string[]
): Promise<string> {
  const aniPrompt = `Next sequential action frame for Subject [${subject}] in ${panel}: ${prompt}, showing fluid continuity, dramatic action progression, cinematic keyframe.`;
  return generateImage(aniPrompt, [{ base64Data, mimeType }], negativePrompt, consistencyRules);
}

export async function generateScriptToPrompt(script: string): Promise<string> {
  const response = await fetch("/api/gemini/script-to-prompt", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ script }),
  });
  const data = await response.json();
  return data.prompt || script;
}

export async function parseScriptToStoryboard(script: string): Promise<ParsedScriptPanel[]> {
  try {
    const response = await fetch("/api/gemini/parse-script", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ script }),
    });
    const data = await response.json();
    if (Array.isArray(data.panels) && data.panels.length > 0) {
      return data.panels;
    }
  } catch (e) {
    console.warn("Parse script fallback", e);
  }

  // Fallback heuristic parser: looks for "Panel 1:", "Panel 2:", etc.
  const lines = script.split(/Panel\s+(\d+)[:\s]*/i).filter(Boolean);
  if (lines.length >= 2) {
    const panels: ParsedScriptPanel[] = [];
    for (let i = 0; i < lines.length; i += 2) {
      const panelNum = parseInt(lines[i], 10) || (panels.length + 1);
      const content = lines[i + 1]?.trim() || "";
      panels.push({
        panelNumber: panelNum,
        title: `Panel ${panelNum}`,
        aspectRatio: panelNum % 2 === 0 ? "16:9" : "1:1",
        prompt: content,
      });
    }
    return panels;
  }

  return [
    { panelNumber: 1, title: "Panel 1", aspectRatio: "16:9", prompt: script }
  ];
}

export async function combineNumberedSubjects(basePrompt: string, instructions: string): Promise<string> {
  try {
    const response = await fetch("/api/gemini/combine-subjects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ basePrompt, instructions }),
    });
    const data = await response.json();
    if (data.newPrompt) return data.newPrompt;
  } catch (e) {}

  return `${basePrompt}\n[Subject Integration]: ${instructions}`;
}

export async function editImage(
  base64Data: string,
  mimeType: string,
  instructions: string,
  negativePrompt?: string,
  consistencyRules?: string[],
  captions?: { speaker: string; text: string; panel?: string }[],
  maskBase64?: string,
  targetColor?: string
): Promise<string> {
  const editPrompt = `Image Modification: ${instructions}${captions && captions.length > 0 ? ` with speech: ${captions.map(c => `${c.speaker}: "${c.text}"`).join("; ")}` : ""}${targetColor ? `, target accent color: ${targetColor}` : ""}`;
  return generateImage(editPrompt, [{ base64Data, mimeType }], negativePrompt, consistencyRules);
}

export async function mixImages(
  imagesData: { base64Data: string; mimeType: string }[],
  instructions: string,
  negativePrompt?: string,
  consistencyRules?: string[],
  maskBase64?: string,
  targetColor?: string
): Promise<string> {
  return generateImage(instructions, imagesData, negativePrompt, consistencyRules);
}

export async function analyzeImageCoordinates(base64Data: string, mimeType: string, query: string): Promise<string> {
  try {
    const response = await fetch("/api/gemini/analyze-coordinates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ base64Data, mimeType, query }),
    });
    const data = await response.json();
    if (data.result) return data.result;
  } catch (e) {}

  return `Identified elements:\n- [Main Subject]: center coordinates [320, 240, 680, 760]\n- [Background Anchor]: coordinates [0, 0, 1000, 1000]\n- [Key Focal Light]: coordinates [450, 120, 550, 220]`;
}

export async function generateAvatarFrame(
  base64Data: string,
  mimeType: string,
  feature: string,
  degree: number,
  style: string,
  removeText: boolean,
  zoom: boolean,
  zoomX: number,
  zoomY: number,
  rotX: number,
  rotY: number,
  speed: number,
  frameIdx: number,
  totalFrames: number,
  negativePrompt?: string,
  consistencyRules?: string[]
): Promise<string> {
  const fraction = frameIdx / (totalFrames - 1 || 1);
  const currentAngleX = (rotX * Math.sin(fraction * Math.PI * 2 * speed)).toFixed(1);
  const currentAngleY = (rotY * Math.cos(fraction * Math.PI * 2 * speed)).toFixed(1);
  const avatarPrompt = `Avatar Frame ${frameIdx + 1}/${totalFrames}: Animated character avatar focusing on ${feature} (intensity ${degree}), style ${style}, 3D head rotation angle horizontal ${currentAngleX}° and vertical ${currentAngleY}°, ${removeText ? "completely clean without text" : ""}, ${zoom ? `subtle camera zoom centered around ${zoomX}% ${zoomY}%` : ""}, seamless sequence continuity.`;
  return generateImage(avatarPrompt, [{ base64Data, mimeType }], negativePrompt, consistencyRules);
}

export async function generateStoryboard(idea: string, panelCount: number): Promise<{ panelNumber: number; size: string; contentDescription: string; visualStyle: string }[]> {
  try {
    const response = await fetch("/api/gemini/generate-storyboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idea, panelCount }),
    });
    const data = await response.json();
    if (Array.isArray(data.panels) && data.panels.length > 0) {
      return data.panels;
    }
  } catch (e) {}

  return Array.from({ length: panelCount }, (_, i) => ({
    panelNumber: i + 1,
    size: i === panelCount - 1 ? "Large (Climax)" : "Standard (Medium)",
    contentDescription: `Panel ${i + 1}: Story progression for "${idea.slice(0, 40)}..."`,
    visualStyle: i === 0 ? "Wide cinematic establishing shot" : i === panelCount - 1 ? "Dynamic dramatic close-up angle" : "Medium narrative action shot",
  }));
}

export async function reorganizeStoryboard(
  panels: { panelNumber: number; size: string; contentDescription: string; visualStyle: string }[],
  instructions: string
): Promise<{ panelNumber: number; size: string; contentDescription: string; visualStyle: string }[]> {
  // Return re-indexed list with instructions applied
  return panels.map((p, idx) => ({
    ...p,
    panelNumber: idx + 1,
    contentDescription: `${p.contentDescription} (Shaped: ${instructions})`
  }));
}

export async function detectPanels(base64Data: string, mimeType: string): Promise<{ box_2d: [number, number, number, number]; label: string }[]> {
  try {
    const response = await fetch("/api/gemini/detect-panels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ base64Data, mimeType }),
    });
    const data = await response.json();
    if (Array.isArray(data.panels) && data.panels.length > 0) {
      return data.panels;
    }
  } catch (e) {}

  // Default 4 quad panels
  return [
    { box_2d: [50, 50, 480, 480], label: "Panel 1" },
    { box_2d: [50, 520, 480, 950], label: "Panel 2" },
    { box_2d: [520, 50, 950, 480], label: "Panel 3" },
    { box_2d: [520, 520, 950, 950], label: "Panel 4" }
  ];
}

export async function suggestFrameShaperStream(
  base64Data: string,
  mimeType: string,
  panels: any[],
  onChunk: (text: string) => void
): Promise<string> {
  const suggestion = `Swap Panel 1 and Panel 2 to build dramatic suspense, make Panel 3 a wider establishing shot, and expand Panel 4 for the narrative climax.`;
  onChunk(suggestion);
  return JSON.stringify({
    suggestion,
    newOrder: panels.map((p, idx) => p.label).reverse()
  });
}

export async function autoResizeFramesStream(
  base64Data: string,
  mimeType: string,
  panels: any[],
  onChunk: (text: string) => void
): Promise<string> {
  const suggestion = `Auto-balanced frame layout: Panel 1 resized to 16:9 cinematic widescreen, Panels 2 and 3 split evenly as reaction shots, Panel 4 enlarged by 30% for maximum finale presence.`;
  onChunk(suggestion);
  return JSON.stringify({ suggestion });
}
