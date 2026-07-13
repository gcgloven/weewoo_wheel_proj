# Product Benchmark — WeeWoo² Wheel vs. Competitors

> **Date:** 2026-07-09
> **Scope:** Chrome extensions that provide AI-powered actions on selected web text (summarize, explain, task creation, knowledge cards).

---

## Key Finding: No Radial Wheel Exists

**Zero** extensions use a game-style radial command wheel. Every competitor uses one of three interaction patterns:

| Pattern | Example | UX |
|---------|---------|-----|
| Right-click context menu | AI Text Toolkit, SimplestPrompt | Slow — buried in a menu |
| Floating toolbar/overlay | Geminify, SmartSelekt, Proactive AI | Linear button row or chat popup |
| Side panel | Merlin, Ryddle AI | Takes over half the screen |

**WeeWoo² Wheel's radial wheel is genuinely novel in this space.** It's a differentiator, not a me-too feature.

---

## Competitor Profiles

### 1. [Snap Text](https://chromewebstore.google.com/detail/snap-text/ngapfniidaedgpjkonnoppkkbffifnbp?hl=en) — ⚠️ Most Overlap

- Select text → instant AI explanation → **save to personal knowledge base** (local, searchable)
- Export to TXT, Markdown, Anki flashcards
- **Overlap:** knowledge cards, local storage, AI-on-selection
- **Difference:** no wheel, no task creation, no configurable LLM provider

### 2. [Geminify AI](https://chromewebstore.google.com/detail/geminify-ai-summarizer-as/alegbajeogbdlcklpnlihhbklgienpoj?hl=en) — ⚠️ Feature-Rich Incumbent

- Mini toolbar on text selection: Explain, Fix Text, Summarize, Chat
- Reading Mode sidebar: TL;DR, key takeaways, spark questions
- Works with Chrome Built-in AI (on-device), Gemini, or OpenRouter (Claude, Llama)
- "My Pages Library" for saved summaries
- **Overlap:** multiple AI actions on selection, BYO provider, saved content
- **Difference:** linear toolbar, not a wheel; no task cards; no customer-owned local DB

### 3. [AI Text Toolkit](https://chromewebstore.google.com/detail/ai-text-toolkit/mkfclkbjbmgfeooeijhpmkeimggjkgca)

- Right-click → Summarize, Rewrite, Translate, Explain, Extract, Reply Draft
- BYO key (OpenAI, Anthropic, Gemini)
- **Overlap:** BYO key, multiple action types
- **Difference:** right-click menu UX (2 clicks minimum), no card storage, no task creation

### 4. [SmartSelekt](https://www.producthunt.com/products/smartselekt-ai-summary-for-any-website?launch=smartselekt)

- Select → instant AI summary in an on-page popup
- Multiple modes: Short, Medium, Bullets, Explain
- Cloud-synced history
- **Overlap:** on-page popup, multiple output modes
- **Difference:** summary-only (no tasks, no knowledge cards, no configurable actions), cloud storage (privacy tradeoff)

### 5. [AI Context Clipper](https://chromewebstore.google.com/detail/ai-context-clipper/ijgldebaflmmmiffjpgimpleihmmfpjl)

- Clip selected text into "context bundles" with source metadata (title, URL, timestamp)
- Combine sources, preview prompt, export as Markdown
- All local, no account
- **Overlap:** source metadata capture (URL/title/timestamp), local-first, privacy-first
- **Difference:** no AI processing built in (you take the bundle elsewhere), no wheel, no save-as-card flow

### 6. [Simplix AI](https://github.com/apurb2509/Simplix-AI)

- Draw a crop box around page sections → AI processes
- 6 modes including Summary, Step-by-Step, Exam Gen
- "Smart Notebook" for persistent storage with priority colors
- **Overlap:** persistent card-like storage, multiple action modes
- **Difference:** crop-tool interaction (not text selection), no configurable LLM

### 7. [AI Right-Click](https://chromewebstore.google.com/detail/ai-right-click/ionfgpadenheacgkccdnkapdljdioigi)

- 8 AI actions via right-click (summarize, explain simply, translate, rewrite, fix grammar, ask questions)
- Fully on-device using Chrome's built-in Gemini Nano model
- Floating panel near cursor; no API key or internet needed
- **Overlap:** multiple action types, floating panel near cursor
- **Difference:** on-device only (no BYO key), right-click activation, no card storage

