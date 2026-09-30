import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn("GEMINI_API_KEY is not configured. Add it to .env before generating content.");
}

const ai = new GoogleGenAI({ apiKey: apiKey || "missing-key" });

const STORY_MODEL = "gemini-3.8-flash";
const IMAGE_MODEL = "gemini-3.1-flash-image";

const cleanJson = (text) => {
  const value = String(text || "").trim();
  const fenced = value.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return (fenced ? fenced[1] : value).trim();
};

const ensureConfig = () => {
  if (!apiKey) {
    const error = new Error("GEMINI_API_KEY is missing. Copy .env.example to .env and add your API key.");
    error.status = 500;
    throw error;
  }
};

export async function generateStory({
  idea = "",
  genre = "Adventure",
  tone = "Cinematic",
  artStyle = "Modern comic book",
  panels = 6
}) {
  ensureConfig();

  const safeIdea = String(idea).trim();
  if (!safeIdea) {
    throw new Error("Please enter a story idea.");
  }

  const panelCount = Math.min(12, Math.max(3, Number(panels) || 6));

  const prompt = `
You are ComicCraft, an expert comic-book writer and storyboard artist.
Create a complete original comic concept from the user's idea.

USER IDEA:
${safeIdea}

CREATIVE SETTINGS:
- Genre: ${genre}
- Tone: ${tone}
- Visual art direction: ${artStyle}
- Number of panels: ${panelCount}

Return ONLY valid JSON. No markdown fences and no commentary.

Use exactly this structure:
{
  "title": "string",
  "logline": "one sentence",
  "characters": [
    {
      "name": "string",
      "role": "string",
      "description": "string"
    }
  ],
  "panels": [
    {
      "number": 1,
      "scene": "short visual description",
      "caption": "optional narration, empty string if none",
      "dialogue": [
        { "speaker": "character name", "line": "spoken line" }
      ],
      "visualPrompt": "detailed prompt for the panel image"
    }
  ]
}

Rules:
- Produce exactly ${panelCount} panels.
- Keep character names consistent across panels.
- Make the story have a clear beginning, escalation, and ending.
- Dialogue should be concise and comic-friendly.
- Do not include copyrighted characters or imitate a living artist.
- Make visualPrompt useful for an image model and include character appearance, environment, action, lighting, camera framing, and the requested art direction.
`;

  const response = await ai.models.generateContent({
    model: STORY_MODEL,
    contents: prompt,
    config: {
      temperature: 0.9,
      maxOutputTokens: 7000,
      responseMimeType: "application/json"
    }
  });

  let story;
  try {
    story = JSON.parse(cleanJson(response.text));
  } catch {
    throw new Error("Gemini returned an invalid story format. Please try again.");
  }

  if (!story.title || !Array.isArray(story.panels)) {
    throw new Error("Gemini returned an incomplete story. Please try again.");
  }

  return story;
}

export async function generateComicImage(prompt) {
  ensureConfig();

  const enhancedPrompt = `
Create a single polished comic-book page based on the following storyboard.
Use a clean multi-panel layout with exactly the requested number of panels.
Keep recurring characters visually consistent across all panels.
Use readable speech balloons only when dialogue is provided.
Do not add a title, watermark, logo, or artist signature.
Use bold comic composition, expressive characters, clear panel borders, strong lighting,
and cinematic storytelling. Preserve the scene order from the storyboard.

STORYBOARD:
${prompt}
`;

  const interaction = await ai.interactions.create({
    model: IMAGE_MODEL,
    input: enhancedPrompt,
    response_format: {
      type: "image",
      mime_type: "image/png",
      aspect_ratio: "3:4",
      image_size: "1K"
    }
  });

  if (interaction.output_image?.data) {
    return {
      imageDataUrl: `data:image/png;base64,${interaction.output_image.data}`
    };
  }

  for (const step of interaction.steps || []) {
    if (step.type !== "model_output") continue;
    for (const block of step.content || []) {
      if (block.type === "image" && block.data) {
        const mime = block.mime_type || "image/png";
        return { imageDataUrl: `data:${mime};base64,${block.data}` };
      }
    }
  }

  throw new Error("The image model did not return an image.");
}
