# Privacy Policy for WeeWoo² Wheel

**Last updated:** 2026-07-13

## TL;DR

WeeWoo² Wheel is a **local-first, zero-telemetry** browser extension. We don't have a backend, we don't collect analytics, and we never see your data. Everything stays on your device unless you explicitly send it to your own AI provider.

---

## What WeeWoo² Wheel Does

WeeWoo² Wheel is a Chrome browser extension that helps you act on text you select on webpages. When you highlight text, a radial command wheel appears letting you:

- **Explain** the selected text
- **Summarize** it
- **Search** the web about it (agentic mode)
- **Create a task** from it

Results are saved locally as cards in your browser's IndexedDB storage. You can review, search, export, and delete these cards from the scrapbook side panel.

---

## Data Storage (All Local)

All data is stored **exclusively on your device** using standard browser storage APIs:

| What | Where | Why |
|------|-------|-----|
| API key & provider settings | `chrome.storage.local` | To connect to your AI provider |
| UI preferences (theme, language, skin) | `chrome.storage.local` | To remember your settings |
| Prompt templates | `chrome.storage.local` | To customize AI behaviour |
| Saved cards (titles, bodies, tags) | IndexedDB (Dexie) | Your scrapbook of saved results |
| Source URLs & page titles | IndexedDB (Dexie) | Context for saved cards |

**None of this data is sent to WeeWoo² Wheel developers.** We have no servers, no databases, no analytics, and no telemetry of any kind.

---

## Data Sent to Third Parties

WeeWoo² Wheel sends data to **your chosen AI provider** solely to fulfil your requests:

### To Your AI Provider (configured by you)

When you use a wheel action, the following is sent to the AI provider URL and model you configure in Settings:

- The **text you selected** on the webpage
- A **system prompt** describing the action (e.g., "Explain the following text...")
- Your **API key** (for authentication with the provider)

**You are in full control** of which provider receives this data. You can use OpenAI, a compatible API, or a local model via Ollama. WeeWoo² Wheel does not intermediary, proxy, or observe these requests.

### For Agentic Web Search (if enabled)

When agentic search mode is enabled, the extension fetches search result pages from **DuckDuckGo** (html.duckduckgo.com) to find relevant web results. These search queries and result snippets are then sent to your AI provider for synthesis. DuckDuckGo's privacy policy applies to the search fetching step.

### No Other Third Parties

- No advertising networks
- No analytics services
- No crash reporters
- No CDNs or external resources (all extension assets are bundled locally)

---

## Data Retention & Deletion

- All data is stored **locally in your browser profile**.
- **Uninstalling the extension** removes all stored data (settings, cards, everything).
- You can **export** your cards as JSON from the side panel at any time.
- You can **delete individual cards** or **clear all data** from within the extension.
- You can **import** previously exported cards.

---

## Permissions Explained

WeeWoo² Wheel requests the following Chrome permissions:

| Permission | Purpose |
|------------|---------|
| `storage` | Save your settings, API key, and preferences locally |
| `activeTab` | Access the current tab's URL and title when you interact with the wheel |
| `sidePanel` | Provide the scrapbook side panel for reviewing saved cards |
| `contextMenus` | Add right-click menu items for selected-text actions |
| `<all_urls>` (host) | Allow the radial wheel to appear on any webpage where you select text |

The `<all_urls>` host permission is required because the extension's core purpose — providing a radial command wheel on selected text — needs to work across all websites. Content scripts only activate when you select text; they do not read or modify page content otherwise.

---

## Children's Privacy

WeeWoo² Wheel is not directed at children under 13. We do not knowingly collect personal information from children.

---

## Changes to This Policy

We may update this privacy policy from time to time. Changes will be reflected in the extension's listing and documentation.

---

## Contact

For privacy questions or concerns, open an issue on the extension's GitHub repository or contact the developer through the Chrome Web Store support channel.

---

## Your Rights

- You can inspect the extension's source code (it is open source).
- You can verify network requests using Chrome DevTools — the extension makes requests only to your configured AI provider and (if agentic search is enabled) DuckDuckGo.
- You can delete all data at any time by uninstalling the extension or using the built-in clear/delete functionality.
