# WeeWoo² Wheel — Card Import Format

Use this spec to generate valid card data for import testing.

## JSON Structure

The import file must be a **JSON array** of card objects:

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "type": "knowledge",
    "title": "DEVS Streaming Framework Overview",
    "body": "## Simple Explanation\n...\n\n## Key Terms\n- **DEVS**: ...",
    "tags": ["devs", "simulation", "json"],
    "folder": "research",
    "sourceUrl": "https://github.com/simlytics-cloud/devs-streaming",
    "sourceTitle": "DEVS Streaming Framework",
    "originalText": "The Discrete Event System Specification...",
    "createdAt": 1720800000000,
    "updatedAt": 1720800000000
  }
]
```

## Field Reference

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | string | **yes** | Any unique string. Use UUIDv4 (`crypto.randomUUID()`). Duplicate IDs are **skipped** on import. |
| `type` | string | **yes** | One of: `"knowledge"`, `"search"`, `"task"` |
| `title` | string | **yes** | Card title, displayed in sidepanel. Keep under 120 chars. |
| `body` | string | **yes** | Card body — supports Markdown (`##`, `-`, `**bold**`, etc.). |
| `tags` | string[] | **yes** | Array of lowercase tags. Can be empty: `[]` |
| `folder` | string | **no** | Defaults to `"no_folder"` if missing. Any string is valid. |
| `sourceUrl` | string | **yes** | URL the content was selected from. Can be empty: `""` |
| `sourceTitle` | string | **yes** | Page title. Can be empty: `""` |
| `originalText` | string | **yes** | The originally selected/highlighted text. Can be empty: `""` |
| `createdAt` | number | **yes** | Unix timestamp in milliseconds. Use `Date.now()`. |
| `updatedAt` | number | **yes` | Same format as createdAt. |

## Type Guidance

The `body` field content should match the `type`:

| Type | Body should contain |
|------|-------------------|
| `"knowledge"` | A response with `## Simple Explanation` (Explain) OR `## Summary` (Summary) |
| `"search"` | A search result with synthesized answer |
| `"task"` | A response with `## Task`, `## Checklist`, `## Acceptance Criteria` |

## Import Behavior

- **Duplicate IDs** are silently skipped (card kept as-is)
- **Missing `folder`** → assigned `"no_folder"`
- **Missing `tags`** → empty array
- **Malformed JSON** → import fails with error toast
- **Not an array** → import fails with "Invalid import format" error

## Minimal Valid Example

```json
[
  {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "type": "knowledge",
    "title": "RAG Basics",
    "body": "## Simple Explanation\nRetrieval Augmented Generation combines...\n\n## Key Terms\n- **RAG**: ...",
    "tags": ["rag", "ai"],
    "folder": "no_folder",
    "sourceUrl": "https://example.com/rag",
    "sourceTitle": "RAG Guide",
    "originalText": "RAG combines retrieval with generation",
    "createdAt": 1720800000000,
    "updatedAt": 1720800000000
  }
]
```

## Multi-Card Example (All Types + Folders)

```json
[
  {
    "id": "10000000-0000-0000-0000-000000000001",
    "type": "knowledge",
    "title": "What is DEVS-SF",
    "body": "## Simple Explanation\nThe DEVS Streaming Framework...\n\n## Key Terms\n- **DEVS**: ...",
    "tags": ["devs"],
    "folder": "research",
    "sourceUrl": "https://github.com/example/devs",
    "sourceTitle": "DEVS-SF",
    "originalText": "DEVS Streaming Framework",
    "createdAt": 1720800000000,
    "updatedAt": 1720800000000
  },
  {
    "id": "10000000-0000-0000-0000-000000000002",
    "type": "knowledge",
    "title": "Streaming Protocols Summary",
    "body": "## Summary\nKafka is a distributed streaming...\n\n## Key Points\n- High throughput\n- Fault tolerant\n- Scalable",
    "tags": ["kafka", "streaming"],
    "folder": "research",
    "sourceUrl": "https://kafka.apache.org",
    "sourceTitle": "Apache Kafka",
    "originalText": "Apache Kafka is a distributed...",
    "createdAt": 1720800000000,
    "updatedAt": 1720800000000
  },
  {
    "id": "10000000-0000-0000-0000-000000000003",
    "type": "search",
    "title": "RFC 6761 Special-Use Domains",
    "body": "RFC 6761 defines special-use domain names...\n\nSources:\n- https://datatracker.ietf.org/doc/rfc6761/",
    "tags": ["rfc", "dns"],
    "folder": "reference",
    "sourceUrl": "https://datatracker.ietf.org/doc/rfc6761/",
    "sourceTitle": "RFC 6761",
    "originalText": "RFC 6761",
    "createdAt": 1720800000000,
    "updatedAt": 1720800000000
  },
  {
    "id": "10000000-0000-0000-0000-000000000004",
    "type": "task",
    "title": "Implement Kafka Consumer",
    "body": "## Task\nImplement Kafka Consumer\n\n## Context\n...\n\n## Checklist\n- [ ] Set up consumer config\n- [ ] Implement message handler\n\n## Acceptance Criteria\n- Consumer processes 1000 msg/s",
    "tags": ["kafka", "dev"],
    "folder": "sprint-23",
    "sourceUrl": "",
    "sourceTitle": "",
    "originalText": "Need to implement a Kafka consumer",
    "createdAt": 1720800000000,
    "updatedAt": 1720800000000
  }
]
```
