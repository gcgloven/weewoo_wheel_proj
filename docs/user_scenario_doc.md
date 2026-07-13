# User Scenario Documentation — WeeWoo² Wheel Browser Plugin MVP

## 1. Product Name

**WeeWoo² Wheel**

## 2. Product One-Liner

**WeeWoo² Wheel is an AI radial command wheel that turns selected web text into summaries, tasks, and flashcards in one click.**

## 3. Product Purpose

WeeWoo² Wheel is designed for users who process information faster than they can manually copy, paste, prompt, click, organize, and revisit.

The plugin gives users a fast AI command layer directly inside the browser:

```text
Highlight web text
↓
Open radial wheel
↓
Choose quick action
↓
Generate useful output
↓
Save as a card
↓
Revisit later
```

The goal is not to create another chatbot. The goal is to create a **one-click capture and processing wheel** for web reading, research, task creation, and knowledge review.

---

## 4. Core User Problem

Users often find useful information while browsing, but the current workflow is slow:

```text
Highlight text
→ copy
→ open ChatGPT
→ paste
→ write prompt
→ wait for answer
→ copy result
→ open notes/task app
→ organize manually
```

This breaks flow and creates friction.

WeeWoo² Wheel solves this by making selected text immediately actionable.

---

## 5. Core Product Loop

```text
Select text
→ Summon WeeWoo² Wheel
→ Choose action
→ AI processes selected text
→ Save result as card
→ Review/search later
```

The main user promise:

> **One selection. One wheel. Instant summary, task, or memory card.**

---

## 6. Target User Persona

### Fast-Thinking Research / Builder User

The user reads many webpages, papers, blogs, documentation pages, GitHub issues, product pages, and technical discussions.

They want to quickly capture useful information without switching between multiple tabs, apps, or chat windows.

### User Goals

```text
Understand selected text quickly
Create structured summaries
Turn selected ideas into task cards
Create flashcards for review
Save useful web knowledge
Search captured cards later
Use own LLM API keys and models
```

---

## 7. MVP Interaction Design

When the user highlights text on a webpage, a game-like radial command wheel appears.

```text
              Explain

   Summary       ●       Create Task

             Flashcard
```

Each action generates a result and allows the user to save it as a reusable card.

---

# 8. Main User Scenario — Capture Web Text with WeeWoo² Wheel

## Scenario

The user is reading a webpage and finds a useful paragraph. They want to quickly process it without leaving the page.

## User Story

As a user, I want to highlight web text and open a radial AI command wheel, so that I can instantly summarize, understand, task, or save the information for later.

## Preconditions

```text
User has installed the Chrome extension
User is browsing a webpage
User has configured an LLM provider or uses the default provider setting
```

## Main Flow

```text
1. User highlights text on a webpage.
2. WeeWoo² Wheel appears near the selected text.
3. User chooses one quick action:
   - Summary
   - Explain
   - Create Task
   - Flashcard
4. Plugin captures selected text, page title, URL, and timestamp.
5. Plugin sends the selected text to the selected LLM provider.
6. AI generates the requested output.
7. Result appears in a compact result panel.
8. User edits or accepts the result.
9. User saves the result as a card.
10. Card is stored in the local knowledge base.
11. User can revisit the card later.
```

## Acceptance Criteria

```text
Radial wheel appears after text selection.
Selected text is captured correctly.
User can choose one of the quick actions.
AI output is generated in the result panel.
User can save output as a reusable card.
Saved card includes source URL, page title, timestamp, and original text.
```

---

# 9. Scenario — Create Summary Card

## Scenario

The user is reading a long article and wants to save the key idea from a selected paragraph.

## User Story

As a user, I want to summarize selected web text, so that I can save the key points without manually writing notes.

## Flow

```text
1. User highlights a paragraph.
2. User selects “Summary” from WeeWoo² Wheel.
3. AI generates a concise summary.
4. User reviews the summary.
5. User saves it as a Knowledge Card.
```

## Output Card

```markdown
# Knowledge Card

## Title
Generated title

## Summary
Concise explanation of selected text.

## Key Points
- Key point 1
- Key point 2
- Key point 3

## Source
Page title, URL, timestamp

## Original Text
Selected text
```

---

# 10. Scenario — Explain Difficult Text

## Scenario

The user reads a difficult technical, financial, or research paragraph and wants a clearer explanation.

## User Story

As a user, I want WeeWoo² Wheel to explain selected text, so that I can understand difficult content without leaving the page.

## Flow

```text
1. User highlights difficult text.
2. User selects “Explain.”
3. AI explains the text in clear language.
4. AI extracts important terms if relevant.
5. User saves the result as a Knowledge Card.
```

## Output Card

```markdown
# Explanation Card

## Simple Explanation
...

## Key Terms
- Term 1: explanation
- Term 2: explanation

## Why It Matters
...

## Source
Page title, URL, timestamp
```

---

# 11. Scenario — Create Task Card

## Scenario

The user reads an idea that should become an action item or implementation task.

## User Story

As a user, I want to convert selected web text into a structured task, so that I can act on it later.

## Flow

```text
1. User highlights text describing an idea, requirement, bug, or research direction.
2. User selects “Create Task.”
3. AI converts the selected text into a structured task.
4. User reviews and edits the task.
5. User saves it as a Task Card.
```

## Output Card

