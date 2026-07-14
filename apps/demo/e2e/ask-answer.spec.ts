import { test, expect, type Page } from "@playwright/test";
import { setupAtn, MOCK_SOURCES, FOLLOW_UP_QUESTIONS } from "./support/atn";

const QUERY = "What did the Fed announce?";
const ANSWER_SNIPPET = "lowering interest rates in the coming months";

async function submitQuestion(page: Page, query: string = QUERY): Promise<void> {
    const input = page.getByPlaceholder("Ask the news anything...");
    await input.fill(query);
    await input.press("Enter");
}

test.describe("Answer view", () => {
    test.beforeEach(async ({ page }) => {
        await setupAtn(page);
        await page.goto("/#/ask-the-news");
        await submitQuestion(page);
        await expect(page.getByText(ANSWER_SNIPPET)).toBeVisible();
    });

    test("renders the question heading and the streamed answer body", async ({ page }) => {
        await expect(page.getByRole("heading", { name: QUERY })).toBeVisible();
        await expect(page.getByRole("button", { name: "Copy answer" })).toBeVisible();
        await expect(page.getByRole("button", { name: "Disclaimer" })).toBeVisible();
        await expect(page.getByPlaceholder("Ask a follow up question")).toBeVisible();
    });

    test("sources pill opens the sources drawer with article cards", async ({ page }) => {
        await page.getByRole("button", { name: `${MOCK_SOURCES.length} Sources` }).click();

        const drawer = page.getByRole("dialog");
        await expect(drawer.getByText("Sources")).toBeVisible();
        await expect(drawer.getByRole("heading", { name: "Articles" })).toBeVisible();
        for (const source of MOCK_SOURCES) {
            await expect(drawer.getByRole("heading", { name: source.headline })).toBeVisible();
        }
        await expect(drawer.getByRole("link", { name: new RegExp(MOCK_SOURCES[0].headline) })).toHaveAttribute("href", MOCK_SOURCES[0].canonical_url);

        await drawer.getByRole("button", { name: "Close sources" }).click();
        await expect(drawer).toBeHidden();
    });

    test("related questions render and clicking one submits a follow-up", async ({ page }) => {
        await expect(page.getByRole("heading", { name: "Related Questions" })).toBeVisible();
        for (const question of FOLLOW_UP_QUESTIONS) {
            await expect(page.getByRole("button", { name: question })).toBeVisible();
        }

        await page.getByRole("button", { name: FOLLOW_UP_QUESTIONS[0] }).first().click();

        await expect(page.getByRole("heading", { name: FOLLOW_UP_QUESTIONS[0] })).toBeVisible();
        // Both the original and the follow-up answers stay in the conversation.
        await expect(page.getByRole("heading", { name: QUERY })).toBeVisible();
        await expect(page.getByText(ANSWER_SNIPPET)).toHaveCount(2);
    });

    test("thumbs-up opens the feedback details dialog and commits the rating", async ({ page }) => {
        await page.getByRole("button", { name: "Helpful", exact: true }).click();

        const dialog = page.getByRole("dialog");
        await expect(dialog.getByText("Add feedback details")).toBeVisible();
        await dialog.getByLabel("Optional feedback").fill("Clear and well sourced.");
        await dialog.getByRole("button", { name: "Submit" }).click();
        await expect(dialog).toBeHidden();

        const thumbsUp = page.getByRole("button", { name: "Helpful", exact: true });
        await expect(thumbsUp).toHaveAttribute("aria-pressed", "true");
        // With a rating committed, the opposite thumb collapses away.
        await expect(page.getByRole("button", { name: "Not helpful" })).toBeHidden();
    });

    test("new chat from the answer menu returns to the landing view", async ({ page }) => {
        await page.getByRole("button", { name: "More actions" }).click();
        await page.getByRole("menuitem", { name: "New chat" }).click();

        await expect(page.getByRole("heading", { name: /Good (Morning|Afternoon|Evening)/ })).toBeVisible();
        await expect(page.getByRole("heading", { name: QUERY })).toBeHidden();
    });
});
