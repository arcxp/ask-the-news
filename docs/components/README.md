# @arcxp/ask-the-news-components

React component library for [Ask The News](https://www.arcxp.com/) — drop a conversational, sources-backed news answering experience into any React app. Includes streaming AI answers, inline citations, suggested follow-up questions, and optional ad slots.

This package wraps the [`@arcxp/ask-the-news-sdk`](../sdk/README.md) — you do not need to install the SDK separately.

---

## Installation

The package is published to GitHub Packages under the `@arcxp` scope. GitHub Packages requires authentication to install (a GitHub token with `read:packages`). See the [root README](../../README.md#installing-the-packages) for setup steps, then install:

```bash
npm install @arcxp/ask-the-news-components
```

**Requires Node >= 22, and React 18 or 19** (peer dependencies provided by your app, not bundled).

---

## Quick start

Wrap your app (or the relevant section of it) in `<AskProvider>` and drop in `<AskChat />`. Import the stylesheet so the components render correctly:

```tsx
import { AskProvider, AskChat } from "@arcxp/ask-the-news-components";
import "@arcxp/ask-the-news-components/styles.css";

export function App() {
  return (
    <AskProvider baseUrl={ATN_BASE_URL} apiKey={ATN_API_KEY} website="my-site">
      <AskChat />
    </AskProvider>
  );
}
```

That is the complete integration for the common case. `<AskChat />` handles the full flow: a landing view with suggested questions, submission, streaming the answer, displaying sources, and collecting feedback.

Everything below covers optional configuration and lower-level building blocks.

---

## Configuration — `<AskProvider>`

`<AskProvider>` is required. Every exported component and hook must be rendered inside one. It supplies the API configuration to all child components through React context — no environment variables needed.

| Prop | Type | Required | Description |
| --- | --- | --- | --- |
| `baseUrl` | `string` | Yes | API base URL (e.g. `https://myorg-config-sandbox.api.arc-cdn.net/ask`) |
| `website` | `string` | Yes | Site identifier (e.g. `my-site`) |
| `apiKey` | `string` | One of these | Static API key, sent as the `X-Api-Key` header |
| `resolveApiKey` | `() => string \| Promise<string>` | One of these | Per-request resolver — use this to decrypt or refresh the key on each call |

**Static key:**
```tsx
<AskProvider baseUrl={ATN_BASE_URL} apiKey={ATN_API_KEY} website="my-site">
```

**Per-request resolver** (for token decryption or refresh flows):
```tsx
<AskProvider baseUrl={ATN_BASE_URL} resolveApiKey={() => fetchFreshToken()} website="my-site">
```

---

## The exported API

There are three tiers. Most integrators only need the first one.

### 1. Drop-in experience

| Export | Kind | Description |
| --- | --- | --- |
| `AskChat` | Component | The full Ask experience — landing view with greeting and suggested questions, transitions into the streamed answer view. The component most integrators use. |

### 2. Composable views and inputs

For teams who want to assemble the layout themselves:

| Export | Kind | Description |
| --- | --- | --- |
| `AskLandingView` | Component | Pre-question landing state (greeting, suggested questions, search box) |
| `AskAnswerView` | Component | Answer state (streamed answer body, sources, related questions, feedback) |
| `SearchBox` | Component | Composed search entry widget |
| `SearchInput` | Component | Lower-level auto-growing input with ghost completion. Exported alongside `DEFAULT_DISCLAIMER`. |
| `AnswerCard` | Component | Renders one streamed answer with hero image, sources drawer, and feedback controls |
| `AdSlot` | Component | Ad placement slot. Exported with its `AdVariant` type. |

### 3. Hooks (headless building blocks)

For fully custom UIs that reuse the data and streaming logic without the built-in markup:

| Export | Description | Exported types |
| --- | --- | --- |
| `useAskConversation` | Manages the full conversation: submitting queries, streaming answers, and thread continuity | `AskConversation`, `QuestionsStatus` |
| `useAtnClient` | Builds the configured SDK client from provider context | — |
| `useActiveQuestions` | Fetches the active/suggested questions — site-wide from settings, or scoped to one article via the `articleId` option | `ActiveQuestions`, `ActiveQuestion` |
| `useQuestionAnswerStream` | Lower-level single question-to-answer SSE stream | `AnswerStreamStatus` |

### Configuration types

| Export | Kind | Description |
| --- | --- | --- |
| `AskProvider` | Component | Context wrapper (see above) |
| `useAskConfig` | Hook | Reads the injected config from context (used internally; exported for advanced cases) |
| `AskConfig`, `AskProviderProps` | Types | Shape of the config object and provider props |

### Shared data types

`Answer`, `AnswerStatus`, `Video`, `Source`, `StreamVideoSource` — the core data-model types for typing your own data or reading hook results.

---

## Customization

### Deep-linking to a query

To auto-submit a question on load (for example, from a `?q=` URL parameter), pass `initialQuery` to `<AskChat />`. There is no built-in router dependency — read the URL parameter yourself using whatever routing library you use:

```tsx
<AskChat initialQuery={new URLSearchParams(location.search).get("q") ?? undefined} />
```

### Fallback images

Source, video, and hero images come from your data (`source.images[…].thumbnail_url`, `source.thumbnail_url`, `answer.heroImageUrl`). When an item has no image, you can either:

- Pass `fallbackImageUrl` to supply a placeholder image of your own:
  ```tsx
  <AskChat fallbackImageUrl="https://example.com/placeholder.png" />
  ```
- Omit it — missing images render a neutral built-in placeholder (no external image is loaded).

### Theming

The stylesheet defines design tokens as CSS custom properties on `:root`. Override them in your own stylesheet to match your brand:

```css
:root {
  --primary: oklch(0.55 0.22 264);
  --background: #fff;
  --radius: 0.75rem;
}
```

---

## Further reading

- If you need raw API access or are working outside React, see the [SDK docs](../sdk/README.md).
- For running the demo app, see the [root README](../../README.md#running-the-demo-app).
