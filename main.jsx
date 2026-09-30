import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const DEFAULTS = {
  idea: "A shy street magician discovers that every trick he performs changes one small part of his city.",
  genre: "Adventure",
  tone: "Cinematic",
  artStyle: "Modern comic book",
  panels: 6
};

async function api(path, body) {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "Request failed.");
  }
  return data;
}

function App() {
  const [form, setForm] = useState(DEFAULTS);
  const [story, setStory] = useState(null);
  const [image, setImage] = useState("");
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [error, setError] = useState("");

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const createStory = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setStory(null);
    setImage("");

    try {
      const data = await api("/api/story", form);
      setStory(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createImage = async () => {
    if (!story) return;
    setImageLoading(true);
    setError("");

    const storyboard = story.panels
      .map((panel) => {
        const dialogue = (panel.dialogue || [])
          .map((line) => `${line.speaker}: "${line.line}"`)
          .join(" | ");

        return `PANEL ${panel.number}
Scene: ${panel.scene}
Caption: ${panel.caption || "None"}
Dialogue: ${dialogue || "None"}
Visual prompt: ${panel.visualPrompt}`;
      })
      .join("\n\n");

    try {
      const data = await api("/api/generate-image", { prompt: storyboard });
      setImage(data.imageDataUrl);
    } catch (err) {
      setError(err.message);
    } finally {
      setImageLoading(false);
    }
  };

  const downloadImage = () => {
    if (!image) return;
    const link = document.createElement("a");
    link.href = image;
    link.download = `${story?.title || "comiccraft-comic"}.png`;
    link.click();
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">CC</div>
          <div>
            <strong>ComicCraft</strong>
            <span>AI Story Studio</span>
          </div>
        </div>
        <div className="gemini-badge">✦ Powered by Gemini</div>
      </header>

      <main className="main">
        <section className="hero">
          <div>
            <p className="eyebrow">CREATE • WRITE • VISUALIZE</p>
            <h1>Turn your idea into a <span>comic.</span></h1>
            <p className="hero-copy">
              Describe a world, character, or wild idea. ComicCraft uses Gemini to
              write the story and build a ready-to-share comic page.
            </p>
          </div>
          <div className="hero-orbit" aria-hidden="true">
            <div className="orbit-card card-one">POW!</div>
            <div className="orbit-card card-two">WOW!</div>
            <div className="orbit-card card-three">✦</div>
          </div>
        </section>

        <div className="workspace">
          <section className="panel-card creator-card">
            <div className="section-heading">
              <div>
                <p className="eyebrow">01 / STORY BUILDER</p>
                <h2>What happens?</h2>
              </div>
              <span className="step-pill">Gemini</span>
            </div>

            <form onSubmit={createStory}>
              <label>
                Story idea
                <textarea
                  value={form.idea}
                  onChange={(e) => update("idea", e.target.value)}
                  placeholder="Example: A robot detective solves a mystery in a floating city..."
                  rows={6}
                />
              </label>

              <div className="field-grid">
                <label>
                  Genre
                  <select value={form.genre} onChange={(e) => update("genre", e.target.value)}>
                    <option>Adventure</option>
                    <option>Fantasy</option>
                    <option>Sci-Fi</option>
                    <option>Mystery</option>
                    <option>Comedy</option>
                    <option>Superhero</option>
                    <option>Horror</option>
                  </select>
                </label>

                <label>
                  Tone
                  <select value={form.tone} onChange={(e) => update("tone", e.target.value)}>
                    <option>Cinematic</option>
                    <option>Funny</option>
                    <option>Dark</option>
                    <option>Wholesome</option>
                    <option>Epic</option>
                    <option>Suspenseful</option>
                  </select>
                </label>

                <label>
                  Art style
                  <select value={form.artStyle} onChange={(e) => update("artStyle", e.target.value)}>
                    <option>Modern comic book</option>
                    <option>Manga-inspired</option>
                    <option>Saturday morning cartoon</option>
                    <option>Graphic novel</option>
                    <option>Retro pulp comic</option>
                  </select>
                </label>

                <label>
                  Panels
                  <select value={form.panels} onChange={(e) => update("panels", Number(e.target.value))}>
                    <option value="3">3 panels</option>
                    <option value="4">4 panels</option>
                    <option value="6">6 panels</option>
                    <option value="8">8 panels</option>
                    <option value="10">10 panels</option>
                    <option value="12">12 panels</option>
                  </select>
                </label>
              </div>

              <button className="primary-button" type="submit" disabled={loading}>
                {loading ? <><span className="spinner" /> Writing your comic...</> : <>✦ Generate Story</>}
              </button>
            </form>

            {error && <div className="error-box">⚠ {error}</div>}
          </section>

          <section className="panel-card result-card">
            {!story ? (
              <div className="empty-state">
                <div className="empty-icon">✎</div>
                <h2>Your comic appears here</h2>
                <p>Generate a story to see the title, characters, dialogue, and panel storyboard.</p>
                <div className="feature-row">
                  <span>✦ Story</span>
                  <span>◈ Characters</span>
                  <span>▣ Panels</span>
                </div>
              </div>
            ) : (
              <>
                <div className="result-header">
                  <div>
                    <p className="eyebrow">02 / STORYBOARD</p>
                    <h2>{story.title}</h2>
                    <p className="logline">{story.logline}</p>
                  </div>
                  <button className="secondary-button" onClick={createImage} disabled={imageLoading}>
                    {imageLoading ? <><span className="spinner dark" /> Drawing...</> : "▣ Generate Comic Page"}
                  </button>
                </div>

                <div className="character-list">
                  {story.characters?.map((character) => (
                    <article className="character" key={character.name}>
                      <div className="avatar">{character.name.charAt(0).toUpperCase()}</div>
                      <div>
                        <strong>{character.name}</strong>
                        <span>{character.role}</span>
                        <p>{character.description}</p>
                      </div>
                    </article>
                  ))}
                </div>

                <div className="storyboard">
                  {story.panels?.map((panel) => (
                    <article className="story-panel" key={panel.number}>
                      <div className="panel-number">{String(panel.number).padStart(2, "0")}</div>
                      <div>
                        <h3>{panel.scene}</h3>
                        {panel.caption && <p className="caption">“{panel.caption}”</p>}
                        {(panel.dialogue || []).map((line, index) => (
                          <div className="dialogue" key={`${line.speaker}-${index}`}>
                            <b>{line.speaker}</b>
                            <span>“{line.line}”</span>
                          </div>
                        ))}
                      </div>
                    </article>
                  ))}
                </div>
              </>
            )}
          </section>
        </div>

        {image && (
          <section className="panel-card comic-preview">
            <div className="section-heading">
              <div>
                <p className="eyebrow">03 / FINAL ART</p>
                <h2>Your comic page</h2>
              </div>
              <button className="secondary-button" onClick={downloadImage}>↓ Download PNG</button>
            </div>
            <div className="image-wrap">
              <img src={image} alt={`${story?.title || "Comic"} generated page`} />
            </div>
          </section>
        )}
      </main>

      <footer>
        <span>ComicCraft AI</span>
        <span>Built with React + Express + Gemini</span>
      </footer>
    </div>
  );
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
