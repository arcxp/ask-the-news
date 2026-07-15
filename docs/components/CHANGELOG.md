# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.2.0] - 2026-07-21

### Changed
- Styles are no longer injected at runtime. The stylesheet ships as a separate file again — import it once, **before your own stylesheets**, in your app entry: `import "@arcxp/ask-the-news-components/styles.css"`. Without the import, components render unstyled.
- The stylesheet was rebuilt to coexist with any host page's CSS:
  - Utilities are emitted **unlayered**, so they compete on ordinary specificity. Site-wide resets (`button { … }`, `* { … }`) can no longer strip the components, and host rules at class specificity or higher (loaded after the stylesheet) win every conflict.
  - Tailwind's global preflight is no longer included. The reset the components need is scoped under the `[data-atn]` attribute, which every component root and every portalled surface (dialogs, drawers, popovers, tooltips, dropdowns) now carries.
  - All design tokens are renamed with an `--atn-` prefix (`--primary` → `--atn-primary`, `--background` → `--atn-background`, …) so they can never collide with host tokens. **Theme overrides must use the new names.**
  - The only remaining global rule is a functional `body { padding-bottom: … }` that reserves space for the fixed-bottom Ask bar (inert `0px` unless one is mounted).

### Removed
- Runtime `<style>` head injection of the embedded stylesheet — superseded by the explicit stylesheet import, which also makes the CSS SSR-clean (no flash of unstyled content on server-rendered pages).
- Leftover app-global CSS that fought host pages: `body` margin/min-height resets, global `:root` font-smoothing, and `::view-transition` rules.

## [1.1.2] - 2026-07-20

### Fixed
- The published bundle is now genuinely ES2019. 1.1.1 down-levelled the library's own code but left the UI dependencies (`radix-ui`, `motion`, `lucide-react`, `vaul`, …) as external runtime dependencies — and their published dists contain ES2020+ syntax (`?.`, `??`), so consumers that don't transpile `node_modules` still failed to parse. Those dependencies are now inlined into the bundle and down-levelled together with the library code; `@arcxp/ask-the-news-sdk` (already ES2019) is the only remaining runtime dependency.

### Changed
- Build now uses **tsup** (esbuild) instead of Vite, matching the SDK's build strategy: a single self-contained, minified ESM bundle plus one bundled `index.d.ts` containing only the public API's type closure.
- Styles no longer require a separate import: the compiled stylesheet is embedded in the JS bundle and injected into `<head>` on first import. (Reverted in 1.2.0, which reinstates the explicit stylesheet import.)

### Removed
- The `./styles.css` package export — superseded by runtime style injection. (Restored in 1.2.0.)

## [1.1.1] - 2026-07-20

### Fixed
- Library build now targets ES2019, so the published bundle contains no optional chaining (`?.`) or nullish coalescing (`??`). Fixes `Module parse failed: Unexpected token` in consumers whose bundlers don't transpile `node_modules` (e.g. Arc Fusion's webpack)

## [1.1.0] - 2026-07-15

### Added
- `queryOptions` on `<AskProvider>`, `<AskChat/>`, and `useAskConversation` — configure query behavior declaratively without calling the SDK directly. Experience-level options override the provider's per field; unset options are omitted from the request so the API defaults apply (no behavior change for existing integrations).
  - `inlineCitations` — toggle `[N]` inline-citation markers and the citations mapping (sent as `inline_citations`; API default `true`)
  - `filters` — retrieval filters mirroring the API's `filters` request block, e.g. `{ sections: { include: ["/politics"] } }` to scope retrieval to up to 5 section paths
- New exported types: `AskQueryOptions`, `AskQueryFilters`

## [1.0.0] - 2026-07-14

First public release.

### Added
- `<AskProvider>` configuration context (`baseUrl`, `website`, `apiKey`)
- `<AskChat/>` drop-in Ask experience (landing view → streamed answer view)
- Composable views and inputs: `AskLandingView`, `AskAnswerView`, `SearchBox`, `SearchInput`, `AnswerCard`
- Headless hooks: `useAskConversation`, `useAtnClient`, `useActiveQuestions`, `useAnswerFeedback`
- Standalone stylesheet export (`@arcxp/ask-the-news-components/styles.css`) with CSS-variable theming
- `useActiveQuestions` accepts an `articleId` option — when set, questions are fetched from the article-questions endpoint (`GET /api/v1/articles/{article_id}/questions`) instead of the site-wide settings list

### Changed
- `useAskConversation` continues threads exclusively via `thread_token`. Thread continuity is automatically dropped when a follow-up returns 404 (thread not found) or 410 (thread expired) — whether as an HTTP error or an in-band SSE `error` event — so the next question starts a fresh conversation
