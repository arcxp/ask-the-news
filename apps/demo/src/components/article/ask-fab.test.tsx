import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { AskFab } from "./ask-fab";
import type { DiveDeeperChunk } from "@arcxp/ask-the-news-components";

let observerCallback: IntersectionObserverCallback | null = null;
let observerOptions: IntersectionObserverInit | undefined;
let observedTarget: Element | null = null;
const observeSpy = vi.fn();
const disconnectSpy = vi.fn();

class MockIntersectionObserver {
    constructor(cb: IntersectionObserverCallback, options?: IntersectionObserverInit) {
        observerCallback = cb;
        observerOptions = options;
    }
    observe(target: Element) {
        observedTarget = target;
        observeSpy(target);
    }
    unobserve() {}
    disconnect() {
        disconnectSpy();
    }
    takeRecords() {
        return [];
    }
    root = null;
    rootMargin = "";
    thresholds: ReadonlyArray<number> = [];
}

// Stable no-op stream for tests that don't care about Explain behavior.
async function* noopStream(): AsyncGenerator<DiveDeeperChunk> {
    yield { type: "done" };
}

beforeAll(() => {
    (globalThis as unknown as { IntersectionObserver: typeof MockIntersectionObserver }).IntersectionObserver = MockIntersectionObserver;
    (window as unknown as { IntersectionObserver: typeof MockIntersectionObserver }).IntersectionObserver = MockIntersectionObserver;
    const proto = window.HTMLElement.prototype as HTMLElement & {
        scrollIntoView?: () => void;
        hasPointerCapture?: (id: number) => boolean;
        setPointerCapture?: (id: number) => void;
        releasePointerCapture?: (id: number) => void;
    };
    if (!proto.scrollIntoView) proto.scrollIntoView = () => {};
    if (!proto.hasPointerCapture) proto.hasPointerCapture = () => false;
    if (!proto.setPointerCapture) proto.setPointerCapture = () => {};
    if (!proto.releasePointerCapture) proto.releasePointerCapture = () => {};
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
});

beforeEach(() => {
    observerCallback = null;
    observerOptions = undefined;
    observedTarget = null;
    observeSpy.mockClear();
    disconnectSpy.mockClear();
    vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
    vi.useRealTimers();
    cleanup();
});

type RenderOpts = {
    withInput?: boolean;
    targetId?: string;
    onJump?: (y: number) => void;
    onExplain?: () => AsyncIterable<DiveDeeperChunk>;
    articleTitle?: string;
};

function renderFab(opts?: RenderOpts) {
    const targetId = opts?.targetId ?? "test-target";
    const withInput = opts?.withInput ?? true;
    return render(
        <MemoryRouter>
            <div id={targetId} data-testid="target">
                {withInput && <input data-testid="target-input" />}
            </div>
            <AskFab
                targetId={targetId}
                onJump={opts?.onJump}
                articleTitle={opts?.articleTitle ?? "Test headline"}
                onExplain={opts?.onExplain ?? noopStream}
            />
        </MemoryRouter>
    );
}

function fireObserver(entry: Partial<IntersectionObserverEntry>) {
    if (!observerCallback) throw new Error("Observer not initialized");
    act(() => {
        observerCallback!([entry as IntersectionObserverEntry], {} as IntersectionObserver);
    });
}

async function tapFab(user: ReturnType<typeof userEvent.setup>) {
    await user.click(screen.getByRole("button", { name: /ask about this article/i }));
}

