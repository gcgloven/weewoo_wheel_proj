# WeeWoo² Wheel

> AI radial command wheel that turns selected web text into summaries, tasks, and knowledge cards in one click.

A Chrome MV3 browser extension (WXT + React 18 + TypeScript) that shows a game-style AI radial command wheel when users highlight text on any webpage. Actions (Explain, Summary, Agent Search, Create Task) call an OpenAI-compatible LLM and save results as cards in IndexedDB (Dexie).

**All 9 MVP phases complete.** **Agentic web search (Tier A→B→C) added.**

## Quick Start

```bash
pnpm install
pnpm dev            # Dev build with HMR
pnpm build          # Prod build → .output/chrome-mv3/
pnpm test:unit      # 52 tests across 11 suites
pnpm zip            # CWS store zip
```

Load unpacked: `chrome://extensions` → Dev mode → `weewooweeoo/.output/chrome-mv3`

## Features

- 🎡 **Radial command wheel** — game-style overlay on text selection (highlight or right-click trigger)
- 🤖 **4 AI actions** — Explain, Summary, Agent Search, Create Task
- 🌐 **Agentic web search** — A→B→C progressive fallback:
  - **Tier A**: LLM tool calling → real DuckDuckGo scraping → synthesized answer with source links
  - **Tier B**: Direct DuckDuckGo scraping → LLM synthesis (no tool calling needed)
  - **Tier C**: Knowledge-only LLM answer (no web search, no hallucinated sources)
- 📇 **Scrapbook side panel** — browse, search, filter, group by date/source/past hour, export/import cards
- 🎨 **Dark/light mode** — full theme token system, auto-syncs across all surfaces
- 🌍 **i18n** — English and 中文 (Chinese) for settings, sidepanel, and wheel labels
- 🖌️ **Doodle skin pack** — hand-drawn icon buttons with paper-tone color palette
- ⚙️ **Configurable** — BYO LLM key, model, max tokens, wheel trigger mode
- 🔒 **Local-first** — all data in IndexedDB, no remote backend

## Architecture

```
Text selection → Radial wheel → Pick action → Background LLM call
  → Result panel → Auto-save → IndexedDB → Scrapbook side panel
```

| Layer | Key Files |
|-------|-----------|
| Types | `src/lib/types.ts` |
| DB | `src/lib/db.ts` (Dexie CRUD) |
| Provider | `src/lib/provider.ts` (OpenAI-compatible + tool calling) |
| Search | `src/lib/search/` (A→B→C orchestrator, DDG scraping, capability probe) |
| Dispatch | `src/lib/dispatch.ts` (runAction + auto-enrich) |
| Theme | `src/lib/theme.ts` (DARK/LIGHT token system) |
| i18n | `src/lib/i18n.ts` (EN/ZH translations) |
| Settings | `src/lib/settings.ts` (chrome.storage.local) |
| Wheel | `entrypoints/content/Wheel.tsx` |
| Sidepanel | `entrypoints/sidepanel/App.tsx` |
| Options | `entrypoints/options/App.tsx` |
| Skin assets | `public/skins/` (doodle PNGs, sidepanel SVGs, wheel icon) |

## Docs

- Implementation plan: `../docs/plan/`
- Progress logs: `../docs/progress/`
- MVP delivery report: `../docs/mvp-delivery-report.md`
- Competitive benchmark: `../docs/product_benchmark.md`
- User scenario doc: `../docs/user_scenario_doc.md`

## Test Suites

- **14 unit + integration suites** using Jest + jest-chrome + fake-indexeddb
- **E2E** runner (`tests/e2e/run.ts`) using tsx + Puppeteer

```bash
pnpm test             # Unit + integration (13/14 passing)
pnpm test:unit        # Unit tests only
pnpm test:integration # Integration tests only
```
