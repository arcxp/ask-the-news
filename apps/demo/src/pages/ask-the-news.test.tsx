import { describe, it, expect, vi, beforeAll, afterEach } from "vitest";
import { render, screen, cleanup, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import type { AskTheNewsClient, QueryStreamEvent, QueryRequest } from "@arcxp/ask-the-news-sdk";

type QueryStreamResponse = Awaited<ReturnType<AskTheNewsClient["queryStream"]>>;
type QueryStreamChunk = QueryStreamEvent;

// `vi.mock` is hoisted above imports, so any variables it references must be hoisted too.
const { queryStreamMock, getActiveQuestionsMock, toastErrorMock } = vi.hoisted(() => ({
    queryStreamMock: vi.fn<(args: QueryRequest) => Promise<QueryStreamResponse>>(),
    getActiveQuestionsMock: vi.fn().mockResolvedValue({ data: { questions: [] } }),
    toastErrorMock: vi.fn(),
}));

vi.mock("@arcxp/ask-the-news-sdk", () => ({
    createAskTheNewsClient: () => ({
        queryStream: queryStreamMock,
        getActiveQuestions: getActiveQuestionsMock,
    }),
}));

vi.mock("sonner", () => ({
    toast: { error: (msg: string) => toastErrorMock(msg) },
}));

import { AskProvider } from "@arcxp/ask-the-news-components";
import { AskTheNewsPage } from "./ask-the-news";

beforeAll(() => {
    if (typeof window !== "undefined" && !window.HTMLElement.prototype.scrollIntoView) {
        window.HTMLElement.prototype.scrollIntoView = () => {};
    }
    // jsdom doesn't implement IntersectionObserver scroll-into-view side effects; harmless no-ops.
});

afterEach(() => {
    cleanup();
    queryStreamMock.mockReset();
    toastErrorMock.mockReset();
});

function renderPage(initialEntry = "/ask-the-news") {
    return render(
        <AskProvider baseUrl="https://api.test" website="testsite" apiKey="test-key">
            <MemoryRouter initialEntries={[initialEntry]}>
                <AskTheNewsPage />
            </MemoryRouter>
        </AskProvider>
    );
}

/** Build a queryStream response whose stream resolves only when `releaseDeltas` is called. */
function deferredStream() {
    let releaseDeltas: ((chunks: QueryStreamChunk[]) => void) | undefined;
    const stream = (async function* () {
        const chunks = await new Promise<QueryStreamChunk[]>((resolve) => {
            releaseDeltas = resolve;
        });
        for (const chunk of chunks) yield chunk;
    })();
    return {
        response: { stream } as unknown as QueryStreamResponse,
        release: (chunks: QueryStreamChunk[]) => releaseDeltas?.(chunks),
    };
}

/** A queryStream response that yields `chunks` and completes immediately. */
function completedStream(chunks: QueryStreamChunk[]): QueryStreamResponse {
    const stream = (async function* () {
        for (const chunk of chunks) yield chunk;
    })();
    return { stream } as unknown as QueryStreamResponse;
}

describe("AskTheNewsPage — optimistic mount", () => {
    it("renders the question + shimmer before queryStream resolves", async () => {
        // Hold queryStream open indefinitely so the test can observe the pre-resolve state.
        let resolveQueryStream: ((value: QueryStreamResponse) => void) | undefined;
        queryStreamMock.mockImplementation(
            () =>
                new Promise<QueryStreamResponse>((resolve) => {
                    resolveQueryStream = resolve;
                })
        );

        renderPage("/ask-the-news?q=What%20is%20happening%3F");

        // Auto-submit kicks in via useEffect; the optimistic answer paints before
        // queryStream's promise has resolved.
        const heading = await screen.findByRole("heading", { level: 2, name: /what is happening/i });
        expect(heading).toBeInTheDocument();
        expect(screen.getByRole("status")).toHaveAttribute("aria-busy", "true");

        // Sanity: queryStream was called but has not resolved.
        expect(queryStreamMock).toHaveBeenCalledTimes(1);
        expect(resolveQueryStream).toBeDefined();
    });

    it("replaces shimmer with the body once the first delta arrives", async () => {
        const { response, release } = deferredStream();
        queryStreamMock.mockResolvedValueOnce(response);

        renderPage("/ask-the-news?q=Climate");

        // Optimistic shimmer is up.
        await screen.findByRole("heading", { level: 2, name: /climate/i });
        expect(screen.getByRole("status")).toBeInTheDocument();

        // Release a delta + a normal stop.
        await act(async () => {
            release([
                { type: "output_text.delta", delta: "Hello world." } as QueryStreamChunk,
                { type: "message_stop", status: "answered" } as QueryStreamChunk,
            ]);
        });

        expect(await screen.findByText("Hello world.")).toBeInTheDocument();
        expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });

    it("surfaces an inline error (no toast) when response.stream is null", async () => {
        queryStreamMock.mockResolvedValueOnce({
            stream: null,
            error: { detail: "API blew up" },
        } as unknown as QueryStreamResponse);

        renderPage("/ask-the-news?q=Anything");

        expect(await screen.findByText(/API blew up/)).toBeInTheDocument();
        expect(toastErrorMock).not.toHaveBeenCalled();
        // The card stays around — surfaced inline as a notice on the question.
        expect(screen.getByRole("heading", { level: 2, name: /anything/i })).toBeInTheDocument();
    });

    it("surfaces an inline error (no toast) when queryStream rejects", async () => {
        queryStreamMock.mockRejectedValueOnce(new Error("network down"));
        const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});

        renderPage("/ask-the-news?q=Test");

        // The failure is finalized inline on the card (consistent with the null-stream
        // path) rather than a toast that would orphan the question.
        expect(await screen.findByText(/network down/)).toBeInTheDocument();
        expect(toastErrorMock).not.toHaveBeenCalled();
        expect(screen.getByRole("heading", { level: 2, name: /test/i })).toBeInTheDocument();

        errSpy.mockRestore();
    });

    it("surfaces an inline error and keeps partial text on a mid-stream error event", async () => {
        const { response, release } = deferredStream();
        queryStreamMock.mockResolvedValueOnce(response);

        renderPage("/ask-the-news?q=Climate");

        await screen.findByRole("heading", { level: 2, name: /climate/i });

        // Some text streams, then the server emits a terminal error event.
        await act(async () => {
            release([
                { type: "output_text.delta", delta: "Partial answer" } as QueryStreamChunk,
                { type: "error", status_code: 429, message: "Rate limit exceeded" } as QueryStreamChunk,
            ]);
        });

        // Error is finalized inline on the card; partial text is preserved.
        expect(await screen.findByText(/rate limit exceeded/i)).toBeInTheDocument();
        expect(screen.getByText("Partial answer")).toBeInTheDocument();
        expect(toastErrorMock).not.toHaveBeenCalled();
    });
});