### 8. [Merlin AI](https://chromewebstore.google.com/detail/merlin-ai/camppjleccjaphfdbohjdohecfnoikec?hl=en)

- 26-in-1 extension: summarize, rewrite, translate, chat with webpages
- Ctrl+M to summon AI on any tab; side panel
- Support for ChatGPT, Gemini, Claude
- **Overlap:** multi-provider, multiple actions
- **Difference:** side-panel UX (heavy), no wheel, no local card storage, subscription-based

---

## Feature Matrix

| Capability | Snap Text | Geminify | AI Text Toolkit | SmartSelekt | AI Right-Click | Merlin | **WeeWoo² Wheel** |
|------------|-----------|----------|-----------------|-------------|----------------|--------|-------------------|
| Radial wheel UX | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | **✅ Unique** |
| AI on selection | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Summary | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Explain | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create Task cards | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | **✅ Unique** |
| Agent search action | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | **✅ Unique** |
| Local scrapbook/inbox | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Search saved cards | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| BYO LLM key | ❌ (free tier) | ✅ | ✅ | ❌ | N/A (on-device) | ❌ (subscription) | ✅ |
| Local-first / privacy | ✅ | ✅ | ✅ | ❌ (cloud) | ✅ | ❌ | ✅ |
| Configurable action slots | ❌ | ✅ (limited) | ❌ | ❌ | ❌ | ❌ | **✅ Unique** |
| Open-source | ❌ | ❌ | ✅ (GitHub) | ❌ | ❌ | ❌ | ✅ |
| Source metadata on cards | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | **✅ Unique** |
| Cost | Free (limited) | Free / Freemium | BYO key | Free | Free | $19+/mo | BYO key |

---

## WeeWoo² Wheel's Differentiation

### Genuine Differentiators

1. **Radial wheel UX** — zero competitors. Faster and more game-like than right-click menus, linear toolbars, or side panels. This is the "why would anyone switch" answer.

2. **Task creation from web text** — nobody else does structured task cards with checklists and acceptance criteria from a text selection. Snap Text and Geminify are pure knowledge/summary tools.

3. **Unified wheel → scrapbook loop** — competitors either process text OR store knowledge, rarely both in one polished flow. WeeWoo² Wheel closes the loop: capture → process → save → search — all local, all one extension.

4. **Configurable wheel slots** — users can customize which actions appear in which slot. No competitor offers this level of action customization in an on-page overlay.

### Risks

- **Snap Text and Geminify could add a wheel UI** — the moat is interaction design, not AI capability. Speed of execution matters.
- **Chrome is adding built-in AI** (Gemini Nano) — AI Right-Click already uses it. This could commoditize the "AI on selection" layer, making UX the only differentiator.
- **The space is crowded** — AI-on-selection is a known and validated category, which is both validation (the problem is real) and risk (competition is active).

### Opportunity

The competitive landscape validates the WeeWoo² Wheel thesis: **no product delivers a fast, gamified, configurable, save-as-card flow for selected web text.** The closest competitors (Snap Text, Geminify) prove the demand exists — they just don't nail the UX or the task-creation dimension.

---

## Sources

- [Snap Text — Chrome Web Store](https://chromewebstore.google.com/detail/snap-text/ngapfniidaedgpjkonnoppkkbffifnbp?hl=en)
- [Geminify AI — Chrome Web Store](https://chromewebstore.google.com/detail/geminify-ai-summarizer-as/alegbajeogbdlcklpnlihhbklgienpoj?hl=en)
- [AI Text Toolkit — Chrome Web Store](https://chromewebstore.google.com/detail/ai-text-toolkit/mkfclkbjbmgfeooeijhpmkeimggjkgca)
- [SmartSelekt — Product Hunt](https://www.producthunt.com/products/smartselekt-ai-summary-for-any-website?launch=smartselekt)
- [AI Context Clipper — Chrome Web Store](https://chromewebstore.google.com/detail/ai-context-clipper/ijgldebaflmmmiffjpgimpleihmmfpjl)
- [Simplix AI — GitHub](https://github.com/apurb2509/Simplix-AI)
- [AI Right-Click — Chrome Web Store](https://chromewebstore.google.com/detail/ai-right-click/ionfgpadenheacgkccdnkapdljdioigi)
- [Merlin AI — Chrome Web Store](https://chromewebstore.google.com/detail/merlin-ai/camppjleccjaphfdbohjdohecfnoikec?hl=en)
