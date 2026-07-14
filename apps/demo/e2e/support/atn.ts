import type { Page } from "@playwright/test";

/** Curated questions served by the mocked settings endpoint (active_questions). */
export const SUGGESTED_QUESTIONS = [
    "What happened with the commemorative arch?",
    "What did the Federal Reserve announce?",
    "How did the gene therapy trials go?",
];

/** Article sources returned by the mocked query stream. */
export const MOCK_SOURCES = [
    {
        document_id: "doc-1",
        headline: "Trump officials plan commemorative arch on federal land",
        description: "Officials are quietly advancing plans to build a large commemorative arch in Washington.",
        canonical_url: "https://example.com/politics/commemorative-arch",
        published_date: "2026-05-20T12:00:00Z",
        websites: [{ sections: ["/politics"] }],
    },
    {
        document_id: "doc-2",
        headline: "Federal Reserve signals rate cuts may begin soon",
        description: "The central bank indicated it may begin lowering interest rates in the coming months.",
        canonical_url: "https://example.com/business/fed-rate-cuts",
        published_date: "2026-05-22T12:00:00Z",
        websites: [{ sections: ["/business"] }],
    },
];

export const FOLLOW_UP_QUESTIONS = ["What is the Commemorative Works Act?", "Who has authority over construction on federal land?"];

export interface QueryStreamMock {
    deltas?: string[];
    sources?: unknown[];
    followUpQuestions?: string[];
    status?: "answered" | "rejected" | "unanswered" | "error";
    queryId?: string;
}

/** Builds an SSE body in the shape the SDK's queryStream() parser expects. */
export function buildSseBody({ deltas = [], sources, followUpQuestions, status = "answered", queryId = "query-e2e-1" }: QueryStreamMock): string {
    const frames: unknown[] = [
        { type: "message_start", query_id: queryId },
        ...deltas.map((delta) => ({ type: "output_text.delta", delta })),
        ...(sources ? [{ type: "sources", results: sources }] : []),
        ...(followUpQuestions ? [{ type: "follow_up_questions", questions: followUpQuestions }] : []),
        { type: "message_stop", status },
    ];
    return frames.map((frame) => `data: ${JSON.stringify(frame)}\n\n`).join("");
}

export const DEFAULT_STREAM: QueryStreamMock = {
    deltas: ["The Federal Reserve indicated it may begin ", "lowering interest rates in the coming months ", "as inflation continues to moderate."],
    sources: MOCK_SOURCES,
    followUpQuestions: FOLLOW_UP_QUESTIONS,
    status: "answered",
};

/**
 * Seeds the "bring your own credentials" localStorage config before any app
 * code runs. This (a) bypasses the PasswordGate regardless of whether a
 * bundled ciphertext exists, and (b) points the SDK baseUrl at the page's own
 * origin so mocked API calls are same-origin and deterministic.
 */
export async function seedAtnConfig(page: Page): Promise<void> {
    await page.addInitScript(() => {
        try {
            window.localStorage.setItem(
                "atn_custom_config",
                JSON.stringify({
                    value: { apiKey: "e2e-key", baseUrl: window.location.origin, website: "e2e" },
                    expiresAt: Date.now() + 60 * 60 * 1000,
                })
            );
        } catch {
            // localStorage unavailable on this document (e.g. about:blank) — ignore.
        }
    });
}

export interface MockAtnOptions {
    questions?: string[];
    stream?: QueryStreamMock;
}

/** Intercepts all Ask the News API traffic plus flaky external resources. */
export async function mockAtnApi(page: Page, { questions = SUGGESTED_QUESTIONS, stream = DEFAULT_STREAM }: MockAtnOptions = {}): Promise<void> {
    await page.route("**/api/v1/settings*", (route) => route.fulfill({ json: { active_questions: questions.map((text) => ({ text })) } }));

    await page.route("**/api/v1/query", (route) =>
        route.fulfill({
            status: 200,
            contentType: "text/event-stream",
            headers: { "cache-control": "no-cache" },
            body: buildSseBody(stream),
        })
    );

    // External resources the app references — block so tests never touch the network.
    await page.route("https://picsum.photos/**", (route) => route.abort());
    await page.route("https://arclabs-sandbox.audio.arc-cdn.net/**", (route) => route.fulfill({ contentType: "text/javascript", body: "" }));
    await page.route("https://fonts.googleapis.com/**", (route) => route.fulfill({ contentType: "text/css", body: "" }));
    await page.route("https://fonts.gstatic.com/**", (route) => route.abort());
}

/** Standard setup: seed credentials + install API mocks. Call before page.goto(). */
export async function setupAtn(page: Page, options: MockAtnOptions = {}): Promise<void> {
    await seedAtnConfig(page);
    await mockAtnApi(page, options);
}
