# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [2.2.0] - 2026-08-25

### Changed
- **Breaking — every public CSS name is renamed from the `atn` prefix to `arc-ask`.** All design tokens (`--atn-*` → `--arc-ask-*`, including the host channel: `--atn-host-primary` → `--arc-ask-host-primary`, …), the scoping attribute (`data-atn` → `data-arc-ask`, so overrides target `[data-arc-ask]`), the host-tunable layout/stacking tokens (`--arc-ask-ask-bar-height`, `--arc-ask-answer-reserve`, `--arc-ask-z-anchored`, `--arc-ask-z-modal`), the `@keyframes` (`arc-ask-shimmer`, `arc-ask-feedback-*`) and the internal drawer attribute (`data-arc-ask-drawer-direction`). The rename also covers the one exported identifier that carried the old abbreviation: the `useAtnClient` hook is now `useArcAskClient`. No compatibility aliases are shipped: the library has no consumers yet, so the rename lands clean.

### Fixed
- **`space-y-*` and `divide-*` rendered dead in the shipped stylesheet — the loading skeleton (and every stacked list) collapsed with no spacing.** Tailwind v4 emits those utilities at zero specificity (`:where(.space-y-2 > :not(:last-child))`), and the scoped preflight's `[data-arc-ask] :where(*) { margin: 0; border: 0 solid }` sits at (0,1,0), which wins regardless of source order — so the margins and dividers never applied anywhere `styles.css` is used (the iframe widget, any npm consumer). The demo app never showed it because it compiles from source without the preflight. Fixed by expressing inter-child spacing from the parent instead, where utilities carry class specificity: `space-y-*` stacks are now `flex flex-col gap-*`, and the suggested-questions dividers moved from `divide-y` on the list to `border-b last:border-b-0` on the items. A widget e2e (`e2e/spacing.spec.ts`) now measures real skeleton layout inside the built embed so a zero-specificity spacing utility can't sneak back in.

### Added
- **Stable `arc-ask-*` class names for customer CSS overrides.** Every exported component root and its meaningful parts now carry a semantic class (`arc-ask-answer__question`, `arc-ask-search-input__submit`, `arc-ask-suggested-questions__item`, …) alongside the Tailwind utilities, including the portalled surfaces (sources drawer, source overlay, overflow menu, feedback dialog, Dive Deeper panel, tooltips) — which render as siblings of the host's markup, so they need a selector of their own. The utilities remain an implementation detail that changes between releases; the `arc-ask-*` names are the supported override surface and are documented as public API in the README ("Stable CSS hooks"), with a contract test (`selector-hooks.test.tsx`) that fails if one disappears. Purely additive: the classes carry no styles of their own, so nothing renders differently.

## [2.1.0] - 2026-08-18

Two fixes for hosts the components don't own, both about the one channel a shadow boundary cannot close: inheritance.

### Added
- **`--arc-ask-host-*` — brand tokens settable from anywhere.** Eleven channels (`--arc-ask-host-primary`, `--arc-ask-host-primary-foreground`, `--arc-ask-host-accent`, `--arc-ask-host-accent-foreground`, `--arc-ask-host-background`, `--arc-ask-host-foreground`, `--arc-ask-host-border`, `--arc-ask-host-radius`, `--arc-ask-host-font-sans`, `--arc-ask-host-font-serif`, `--arc-ask-host-font-masthead`) that a host sets on `:root`, `<html>`, a wrapper, or the element hosting the components — they travel by inheritance, so unlike `[data-arc-ask] { --arc-ask-primary: … }` they work **through a shadow boundary**, which is what the `<arc-ask-chat>` widget needs. Each one is read as a fallback by the token it feeds (`--arc-ask-primary: var(--arc-ask-host-primary, <default>)`), so leaving it unset changes nothing and every existing override on `[data-arc-ask]` keeps working. One value covers both colour schemes; pass `light-dark(a, b)` to split them. The palette keeps its declarations on purpose: those tokens are read from ~30 places, and the undeclared-with-inline-fallback pattern used by the layout tokens would make any read written without the fallback render invalid.

