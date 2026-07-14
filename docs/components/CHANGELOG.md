# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.0.0] - 2026-07-14

First public release.

### Added
- `<AskProvider>` configuration context (`baseUrl`, `website`, static `apiKey` or per-request `resolveApiKey`)
- `<AskChat/>` drop-in Ask experience (landing view → streamed answer view)
- Composable views and inputs: `AskLandingView`, `AskAnswerView`, `SearchBox`, `SearchInput`, `AnswerCard`, `AdSlot`
- Headless hooks: `useAskConversation`, `useAtnClient`, `useActiveQuestions`, `useQuestionAnswerStream`
- Standalone stylesheet export (`@arcxp/ask-the-news-components/styles.css`) with CSS-variable theming
