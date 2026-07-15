# Ask The News

**Ask The News** is an Arc XP product that lets readers ask natural-language questions about your newsroom's content. It queries your Arc XP news corpus and returns AI-generated answers with cited articles, streamed in real time.

This repository hosts documentation and a runnable demo app for two npm packages that integrate Ask The News into your application:

| Package | What it is |
| --- | --- |
| [`@arcxp/ask-the-news-sdk`](docs/sdk/README.md) | TypeScript SDK — direct API access (queries, SSE streaming, feedback, settings). Use this if you are building a custom UI or working outside of React. |
| [`@arcxp/ask-the-news-components`](docs/components/README.md) | React component library built on the SDK — drop-in `<AskChat/>` plus composable views and hooks. Use this if you want a working UI with minimal setup. |

---

## Which package do I need?

- **Building a React app and want a ready-made UI?** Install `@arcxp/ask-the-news-components`. It includes the SDK internally and gives you a full chat experience in a few lines of JSX. [Get started with components.](docs/components/README.md)
- **Building a custom UI, using a non-React framework, or need raw API access?** Install `@arcxp/ask-the-news-sdk`. It handles auth, request/response typing, and SSE streaming. [Get started with the SDK.](docs/sdk/README.md)

---

## Installing the packages

The packages are published to [GitHub Packages](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry) under the `@arcxp` scope. GitHub Packages requires authentication even for public packages — anonymous installs will be rejected.

**Step 1 — Get a GitHub token with `read:packages` scope.** You can create one at [github.com/settings/tokens](https://github.com/settings/tokens).

**Step 2 — Add your `.npmrc`.** This tells npm to route `@arcxp` packages to GitHub Packages and authenticate with your token:

```ini
# .npmrc (project root or home directory)
@arcxp:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NPM_GITHUB_TOKEN}
```

**Step 3 — Set the environment variable and install:**

```bash
export NPM_GITHUB_TOKEN=ghp_your_token_here
npm install @arcxp/ask-the-news-components   # React UI (includes the SDK)
# or
npm install @arcxp/ask-the-news-sdk          # SDK only
```

Both packages require **Node >= 22**.

---

## Documentation

- [SDK docs](docs/sdk/README.md) — API reference, query methods, SSE streaming, error handling
- [SDK changelog](docs/sdk/CHANGELOG.md)
- [Components docs](docs/components/README.md) — `<AskProvider>`, `<AskChat/>`, composable views, hooks, theming
- [Components changelog](docs/components/CHANGELOG.md)

---

## Running the demo app

[`apps/demo`](apps/demo) is a minimal demo app showing how the packages are wired together: a single page rendering `<AskProvider>` + `<AskChat/>`. It is dev-only and runs off the Vite dev server.

**Prerequisites:** Node >= 22 and the `.npmrc` auth above (the repo's `.npmrc` reads `NPM_GITHUB_TOKEN` from your environment).

```bash
npm install       # installs the demo and the published @arcxp packages
npm run dev       # starts the demo on http://localhost:3000
```

Point the demo at your Ask The News deployment with these environment variables (e.g. via `apps/demo/.env.local` or real environment variables):

| Variable | Description | Example |
| --- | --- | --- |
| `VITE_ATN_BASE_URL` | API base URL | `https://myorg-config-sandbox.api.arc-cdn.net/ask` |
| `VITE_ATN_WEBSITE` | Site identifier | `my-site` |
| `VITE_ATN_API_KEY` | Site-scoped API key (sent as the `X-Api-Key` header) | (your site's API key) |

---

## License

[MIT](LICENSE)
