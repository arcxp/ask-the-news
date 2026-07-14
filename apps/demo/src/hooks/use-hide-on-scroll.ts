import { useEffect, useSyncExternalStore } from "react";
import { useLocation } from "react-router";

const THRESHOLD = 8;
const TOP_DEADBAND = 24;
const BOTTOM_DEADBAND = 2;

let hidden = false;
let lastY = 0;
let accum = 0;
let rafId: number | null = null;
let activeCount = 0;
const subscribers = new Set<() => void>();

function notify() {
    subscribers.forEach((cb) => cb());
}

function setHidden(next: boolean) {
    if (hidden === next) return;
    hidden = next;
    notify();
}

function handleScroll() {
    if (rafId !== null) return;
    rafId = window.requestAnimationFrame(() => {
        rafId = null;
        const y = window.scrollY;
        const dy = y - lastY;
        lastY = y;

        if (y < TOP_DEADBAND) {
            accum = 0;
            setHidden(false);
            return;
        }

        const max = document.documentElement.scrollHeight - window.innerHeight;
        if (y >= max - BOTTOM_DEADBAND) {
            accum = 0;
            setHidden(false);
            return;
        }

        if ((dy > 0 && accum < 0) || (dy < 0 && accum > 0)) {
            accum = 0;
        }
        accum += dy;

        if (accum > THRESHOLD) {
            accum = 0;
            setHidden(true);
        } else if (accum < -THRESHOLD) {
            accum = 0;
            setHidden(false);
        }
    });
}

function attach() {
    hidden = false;
    accum = 0;
    lastY = window.scrollY;
    window.addEventListener("scroll", handleScroll, { passive: true });
}

function detach() {
    window.removeEventListener("scroll", handleScroll);
    if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
    }
}

function subscribe(cb: () => void) {
    subscribers.add(cb);
    if (activeCount === 0) attach();
    activeCount++;
    return () => {
        subscribers.delete(cb);
        activeCount--;
        if (activeCount === 0) detach();
    };
}

const noopSubscribe = () => () => {};
const getSnapshot = () => hidden;
const falseSnapshot = () => false;

export function isHideOnScrollRoute(pathname: string) {
    return pathname === "/for-you" || pathname.startsWith("/article/");
}

/**
 * Returns `true` when the mobile chrome should be hidden because the user is
 * scrolling down. Scrolling up, reaching the top, or reaching the bottom
 * reveals it again. When `enabled` is false, always returns `false` and does
 * not attach a scroll listener.
 *
 * Multiple consumers share a single rAF-throttled scroll listener via a
 * module-level store, so the top nav and bottom tab bar animate in lockstep.
 */
export function useHideOnScroll(enabled: boolean) {
    const location = useLocation();

    useEffect(() => {
        if (!enabled) return;
        accum = 0;
        lastY = window.scrollY;
        setHidden(false);
    }, [enabled, location.pathname]);

    return useSyncExternalStore(enabled ? subscribe : noopSubscribe, enabled ? getSnapshot : falseSnapshot, falseSnapshot);
}