### Fixed
- **Inherited host typography no longer leaks into the components.** The scoped preflight reset `font-family`, `line-height` and `color` and stopped there, so a host's `body { text-transform: uppercase; letter-spacing: 3px; font-style: italic; … }` reached straight through the shadow boundary — selectors can't cross it, inherited properties always do. `[data-arc-ask]` now also resets `font-style`, `font-weight`, `font-variant-caps`, `font-stretch`, `letter-spacing`, `word-spacing`, `text-align`, `text-indent`, `text-transform`, `text-shadow`, `white-space` and `cursor`. `direction` and `color-scheme` are still inherited on purpose — RTL layouts and the dark-mode signal both depend on it.
- **Inherited host text wrapping and writing mode no longer leak either.** The same channel, one level down from typography: `word-break`, `overflow-wrap` and `hyphens` re-wrapped our text mid-word, `tab-size` re-indented preformatted answer content, `list-style-type` reached any list item outside the `ul, ol, menu` the preflight already covered, and `writing-mode: vertical-rl` on a host page collapsed the whole component into a narrow vertical column. All six are now pinned on `[data-arc-ask]`. `writing-mode` is reset even though `direction` is not: RTL layouts depend on inheriting direction, but these layouts are horizontal by construction.

## [2.0.0] - 2026-08-13

This release makes the components safe to drop into a page they don't own. The behavioral defaults are unchanged for a standalone app, but three things that used to reach into the host document no longer do, and theming moved off `:root` — see the breaking items below.

### Added
- **`embedded` on `<AskProvider>`** — declares that the components share a page they don't own (a customer's article, a PageBuilder feature, a widget in a shadow root) rather than occupying a route of their own. Defaults to `false`, which keeps the standalone behavior exactly as it was. Set `true` and the components give up the affordances that require owning the viewport: the Ask bar sits in normal flow instead of pinning itself to the bottom of the host's viewport, a streaming answer no longer auto-follows the reader's scroll, the scroll-down pill isn't mounted, and a newly asked question isn't scrolled into view. It is not a styling switch — it is about which document the components are entitled to move.
- **Shadow-DOM support.** Every portalled surface (dialog, drawer, popover, tooltip, dropdown menu, and the desktop source overlay) now mounts into a container inside the shadow root that hosts the components instead of `document.body`. That keeps them inside the stylesheet adopted into that root, and — the less obvious half — keeps them dismissable: Radix decides "did this click land outside the layer?" from React capture handlers attached at the React root, so a layer portalled out of the shadow root read every interaction *inside* itself as an outside click. Detection is by asking (`getRootNode()`), not by configuration: in the light DOM this resolves to nothing and portals still go to `document.body`. Two details that make it hold up:
  - **The composable exports resolve a container of their own**, so `AnswerCard`, `SearchInput` and `DiveDeeper` behave the same inside a shadow root with or without an `<AskProvider>` above them. Providers nest without duplicating anything, so the wrapped case costs nothing.
  - **A modal open in a shadow root hides the widget behind it from assistive tech.** Radix's background-hiding pass starts at `document.body`, which does not contain a node inside a shadow root, so it hid your page but left everything in the components' own root exposed to a screen reader. A second pass scoped to the shadow root closes that.
- `--arc-ask-answer-reserve` (default `20rem`) — the height held open for an answer while it streams in embedded mode, so streamed text fills that box instead of growing it and pushing the host's article down on every delta. The right value depends on your type scale and column width, so it's a token rather than a constant.
- `--arc-ask-z-anchored` (`30`) and `--arc-ask-z-modal` (`1000`) — the two stacking tiers, exposed because the correct number depends on the host's own stacking. Anchored surfaces (dropdown, popover, tooltip) sit deliberately **low** so a host's sticky header wins: an autocomplete list covering the site's navigation is worse than one sliding under it. Modal surfaces (dialog, drawer, sources overlay) must beat everything the host has.
- All three of the tokens above — plus `--arc-ask-ask-bar-height` — are **left undeclared on purpose**, with their defaults carried inline at each use site. That is what makes them reachable by inheritance: since the components declare their tokens on their own root element, a token that *is* declared can only be overridden by matching `[data-arc-ask]`. Declared (internal) vs undeclared (yours to set) is now an explicit contract, documented in `src/index.css`. Note that `--arc-ask-z-modal`, `--arc-ask-z-anchored` and `--arc-ask-ask-bar-height` are read only by portalled surfaces, which are siblings of your markup rather than descendants — **set those on `:root`, `html`, `body` or the shadow host**, not on a wrapper inside your own tree. `--arc-ask-answer-reserve` is read in place and works on any ancestor.

