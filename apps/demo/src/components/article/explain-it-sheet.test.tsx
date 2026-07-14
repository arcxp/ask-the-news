import { describe, it, expect, beforeAll, afterEach, vi } from "vitest";
import { act, cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ExplainItSheet, parseBullets } from "./explain-it-sheet";
import type { DiveDeeperChunk } from "@arcxp/ask-the-news-components";

/** Returns the visible bullet column scoped for in-content queries. */
function visibleList(): HTMLElement {
    const ul = document.querySelector('ul[aria-hidden="true"]');
    if (!ul) throw new Error("visible bullet list not found");
    return ul as HTMLElement;
}

/** Returns the sr-only aria-live region for accessibility-focused queries. */
function liveRegion(): HTMLElement {
    const el = document.querySelector('div[aria-live="polite"]');
    if (!el) throw new Error("aria-live region not found");
    return el as HTMLElement;
}

beforeAll(() => {
    if (!window.matchMedia) {
        Object.defineProperty(window, "matchMedia", {
            writable: true,
            value: (query: string) => ({
                matches: false,
                media: query,
                onchange: null,
                addListener: () => {},
                removeListener: () => {},
                addEventListener: () => {},
                removeEventListener: () => {},
                dispatchEvent: () => false,
            }),
        });
    }
    const proto = window.HTMLElement.prototype as HTMLElement & {
        hasPointerCapture?: (id: number) => boolean;
        setPointerCapture?: (id: number) => void;
        releasePointerCapture?: (id: number) => void;
        scrollIntoView?: () => void;
    };
    if (!proto.hasPointerCapture) proto.hasPointerCapture = () => false;
    if (!proto.setPointerCapture) proto.setPointerCapture = () => {};
    if (!proto.releasePointerCapture) proto.releasePointerCapture = () => {};
    if (!proto.scrollIntoView) proto.scrollIntoView = () => {};
});

afterEach(() => {
    cleanup();
});

// Helper: returns a stream factory that resolves a queue of chunks, with a tiny
// real-timer await between yields so React can observe streaming state. The
// queue can be enqueued to after construction (mutable) to simulate live
// streaming during the test.
function makeControlledStream() {
    let resolveNext: (() => void) | null = null;
    const queue: DiveDeeperChunk[] = [];
    let ended = false;
    const gen = async function* (): AsyncGenerator<DiveDeeperChunk> {
        while (!ended || queue.length > 0) {
            if (queue.length === 0) {
                await new Promise<void>((r) => {
                    resolveNext = r;
                });
                continue;
            }
            yield queue.shift()!;
        }
    };
    return {
        factory: () => gen(),
        push(chunk: DiveDeeperChunk) {
            queue.push(chunk);
            resolveNext?.();
            resolveNext = null;
        },
        end() {
            ended = true;
            resolveNext?.();
            resolveNext = null;
        },
    };
}

// Simpler helper for cases that don't need mid-stream control.
function makeBatchStream(chunks: DiveDeeperChunk[]) {
    return async function* (): AsyncGenerator<DiveDeeperChunk> {
        for (const c of chunks) yield c;
    };
}

describe("parseBullets", () => {
    it("strips '-' prefix and trims", () => {
        expect(parseBullets("- one\n- two\n").completed).toEqual(["one", "two"]);
    });
    it("accepts '•' bullets", () => {
        expect(parseBullets("• one\n• two\n").completed).toEqual(["one", "two"]);
    });
    it("accepts '*' bullets", () => {
        expect(parseBullets("* one\n* two\n").completed).toEqual(["one", "two"]);
    });
    it("ignores prose lines without a bullet prefix", () => {
        expect(parseBullets("hello world\n").completed).toEqual([]);
    });
    it("accepts leading whitespace", () => {
        expect(parseBullets("  - foo\n").completed).toEqual(["foo"]);
    });
    it("treats the last line as in-progress when there's no trailing newline", () => {
        const r = parseBullets("- one\n- two in progress");
        expect(r.completed).toEqual(["one"]);
        expect(r.inProgress).toEqual("two in progress");
    });
});

