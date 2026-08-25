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
    <AskProvider baseUrl={ARC_ASK_BASE_URL} apiKey={ARC_ASK_API_KEY} website="my-site">
      <AskChat />
    </AskProvider>
  );
}
```

That is the complete integration for the common case. `<AskChat />` handles the full flow: a landing view with suggested questions, submission, streaming the answer, displaying sources, and collecting feedback.

> **The stylesheet import is required.** Styles are not injected at runtime — without the `styles.css` import the components render unstyled. The stylesheet is safe to add to any page: no global resets, all design tokens are `--arc-ask-*` prefixed, and your own CSS keeps precedence (see [How the styles coexist with yours](#how-the-styles-coexist-with-yours)).

Everything below covers optional configuration and lower-level building blocks.

---

## Configuration — `<AskProvider>`

`<AskProvider>` supplies the API configuration to all child components through React context — no environment variables needed. It is required for the full experience and for everything API-backed: every hook, and any component that talks to the API (`AskChat`, the views, question fetching, feedback posting). A few presentational components can render without one — see the note under [Composable views](#2-composable-views-and-inputs).

| Prop | Type | Required | Description |
| --- | --- | --- | --- |
| `baseUrl` | `string` | Yes | API base URL (e.g. `https://myorg-config-sandbox.api.arc-cdn.net/ask`) |
| `website` | `string` | Yes | Site identifier (e.g. `my-site`) |
| `apiKey` | `string` | Yes | API key, sent as the `X-Api-Key` header |
| `queryOptions` | `AskQueryOptions` | No | Default query options applied to every query sent under this provider (see below) |

```tsx
<AskProvider baseUrl={ARC_ASK_BASE_URL} apiKey={ARC_ASK_API_KEY} website="my-site">
```

### Query options — `AskQueryOptions`