describe("AskFab", () => {
    it("renders the sparkle button with the default aria-label", () => {
        renderFab();
        expect(screen.getByRole("button", { name: /ask about this article/i })).toBeInTheDocument();
    });

    it("renders a custom label when provided", () => {
        render(
            <MemoryRouter>
                <div id="test-target" />
                <AskFab targetId="test-target" label="Ask something" articleTitle="t" onExplain={noopStream} />
            </MemoryRouter>
        );
        expect(screen.getByRole("button", { name: "Ask something" })).toBeInTheDocument();
    });

    it("observes the element matching targetId with thresholds [0.25, 0.9]", () => {
        renderFab();
        expect(observeSpy).toHaveBeenCalledTimes(1);
        expect(observedTarget).toBe(screen.getByTestId("target"));
        expect(observerOptions?.threshold).toEqual([0.25, 0.9]);
    });

    it("does not observe when the target id does not resolve", () => {
        render(
            <MemoryRouter>
                <AskFab targetId="nonexistent" articleTitle="t" onExplain={noopStream} />
            </MemoryRouter>
        );
        expect(observeSpy).not.toHaveBeenCalled();
    });

    it("expands the menu when tapped, showing both action buttons", async () => {
        const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
        renderFab();
        const fab = screen.getByRole("button", { name: /ask about this article/i });
        expect(fab).toHaveAttribute("aria-expanded", "false");
        expect(screen.queryByRole("button", { name: /explain it to me/i })).not.toBeInTheDocument();

        await tapFab(user);

        expect(fab).toHaveAttribute("aria-expanded", "true");
        expect(screen.getByRole("button", { name: /explain it to me/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /ask a question/i })).toBeInTheDocument();
    });

    it("collapses on a second tap", async () => {
        const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
        renderFab();
        await tapFab(user);
        await tapFab(user);
        expect(screen.getByRole("button", { name: /ask about this article/i })).toHaveAttribute("aria-expanded", "false");
    });

    it("collapses when the scrim is tapped", async () => {
        const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
        renderFab();
        await tapFab(user);
        await user.click(screen.getByRole("button", { name: /close menu/i }));
        expect(screen.getByRole("button", { name: /ask about this article/i })).toHaveAttribute("aria-expanded", "false");
    });

    it("collapses on Escape while expanded", async () => {
        const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
        renderFab();
        await tapFab(user);
        await user.keyboard("{Escape}");
        expect(screen.getByRole("button", { name: /ask about this article/i })).toHaveAttribute("aria-expanded", "false");
    });

    it("'Ask a question' calls onJump with scrollY then scrolls the target", async () => {
        const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
        const onJump = vi.fn();
        renderFab({ onJump });
        Object.defineProperty(window, "scrollY", { value: 420, configurable: true });
        const target = screen.getByTestId("target");
        const spy = vi.spyOn(target, "scrollIntoView");

        await tapFab(user);
        await user.click(screen.getByRole("button", { name: /ask a question/i }));
        // The 120ms exit motion runs before scroll fires.
        await act(async () => {
            await vi.advanceTimersByTimeAsync(150);
        });

        expect(onJump).toHaveBeenCalledWith(420);
        expect(spy).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });
        // onJump fires BEFORE scroll.
        expect(onJump.mock.invocationCallOrder[0]).toBeLessThan(spy.mock.invocationCallOrder[0]);
    });

    it("'Explain it to me' opens the sheet and does NOT call onJump", async () => {
        const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
        const onJump = vi.fn();
        renderFab({ onJump });

        await tapFab(user);
        await user.click(screen.getByRole("button", { name: /explain it to me/i }));
        await act(async () => {
            await vi.advanceTimersByTimeAsync(150);
        });

        expect(onJump).not.toHaveBeenCalled();
        // Drawer renders the kicker text inside its content.
        expect(await screen.findByText(/explain it to me/i, { selector: "p" })).toBeInTheDocument();
    });

    it("focuses the target's input after Ask-a-question once the widget reaches ≥0.9 visibility", async () => {
        const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
        renderFab();

        await tapFab(user);
        await user.click(screen.getByRole("button", { name: /ask a question/i }));
        await act(async () => {
            await vi.advanceTimersByTimeAsync(150);
        });

        const input = screen.getByTestId("target-input") as HTMLInputElement;
        expect(document.activeElement).not.toBe(input);

        fireObserver({ isIntersecting: true, intersectionRatio: 0.95 });
        expect(document.activeElement).toBe(input);
    });

    it("does not focus the input when the widget enters view without a prior Ask-a-question tap", () => {
        renderFab();
        const input = screen.getByTestId("target-input") as HTMLInputElement;
        fireObserver({ isIntersecting: true, intersectionRatio: 0.95 });
        expect(document.activeElement).not.toBe(input);
    });

    it("hides itself (opacity-0 pointer-events-none) when the target is ≥25% visible", () => {
        renderFab();
        const button = screen.getByRole("button", { name: /ask about this article/i });

        expect(button.className).not.toMatch(/opacity-0/);
        fireObserver({ isIntersecting: true, intersectionRatio: 0.5 });
        expect(button.className).toMatch(/opacity-0/);
        expect(button.className).toMatch(/pointer-events-none/);
    });

    it("collapses the menu when the target becomes ≥25% visible", async () => {
        const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
        renderFab();
        await tapFab(user);
        expect(screen.getByRole("button", { name: /ask about this article/i })).toHaveAttribute("aria-expanded", "true");

        fireObserver({ isIntersecting: true, intersectionRatio: 0.5 });

        expect(screen.getByRole("button", { name: /ask about this article/i })).toHaveAttribute("aria-expanded", "false");
    });

    it("stays visible when only a sliver of the target is on-screen (ratio < 0.25)", () => {
        renderFab();
        const button = screen.getByRole("button", { name: /ask about this article/i });

        fireObserver({ isIntersecting: true, intersectionRatio: 0.05 });
        expect(button.className).not.toMatch(/opacity-0/);
    });

    it("exposes aria-controls pointing at the menu group when expanded", async () => {
        const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
        renderFab();
        await tapFab(user);
        const fab = screen.getByRole("button", { name: /ask about this article/i });
        const menuId = fab.getAttribute("aria-controls");
        expect(menuId).toBeTruthy();
        const group = document.getElementById(menuId!);
        expect(group).toBeInTheDocument();
        expect(group).toHaveAttribute("role", "group");
    });
});