### Changed
- **Breaking — theme overrides must target `[data-arc-ask]`, not `:root`.** All `--arc-ask-*` tokens are now declared on `[data-arc-ask]`, the attribute every component root and portalled surface carries, because `:root` matches nothing inside a shadow root. An element's own declaration always beats an inherited one, so a `:root { --arc-ask-primary: … }` block no longer reaches the components — rewrite it as `[data-arc-ask] { --arc-ask-primary: … }`.
- **Breaking — dark mode follows `color-scheme`, not a class.** Every color token is declared with `light-dark()` and flips with the `color-scheme` your page sets (`:root { color-scheme: light dark }`); the `dark:` variant and the duplicated dark palette are gone, so there is one source of truth for the palette. Pages that signal dark mode with a `.dark` class keep working through a one-line compat rule that translates the class into `color-scheme: dark`, but `color-scheme` is the supported signal from here on — and it is the **only** one that works in a shadow root, since the compat rule's `.dark` ancestor sits outside the root where the adopted stylesheet cannot see it. Requires `light-dark()` (Chrome 123+, Safari 17.5+, Firefox 120+); older engines fall back to the light palette — every colour token declares its light value unconditionally and the mode-aware pair sits behind an `@supports` gate — so the components stay legible instead of breaking.
- **Breaking — the library no longer writes to the host document.** Three writes are gone: the global `body { padding-bottom: … }` rule that reserved space for the fixed-bottom Ask bar, the runtime write of the bar's measured height onto `<html>` as `--arc-ask-ask-bar-height`, and the `document.body.style.overflow` scroll lock the desktop source overlay used to set (which restored to the literal `"auto"`, permanently clobbering a host's own value after the first open). Each view now reserves space for its own fixed chrome inside its own box, and every modal surface takes the standard Radix scroll lock (see the exception below) rather than writing to `body` by hand. **If your page relied on that body padding to keep its own content clear of the Ask bar, reserve the space yourself.** `--arc-ask-ask-bar-height` survives as a host-override hook only: it is deliberately left undeclared so a value you set on an ancestor can reach the components, and every library use site carries its own `0px` fallback.
  One exception, unchanged from previous versions and worth stating plainly: while a dialog, drawer or the desktop source overlay is **open**, Radix runs it in `modal` mode, so `react-remove-scroll` locks the page behind it — `data-scroll-locked` on `<body>`, a matching rule in `<head>`, and `aria-hidden` on your other top-level nodes — all reverted on close. `vaul` did the same. This is the standard modal scroll lock rather than something the library writes itself, and it is what keeps a bottom sheet from scrolling the article underneath it.
- **Breaking — the drawer no longer drags to dismiss.** It is built on Radix Dialog instead of `vaul`, which removes the last third-party runtime dependency from the bundle and gives every modal in the library the same focus trap, Escape handling, dismissable-layer behavior and portal container. Closing is the X button, Escape, or a click on the overlay. The component API is unchanged; the internal direction attribute is now `data-arc-ask-drawer-direction` (was `data-vaul-drawer-direction`).
- A follow-up answer scrolled into view is offset from the top of the scroll container by a fixed `0.75rem`, instead of by the measured height of the page's first `<nav>` element — that query matched *any* `<nav>`, sticky or not, so it was as likely to measure the wrong thing as the right one. **If your page has a sticky header and the components own the page scroll, set `scroll-padding-top` on your scroll container** (e.g. `html { scroll-padding-top: 4.5rem }`); otherwise the heading lands underneath it. Embedded mode never scrolls the page, so this does not apply there.
- Streaming auto-follow scroll is measured against the nearest scroll container and the bottom edge of the components' own box, instead of `window.scrollY` and the document height. It now works inside a bounded scroll box, and it stops at the end of our content rather than the end of whatever document it happens to be in.
- **The desktop source overlay is a real dialog.** It was hand-rolled: its own Escape key handler, a document-level click-outside listener, and `overscroll-contain` where a modal wants a scroll lock. It is built on Radix Dialog now, like every other modal in the library, which is what finally gives it a focus trap (Tab used to walk straight out into the page behind it), a scroll lock that also covers Space / PageDown / the arrow keys (`overscroll-behavior` only ever governed wheel and touch), background hiding for assistive tech, and a fade-out on close to match its fade-in. It also scrolls internally and sizes itself against the viewport, and no longer subtracts our bottom chrome from its height: the modal tier paints above the Ask bar, so there is nothing left to clear.
- Component states that were expressed as `dark:` utility pairs are folded into derived tokens (`--arc-ask-ring-invalid`, `--arc-ask-destructive-surface`, `--arc-ask-destructive-surface-subtle`, `--arc-ask-outline-border`, `--arc-ask-outline-surface`, `--arc-ask-outline-surface-hover`, `--arc-ask-textarea-surface`, `--arc-ask-ghost-surface-hover`, `--arc-ask-media-surface`, `--arc-ask-edge-border`, `--arc-ask-edge-shadow-*`), since with the palette driven by inherited `color-scheme` there is no selector a `dark:` variant could key off. They derive from the base palette — theme the palette and these follow.
- If you compile the library's utilities from source with Tailwind's `@source` instead of importing `styles.css`, your stylesheet now also has to declare `color-scheme` on your root plus the new tokens above (`--arc-ask-answer-reserve`, `--arc-ask-z-anchored`, `--arc-ask-z-modal` and the derived set). Anything the markup references but your stylesheet doesn't declare is dropped silently. See the README's *Using Tailwind on the consumer side* section.