describe("ExplainItSheet", () => {
    it("renders 3 skeletons immediately on open when no cache exists", async () => {
        const stream = makeControlledStream();
        render(<ExplainItSheet open={true} onOpenChange={() => {}} articleTitle="A headline" onExplain={stream.factory} />);

        // The kicker is the visible <p>, distinct from the sr-only DrawerTitle <h2>.
        const kicker = await screen.findByText(/^explain it to me$/i, { selector: "p" });
        expect(kicker).toBeInTheDocument();
        expect(screen.getByText("A headline")).toBeInTheDocument();
        // 3 skeleton rows (li elements inside the bullet list)
        const items = document.querySelectorAll("ul[aria-hidden='true'] > li");
        expect(items.length).toBe(3);
    });

    it("shows 'Thinking…' after 800ms of pending", async () => {
        vi.useFakeTimers({ shouldAdvanceTime: true });
        try {
            const stream = makeControlledStream();
            render(<ExplainItSheet open={true} onOpenChange={() => {}} articleTitle="A" onExplain={stream.factory} />);

            expect(screen.queryByText(/thinking…/i)).not.toBeInTheDocument();
            await act(async () => {
                await vi.advanceTimersByTimeAsync(850);
            });
            expect(screen.getByText(/thinking…/i)).toBeInTheDocument();
        } finally {
            vi.useRealTimers();
        }
    });

    it("streams: completed bullets land as deltas arrive", async () => {
        const onExplain = makeBatchStream([
            { type: "delta", text: "- bullet one\n" },
            { type: "delta", text: "- bullet two\n" },
            { type: "delta", text: "- bullet three\n" },
            { type: "done" },
        ]);
        render(<ExplainItSheet open={true} onOpenChange={() => {}} articleTitle="A" onExplain={onExplain} />);

        await waitFor(() => expect(within(visibleList()).getByText("bullet one")).toBeInTheDocument());
        expect(within(visibleList()).getByText("bullet two")).toBeInTheDocument();
        expect(within(visibleList()).getByText("bullet three")).toBeInTheDocument();
    });

    it("on done with 3 bullets: renders all 3 and no skeletons", async () => {
        const onExplain = makeBatchStream([{ type: "delta", text: "- one\n- two\n- three\n" }, { type: "done" }]);
        render(<ExplainItSheet open={true} onOpenChange={() => {}} articleTitle="A" onExplain={onExplain} />);

        await waitFor(() => expect(within(visibleList()).getByText("three")).toBeInTheDocument());
        const items = visibleList().querySelectorAll("li");
        expect(items.length).toBe(3);
        // None of the items should contain a skeleton div.
        items.forEach((li) => {
            expect(li.querySelector("div.bg-muted")).toBeNull();
        });
    });

    it("on done with 2 bullets: renders 2 bullets, no error", async () => {
        const onExplain = makeBatchStream([{ type: "delta", text: "- one\n- two\n" }, { type: "done" }]);
        render(<ExplainItSheet open={true} onOpenChange={() => {}} articleTitle="A" onExplain={onExplain} />);

        await waitFor(() => expect(within(visibleList()).getByText("two")).toBeInTheDocument());
        expect(screen.queryByText(/no explanation available/i)).not.toBeInTheDocument();
        const items = visibleList().querySelectorAll("li");
        expect(items.length).toBe(2);
    });

    it("on done with 1 bullet: shows the rejected notice with retry", async () => {
        const onExplain = makeBatchStream([{ type: "delta", text: "- only one\n" }, { type: "done" }]);
        render(<ExplainItSheet open={true} onOpenChange={() => {}} articleTitle="A" onExplain={onExplain} />);

        expect(await screen.findByText(/no explanation available/i)).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
    });

    it("on done with prose (no bullet prefix): shows the rejected notice", async () => {
        const onExplain = makeBatchStream([{ type: "delta", text: "This is just prose without bullets.\n" }, { type: "done" }]);
        render(<ExplainItSheet open={true} onOpenChange={() => {}} articleTitle="A" onExplain={onExplain} />);

        expect(await screen.findByText(/no explanation available/i)).toBeInTheDocument();
    });

    it("with fallbackBullets: on error, renders fallback bullets and a subtle Try again (no error notice)", async () => {
        let callCount = 0;
        const onExplain = () => {
            callCount += 1;
            if (callCount === 1) return makeBatchStream([{ type: "error", message: "boom" }])();
            return makeBatchStream([{ type: "delta", text: "- live one\n- live two\n- live three\n" }, { type: "done" }])();
        };
        const fallback = ["fallback alpha", "fallback beta", "fallback gamma"];
        render(<ExplainItSheet open={true} onOpenChange={() => {}} articleTitle="A" onExplain={onExplain} fallbackBullets={fallback} />);

        await waitFor(() => expect(within(visibleList()).getByText("fallback alpha")).toBeInTheDocument());
        expect(within(visibleList()).getByText("fallback beta")).toBeInTheDocument();
        expect(within(visibleList()).getByText("fallback gamma")).toBeInTheDocument();
        // No prominent error notice when a fallback is provided.
        expect(screen.queryByText(/something went wrong/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/no explanation available/i)).not.toBeInTheDocument();

        const user = userEvent.setup();
        await user.click(screen.getByRole("button", { name: /try again/i }));
        await waitFor(() => expect(within(visibleList()).getByText("live one")).toBeInTheDocument());
        expect(callCount).toBe(2);
    });

    it("with fallbackBullets: on rejected (e.g. malformed prose), renders fallback bullets", async () => {
        const onExplain = makeBatchStream([{ type: "delta", text: "just some prose\n" }, { type: "done" }]);
        const fallback = ["fallback alpha", "fallback beta", "fallback gamma"];
        render(<ExplainItSheet open={true} onOpenChange={() => {}} articleTitle="A" onExplain={onExplain} fallbackBullets={fallback} />);

        await waitFor(() => expect(within(visibleList()).getByText("fallback alpha")).toBeInTheDocument());
        expect(screen.queryByText(/no explanation available/i)).not.toBeInTheDocument();
    });

    it("on error: shows the error notice with retry that re-dispatches", async () => {
        let callCount = 0;
        const onExplain = () => {
            callCount += 1;
            if (callCount === 1) {
                return makeBatchStream([{ type: "error", message: "boom" }])();
            }
            return makeBatchStream([{ type: "delta", text: "- a\n- b\n" }, { type: "done" }])();
        };
        render(<ExplainItSheet open={true} onOpenChange={() => {}} articleTitle="A" onExplain={onExplain} />);

        expect(await screen.findByText(/something went wrong/i)).toBeInTheDocument();
        const user = userEvent.setup();
        await user.click(screen.getByRole("button", { name: /try again/i }));
        await waitFor(() => expect(within(visibleList()).getByText("a")).toBeInTheDocument());
        expect(callCount).toBe(2);
    });

    it("caches answered bullets and reuses them on reopen without restreaming", async () => {
        const onExplain = vi.fn(() => makeBatchStream([{ type: "delta", text: "- one\n- two\n- three\n" }, { type: "done" }])());

        const { rerender } = render(<ExplainItSheet open={true} onOpenChange={() => {}} articleTitle="A" onExplain={onExplain} />);
        await waitFor(() => expect(within(visibleList()).getByText("three")).toBeInTheDocument());
        expect(onExplain).toHaveBeenCalledTimes(1);

        // Close, then reopen.
        rerender(<ExplainItSheet open={false} onOpenChange={() => {}} articleTitle="A" onExplain={onExplain} />);
        rerender(<ExplainItSheet open={true} onOpenChange={() => {}} articleTitle="A" onExplain={onExplain} />);

        await waitFor(() => expect(within(visibleList()).getByText("three")).toBeInTheDocument());
        expect(onExplain).toHaveBeenCalledTimes(1);
    });

    it("invalidates cache when articleTitle changes between opens", async () => {
        const onExplain = vi.fn(() => makeBatchStream([{ type: "delta", text: "- one\n- two\n- three\n" }, { type: "done" }])());

        const { rerender } = render(<ExplainItSheet open={true} onOpenChange={() => {}} articleTitle="A" onExplain={onExplain} />);
        await waitFor(() => expect(within(visibleList()).getByText("three")).toBeInTheDocument());
        expect(onExplain).toHaveBeenCalledTimes(1);

        rerender(<ExplainItSheet open={false} onOpenChange={() => {}} articleTitle="A" onExplain={onExplain} />);
        rerender(<ExplainItSheet open={true} onOpenChange={() => {}} articleTitle="B" onExplain={onExplain} />);

        await waitFor(() => expect(onExplain).toHaveBeenCalledTimes(2));
    });

    it("does not cache a half-stream when closed mid-stream; reopen starts fresh", async () => {
        const calls: ReturnType<typeof makeControlledStream>[] = [];
        const onExplain = () => {
            const s = makeControlledStream();
            calls.push(s);
            return s.factory();
        };

        const { rerender } = render(<ExplainItSheet open={true} onOpenChange={() => {}} articleTitle="A" onExplain={onExplain} />);
        // Wait for the first stream factory call.
        await waitFor(() => expect(calls.length).toBe(1));
        // Stream half a bullet (no newline yet), then close.
        await act(async () => {
            calls[0].push({ type: "delta", text: "- half" });
            await Promise.resolve();
        });
        rerender(<ExplainItSheet open={false} onOpenChange={() => {}} articleTitle="A" onExplain={onExplain} />);

        // Reopen — should trigger a NEW stream (no cache hit, since we never reached `answered`).
        rerender(<ExplainItSheet open={true} onOpenChange={() => {}} articleTitle="A" onExplain={onExplain} />);
        await waitFor(() => expect(calls.length).toBe(2));
    });

    it("aria-live sr-only region contains only completed bullets (not in-progress text)", async () => {
        // Use a controlled stream that stays open so the in-progress line
        // doesn't get promoted by `done` (which appends a synthetic newline).
        const stream = makeControlledStream();
        render(<ExplainItSheet open={true} onOpenChange={() => {}} articleTitle="A" onExplain={stream.factory} />);

        await act(async () => {
            stream.push({ type: "delta", text: "- finished one\n" });
            stream.push({ type: "delta", text: "- in progress without newline" });
            await Promise.resolve();
        });

        await waitFor(() => expect(liveRegion().textContent).toContain("finished one"));
        expect(liveRegion().textContent).not.toContain("in progress without newline");
    });

    it("the visible bullet list is aria-hidden", async () => {
        const onExplain = makeBatchStream([{ type: "delta", text: "- a\n- b\n" }, { type: "done" }]);
        render(<ExplainItSheet open={true} onOpenChange={() => {}} articleTitle="A" onExplain={onExplain} />);
        await waitFor(() => expect(within(visibleList()).getByText("b")).toBeInTheDocument());
        const ul = document.querySelector("ul[aria-hidden='true']");
        expect(ul).toBeTruthy();
    });

    it("includes the Powered by Arc Intelligencer footnote", async () => {
        const onExplain = makeBatchStream([{ type: "done" }]);
        render(<ExplainItSheet open={true} onOpenChange={() => {}} articleTitle="A" onExplain={onExplain} />);
        expect(await screen.findByText(/powered by arc intelligencer/i)).toBeInTheDocument();
    });
});
