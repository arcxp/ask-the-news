import { describe, it, expect, vi, beforeAll, afterEach } from "vitest";
import { render, screen, cleanup, act } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import type { AskTheNewsClient, QueryStreamEvent } from "@arcxp/ask-the-news-sdk";

type QueryStreamResponse = Awaited<ReturnType<AskTheNewsClient["queryStream"]>>;
type QueryStreamChunk = QueryStreamEvent;

const { queryStreamMock } = vi.hoisted(() => ({
    queryStreamMock: vi.fn<(args: { query: string; website: string }) => Promise<QueryStreamResponse>>(),
}));

vi.mock("@arcxp/ask-the-news-sdk", () => ({
    createAskTheNewsClient: () => ({
        queryStream: queryStreamMock,
        getActiveQuestions: vi.fn().mockResolvedValue({ data: { questions: [] } }),
    }),
}));

import { AskProvider } from "@arcxp/ask-the-news-components";
import { TikTokStory } from "./tiktok-story";

beforeAll(() => {
    if (typeof window !== "undefined" && !window.requestAnimationFrame) {
        window.requestAnimationFrame = ((cb: FrameRequestCallback) => window.setTimeout(() => cb(performance.now()), 0)) as typeof window.requestAnimationFrame;
        window.cancelAnimationFrame = ((id: number) => window.clearTimeout(id)) as typeof window.cancelAnimationFrame;
    }
});

afterEach(() => {
    cleanup();
    queryStreamMock.mockReset();
});

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

function renderCard(props: Partial<React.ComponentProps<typeof TikTokStory>> = {}) {
    return render(
        <AskProvider baseUrl="https://api.test" website="testsite" apiKey="test-key">
            <MemoryRouter>
                <TikTokStory
                    imageUrl="/img.jpg"
                    title="What is happening today?"
                    href="/ask-the-news?q=what"
                    kicker="Ask"
                    id="abc"
                    {...props}
                />
            </MemoryRouter>
        </AskProvider>
    );
}

describe("TikTokStory — answer reveal", () => {
    it("does not fetch when inactive and not prefetching", () => {
        renderCard();
        expect(queryStreamMock).not.toHaveBeenCalled();
    });

    it("fetches and reveals when active=true", async () => {
        const { response, release } = deferredStream();
        queryStreamMock.mockResolvedValueOnce(response);

        renderCard({ active: true });

        // Stream invoked with the card's question text.
        await vi.waitFor(() => {
            expect(queryStreamMock).toHaveBeenCalledTimes(1);
            expect(queryStreamMock.mock.calls[0][0].query).toBe("What is happening today?");
        });

        await act(async () => {
            release([{ type: "output_text.delta", delta: "Because of the budget." } as QueryStreamChunk]);
        });

        // The streamed text appears inside the revealed bottom block.
        expect(await screen.findByText(/Because of the budget\./)).toBeInTheDocument();
    });

    it("fetches silently when prefetch=true (no text rendered)", async () => {
        const { response, release } = deferredStream();
        queryStreamMock.mockResolvedValueOnce(response);

        renderCard({ prefetch: true });

        await vi.waitFor(() => expect(queryStreamMock).toHaveBeenCalledTimes(1));

        await act(async () => {
            release([{ type: "output_text.delta", delta: "Hidden buffer text." } as QueryStreamChunk]);
        });

        // Buffered text exists in DOM but the revealed-bottom block is faded out (opacity-0).
        // Hidden answer block carries `aria-hidden="true"`; the IDLE title is still visible.
        expect(screen.getByRole("heading", { level: 3, name: /what is happening today/i })).toBeInTheDocument();
    });

    it("navigates to the ask-the-news page on click (link preserved)", () => {
        renderCard();
        const link = screen.getByRole("link");
        expect(link).toHaveAttribute("href", "/ask-the-news?q=what");
    });

    it("falls back silently on stream error (no toast, question still shown)", async () => {
        queryStreamMock.mockRejectedValueOnce(new Error("network down"));
        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

        renderCard({ active: true });

        await vi.waitFor(() => expect(warnSpy).toHaveBeenCalled());
        // IDLE question remains rendered.
        expect(screen.getByRole("heading", { level: 3, name: /what is happening today/i })).toBeInTheDocument();
        warnSpy.mockRestore();
    });

    it("falls back silently when stream is null", async () => {
        queryStreamMock.mockResolvedValueOnce({
            stream: null,
            error: { detail: "boom" },
        } as unknown as QueryStreamResponse);
        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

        renderCard({ active: true });

        await vi.waitFor(() => expect(warnSpy).toHaveBeenCalled());
        expect(screen.getByRole("heading", { level: 3, name: /what is happening today/i })).toBeInTheDocument();
        warnSpy.mockRestore();
    });
});