```markdown
# Task Card

## Task
Generated task title

## Context
Why this task exists.

## Checklist
- Step 1
- Step 2
- Step 3

## Acceptance Criteria
- Criteria 1
- Criteria 2

## Status
Draft

## Source
Page title, URL, timestamp
```

---

# 12. Scenario — Create Flashcard

## Scenario

The user finds a concept they want to remember and review later.

## User Story

As a user, I want to create a flashcard from selected text, so that I can remember important knowledge through review.

## Flow

```text
1. User highlights a concept or definition.
2. User selects “Flashcard.”
3. AI generates a question-and-answer pair.
4. User edits the flashcard if needed.
5. User saves it to the review queue.
```

## Output Card

```markdown
# Flashcard

## Question
Generated question

## Answer
Generated answer

## Source
Page title, URL, timestamp

## Original Text
Selected text
```

---

# 13. Scenario — Review Saved Cards Later

## Scenario

The user wants to revisit previously captured knowledge, tasks, and flashcards.

## User Story

As a user, I want a card inbox, so that I can review and search information I saved earlier.

## Flow

```text
1. User clicks the WeeWoo² Wheel extension icon.
2. Side panel opens.
3. User sees saved cards grouped by type and date.
4. User filters by Knowledge, Task, or Flashcard.
5. User opens a card.
6. User edits, deletes, copies, or reviews the card.
```

## Card Inbox Example

```text
Today
- Knowledge: Chrome Extension Manifest V3
- Task: Build radial wheel prototype
- Flashcard: What is RAG?

Yesterday
- Knowledge: MQTT vs gRPC latency
- Task: Compare search API providers
```

---

# 14. Scenario — Search Personal Knowledge Base

## Scenario

The user wants to find previous notes related to a topic.

## User Story

As a user, I want to search saved cards, so that I can reuse information I captured before.

## Flow

```text
1. User opens the card inbox.
2. User searches for a topic.
3. Plugin returns matching cards.
4. User opens the relevant card.
```

## MVP Search Scope

```text
Search by title
Search by card content
Search by tags
Search by source page
```

Later version:

```text
Semantic search
Simple RAG over saved cards
Ask My Knowledge action
```

---

# 15. Scenario — Configure LLM Provider

## Scenario

The user wants to use their own API key and preferred LLM provider.

## User Story

As a user, I want to configure my LLM provider, API key, and model, so that I can control cost, quality, and privacy.

## Flow

```text
1. User opens Settings.
2. User selects provider:
   - OpenAI
   - Claude
   - DeepSeek
   - GLM / Z.AI
   - Custom OpenAI-compatible endpoint
3. User enters API key.
4. Plugin validates provider configuration.
5. User selects default model.
6. Settings are saved.
```

## Acceptance Criteria

```text
User can add at least one LLM provider.
User can select default model.
Plugin can call the selected model.
API key is not exposed to webpage scripts.
Provider errors are shown clearly.
```

---

# 16. MVP Functional Requirements

| ID     | Requirement                                                |
| ------ | ---------------------------------------------------------- |
| FR-001 | Detect selected text on webpage                            |
| FR-002 | Show WeeWoo² radial wheel after text selection             |
| FR-003 | Provide Summary quick action                               |
| FR-004 | Provide Explain quick action                               |
| FR-005 | Provide Create Task quick action                           |
| FR-006 | Provide Flashcard quick action                             |
| FR-007 | Show AI result in compact result panel                     |
| FR-008 | Allow user to edit result before saving                    |
| FR-009 | Save generated output as card                              |
| FR-010 | Store source URL, page title, timestamp, and original text |
| FR-011 | Provide local card inbox                                   |
| FR-012 | Support keyword search over saved cards                    |
| FR-013 | Support LLM provider configuration                         |
| FR-014 | Support API key input                                      |
| FR-015 | Allow copying card as Markdown                             |

---

# 17. MVP Non-Functional Requirements

| Area          | Requirement                                                   |
| ------------- | ------------------------------------------------------------- |
| Speed         | Wheel should appear quickly after text selection              |
| Privacy       | Do not send selected text until user chooses an action        |
| Security      | API keys should not be injected into webpage DOM              |
| Usability     | User should capture useful text in fewer than 3 clicks        |
| Storage       | Cards should persist across browser restarts                  |
| Extensibility | Quick actions should be prompt-template driven                |
| Reliability   | Should work on common webpages, blogs, docs, and GitHub pages |

---

# 18. MVP Out of Scope

```text
System-wide desktop overlay
Full autonomous agent execution
Cloud sync
Team collaboration
Email/calendar integration
Advanced spaced repetition
Multi-document RAG
PDF OCR
Browser automation
Complex multi-agent task execution
```

---

# 19. MVP Success Criteria

The MVP is successful if a user can:

```text
Highlight text on a webpage
Open WeeWoo² Wheel
Generate summary, explanation, task, or flashcard
Save the result as a card
Review saved cards later
Search saved cards
Use their own LLM provider/API key
```

The key validation question:

> **Does WeeWoo² Wheel make web reading, capturing, and task creation faster than copy-pasting into ChatGPT manually?**

---

# 20. Final MVP Definition

**WeeWoo² Wheel is a Chrome browser plugin that shows a game-style AI radial command wheel when users highlight web text. It lets users summarize, explain, create tasks, and generate flashcards in one click. Each output can be saved as a reusable card in a local knowledge base for later review and search.**
