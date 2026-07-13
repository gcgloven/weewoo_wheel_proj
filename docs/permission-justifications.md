# Permission Justifications — WeeWoo² Wheel v0.1.0

For Chrome Web Store submission. Each permission is listed with its single-purpose justification.

| Permission | Required? | Justification |
|------------|-----------|---------------|
| `storage` | **Yes** | Stores user settings, API provider configuration, prompt templates, UI preferences (theme, language, skin), and wheel trigger mode. All data is local to the user's browser profile. |
| `activeTab` | **Yes** | Allows the extension to access the current tab's URL and title when the user interacts with the wheel or context menu. This provides source attribution for saved cards (e.g., "Summarized from example.com/page"). The permission is only activated on explicit user gesture, never on page load. |
| `sidePanel` | **Yes** | Provides the scrapbook side panel where users review, search, filter, group by date, export, import, and delete saved cards. This is a core feature of the extension. |
| `contextMenus` | **Yes** | Adds right-click menu items for selected-text actions: Explain, Summarize, Agentic Search, and Create Task. This is an alternative trigger method alongside the radial wheel. Only activates on text selection context. |
| `<all_urls>` host | **Yes** | **Core requirement.** The extension's primary purpose is to provide a radial command wheel when users select text on any webpage. Content scripts must be able to inject on all HTTP/HTTPS pages to detect text selection and render the wheel. This is the same pattern used by Grammarly, dictionary extensions, and other text-selection tools. Content scripts activate only on user text selection; they do not read, modify, or transmit page content otherwise. |
| `<all_urls>` web_accessible_resources | **Yes** | The wheel's visual assets (icon skins, emoji SVGs, doodle PNGs) are rendered inside the content script's shadow DOM on webpages. These assets must be web-accessible on the same origins where the content script runs. Narrowing this would break the wheel's appearance on non-matching origins. |

## Permissions NOT Requested

| Permission | Why Not Needed |
|------------|---------------|
| `notifications` | Removed. The extension previously used chrome.notifications for success/failure toasts, but these were non-essential. The result panel already provides in-context feedback. Side panel refresh messages are sent via `chrome.runtime.sendMessage`. |
| `tabs` | Not needed. Tab access is handled through `activeTab` on user gesture. |
| `cookies` | Not needed. No cookie access required. |
| `scripting` | Not needed. Content scripts are declared declaratively in manifest. |
| `webRequest` | Not needed. No network interception. |
| `downloads` | Not needed. Export is handled via JSON file download in the side panel. |

## Restricted-Origin Notes

- The extension does **not** inject on `chrome://`, `chrome-extension://`, or `file://` URLs (this is the default Chrome behavior for `<all_urls>` — these schemes are excluded unless explicitly listed).
- The extension has **no** access to the Chrome Web Store, Google accounts, or other privileged origins beyond standard webpage content-script injection.
- DuckDuckGo search fetching (agentic mode) only accesses `html.duckduckgo.com` — this is an explicit, user-initiated action, not background scraping.