describe("AskTheNewsPage — conversation threads", () => {
    it("sends root_query_id + previous_query_id on a follow-up when no thread_token is issued", async () => {
        // First turn: message_start carries ids but no token → linear-chain continuity.
        queryStreamMock.mockResolvedValueOnce(
            completedStream([
                { type: "message_start", query_id: "q-1", root_query_id: "q-1", thread_token: null } as QueryStreamChunk,
                { type: "output_text.delta", delta: "First answer." } as QueryStreamChunk,
                { type: "message_stop", status: "answered" } as QueryStreamChunk,
            ])
        );
        // Follow-up stream held open; we only assert on the call arguments.
        const { response } = deferredStream();
        queryStreamMock.mockResolvedValueOnce(response);

        renderPage("/ask-the-news?q=First%20question");

        expect(await screen.findByText("First answer.")).toBeInTheDocument();

        const user = userEvent.setup();
        await user.type(screen.getByPlaceholderText(/ask a follow up question/i), "And then?");
        await user.keyboard("{Enter}");

        await vi.waitFor(() => expect(queryStreamMock).toHaveBeenCalledTimes(2));
        expect(queryStreamMock).toHaveBeenLastCalledWith(
            expect.objectContaining({
                query: "And then?",
                root_query_id: "q-1",
                previous_query_id: "q-1",
            })
        );
    });

    it("sends thread_token (and omits query ids) on a follow-up when a token is issued", async () => {
        queryStreamMock.mockResolvedValueOnce(
            completedStream([
                { type: "message_start", query_id: "q-1", root_query_id: "q-1", thread_token: "tok-1" } as QueryStreamChunk,
                { type: "output_text.delta", delta: "First answer." } as QueryStreamChunk,
                { type: "message_stop", status: "answered" } as QueryStreamChunk,
            ])
        );
        const { response } = deferredStream();
        queryStreamMock.mockResolvedValueOnce(response);

        renderPage("/ask-the-news?q=First%20question");

        expect(await screen.findByText("First answer.")).toBeInTheDocument();

        const user = userEvent.setup();
        await user.type(screen.getByPlaceholderText(/ask a follow up question/i), "And then?");
        await user.keyboard("{Enter}");

        await vi.waitFor(() => expect(queryStreamMock).toHaveBeenCalledTimes(2));
        const followUpArgs = queryStreamMock.mock.calls[1][0];
        expect(followUpArgs).toMatchObject({ query: "And then?", thread_token: "tok-1" });
        // Token identifies the thread; the linear ids must not also be sent.
        expect(followUpArgs).not.toHaveProperty("root_query_id");
        expect(followUpArgs).not.toHaveProperty("previous_query_id");
    });

    it("drops thread continuity after New chat so the next question starts fresh", async () => {
        queryStreamMock.mockResolvedValueOnce(
            completedStream([
                { type: "message_start", query_id: "q-1", root_query_id: "q-1", thread_token: "tok-1" } as QueryStreamChunk,
                { type: "output_text.delta", delta: "First answer." } as QueryStreamChunk,
                { type: "message_stop", status: "answered" } as QueryStreamChunk,
            ])
        );
        const { response } = deferredStream();
        queryStreamMock.mockResolvedValueOnce(response);

        renderPage("/ask-the-news?q=First%20question");
        expect(await screen.findByText("First answer.")).toBeInTheDocument();

        const user = userEvent.setup();
        await user.click(screen.getByRole("button", { name: /new chat/i }));
        await user.type(screen.getByPlaceholderText(/ask the news anything/i), "Fresh question");
        await user.keyboard("{Enter}");

        await vi.waitFor(() => expect(queryStreamMock).toHaveBeenCalledTimes(2));
        const freshArgs = queryStreamMock.mock.calls[1][0];
        expect(freshArgs).not.toHaveProperty("thread_token");
        expect(freshArgs).not.toHaveProperty("root_query_id");
        expect(freshArgs).not.toHaveProperty("previous_query_id");
    });

    it("does not promote continuity when the turn ends in a mid-stream error", async () => {
        // First turn issues a token but then errors — the failed turn must not
        // seed continuity, so the next question starts a fresh thread.
        queryStreamMock.mockResolvedValueOnce(
            completedStream([
                { type: "message_start", query_id: "q-1", root_query_id: "q-1", thread_token: "tok-1" } as QueryStreamChunk,
                { type: "output_text.delta", delta: "Partial." } as QueryStreamChunk,
                { type: "error", status_code: 500, message: "Upstream failed" } as QueryStreamChunk,
            ])
        );
        const { response } = deferredStream();
        queryStreamMock.mockResolvedValueOnce(response);

        renderPage("/ask-the-news?q=First%20question");
        expect(await screen.findByText(/upstream failed/i)).toBeInTheDocument();

        const user = userEvent.setup();
        await user.type(screen.getByPlaceholderText(/ask a follow up question/i), "Next?");
        await user.keyboard("{Enter}");

        await vi.waitFor(() => expect(queryStreamMock).toHaveBeenCalledTimes(2));
        const nextArgs = queryStreamMock.mock.calls[1][0];
        expect(nextArgs).not.toHaveProperty("thread_token");
        expect(nextArgs).not.toHaveProperty("root_query_id");
        expect(nextArgs).not.toHaveProperty("previous_query_id");
    });
});
