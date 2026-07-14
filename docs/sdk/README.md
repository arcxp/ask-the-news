# @arcxp/ask-the-news-sdk

TypeScript SDK for the [Ask The News API](https://www.arcxp.com/) — submit natural-language questions against your Arc XP news corpus and receive AI-generated answers with cited articles.

Use this package if you need direct API access, are building a custom UI, or are working outside of React. If you want a ready-made React UI, see the [components package](../components/README.md) instead — it wraps this SDK.

---

## Installation

The package is published to GitHub Packages under the `@arcxp` scope. GitHub Packages requires authentication to install (a GitHub token with `read:packages`). See the [root README](../../README.md#installing-the-packages) for setup steps, then install:

```bash
npm install @arcxp/ask-the-news-sdk
```

**Requires Node >= 22.**

The package ships as a self-contained bundle in both ESM and CommonJS formats, down-levelled to ES2019 with its dependencies inlined. This means it works in environments that do not transpile `node_modules` (such as Arc Fusion's webpack).

```ts
// ESM
import { createAskTheNewsClient } from "@arcxp/ask-the-news-sdk";
```

```js
// CommonJS
const { createAskTheNewsClient } = require("@arcxp/ask-the-news-sdk");
```

---

## Quick start

Create a client by passing your API base URL and site-scoped API key:

```ts
import { createAskTheNewsClient } from "@arcxp/ask-the-news-sdk";

const client = createAskTheNewsClient({
  // Format: https://{org}-config-{env}.api.arc-cdn.net/ask
  // where {env} is "sandbox" or "prod"
  baseUrl: "https://myorg-config-sandbox.api.arc-cdn.net/ask",
  apiKey: "your-site-scoped-api-key", // sent as the X-Api-Key header
});
```

All methods return `{ data, error, response }`. Always check `error` before accessing `data`:

```ts
const { data, error, response } = await client.queryJson({
  query: "What happened at the climate summit?",
  website: "my-site",
});

if (error) {
  console.error(`HTTP ${response.status}: ${error.detail}`);
} else {
  console.log(data.answer);
}
```

---

## Usage

### Query — complete JSON response

`queryJson()` posts to `/api/v1/query-json` and waits for the full response before returning. Use this when you don't need to show progressive output.

```ts
const { data, error } = await client.queryJson({
  query: "What happened at the climate summit?",
  website: "my-site",
});

if (data) {
  console.log(data.answer);
  console.log(`Status: ${data.status}`); // "answered" | "unanswered" | "rejected"
  console.log(`Sources: ${data.sources?.length ?? 0}`);

  if (data.follow_up_questions) {
    console.log("Follow-ups:", data.follow_up_questions);
  }
}
```

### Query — SSE streaming

`queryStream()` posts to `/api/v1/query` and returns an async generator that yields typed events as they arrive from the server (Server-Sent Events, or SSE). Use this when you want to render the answer progressively as it is generated.

Events arrive in order: `message_start` → optional `intent` → `answer_status` → multiple `output_text.delta` → `generation_complete` → optional `follow_up_questions` → `message_stop`.

```ts
const result = await client.queryStream({
  query: "What happened at the climate summit?",
  website: "my-site",
});

if (result.stream) {
  for await (const event of result.stream) {
    switch (event.type) {
      case "message_start":
        console.log("Query ID:", event.query_id);
        break;
      case "intent":
        // Emitted when the query-intent feature is enabled.
        console.log("Intent:", event.intent.type);
        break;
      case "answer_status":
        console.log("Status:", event.status);
        break;
      case "output_text.delta":
        process.stdout.write(event.delta);
        break;
      case "generation_complete":
        // Fires for every outcome (answered / unanswered / rejected)
        // with final status and inline citations.
        console.log("\nComplete:", event.status);
        break;
      case "follow_up_questions":
        console.log("\nSuggested follow-ups:", event.questions);
        break;
      case "message_stop":
        console.log("\nDone");
        break;
      case "error":
        console.error(`Error ${event.status_code}: ${event.message}`);
        break;
    }
  }
}
```

### Scoping a query to sections

Pass `filters.sections.include` (up to 5 section paths, each starting with `/`) to restrict retrieval to a subset of your site:

```ts
const { data } = await client.queryJson({
  query: "What's the latest in sports?",
  website: "my-site",
  filters: { sections: { include: ["/news/sports"] } },
});
```

### Sources and citations

`sources` is a single, score-ordered list of every retrieved source — articles and videos — as a discriminated union keyed on `source_type`. `citations` maps each `[N]` marker in `answer` to a source by `document_id`.

```ts
const { data } = await client.queryJson({
  query: "What happened at the climate summit?",
  website: "my-site",
});

if (data?.sources) {
  for (const source of data.sources) {
    if (source.source_type === "article") {
      console.log(`Article: ${source.headline} (score: ${source.score})`);
    } else {
      // source.source_type === "video"
      console.log(
        `Video: ${source.transcript_id} @ ${source.start_time}–${source.end_time}`,
      );
    }
  }
}

// Resolve each inline [N] citation marker to its source.
// Video citations also carry chunk_index, start_time, and end_time
// for deep-link seeking.
for (const citation of data?.citations ?? []) {
  if (citation.source_type === "video") {
    console.log(
      `[${citation.position}] -> video ${citation.document_id} @ ${citation.start_time}`,
    );
  } else {
    console.log(`[${citation.position}] -> article ${citation.document_id}`);
  }
}
```

### Submit feedback

Record positive or negative feedback for a query response, keyed by its `query_id`:

```ts
const { data } = await client.submitFeedback({
  query_id: "11111111-1111-1111-1111-111111111111",
  website: "my-site",
  feedback: "positive", // "positive" | "negative"
  feedback_text: "This answer was helpful.", // optional
});

if (data?.recorded) {
  console.log("Feedback recorded");
}
```

### Get settings

Fetch the delivery settings for a site, including available sections and active curated questions:

```ts
const { data } = await client.getSettings("my-site");

if (data) {
  console.log(data.name);
  for (const section of data.available_sections ?? []) {
    console.log(section.path, section.name);
  }
}
```

### Using the generated types

All request and response types are exported for use in your application:

```ts
import type { components, operations } from "@arcxp/ask-the-news-sdk";

type QueryRequest = components["schemas"]["QueryRequest"];
type StreamEvent = components["schemas"]["QueryStreamEvent"];
```

---

## Error handling

All methods return `{ data, error, response }` following the [openapi-fetch](https://openapi-ts.dev/openapi-fetch/) pattern. On success, `data` is populated and `error` is `undefined`. On failure, `error` contains the API error response and `data` is `undefined`.

```ts
const { data, error, response } = await client.queryJson({
  query: "Latest news?",
  website: "my-site",
});

if (error) {
  console.error(`HTTP ${response.status}: ${error.detail}`);
} else {
  console.log(data.answer);
}
```

---

## Rate limiting

The API enforces a limit of **120 requests per minute**. Build in retry logic or request queuing if your integration may approach this limit.

---

## API reference

| Method | Endpoint | Description |
| --- | --- | --- |
| `queryJson(body)` | `POST /api/v1/query-json` | Run a query; returns a complete JSON response |
| `queryStream(body)` | `POST /api/v1/query` | Run a query; returns an SSE stream of typed events |
| `submitFeedback(body)` | `POST /api/v1/query/feedback` | Submit positive/negative feedback for a query response |
| `getSettings(website)` | `GET /api/v1/settings` | Get delivery settings for a site (sections, active questions) |
