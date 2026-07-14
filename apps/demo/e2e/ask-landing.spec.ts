import { test, expect } from "@playwright/test";
import { setupAtn, seedAtnConfig, mockAtnApi, SUGGESTED_QUESTIONS } from "./support/atn";

const ASK_INPUT_PLACEHOLDER = "Ask the news anything...";

test.describe("Ask landing view", () => {
    test("renders the greeting, badge, search input, and suggested questions", async ({ page }) => {
        await setupAtn(page);
        await page.goto("/#/ask-the-news");

        await expect(page.getByRole("heading", { name: /Good (Morning|Afternoon|Evening)/ })).toBeVisible();
        await expect(page.getByText("Ask about the latest news, trends, and stories")).toBeVisible();
        await expect(page.getByPlaceholder(ASK_INPUT_PLACEHOLDER)).toBeVisible();
        await expect(page.getByRole("button", { name: "AI-generated answers" })).toBeVisible();

        for (const question of SUGGESTED_QUESTIONS) {
            await expect(page.getByRole("button", { name: question })).toBeVisible();
        }
    });

    test("shows a loading shimmer while suggested questions are fetched", async ({ page }) => {
        await seedAtnConfig(page);
        await mockAtnApi(page);
        // Re-route settings with a delay so the loading state is observable.
        await page.route("**/api/v1/settings*", async (route) => {
            await new Promise((resolve) => setTimeout(resolve, 1200));
            await route.fulfill({ json: { active_questions: SUGGESTED_QUESTIONS.map((text) => ({ text })) } });
        });
        await page.goto("/#/ask-the-news");

        await expect(page.getByText("Loading questions...")).toBeVisible();
        await expect(page.getByRole("button", { name: SUGGESTED_QUESTIONS[0] })).toBeVisible();
        await expect(page.getByText("Loading questions...")).toBeHidden();
    });

    test("clicking a suggested question submits it and shows the answer view", async ({ page }) => {
        await setupAtn(page);
        await page.goto("/#/ask-the-news");

        await page.getByRole("button", { name: SUGGESTED_QUESTIONS[1] }).click();

        await expect(page.getByRole("heading", { name: SUGGESTED_QUESTIONS[1] })).toBeVisible();
        await expect(page.getByText("lowering interest rates in the coming months")).toBeVisible();
    });

    test("typing filters suggestions into the autocomplete dropdown and selecting one submits it", async ({ page }) => {
        await setupAtn(page);
        await page.goto("/#/ask-the-news");
        // Wait for the suggestion pool to load before typing.
        await expect(page.getByRole("button", { name: SUGGESTED_QUESTIONS[0] })).toBeVisible();

        const input = page.getByPlaceholder(ASK_INPUT_PLACEHOLDER);
        await input.click();
        await input.fill("federal");

        const dropdown = page.getByRole("listbox");
        await expect(dropdown).toBeVisible();
        await expect(dropdown.getByRole("option", { name: SUGGESTED_QUESTIONS[1] })).toBeVisible();
        await expect(dropdown.getByRole("option")).toHaveCount(1);

        await dropdown.getByRole("option", { name: SUGGESTED_QUESTIONS[1] }).click();
        await expect(page.getByRole("heading", { name: SUGGESTED_QUESTIONS[1] })).toBeVisible();
    });

    test("Tab accepts the ghost completion", async ({ page }) => {
        await setupAtn(page);
        await page.goto("/#/ask-the-news");
        await expect(page.getByRole("button", { name: SUGGESTED_QUESTIONS[0] })).toBeVisible();

        const input = page.getByPlaceholder(ASK_INPUT_PLACEHOLDER);
        await input.click();
        await input.pressSequentially("What did");
        await expect(page.getByText("to accept")).toBeVisible();

        await input.press("Tab");
        await expect(input).toHaveValue(SUGGESTED_QUESTIONS[1]);
    });
});
