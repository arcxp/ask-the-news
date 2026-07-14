# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.0.0] - 2026-07-14

First public release. Functionally identical to 0.7.1 — no API changes.

## [0.7.1] - 2026-07-13

### Changed
- Build now uses **tsup** (esbuild) instead of plain `tsc`. The published `dist/` is a self-contained bundle down-levelled to **ES2019**: `openapi-fetch` (and its `openapi-typescript-helpers` type dependency) are inlined rather than left as external runtime imports, and ES2020 syntax (`?.`, `??`) is transpiled away. This lets the SDK be consumed by tooling that does not transpile `node_modules` — e.g. Arc Fusion's webpack, which rejects `?.`/`??` and cannot parse `openapi-fetch`'s raw source.

### Added
- CommonJS output (`dist/index.cjs`) alongside ESM (`dist/index.js`), so `require("@arcxp/ask-the-news-sdk")` now works. The `exports` map exposes `import`/`require` conditions, each with its matching type declaration (`dist/index.d.ts` / `dist/index.d.cts`).

No API changes — every client method and exported type is identical to 0.7.0.

## [0.7.0] - 2026-07-13

### Added
- New type exports: `ArticleCitation`, `VideoCitation` — the narrowed branches of `Citation`

### Changed
- `citations` entries are now a discriminated union keyed on `source_type` (matching `sources`): article citations carry only `position`/`document_id`, while video citations always carry `chunk_index`, `start_time`, and `end_time` (previously a single shape with those fields nullable)

## [0.6.0] - 2026-07-09

### Changed
- `/api/v1/query` is now streaming-only — it responds with Server-Sent Events regardless of the `Accept` header. Use `queryJson(body)` (`POST /api/v1/query-json`) for a complete JSON response, or `queryStream(body)` for SSE.
- `QueryResponse` now derives from the `/api/v1/query-json` operation (the only endpoint returning a single JSON payload); `QueryJsonResponse` is an alias of it.

### Removed
- `query(body)` client method — `/api/v1/query` no longer returns JSON. JSON consumers should use `queryJson(body)`; streaming consumers should use `queryStream(body)`.
- `getActiveQuestions(website)` client method and the `GET /api/v1/active-questions` endpoint. Curated questions are still available via `active_questions` on the `getSettings(website)` response.
- Type export `ActiveQuestionsResponse` (backed by the removed `PublicQuestionsResponse` schema).

## [0.4.0] - 2026-06-30

### Added
- `queryJson(body)` client method — run a query against the dedicated JSON-only endpoint (`POST /api/v1/query-json`), which never streams
- `submitFeedback(body)` client method — submit positive/negative feedback for a query response (`POST /api/v1/query/feedback`)
- Per-query section filtering — `QueryRequest` accepts `filters.sections.include` (up to 5 section paths) to scope retrieval within a site
- Unified `sources` field on the query response — a single, score-ordered, discriminated union of articles and videos keyed on `source_type`; supersedes the legacy `results` and `video_sources` fields (still populated during the deprecation window)
- `citations` field on the query response — maps each `[N]` marker in `answer` to a source by `document_id`/`source_type`
- New SSE events: `intent` (classified query intent), `generation_complete` (fires for every outcome with `status` + inline `citations`), and `answer_complete` (deprecated, superseded by `generation_complete`)
- `available_sections` and `active_questions` on the settings response
- New type exports: `QueryJsonResponse`, `QueryFilters`, `SectionsFilter`, `QuerySource`, `ArticleQuerySource`, `VideoQuerySource`, `Citation`, `AvailableSection`, `IntentEvent`, `GenerationCompleteEvent`, `AnswerCompleteEvent`, `FeedbackRequest`, `FeedbackResponse`, `SettingsResponse`
- Test suite (`npm test`) using the built-in `node:test` runner

### Changed
- `GET /api/v1/settings` now returns the reshaped `DeliverySettingsResponse` (exported as `SettingsResponse`), replacing `SiteSettingsResponse`

### Removed
- `getConversationThread(queryId, website)` client method and the `GET /api/v1/answer-history/{query_id}/thread` endpoint
- Type exports `SiteSettingsResponse`, `AnswerHistoryThreadResponse`, `AnswerHistoryRecord`, `AnswerHistorySource`, `AnswerHistoryVideoTranscript`, `SourceMode`

## [0.3.0] - 2026-05-19

### Added
- `video_sources` field on JSON query response — video transcript chunks the LLM cited as sources, alongside article `results`
- `video_sources` SSE event — emitted when the org has the video transcripts feature enabled and the LLM cites at least one video chunk
- `video_sources` and `source_mode` fields on `AnswerHistoryRecord` — `source_mode` is `"articles" | "videos" | "both" | null`
- New type exports: `VideoSource`, `VideoSourcesEvent`, `StreamVideoSource`, `AnswerHistoryVideoTranscript`, `SourceMode`

### Changed
- Updated OpenAPI spec from v0.21.3 to v0.28.1

### Removed
- Default `arc-service: "api"` header. Pass it via `headers` in `createAskTheNewsClient` options if your deployment requires it.

## [0.2.0] - 2026-05-05

### Added
- `getSettings(website)` client method — fetch per-site settings (branding, product name) via `GET /api/v1/settings`
- `getConversationThread(queryId, website)` client method — fetch full conversation thread (root + follow-ups) via `GET /api/v1/answer-history/{query_id}/thread`
- Conversation threading support on queries — `QueryRequest` accepts `root_query_id` and `previous_query_id` for follow-up turns; `QueryResponse` returns `root_query_id`
- `answer_status` SSE event — early status classification (`answered`/`unanswered`/`rejected`) before answer text begins streaming
- New type exports: `SiteSettingsResponse`, `AnswerHistoryThreadResponse`, `AnswerHistoryRecord`, `AnswerHistorySource`, `AnswerStatusEvent`, `FeedbackValue`

### Changed
- Updated OpenAPI spec from v0.21.3 to v0.27.2
