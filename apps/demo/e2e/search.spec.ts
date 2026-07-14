import { test, expect } from "@playwright/test";
import { setupAtn, MOCK_SOURCES } from "./support/atn";

const QUERY = "federal reserve rates";
const OVERVIEW_SNIPPET = "lowering interest rates in the coming months";

test.describe("Search page", () => {
    test("empty state prompts for a query and submitting navigates to results", async ({ page }) => {
        await setupAtn(page);
        await page.goto("/#/search");

        await expect(page.getByRole("heading", { name: "Search Arc Intelligencer" })).toBeVisible();

        // The navbar carries its own "Search Arc Intelligencer" input — scope to the page body.
        const input = page.getByRole("main").getByPlaceholder("Search Arc Intelligencer");
        await input.fill(QUERY);
        await input.press("Enter");

        await page.waitForURL(/#\/search\?q=/);
        await expect(page.getByText("Search results for")).toBeVisible();
        await expect(page.getByRole("heading", { name: new RegExp(QUERY) })).toBeVisible();
    });

    test("streams an AI overview and lists the source results", async ({ page }) => {
        await setupAtn(page);
        await page.goto(`/#/search?q=${encodeURIComponent(QUERY)}`);

        const overview = page.getByRole("region", { name: "AI-generated overview" });
        await expect(overview).toBeVisible();
        await expect(overview).toContainText(OVERVIEW_SNIPPET);

        await expect(page.getByText(`${MOCK_SOURCES.length} results`)).toBeVisible();
        for (const source of MOCK_SOURCES) {
            await expect(page.getByRole("heading", { name: source.headline })).toBeVisible();
        }
        const firstResult = page.getByRole("link", { name: new RegExp(MOCK_SOURCES[0].headline) });
        await expect(firstResult).toHaveAttribute("href", MOCK_SOURCES[0].canonical_url);
        await expect(firstResult).toHaveAttribute("target", "_blank");
    });

    test("a follow-up question hands off to Ask the News", async ({ page }) => {
        await setupAtn(page);
        await page.goto(`/#/search?q=${encodeURIComponent(QUERY)}`);
        await expect(page.getByText(`${MOCK_SOURCES.length} results`)).toBeVisible();

        const followUp = page.getByPlaceholder("Have a question instead?");
        await followUp.fill("What did the Fed announce?");
        await followUp.press("Enter");

        await page.waitForURL(/#\/ask-the-news\?q=/);
        await expect(page.getByRole("heading", { name: "What did the Fed announce?" })).toBeVisible();
        await expect(page.getByText(OVERVIEW_SNIPPET)).toBeVisible();
    });
});
