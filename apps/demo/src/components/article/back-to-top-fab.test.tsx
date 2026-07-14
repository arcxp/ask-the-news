import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { BackToTopFab, RETURN_PROXIMITY_PX } from "./back-to-top-fab";

const SETTLE_MS = 600;

function setScrollY(y: number) {
    Object.defineProperty(window, "scrollY", { value: y, configurable: true, writable: true });
    window.dispatchEvent(new Event("scroll"));
}

function renderFab(returnY: number | null, onDismiss = vi.fn()) {
    const utils = render(
        <MemoryRouter>
            <BackToTopFab returnY={returnY} onDismiss={onDismiss} />
        </MemoryRouter>
    );
    return { ...utils, onDismiss };
}

beforeEach(() => {
    vi.useFakeTimers();
    setScrollY(0);
});

afterEach(() => {
    vi.useRealTimers();
    cleanup();
});

describe("BackToTopFab", () => {
    it("mounts after the settle delay when returnY is set", () => {
        const returnY = 1000;
        // User has been jumped well below returnY by the Ask FAB.
        setScrollY(3000);
        renderFab(returnY);

        expect(screen.queryByRole("button", { name: /scroll back/i })).toBeNull();
        act(() => {
            vi.advanceTimersByTime(SETTLE_MS);
        });
        expect(screen.getByRole("button", { name: /scroll back/i })).toBeDefined();
    });

    it("does not dismiss on a small upward scroll far from returnY", () => {
        const returnY = 1000;
        setScrollY(3000);
        const { onDismiss } = renderFab(returnY);
        act(() => vi.advanceTimersByTime(SETTLE_MS));

        // A flick upward — still well above returnY + proximity.
        act(() => setScrollY(2800));
        act(() => setScrollY(2500));

        expect(onDismiss).not.toHaveBeenCalled();
    });

    it("dismisses once the user scrolls within RETURN_PROXIMITY_PX of returnY", () => {
        const returnY = 1000;
        setScrollY(3000);
        const { onDismiss } = renderFab(returnY);
        act(() => vi.advanceTimersByTime(SETTLE_MS));

        // Just outside the proximity window — still visible.
        act(() => setScrollY(returnY + RETURN_PROXIMITY_PX + 1));
        expect(onDismiss).not.toHaveBeenCalled();

        // Crosses into the proximity window — dismiss.
        act(() => setScrollY(returnY + RETURN_PROXIMITY_PX));
        expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it("dismisses when the user scrolls above returnY entirely", () => {
        const returnY = 1000;
        setScrollY(3000);
        const { onDismiss } = renderFab(returnY);
        act(() => vi.advanceTimersByTime(SETTLE_MS));

        act(() => setScrollY(500));
        expect(onDismiss).toHaveBeenCalled();
    });
});
