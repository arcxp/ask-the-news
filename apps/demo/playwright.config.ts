import { defineConfig, devices } from "@playwright/test";

// E2E tests run against the Vite dev server with all Ask the News API traffic
// mocked at the network layer (see e2e/support/atn.ts) — no real credentials
// or backend are needed.
export default defineConfig({
    testDir: "./e2e",
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
    use: {
        baseURL: "http://localhost:3000",
        // Skip motion/react + motion-safe CSS animations so assertions don't race transitions.
        contextOptions: { reducedMotion: "reduce" },
        trace: "on-first-retry",
    },
    projects: [
        {
            name: "chromium",
            // channel "chromium" runs the full browser in new-headless mode — the sandbox
            // provisions only the full Chromium binary, not the headless shell.
            use: { ...devices["Desktop Chrome"], channel: "chromium" },
        },
    ],
    webServer: {
        command: "npm run dev",
        url: "http://localhost:3000",
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
    },
});
