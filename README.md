# ComicCraft - AI

**Comic Story Creator using Gemini Models**

ComicCraft is a full-stack web application that turns a simple idea into a comic-ready story and an AI-generated comic page.

## Features

- Generate a structured comic story from a simple prompt.
- Choose genre, art style, tone, and number of panels.
- Generate a comic-page image with Gemini native image generation.
- Display title, characters, panel descriptions, dialogue, captions, and image.
- Responsive modern UI.
- API key stays on the Node.js server.
- Health-check endpoint.
- Clear error messages and loading states.

## Tech stack

- React 19 + Vite
- Node.js + Express
- Google `@google/genai` SDK
- Gemini text model: `gemini-3.8-flash`
- Gemini image model: `gemini-3.1-flash-image`

Google's current JavaScript SDK is `@google/genai`; the older `@google/generative-ai` package is legacy/deprecated. See the official Gemini documentation for model availability and quotas.

## Requirements

- Node.js 20+
- A Gemini API key
- Internet access for Gemini API requests

## Setup

1. Extract the ZIP.
2. Open a terminal in the project folder.
3. Install dependencies:

```bash
npm install
```

4. Copy `.env.example` to `.env`.
5. Put your Gemini API key into `.env`:

```env
GEMINI_API_KEY=your_real_key_here
```

6. Start the app:

```bash
npm run dev
```

7. Open:

```text
http://localhost:5173
```

The Express API runs on port 5000.

## Production build

```bash
npm run build
```

To serve the built frontend with Vite preview:

```bash
npm run preview
```

## API

### `GET /api/health`

Returns the server status.

### `POST /api/story`

Body:

```json
{
  "idea": "A young astronaut finds a mysterious signal on Mars.",
  "genre": "Sci-Fi",
  "tone": "Cinematic",
  "artStyle": "Modern comic book",
  "panels": 6
}
```

Returns structured JSON containing the title, logline, characters, and panels.

### `POST /api/generate-image`

Body:

```json
{
  "prompt": "Create a 6-panel comic page..."
}
```

Returns a data URL for the generated image.

## Notes

Image generation depends on the Gemini models enabled for your API key/account. If the selected image model is unavailable for your account, the UI will show the API error instead of silently pretending an image was generated.

Do not commit `.env` or expose the Gemini API key in React code.
