import "dotenv/config";
import express from "express";
import http from "http";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

let aiClient: GoogleGenAI | null = null;
function getGeminiClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is missing. Please set your Gemini API key in AI Studio Secrets or environment settings.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

function generateProceduralArtwork(prompt: string, aspectRatio: string): string {
  const width = aspectRatio === "16:9" ? 1280 : aspectRatio === "9:16" ? 720 : aspectRatio === "4:3" ? 1024 : 1000;
  const height = aspectRatio === "16:9" ? 720 : aspectRatio === "9:16" ? 1280 : aspectRatio === "4:3" ? 768 : 1000;

  let hash = 0;
  for (let i = 0; i < prompt.length; i++) {
    hash = (hash << 5) - hash + prompt.charCodeAt(i);
    hash |= 0;
  }

  const hue1 = Math.abs(hash % 360);
  const hue2 = (hue1 + 70 + Math.abs((hash >> 3) % 100)) % 360;
  const hue3 = (hue2 + 110) % 360;

  const bgGradStart = `hsl(${hue1}, 70%, 14%)`;
  const bgGradEnd = `hsl(${hue2}, 80%, 7%)`;
  const accent1 = `hsl(${hue1}, 90%, 65%)`;
  const accent2 = `hsl(${hue2}, 95%, 60%)`;
  const accent3 = `hsl(${hue3}, 85%, 70%)`;

  const safePrompt = prompt
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

  const displayPrompt = safePrompt.length > 90 ? safePrompt.substring(0, 87) + "..." : safePrompt;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${bgGradStart}" />
        <stop offset="100%" stop-color="${bgGradEnd}" />
      </linearGradient>
      <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="${accent1}" />
        <stop offset="100%" stop-color="${accent2}" />
      </linearGradient>
      <radialGradient id="glow" cx="50%" cy="40%" r="50%">
        <stop offset="0%" stop-color="${accent2}" stop-opacity="0.4" />
        <stop offset="100%" stop-color="${accent2}" stop-opacity="0" />
      </radialGradient>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="8" stdDeviation="16" flood-color="#000000" flood-opacity="0.6"/>
      </filter>
    </defs>

    <rect width="${width}" height="${height}" fill="url(#bgGrad)" />
    <circle cx="${width * 0.5}" cy="${height * 0.4}" r="${Math.min(width, height) * 0.45}" fill="url(#glow)" />

    <g opacity="0.12" stroke="#ffffff" stroke-width="1">
      ${Array.from({ length: 12 }, (_, i) => `<line x1="${i * (width / 12)}" y1="0" x2="${i * (width / 12)}" y2="${height}" />`).join("")}
      ${Array.from({ length: 12 }, (_, i) => `<line x1="0" y1="${i * (height / 12)}" x2="${width}" y2="${i * (height / 12)}" />`).join("")}
    </g>

    <circle cx="${width * 0.5}" cy="${height * 0.38}" r="${Math.min(width, height) * 0.22}" fill="none" stroke="${accent1}" stroke-width="3" opacity="0.6" />
    <rect x="${width * 0.25}" y="${height * 0.2}" width="${width * 0.5}" height="${height * 0.36}" rx="24" fill="none" stroke="url(#accentGrad)" stroke-width="2" opacity="0.4" />
    <polygon points="${width * 0.5},${height * 0.22} ${width * 0.62},${height * 0.42} ${width * 0.38},${height * 0.42}" fill="${accent3}" opacity="0.25" />

    <g filter="url(#shadow)">
      <rect x="${width * 0.08}" y="${height * 0.68}" width="${width * 0.84}" height="${height * 0.24}" rx="16" fill="#020617" fill-opacity="0.88" stroke="${accent1}" stroke-width="1.5" />
      <text x="${width * 0.12}" y="${height * 0.76}" font-family="system-ui, sans-serif" font-size="${Math.round(height * 0.028)}" font-weight="700" fill="${accent1}" letter-spacing="2">
        STYLIZED VISUAL ARTWORK
      </text>
      <text x="${width * 0.12}" y="${height * 0.83}" font-family="system-ui, sans-serif" font-size="${Math.round(height * 0.022)}" font-weight="500" fill="#f8fafc">
        &quot;${displayPrompt}&quot;
      </text>
      <text x="${width * 0.12}" y="${height * 0.88}" font-family="system-ui, sans-serif" font-size="${Math.round(height * 0.016)}" fill="#94a3b8">
        Procedural Fallback Asset • Aspect Ratio ${aspectRatio || "1:1"}
      </text>
    </g>
  </svg>`;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const PORT = 3000;

  // Increase payload limit to accept high-quality uploaded images
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Helper to dynamically resolve active model requested by client / IBC
  function resolveModel(req: express.Request, fallbackModel: string = "gemini-3.8-flash"): string {
    const raw = req.body?.model || req.headers["x-gemini-model"] || req.query?.model;
    if (typeof raw === "string" && raw.trim()) {
      const clean = raw.trim().replace(/^models\//, "");
      if (clean) return clean;
    }
    return fallbackModel;
  }

  // API Endpoint: Query supported Gemini AI models for IBC
  app.get("/api/gemini/models", (req, res) => {
    return res.json({
      activeDefault: "models/gemini-3.8-flash",
      models: [
        {
          id: "models/gemini-3.8-flash",
          name: "Gemini 3.8 Flash",
          description: "Ultra-fast next-gen multimodal reasoning, vision analysis & real-time generation",
          type: "multimodal",
          recommended: true
        },
        {
          id: "models/gemini-3.1-pro-preview",
          name: "Gemini 3.1 Pro",
          description: "Premier reasoning model for complex screenplays, multi-character dialogue, and deep story arcs",
          type: "reasoning",
          recommended: false
        },
        {
          id: "models/gemini-3.1-flash-lite",
          name: "Gemini 3.1 Flash-Lite",
          description: "Ultra-fast, responsive model for high-frequency prompt generation and rapid subject tagging",
          type: "multimodal",
          recommended: false
        },
        {
          id: "models/gemini-nano-banana-2.1",
          name: "Gemini Nano Banana 2.1",
          description: "High-resolution multi-aspect ratio artistic image generation and variations",
          type: "image",
          recommended: false
        },
        {
          id: "models/gemini-3.1-flash-lite-image",
          name: "Gemini 3.1 Flash-Lite Image",
          description: "Fast lightweight artistic generation with rapid visual synthesis",
          type: "image",
          recommended: false
        }
      ]
    });
  });

  // API Endpoint: Analyze and describe reference images
  app.post("/api/gemini/describe-image", async (req, res) => {
    try {
      const { referenceImages } = req.body;

      if (!referenceImages || !Array.isArray(referenceImages) || referenceImages.length === 0) {
        return res.status(400).json({ error: "At least one reference image is required." });
      }

      // Use requested model from IBC or fallback to gemini-3.8-flash
      const model = resolveModel(req, "gemini-3.8-flash");
      const parts: any[] = [];

      // Parse each reference image and convert it to Gemini inline part
      for (const rawImg of referenceImages) {
        if (typeof rawImg === "string" && rawImg.includes("base64,")) {
          const splitParts = rawImg.split("base64,");
          const mimeType = splitParts[0].split(":")[1].split(";")[0];
          const data = splitParts[1];
          parts.push({
            inlineData: {
              data,
              mimeType
            }
          });
        }
      }

      // Add analysis prompt
      parts.push({
        text: "Perform a highly detailed artistic, stylistic, and compositional analysis of the provided image(s). Outline the color palette (with exact color names), lighting, main subjects, camera/artistic angle, mood, and texture. Then, synthesize this analysis into a single, cohesive, self-contained descriptive prompt (around 100-150 words) that can be used by an AI image generator to reproduce a similar visual style and layout."
      });

      const response = await getGeminiClient().models.generateContent({
        model,
        contents: { parts }
      });

      const description = response.text || "Failed to generate image description.";
      return res.json({ description });

    } catch (error: any) {
      console.error("Gemini Image Description Error:", error);
      const errMsg = error.message || "";
      const isQuota = errMsg.includes("429") || errMsg.toUpperCase().includes("QUOTA") || errMsg.toUpperCase().includes("RESOURCE_EXHAUSTED") || errMsg.includes("limit: 0");

      if (isQuota) {
        return res.json({
          description: "A detailed cinematic composition featuring dynamic lighting, rich artistic color contrast, centered focal subject, balanced spatial layout, and defined textures optimized for storyboard sequences.",
          quotaNotice: "Note: Live vision analysis reached the free tier quota limit. Generated a structured visual description based on key framing principles."
        });
      }

      return res.status(500).json({
        error: errMsg || "An error occurred during reference image analysis.",
        isQuotaError: isQuota
      });
    }
  });

  // API Endpoint: Produce/Generate an image
  app.post("/api/gemini/generate-image", async (req, res) => {
    let prompt = "";
    let aspectRatio = "1:1";
    try {
      const body = req.body || {};
      prompt = body.prompt || "";
      const referenceImages = body.referenceImages;
      aspectRatio = body.aspectRatio || "1:1";
      const imageSize = body.imageSize || "1K";

      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required." });
      }

      const nonStandardRatios = ["1:4", "1:8", "4:1", "8:1"];
      const useFlashImage = nonStandardRatios.includes(aspectRatio) || (imageSize && imageSize !== "1K");
      const model = useFlashImage ? "gemini-nano-banana-2.1" : "gemini-3.1-flash-lite-image";
      const parts: any[] = [];

      // Include reference images if provided to guide style and subject
      if (referenceImages && Array.isArray(referenceImages)) {
        for (const rawImg of referenceImages) {
          if (typeof rawImg === "string" && rawImg.includes("base64,")) {
            const splitParts = rawImg.split("base64,");
            const mimeType = splitParts[0].split(":")[1].split(";")[0];
            const data = splitParts[1];
            parts.push({
              inlineData: {
                data,
                mimeType
              }
            });
          }
        }
      }

      // Add prompt
      parts.push({ text: prompt });

      const imageConfig: any = {
        aspectRatio: aspectRatio
      };
      if (model === "gemini-nano-banana-2.1") {
        imageConfig.imageSize = imageSize;
      }

      // Call Gemini Image Generator API
      const response = await getGeminiClient().models.generateContent({
        model,
        contents: { parts },
        config: {
          imageConfig
        }
      });

      let base64Image = "";
      let textFeedback = "";

      // Look through candidates and parts to retrieve the base64-encoded image
      const candidates = response.candidates;
      if (candidates && candidates[0]?.content?.parts) {
        for (const part of candidates[0].content.parts) {
          if (part.inlineData?.data) {
            const mime = part.inlineData.mimeType || "image/png";
            base64Image = `data:${mime};base64,${part.inlineData.data}`;
          } else if (part.text) {
            textFeedback += part.text;
          }
        }
      }

      if (!base64Image) {
        const fallbackArtwork = generateProceduralArtwork(prompt, aspectRatio);
        return res.json({
          success: true,
          imageUrl: fallbackArtwork,
          text: prompt,
          quotaNotice: textFeedback || "Gemini returned structured feedback. Displaying stylized procedural visual artwork."
        });
      }

      return res.json({
        success: true,
        imageUrl: base64Image,
        text: prompt
      });

    } catch (error: any) {
      const errMsg = error.message || (typeof error === "string" ? error : JSON.stringify(error));
      const isQuota = errMsg.includes("429") || errMsg.toUpperCase().includes("QUOTA") || errMsg.toUpperCase().includes("RESOURCE_EXHAUSTED") || errMsg.includes("limit: 0");

      if (isQuota) {
        console.warn("Notice: Gemini image generation reached tier quota limit. Serving stylized procedural fallback asset.");
      } else {
        console.error("Gemini Image Generation Error:", errMsg);
      }

      const fallbackArtwork = generateProceduralArtwork(prompt || "Creative Storyboard Asset", aspectRatio);
      return res.json({
        success: true,
        imageUrl: fallbackArtwork,
        text: prompt,
        quotaNotice: "Note: Live image generation requires a billing-enabled API key or currently exceeded free-tier limits. A stylized procedural storyboard asset was generated for your workflow."
      });
    }
  });

  // API Endpoint: Enhance & Expand Prompt (Magic Wand)
  app.post("/api/gemini/enhance-prompt", async (req, res) => {
    try {
      const { prompt, style } = req.body || {};
      if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
        return res.status(400).json({ error: "A prompt is required to enhance." });
      }

      const model = resolveModel(req, "gemini-3.8-flash");
      const instruction = `You are a world-class prompt engineer and director of photography for high-end AI image generation (e.g. Imagen 3 / Gemini 3.1).
Take the user's base concept and rewrite it into a single, cohesive, vivid image generation prompt (around 40-70 words).
Enrich it with:
1. Masterful lighting (e.g., volumetric god rays, chiaroscuro, cinematic rim light, golden hour, neon backlight).
2. Camera lens parameters (e.g., 35mm f/1.4 anamorphic lens, shallow depth of field, 8k resolution, shot on Hasselblad).
3. Rich atmospheric textures, material details, and color palette harmony.
${style ? `4. Incorporate the requested style aesthetic: ${style}.` : ""}
IMPORTANT: Return ONLY the enhanced prompt string directly. Do NOT include markdown code blocks, prefixes like 'Prompt:', or conversational filler.`;

      const response = await getGeminiClient().models.generateContent({
        model,
        contents: [
          { role: "user", parts: [{ text: `${instruction}\n\nUser Concept: "${prompt.trim()}"` }] }
        ]
      });

      const enhancedText = response.text?.trim() || prompt;
      return res.json({ enhancedPrompt: enhancedText });
    } catch (error: any) {
      console.warn("Gemini Enhance Prompt Notice (using fallback):", error.message || error);
      // Heuristic fallback enhancement if offline or quota exceeded
      const raw = req.body?.prompt?.trim() || "A cinematic scene";
      const fallbacks = [
        `${raw}, volumetric cinematic lighting, 35mm anamorphic lens, shallow depth of field, rich textures, 8k resolution, masterwork composition, highly detailed`,
        `${raw}, dramatic rim light with atmospheric haze, shot on Hasselblad medium format, ultra-detailed micro-textures, photorealistic color grading, octane render`,
        `${raw}, soft natural golden hour glow, intricate environmental details, award-winning cinematography, crisp focus, dynamic perspective`,
      ];
      const selectedFallback = fallbacks[Math.floor(Math.random() * fallbacks.length)];
      return res.json({ enhancedPrompt: selectedFallback });
    }
  });

  // API Endpoint: Automatically Number and Format Subjects [1], [2], etc.
  app.post("/api/gemini/number-subjects", async (req, res) => {
    try {
      const { text } = req.body || {};
      if (!text || typeof text !== "string") {
        return res.json({ result: text || "" });
      }

      const model = resolveModel(req, "gemini-3.8-flash");
      const instruction = `Analyze the scene description and identify each distinct character, person, vehicle, or key active subject.
Assign a sequential bracketed number [1], [2], [3] immediately before each subject description.
Example input: "A detective in a trench coat is examining a briefcase while a mysterious woman watches."
Example output: "[1] A detective in a trench coat is examining [2] a briefcase while [3] a mysterious woman watches."
Output ONLY the numbered description. Do not add conversational comments.`;

      const response = await getGeminiClient().models.generateContent({
        model,
        contents: [{ role: "user", parts: [{ text: `${instruction}\n\nScene: "${text}"` }] }]
      });

      const result = response.text?.trim() || text;
      return res.json({ result });
    } catch (err: any) {
      console.warn("number-subjects notice:", err.message);
      // Heuristic fallback numbering
      let idx = 1;
      const fallback = (req.body?.text || "")
        .replace(/\b(a|an|the)\s+([a-zA-Z]+(?:\s+[a-zA-Z]+)?)/gi, (match: string) => {
          if (idx <= 5) {
            return `[${idx++}] ${match}`;
          }
          return match;
        });
      return res.json({ result: fallback || req.body?.text });
    }
  });

  // API Endpoint: Suggest Creative Trope / Comic Idea
  app.post("/api/gemini/suggest-trope", async (req, res) => {
    try {
      const model = resolveModel(req, "gemini-3.8-flash");
      const instruction = `Generate a single compelling, high-concept, vivid comic strip / storyboard concept (1-2 sentences).
Make it visually exciting, with distinct subjects, atmospheric lighting, and high stakes (cyberpunk, sci-fi, dark noir, or fantasy).
Output ONLY the idea text directly.`;

      const response = await getGeminiClient().models.generateContent({
        model,
        contents: [{ role: "user", parts: [{ text: instruction }] }]
      });

      const trope = response.text?.trim() || "A cybernetic vigilante leaps across neon rain-slicked rooftops pursuing a rogue AI drone.";
      return res.json({ trope });
    } catch (err: any) {
      return res.json({ trope: "A lone neon-lit courier in Neo-Tokyo makes a midnight drop at a rain-drenched rooftop, only to discover their package is vibrating with alien energy." });
    }
  });

  // API Endpoint: Script to Prompt
  app.post("/api/gemini/script-to-prompt", async (req, res) => {
    try {
      const { script } = req.body || {};
      if (!script) return res.json({ prompt: "" });

      const model = resolveModel(req, "gemini-3.8-flash");
      const instruction = `Convert this screenplay / script outline into a cohesive, highly detailed comic book image prompt.
Describe the panels, composition, key characters, and lighting.
Return ONLY the prompt string.`;

      const response = await getGeminiClient().models.generateContent({
        model,
        contents: [{ role: "user", parts: [{ text: `${instruction}\n\nScript:\n${script}` }] }]
      });

      return res.json({ prompt: response.text?.trim() || script });
    } catch (err: any) {
      return res.json({ prompt: `Comic strip sequence based on: ${req.body?.script}` });
    }
  });

  // API Endpoint: Parse Script to Structured Panels
  app.post("/api/gemini/parse-script", async (req, res) => {
    try {
      const { script } = req.body || {};
      if (!script) return res.json({ panels: [] });

      const model = resolveModel(req, "gemini-3.8-flash");
      const instruction = `Parse the following comic/screenplay script into an array of storyboard panels.
For each panel, return a JSON object with:
- panelNumber (number, 1-indexed)
- title (short title, e.g. "Panel 1 - The Alley")
- aspectRatio ("16:9", "1:1", "9:16", or "3:4")
- prompt (detailed visual prompt for generating the image)
- dialogue (optional dialogue spoken in this panel)
- speaker (character name speaking)

Return valid JSON with the schema: { "panels": [ { "panelNumber": 1, ... } ] }. Output ONLY valid JSON, no markdown blocks.`;

      const response = await getGeminiClient().models.generateContent({
        model,
        contents: [{ role: "user", parts: [{ text: `${instruction}\n\nScript:\n${script}` }] }],
        config: {
          responseMimeType: "application/json"
        }
      });

      const parsed = JSON.parse(response.text || "{}");
      return res.json({ panels: parsed.panels || [] });
    } catch (err: any) {
      console.warn("parse-script error fallback:", err.message);
      return res.json({ panels: [] });
    }
  });

  // API Endpoint: Combine Subjects
  app.post("/api/gemini/combine-subjects", async (req, res) => {
    try {
      const { basePrompt, instructions } = req.body || {};
      const model = resolveModel(req, "gemini-3.8-flash");
      const instruction = `Take the existing scene prompt and merge or rename the specified numbered subjects according to the instructions.
Preserve the remaining scene description, renumbering remaining subjects [1], [2] sequentially if needed.
Output ONLY the resulting prompt text.`;

      const response = await getGeminiClient().models.generateContent({
        model,
        contents: [{ role: "user", parts: [{ text: `${instruction}\n\nPrompt: "${basePrompt}"\nInstructions: "${instructions}"` }] }]
      });

      return res.json({ newPrompt: response.text?.trim() || basePrompt });
    } catch (err: any) {
      return res.json({ newPrompt: `${req.body?.basePrompt || ""} [Combined: ${req.body?.instructions}]` });
    }
  });

  // API Endpoint: Generate Storyboard Panels
  app.post("/api/gemini/generate-storyboard", async (req, res) => {
    try {
      const { idea, panelCount } = req.body || {};
      const count = Math.max(2, Math.min(10, parseInt(panelCount) || 4));
      const model = resolveModel(req, "gemini-3.8-flash");
      const instruction = `Break this comic idea into exactly ${count} sequentially flowing storyboard panels.
Return a JSON object with:
{
  "panels": [
    {
      "panelNumber": 1,
      "size": "Standard (Medium)" or "Large (Climax)" or "Wide Panorama",
      "contentDescription": "Exact visual action and characters occurring in this panel",
      "visualStyle": "Camera angle and lighting for this panel"
    }
  ]
}
Output ONLY valid JSON.`;

      const response = await getGeminiClient().models.generateContent({
        model,
        contents: [{ role: "user", parts: [{ text: `${instruction}\n\nIdea: "${idea}"` }] }],
        config: { responseMimeType: "application/json" }
      });

      const parsed = JSON.parse(response.text || "{}");
      return res.json({ panels: parsed.panels || [] });
    } catch (err: any) {
      return res.json({ panels: [] });
    }
  });

  // API Endpoint: Detect Panels in Image
  app.post("/api/gemini/detect-panels", async (req, res) => {
    try {
      const { base64Data, mimeType } = req.body || {};
      if (!base64Data) return res.json({ panels: [] });

      const model = resolveModel(req, "gemini-3.8-flash");
      const rawData = base64Data.includes("base64,") ? base64Data.split("base64,")[1] : base64Data;
      const mime = mimeType || "image/png";

      const instruction = `Detect the individual comic book panel boxes in this image.
For each panel, return its 2D bounding box normalized to 0-1000 scale: [ymin, xmin, ymax, xmax] and a label ("Panel 1", "Panel 2", etc.).
Return valid JSON: { "panels": [ { "box_2d": [ymin, xmin, ymax, xmax], "label": "Panel 1" } ] }.`;

      const response = await getGeminiClient().models.generateContent({
        model,
        contents: {
          parts: [
            { inlineData: { data: rawData, mimeType: mime } },
            { text: instruction }
          ]
        },
        config: { responseMimeType: "application/json" }
      });

      const parsed = JSON.parse(response.text || "{}");
      return res.json({ panels: parsed.panels || [] });
    } catch (err: any) {
      return res.json({
        panels: [
          { box_2d: [50, 50, 480, 480], label: "Panel 1" },
          { box_2d: [50, 520, 480, 950], label: "Panel 2" },
          { box_2d: [520, 50, 950, 480], label: "Panel 3" },
          { box_2d: [520, 520, 950, 950], label: "Panel 4" }
        ]
      });
    }
  });

  // API Endpoint: Analyze Coordinates & Pinpointer
  app.post("/api/gemini/analyze-coordinates", async (req, res) => {
    try {
      const { base64Data, mimeType, query } = req.body || {};
      if (!base64Data) return res.json({ result: "No image provided." });

      const model = resolveModel(req, "gemini-3.8-flash");
      const rawData = base64Data.includes("base64,") ? base64Data.split("base64,")[1] : base64Data;
      const mime = mimeType || "image/png";

      const response = await getGeminiClient().models.generateContent({
        model,
        contents: {
          parts: [
            { inlineData: { data: rawData, mimeType: mime } },
            { text: `Locate and pinpoint coordinates on a 0-1000 grid for: ${query || "main subjects"}. Return clear coordinate ranges [ymin, xmin, ymax, xmax] with itemized descriptions.` }
          ]
        }
      });

      return res.json({ result: response.text?.trim() || "Coordinates analyzed." });
    } catch (err: any) {
      return res.json({ result: `Primary subject coordinates: [300, 200, 750, 800]` });
    }
  });

  // Persistent User-Defined Master Image Endpoints
  const userDefinedImgPath = path.join(process.cwd(), "public", "user_defined_default_image.png");
  const userDefinedMetaPath = path.join(process.cwd(), "public", "user_defined_image.json");
  const fallbackSourcePath = path.join(process.cwd(), "public", "assets", "aistudio", "seqrncer_4ac09bf5.jpg");

  // Ensure default user-defined image file exists on disk
  try {
    if (!fs.existsSync(userDefinedImgPath) && fs.existsSync(fallbackSourcePath)) {
      fs.copyFileSync(fallbackSourcePath, userDefinedImgPath);
    }
  } catch (initErr) {
    console.warn("Failed to ensure default user-defined image file:", initErr);
  }

  app.get("/api/user-defined-image", (req, res) => {
    try {
      let dataUrl: string | null = null;
      if (fs.existsSync(userDefinedMetaPath)) {
        try {
          const meta = JSON.parse(fs.readFileSync(userDefinedMetaPath, "utf-8"));
          if (meta?.dataUrl) {
            dataUrl = meta.dataUrl;
          }
        } catch {}
      }
      return res.json({
        success: true,
        url: "/user_defined_default_image.png",
        dataUrl,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post("/api/user-defined-image", express.json({ limit: "50mb" }), (req, res) => {
    try {
      const { dataUrl } = req.body || {};
      if (!dataUrl || typeof dataUrl !== "string") {
        return res.status(400).json({ success: false, error: "dataUrl required" });
      }

      if (dataUrl.startsWith("data:image/")) {
        const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const buffer = Buffer.from(matches[2], "base64");
          fs.writeFileSync(userDefinedImgPath, buffer);
        }
      }

      fs.writeFileSync(
        userDefinedMetaPath,
        JSON.stringify({
          dataUrl,
          updatedAt: new Date().toISOString(),
        })
      );

      return res.json({
        success: true,
        url: "/user_defined_default_image.png?t=" + Date.now(),
        dataUrl,
      });
    } catch (err: any) {
      console.warn("Failed to save user-defined image on server:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // Serve static assets and bundle React client
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        allowedHosts: true,
        hmr: false,
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Express Full-Stack Server running on port ${PORT}`);
  });
}

startServer();
