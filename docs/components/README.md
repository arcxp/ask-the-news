# @arcxp/ask-the-news-components

React component library for [Ask The News](https://www.arcxp.com/) — drop a conversational, sources-backed news answering experience into any React app. Includes streaming AI answers, inline citations, and suggested follow-up questions.

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

Wrap your app (or the relevant section of it) in `<AskProvider>` and drop in `<AskChat />`. Import the stylesheet once, before your own stylesheets (so your CSS wins any conflict — see [Theming](#theming)):

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

> **The stylesheet import is required.** Styles are not injected at runtime — without the `styles.css` import the components render unstyled. The stylesheet is safe to add to any page: no global resets, all design tokens are `--atn-*` prefixed, and your own CSS keeps precedence (see [How the styles coexist with yours](#how-the-styles-coexist-with-yours)).

Everything below covers optional configuration and lower-level building blocks.

---

## Configuration — `<AskProvider>`

`<AskProvider>` is required. Every exported component and hook must be rendered inside one. It supplies the API configuration to all child components through React context — no environment variables needed.

| Prop | Type | Required | Description |
| --- | --- | --- | --- |
| `baseUrl` | `string` | Yes | API base URL (e.g. `https://myorg-config-sandbox.api.arc-cdn.net/ask`) |
| `website` | `string` | Yes | Site identifier (e.g. `my-site`) |
| `apiKey` | `string` | Yes | API key, sent as the `X-Api-Key` header |
| `queryOptions` | `AskQueryOptions` | No | Default query options applied to every query sent under this provider (see below) |

```tsx
<AskProvider baseUrl={ATN_BASE_URL} apiKey={ATN_API_KEY} website="my-site">
```

### Query options — `AskQueryOptions`

Controls query behavior without dropping down to the SDK. Set it once on `<AskProvider>`, or per experience via the `queryOptions` prop on `<AskChat />` / the `queryOptions` option of `useAskConversation` (per-experience values win over the provider's). Every field is optional — an unset field is omitted from the request and the API's own default applies, so existing integrations are unaffected.

| Field | Type | API default | Description |
| --- | --- | --- | --- |
| `inlineCitations` | `boolean` | `true` | Whether answers carry `[N]` inline-citation markers and a citations mapping. Set `false` for plain-prose answers with no markers. |
| `filters` | `AskQueryFilters` | none (whole site) | Retrieval filters, mirroring the API's `filters` request block. `{ sections: { include: [...] } }` scopes retrieval to up to 5 section paths (each starting with `/`, matching the paths used at ingestion). |

```tsx
// Site-wide: plain-prose answers everywhere under this provider.
<AskProvider baseUrl={ATN_BASE_URL} apiKey={ATN_API_KEY} website="my-site" queryOptions={{ inlineCitations: false }}>

// Or per experience, overriding the provider — e.g. a politics-page Ask
// experience scoped to two sections:
<AskChat queryOptions={{ filters: { sections: { include: ["/politics", "/elections"] } } }} />
```

Overrides resolve per field: an experience-level `inlineCitations` or `filters` each replace the provider's value for that field independently (`filters` is replaced as a whole block, not deep-merged).

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
| `SuggestedQuestions` | Component | Standalone list of suggested/active questions with loading state (pairs with `useActiveQuestions`) |
| `DiveDeeper` | Component | Popover mini-Ask experience: three recommended questions plus a streamed answer, fed by an `onAsk` callback you supply (returning an `AsyncIterable<DiveDeeperChunk>`). Exported alongside the `DiveDeeperChunk` and `DiveDeeperProps` types. |

### 3. Hooks (headless building blocks)

For fully custom UIs that reuse the data and streaming logic without the built-in markup:

| Export | Description | Exported types |
| --- | --- | --- |
| `useAskConversation` | Manages the full conversation: submitting queries, streaming answers, and thread continuity. Accepts `website` and `queryOptions` overrides. | `AskConversation`, `QuestionsStatus` |
| `useAtnClient` | Builds the configured SDK client from provider context | — |
| `useActiveQuestions` | Fetches the active/suggested questions — site-wide from settings, or scoped to one article via the `articleId` option | `ActiveQuestions`, `ActiveQuestion` |
| `useAnswerFeedback` | Returns a commit function that submits a rating + comment for an answer to the feedback endpoint (or `undefined` when the answer isn't feedback-eligible yet) | `AnswerFeedbackCommit` |

### Configuration types

| Export | Kind | Description |
| --- | --- | --- |
| `AskProvider` | Component | Context wrapper (see above) |
| `useAskConfig` | Hook | Reads the config supplied by `<AskProvider>` from context |
| `AskConfig`, `AskProviderProps`, `AskQueryOptions`, `AskQueryFilters` | Types | Shape of the config object, provider props, query options, and retrieval filters |

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

The stylesheet defines design tokens as CSS custom properties on `:root`, all prefixed `--atn-` so they never collide with your own tokens (`--primary`, `--background`, …). Override them in your own stylesheet to match your brand:

```css
:root {
  --atn-primary: oklch(0.55 0.22 264);
  --atn-background: #fff;
  --atn-radius: 0.75rem;
}
```

**Dark mode:** add the `dark` class to an ancestor (typically `<html>`) and the tokens flip to the built-in dark palette. Override dark values the same way, inside a `.dark { … }` block.

#### Layout tokens

The fixed-bottom Ask bar reserves page space through a few `:root` tokens. Most are managed automatically (`--atn-ask-bar-height` is set/cleared while a fixed bar is mounted; `--atn-bottom-chrome` and `--atn-sticky-bar-pb` derive from the device safe-area). One needs your attention:

| Token | Default | When to override |
| --- | --- | --- |
| `--atn-tab-bar-height` | `0px` on desktop, **`56px` below 768px** | The default assumes a mobile bottom tab bar for the Ask bar to sit above. **If your mobile layout has none, set it to `0px`** — otherwise the page gets 56px of unused bottom padding on mobile. |

### How the styles coexist with yours

The stylesheet is built to drop into any page without a fight:

- **No global resets.** Tailwind's preflight is not included; the reset the components need is scoped under the `[data-atn]` attribute that every component root (and every portalled surface — dialogs, drawers, popovers, tooltips, dropdowns) carries. The only global rule is a functional `body { padding-bottom: … }` that reserves space for the fixed-bottom Ask bar (inert `0px` unless one is mounted).
- **Utilities are unlayered** and compete on ordinary specificity, so a site-wide reset (`button { … }`, `* { … }`) can't strip the components — and any of your rules at class specificity or higher, loaded after this stylesheet, wins ties. Import `styles.css` **before** your own stylesheets to keep that precedence.
- **To restyle the components wholesale**, target `[data-atn]` (e.g. `[data-atn] { font-family: … }`) or override the `--atn-*` tokens above.

#### If your app is itself built with Tailwind + shadcn

One caveat applies when your app uses the same semantic utility classes this library does (`bg-background`, `text-foreground`, …): because this stylesheet's utilities are unlayered and yours sit in `@layer utilities`, the library's definitions win on **your** markup too — so those shared classes resolve to the `--atn-*` tokens app-wide. If your token values match the defaults you'll never notice; if they differ (custom brand, custom dark palette), skip the `styles.css` import and compile the library's markup in your own Tailwind build instead:

```css
/* your app stylesheet — no styles.css import in this mode */
@source "../node_modules/@arcxp/ask-the-news-components/dist-lib";
```

Your build then generates the utilities against your own tokens. In this mode also define the `--atn-*` variables the library's markup references directly: `--atn-success`, `--atn-tab-bar-height`, `--atn-ask-bar-height`, `--atn-bottom-chrome`, `--atn-sticky-bar-pb`.

---

## Further reading

- If you need raw API access or are working outside React, see the [SDK docs](../sdk/README.md).
- For running the demo app, see the [root README](../../README.md#running-the-demo-app).