Controls query behavior without dropping down to the SDK. Set it once on `<AskProvider>`, or per experience via the `queryOptions` prop on `<AskChat />` / the `queryOptions` option of `useAskConversation` (per-experience values win over the provider's). Every field is optional — an unset field is omitted from the request and the API's own default applies, so existing integrations are unaffected.

| Field | Type | API default | Description |
| --- | --- | --- | --- |
| `inlineCitations` | `boolean` | `true` | Whether answers carry `[N]` inline-citation markers and a citations mapping. Set `false` for plain-prose answers with no markers. |
| `filters` | `AskQueryFilters` | none (whole site) | Retrieval filters, mirroring the API's `filters` request block. `{ sections: { include: [...] } }` scopes retrieval to up to 5 section paths (each starting with `/`, matching the paths used at ingestion). |

```tsx
// Site-wide: plain-prose answers everywhere under this provider.
<AskProvider baseUrl={ARC_ASK_BASE_URL} apiKey={ARC_ASK_API_KEY} website="my-site" queryOptions={{ inlineCitations: false }}>

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

The ones that open a floating surface of their own — `AnswerCard`, `SearchInput`, `DiveDeeper` — also render without an `<AskProvider>` above them, including inside a shadow root: portal-container resolution is provider-independent (each resolves its own, and nesting one inside a provider duplicates nothing). What the provider still gates is the API-backed behavior: without one, `AnswerCard`'s feedback buttons stay purely presentational (nothing is posted) and question fetching isn't available — and hooks always require it.

### 3. Hooks (headless building blocks)

For fully custom UIs that reuse the data and streaming logic without the built-in markup:

| Export | Description | Exported types |
| --- | --- | --- |
| `useAskConversation` | Manages the full conversation: submitting queries, streaming answers, and thread continuity. Accepts `website` and `queryOptions` overrides. | `AskConversation`, `QuestionsStatus` |
| `useArcAskClient` | Builds the configured SDK client from provider context | — |
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

The stylesheet defines design tokens as CSS custom properties on `[data-arc-ask]` — the attribute every component root carries — all prefixed `--arc-ask-` so they never collide with your own tokens (`--primary`, `--background`, …). Override them in your own stylesheet to match your brand:

```css
[data-arc-ask] {
  --arc-ask-primary: oklch(0.55 0.22 264);
  --arc-ask-background: #fff;
  --arc-ask-radius: 0.75rem;
}
```

They are declared on `[data-arc-ask]` rather than `:root` so that the stylesheet keeps working when it is adopted into a shadow root, where `:root` matches nothing. One consequence: because the components declare these on their own root element, an override has to match that element too — a `:root { --arc-ask-…: … }` block reaches them only by inheritance, and an element's own declaration always wins. Target `[data-arc-ask]`.

#### Brand tokens you can set from anywhere — `--arc-ask-host-*`

Targeting `[data-arc-ask]` is not always possible: inside a shadow root your selectors cannot reach it at all. So the brand surface has a second channel that travels by **inheritance**, which nothing blocks. Set any of these wherever you like — `:root`, `<html>`, a wrapper, or the element hosting the components — and they reach the tokens:

| Channel | Token it feeds | Default |
| --- | --- | --- |
| `--arc-ask-host-primary` / `--arc-ask-host-primary-foreground` | `--arc-ask-primary` / `--arc-ask-primary-foreground` | near-black / near-white |
| `--arc-ask-host-accent` / `--arc-ask-host-accent-foreground` | `--arc-ask-accent` / `--arc-ask-accent-foreground` | blue / white |
| `--arc-ask-host-background` / `--arc-ask-host-foreground` | `--arc-ask-background` / `--arc-ask-foreground` | white / near-black |
| `--arc-ask-host-border` | `--arc-ask-border` | light grey |
| `--arc-ask-host-radius` | `--arc-ask-radius` | `0.625rem` |
| `--arc-ask-host-font-sans` / `--arc-ask-host-font-serif` / `--arc-ask-host-font-masthead` | the matching font token | Helvetica / Georgia / UnifrakturMaguntia |

```css
:root {
  --arc-ask-host-primary: #b5121b;
  --arc-ask-host-font-sans: "Publico Text", Georgia, serif;
  --arc-ask-host-radius: 0;
}
```

One value covers both colour schemes; pass `light-dark(a, b)` if you want them to differ. Leave a channel unset and the library's own default applies — it is a fallback, not a required value.

This is the only theming route that works through a shadow boundary, and it works identically in the light DOM. Everything outside the table above is internal: override those on `[data-arc-ask]` as shown before.

**Dark mode:** the palette follows the standard [`color-scheme`](https://developer.mozilla.org/docs/Web/CSS/color-scheme) property, which the components inherit from your page. Match it to however your page decides dark mode:

```css
/* OS-driven: the components follow the system preference. Use this only if
   your own theme variables also respond to the OS scheme (light-dark() or a
   prefers-color-scheme media query) — otherwise the widget flips dark while
   the rest of your page stays light. */
:root { color-scheme: light dark; }

/* Class-driven (what the demo app does): pin light as the default and flip
   the property under your theme class, so the components switch exactly when
   your page does. */
:root { color-scheme: light; }
.dark { color-scheme: dark; }
```

Every colour token is declared with `light-dark()`, so it flips with `color-scheme` and needs no class on our side. Override a specific value per mode the same way:

```css
[data-arc-ask] { --arc-ask-background: light-dark(#fff, #16181d); }
```

Even if you set no `color-scheme` at all, a page that signals dark mode with a `.dark` class keeps working: a compat rule translates the class into `color-scheme: dark`. It exists for pages that shipped against earlier versions — prefer declaring `color-scheme` yourself, as above.

> **The class signal does not reach a shadow root.** The rule is `.dark [data-arc-ask]`, and your `.dark` sits on `<html>`, outside the root — a selector in the adopted stylesheet cannot see it, so the components stay light while your page goes dark. If you mount them in a shadow root, set `color-scheme` (it inherits straight through the boundary) instead of relying on the class.

> Requires `light-dark()`: Chrome 123+, Safari 17.5+, Firefox 120+. Older engines fall back to the light palette — every colour token declares its light value unconditionally and the mode-aware pair sits behind an `@supports` gate — so the components stay legible rather than breaking.

#### Layout and stacking tokens

The components reserve space for their own fixed chrome inside their own boxes; they no longer write anything to your document. A handful of tokens control that, and **where you set them depends on which group they're in.**

**Set these outside the components — on `:root`, `html`, `body`, or the shadow host.** They are deliberately left undeclared by the stylesheet, and each use site carries the default inline, so an inherited value reaches the components.

Mind where "inherited" ends: `--arc-ask-z-modal`, `--arc-ask-z-anchored` and `--arc-ask-ask-bar-height` are read only by surfaces portalled out of the React tree (dialogs, drawers, popovers, tooltips, dropdowns, the sources overlay). Those mount in `document.body`, or in our own container inside the shadow root — either way they are **siblings** of your markup, not descendants, so a value set on a wrapper *inside* your tree never reaches them. `--arc-ask-answer-reserve` is read in place and can go on any ancestor.

| Token | Default | When to set it |
| --- | --- | --- |
| `--arc-ask-z-modal` | `1000` | Dialogs, drawers and the sources overlay. They must paint above everything of yours; raise it if your own chrome sits higher. |
| `--arc-ask-z-anchored` | `30` | Dropdowns, popovers, tooltips. Deliberately **low** so your sticky header wins — an autocomplete covering your navigation is worse than one sliding under it. Raise it only if it disappears behind something it shouldn't. |
| `--arc-ask-answer-reserve` | `20rem` | Embedded mode only: the height held open while an answer streams, so streamed text fills the box instead of growing it and shifting your article. Tune it to your type scale and column width — too small and text pushes, too large and short answers leave whitespace. |
| `--arc-ask-ask-bar-height` | `0px` | Only if your page has its own bottom-fixed ask/search bar the components should keep clear of. |

**Set these on `[data-arc-ask]`.** They describe the components' own mobile chrome, so the stylesheet declares them — and because a token declared on the component's own root always beats an inherited value, a `:root` override would silently do nothing:

| Token | Default | When to override |
| --- | --- | --- |
| `--arc-ask-tab-bar-height` | `0px` on desktop, **`56px` below 768px** | The default assumes a mobile bottom tab bar for the Ask bar to sit above. **If your mobile layout has none, set `[data-arc-ask] { --arc-ask-tab-bar-height: 0px }`** — otherwise the Ask bar floats 56px above the bottom edge on mobile. |
| `--arc-ask-bottom-chrome` | `calc(var(--arc-ask-tab-bar-height) + env(safe-area-inset-bottom))` | Rarely. Derived from the row above; override that one instead. |
| `--arc-ask-sticky-bar-pb` | `max(env(safe-area-inset-bottom), 0.75rem)` | Rarely. Inner padding of the sticky Ask bar. |

The same split applies to every `--arc-ask-*` token, including the palette: **declared → override on `[data-arc-ask]`; undeclared → set it on an ancestor**, which is what every `--arc-ask-host-*` channel is. `src/index.css` marks which is which.

#### If your page has a sticky header

Only relevant when the components own the page scroll (i.e. not `embedded`). Asking a follow-up scrolls its answer's heading to the top of the scroll container, offset by a fixed `0.75rem` — the components do not measure your header. Set [`scroll-padding-top`](https://developer.mozilla.org/docs/Web/CSS/scroll-padding-top) on your scroll container so the heading lands below it instead of underneath:

```css
html { scroll-padding-top: 4.5rem; }   /* your header's height */
```

### Stable CSS hooks — the `arc-ask-*` class names

Every exported component root and its meaningful parts carry a semantic class name alongside the utility classes. These are the selectors to write overrides against: the utility classes (`flex`, `text-sm`, …) are an implementation detail and change between releases without notice, while **the `arc-ask-*` names below are public API** — removing or renaming one is a breaking change. Anything not on this list is internal and may change.

Landing view:

| Selector | Element |
| --- | --- |
| `.arc-ask-landing` | landing view root (`<main>`) |
| `.arc-ask-landing__greeting` | the time-of-day greeting heading |
| `.arc-ask-landing__tagline` | the line under the greeting |
| `.arc-ask-badge` | the "Ask the News" badge |
| `.arc-ask-suggested-questions` | suggested-questions list (also its loading state) |
| `.arc-ask-suggested-questions__item` | one suggested-question button |

Search:

| Selector | Element |
| --- | --- |
| `.arc-ask-search-box` | search box root (input + autocomplete) |
| `.arc-ask-search-input` | the visible search bar (`<form>`) |
| `.arc-ask-search-input__input` | the text input |
| `.arc-ask-search-input__submit` | the submit (arrow) button |
| `.arc-ask-search-input__new-chat` | the "New chat" button, when enabled |
| `.arc-ask-search-input__disclaimer` | the AI disclaimer paragraph (in-flow mode) |
| `.arc-ask-search-input__disclaimer-toggle` | the "AI-generated answers" tooltip trigger (fixed-bar mode) |
| `.arc-ask-bar` | the bar pinned to the bottom of the viewport (standalone mode) |
| `.arc-ask-autocomplete` | the autocomplete listbox |
| `.arc-ask-autocomplete__option` | one autocomplete option |

Answer list and answer card:

| Selector | Element |
| --- | --- |
| `.arc-ask-answer-view` | the answer list root |
| `.arc-ask-answer-view__item` | one answer `<section>` in the list |
| `.arc-ask-answer-view__follow-up` | the follow-up search wrapper |
| `.arc-ask-scroll-fab` | the mobile "scroll to latest" pill (standalone mode) |
| `.arc-ask-answer` | one answer card (`<article>`) |
| `.arc-ask-answer__question` | the question heading |
| `.arc-ask-answer__hero` | the lead photo |
| `.arc-ask-answer__body` | the answer text |
| `.arc-ask-answer__loading` | the skeleton block while an answer loads |
| `.arc-ask-answer__actions` | the row with sources pill, copy, feedback and disclaimer |
| `.arc-ask-answer__sources-trigger` | the "N Sources" pill (drawer mode) |
| `.arc-ask-answer__sources` | the inline sources section (carousel mode) |
| `.arc-ask-answer__copy` | the copy-answer button |
| `.arc-ask-answer__menu-trigger` | the ⋮ overflow-menu button |
| `.arc-ask-answer__disclaimer-trigger` | the ⓘ disclaimer button |
| `.arc-ask-answer__videos` | the related-videos section |
| `.arc-ask-answer__related-questions` | the related-questions section |
| `.arc-ask-answer__related-question` | one related-question button |
| `.arc-ask-feedback` | the thumbs up/down group |
| `.arc-ask-feedback__up` / `.arc-ask-feedback__down` | the individual thumb buttons |
| `.arc-ask-sources-carousel` | the sources carousel (carousel mode) |
| `.arc-ask-sources-carousel__card` | one carousel card |
| `.arc-ask-dive-deeper` | the Dive Deeper trigger badge |

Portalled surfaces — these render as **siblings of your markup**, not descendants of the widget, so select them directly and never scope them under your own container:

| Selector | Element |
| --- | --- |
| `.arc-ask-sources-drawer` | the sources drawer |
| `.arc-ask-source-card` | one source card inside the drawer (`.arc-ask-source-card--video` for video sources) |
| `.arc-ask-source-overlay` | the expanded source modal/sheet (carousel mode) |
| `.arc-ask-answer__menu` | the overflow menu content |
| `.arc-ask-feedback-dialog` | the feedback details dialog |
| `.arc-ask-dive-deeper__panel` | the Dive Deeper popover/drawer (with `.arc-ask-dive-deeper__question` and `.arc-ask-dive-deeper__answer` inside) |
| `.arc-ask-tooltip` | tooltip content (disclaimers) |

Overriding is plain CSS:

```css
/* your stylesheet, loaded after styles.css */
[data-arc-ask] .arc-ask-answer__question { font-family: Georgia, serif; }
.arc-ask-bar { display: none; }          /* portalled/fixed chrome: no ancestor scoping */
```

One specificity note: the library's utilities are unlayered and sit at class specificity, so a bare `.arc-ask-*` rule only wins if your stylesheet loads **after** `styles.css` (the recommended order — see below). Prefixing with `[data-arc-ask]` (as above) outranks the utilities regardless of load order; `!important` is the last resort, not the default.

### How the styles coexist with yours

The stylesheet is built to drop into any page without a fight:

- **Inherited typography stops at the component root.** Your selectors cannot reach inside a shadow root, but *inherited* properties always do — that channel is not closeable. So the scoped preflight neutralises the inherited set on `[data-arc-ask]`: `font-*`, `letter-spacing`, `word-spacing`, `text-align`, `text-indent`, `text-transform`, `text-shadow`, `white-space`, `word-break`, `overflow-wrap`, `hyphens`, `tab-size`, `list-style-type`, `line-height`, `writing-mode` and `cursor`. Two are deliberately left alone because you *should* own them: `direction` (so RTL pages work) and `color-scheme` (the dark-mode signal). A `body { text-transform: uppercase }` on your page no longer shouts inside the widget.
- **Nothing global paints.** Tailwind's preflight is not included; the reset the components need is scoped under the `[data-arc-ask]` attribute that every component root (and every portalled surface — dialogs, drawers, popovers, tooltips, dropdowns) carries. No rule targets `body` or `html`, and no component writes to `document.body` or `<html>` at runtime. The one document-level selector is Tailwind's own `@layer theme { :root, :host }` block, which declares variables and nothing else — layered, so anything of yours overrides it.
  The one thing that does touch your document is the standard modal scroll lock, and only while a dialog, drawer or the desktop source overlay is **open**: Radix marks `<body>` with `data-scroll-locked`, adds a matching rule to `<head>`, and sets `aria-hidden` on your other top-level nodes, reverting all of it on close. That is what stops a bottom sheet from scrolling the article behind it.
- **Utilities are unlayered** and compete on ordinary specificity, so a site-wide reset (`button { … }`, `* { … }`) can't strip the components — and any of your rules at class specificity or higher, loaded after this stylesheet, wins ties. Import `styles.css` **before** your own stylesheets to keep that precedence.
- **To restyle the components wholesale**, target `[data-arc-ask]` (e.g. `[data-arc-ask] { font-family: … }`) or override the `--arc-ask-*` tokens above.

#### If your app is itself built with Tailwind + shadcn

One caveat applies when your app uses the same semantic utility classes this library does (`bg-background`, `text-foreground`, …): because this stylesheet's utilities are unlayered and yours sit in `@layer utilities`, the library's definitions win on **your** markup too — so those shared classes resolve to the `--arc-ask-*` tokens app-wide. If your token values match the defaults you'll never notice; if they differ (custom brand, custom dark palette), skip the `styles.css` import and compile the library's markup in your own Tailwind build instead:

```css
/* your app stylesheet — no styles.css import in this mode */
@source "../node_modules/@arcxp/ask-the-news-components/dist-lib";
```

Your build then generates the utilities against your own tokens. In this mode you also have to supply, in your own stylesheet, everything the library's markup references but the class names don't carry:

- **Tokens:** `--arc-ask-success`, `--arc-ask-background`, `--arc-ask-muted-foreground` (the last two are named directly by the shimmer placeholder, whose text colour *is* its `background-image` — leave them out and it renders invisible rather than unstyled), `--arc-ask-tab-bar-height`, `--arc-ask-bottom-chrome`, `--arc-ask-sticky-bar-pb`, and the derived tokens the markup names directly (`--arc-ask-ring-invalid`, `--arc-ask-destructive-surface`, `--arc-ask-destructive-surface-subtle`, `--arc-ask-outline-border`, `--arc-ask-outline-surface`, `--arc-ask-outline-surface-hover`, `--arc-ask-textarea-surface`, `--arc-ask-ghost-surface-hover`, `--arc-ask-media-surface`, `--arc-ask-edge-border`, `--arc-ask-edge-shadow-near`, `--arc-ask-edge-shadow-far`, `--arc-ask-edge-shadow-far-strong`). Copy them from [`src/index.css`](https://github.com/WPMedia/arc-ask-the-news-packages/blob/main/packages/components/src/index.css), both halves — the unconditional light values and the `@supports (color: light-dark(…))` block that adds the dark ones. Anything the markup references but your stylesheet doesn't declare is dropped silently. The host-tunable four (`--arc-ask-z-modal`, `--arc-ask-z-anchored`, `--arc-ask-answer-reserve`, `--arc-ask-ask-bar-height`) are the exception: they carry their defaults inline at each use site, so declare them only if you want different values.
- **`color-scheme`:** declare it on your root (`color-scheme: light dark`) so the `light-dark()` palette resolves.
- **Entrance animations:** `@import "tw-animate-css";` — the components use its `animate-in` / `fade-in` / `slide-in-from-*` utilities.
- **Custom keyframes and utilities:** the `arc-ask-shimmer`, `arc-ask-feedback-bloom`, `arc-ask-feedback-ring` and `arc-ask-feedback-particle` `@keyframes`, plus the `arc-ask-shimmer` and `scrollbar-none` utilities. Copy them from [`src/index.css`](https://github.com/WPMedia/arc-ask-the-news-packages/blob/main/packages/components/src/index.css); without them the shimmer and the feedback celebration render static.

The demo app's [`src/index.css`](../../apps/demo/src/index.css) is a complete, working example of this mode.

---

## Further reading

- Measured limitations we have not fixed yet, with repros: [KNOWN-ISSUES.md](https://github.com/WPMedia/arc-ask-the-news-packages/blob/main/packages/components/KNOWN-ISSUES.md).
- If you need raw API access or are working outside React, see the [SDK docs](../sdk/README.md).
- For running the demo app, see the [root README](../../README.md#running-the-demo-app).
