# Chrome Web Store — Listing Copy

> **Status:** Copy is finalized and ready for CWS submission.
> **Remaining:** Host privacy policy at a public URL.

## Short Description (132 chars max)

Turn selected webpage text into AI summaries, explanations, searches, and task cards from a radial command wheel. Local-first, zero-telemetry.

## Full Description

WeeWoo² Wheel is a radial command wheel that appears when you select text on any webpage. Pick an action — Explain, Summarize, Search, or Create Task — and your configured AI provider generates a result you can save as a card in your local scrapbook.

**⚡ How it works:**
1. Select text on any webpage
2. The radial wheel appears near your selection
3. Click an action (Explain / Summarize / Search / Task)
4. Your AI provider processes the text
5. Review and save the result as a card

**🔒 Privacy-first:**
- All data stored locally on your device (chrome.storage + IndexedDB)
- No backend, no analytics, no telemetry, no tracking
- You bring your own API key — we never see it
- Open source — inspect the code yourself

**🎨 Features:**
- **Radial command wheel** — game-style wheel with emoji or doodle skins
- **Right-click menu** — alternative trigger for all actions
- **Agentic web search** — real-time DuckDuckGo search with LLM synthesis (optional)
- **Scrapbook side panel** — search, filter, group, export, and import saved cards
- **Customisable** — configure your own AI provider, model, prompts, theme, and language
- **Markdown rendering** — cards render with rich formatting
- **English & 中文** — bilingual UI and response support

**🛠️ Compatible providers:**
Any OpenAI-compatible API — OpenAI, Ollama (local), Groq, Together AI, OpenRouter, and more.

**📋 Requirements:**
- A compatible AI provider API key
- Chromium-based browser (Chrome, Edge, Brave, Arc, etc.)

## Category

Productivity

## Language

English (en)

## Support URL

https://github.com/gcgloven/weewoo_wheel/issues

## Privacy Policy URL

*(Host `docs/privacy-policy.md` via GitHub Pages or your own site, then paste the URL here.)*

**Recommended approach — GitHub Pages:**
1. Go to repo Settings → Pages → Source: "Deploy from a branch" → Branch: `master`, folder: `/docs`
2. The privacy policy will be available at:
   `https://gcgloven.github.io/weewoo_wheel/privacy-policy`

This URL would go in the CWS Privacy Practices field.

## Screenshots (1280×800)

| # | File | Description | Status |
|---|------|-------------|--------|
| 0 | `docs/screenshots/00-promo.png` | Promo tile — wheel, settings & sidepanel combined (1280×800) | ✅ Done |

## Release Notes (v0.1.0)

Initial public release:
- Radial command wheel with Explain, Summarize, Search, and Task actions
- Right-click context menu integration
- Agentic web search mode (DuckDuckGo + LLM)
- Scrapbook side panel with search, filter, date grouping, import/export
- Options page for provider, model, prompts, theme, language, and wheel configuration
- Light/dark theme support
- Emoji and doodle wheel skins
- English and Chinese (中文) language support
- Local-first storage — no backend, no tracking