### Removed
- The `vaul` dependency — and with it the drawer's drag-to-dismiss gesture (see above). This was an accepted product regression, not an oversight.
- Tailwind's `dark` custom variant and the separate `.dark` palette block, superseded by `light-dark()`.
- The global `body { padding-bottom }` rule, the runtime `--arc-ask-ask-bar-height` write, and the source overlay's hand-written `document.body.style.overflow` lock. The stylesheet's only document-level selector is now Tailwind's own `@layer theme { :root, :host }` variable block, which declares variables and nothing else.

### Fixed
- **`prefers-reduced-motion` is honored everywhere.** Dialogs, drawers, popovers, tooltips and dropdown menus animated their fade and zoom regardless of the setting, as did the landing view, the follow-up bar, the autocomplete list and the answer's own entrances. Every animation in the library is now behind `motion-safe:`, so the preference suppresses all of them rather than most of them.

## [1.3.0] - 2026-08-10

### Changed
- The bundle is **36% smaller** — 388.6 KB → 248.7 KB — after dropping the runtime animation library. Nothing in the public API moved: same exports, same props, same `./styles.css` export, still ES2019.
- Every animation is now plain CSS: `tw-animate-css` utilities for entrances, ordinary `transition-*` for state changes, and a few `arc-ask-*` `@keyframes` shipped in the stylesheet for the shimmer sweep and the feedback celebration. Reduced motion is honored through `prefers-reduced-motion` media queries instead of a JS hook, so the preference no longer has to be measured at runtime.

### Removed
- The `motion` (Framer Motion) dependency. Three exit animations went with it: the landing → answer swap, the rotating loading messages and the desktop source-card dialog now fade in only, with no fade-out. Everything else keeps its behavior — the shimmer, the staggered source cards, the collapsing feedback thumbs and their celebration burst all still animate in and out, and the thumb "pop" now uses an overshooting easing curve in place of a spring.
- Dead shared-layout code in the sources carousel: the internal `layout` prop on `SourcesCardsCarouselCard` and its `layoutId` wiring were never switched on.

### Fixed
- Source cards in the carousel now render as `<button type="button">`. They previously fell back to the HTML default of `type="submit"`, so clicking one inside a host `<form>` could submit it.

## [1.2.0] - 2026-07-21

### Changed
- Styles are no longer injected at runtime. The stylesheet ships as a separate file again — import it once, **before your own stylesheets**, in your app entry: `import "@arcxp/ask-the-news-components/styles.css"`. Without the import, components render unstyled.
- The stylesheet was rebuilt to coexist with any host page's CSS:
  - Utilities are emitted **unlayered**, so they compete on ordinary specificity. Site-wide resets (`button { … }`, `* { … }`) can no longer strip the components, and host rules at class specificity or higher (loaded after the stylesheet) win every conflict.
  - Tailwind's global preflight is no longer included. The reset the components need is scoped under the `[data-arc-ask]` attribute, which every component root and every portalled surface (dialogs, drawers, popovers, tooltips, dropdowns) now carries.
  - All design tokens are renamed with an `--arc-ask-` prefix (`--primary` → `--arc-ask-primary`, `--background` → `--arc-ask-background`, …) so they can never collide with host tokens. **Theme overrides must use the new names.**
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
- Headless hooks: `useAskConversation`, `useArcAskClient`, `useActiveQuestions`, `useAnswerFeedback`
- Standalone stylesheet export (`@arcxp/ask-the-news-components/styles.css`) with CSS-variable theming
- `useActiveQuestions` accepts an `articleId` option — when set, questions are fetched from the article-questions endpoint (`GET /api/v1/articles/{article_id}/questions`) instead of the site-wide settings list

### Changed
- `useAskConversation` continues threads exclusively via `thread_token`. Thread continuity is automatically dropped when a follow-up returns 404 (thread not found) or 410 (thread expired) — whether as an HTTP error or an in-band SSE `error` event — so the next question starts a fresh conversation
