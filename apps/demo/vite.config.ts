/// <reference types="vitest/config" />
import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// Base path for the application (can be overridden with UI_BASE env var)
const basePath = process.env.UI_BASE ?? "./"
// Env files (.env, .env.local, …) live in the repo-root .devcontainer-exclude
// folder (git-ignored, devcontainer-mounted) — shared by all workspaces.
const envDir = path.resolve(__dirname, "../../.devcontainer-exclude")

export default defineConfig({
    base: basePath,
    envDir: envDir,
    plugins: [react(), tailwindcss()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    server: {
        host: "0.0.0.0",
        allowedHosts: true,
        port: 3000,
        hmr: {
            clientPort: 3000,
        },
    },
    test: {
        environment: "jsdom",
        setupFiles: "./src/test/setup.ts",
        globals: true,
        css: true,
        pool: "threads",
        // Playwright specs live in e2e/ and are run by `npm run test:e2e`, not Vitest.
        exclude: ["**/node_modules/**", "e2e/**"],
        server: {
            deps: {
                // The components package is installed prebuilt from the registry; inline it
                // so vi.mock("@arcxp/ask-the-news-sdk") also intercepts the SDK import
                // inside the library (externalized node_modules bypass module mocks).
                inline: ["@arcxp/ask-the-news-components"],
            },
        },
    },
})
