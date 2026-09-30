import "dotenv/config";
import express from "express";
import cors from "cors";
import { generateStory, generateComicImage } from "./gemini.js";

const app = express();
const PORT = Number(process.env.PORT || 5000);

app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "ComicCraft AI",
    configured: Boolean(process.env.GEMINI_API_KEY)
  });
});

app.post("/api/story", async (req, res) => {
  try {
    const result = await generateStory(req.body || {});
    res.json(result);
  } catch (error) {
    console.error("Story generation error:", error);
    res.status(500).json({
      error: error?.message || "Unable to generate the story."
    });
  }
});

app.post("/api/generate-image", async (req, res) => {
  try {
    const { prompt } = req.body || {};
    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ error: "A comic image prompt is required." });
    }

    const result = await generateComicImage(prompt);
    res.json(result);
  } catch (error) {
    console.error("Image generation error:", error);
    res.status(500).json({
      error: error?.message || "Unable to generate the comic image."
    });
  }
});

app.use((err, _req, res, _next) => {
  console.error("Unhandled server error:", err);
  res.status(500).json({ error: "Unexpected server error." });
});

app.listen(PORT, () => {
  console.log(`ComicCraft API running at http://localhost:${PORT}`);
});
