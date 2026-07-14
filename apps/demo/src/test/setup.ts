import "@testing-library/jest-dom/vitest";

// Node 25 enables the Web Storage API by default; without --localstorage-file its
// broken global shadows jsdom's storage — window.localStorage comes back undefined
// (Node 25) or throws on access (Node 22-24 with --experimental-webstorage).
// See https://github.com/vitest-dev/vitest/issues/8757. Restore an in-memory Storage.
// Known shim limit: setItem/removeItem don't dispatch StorageEvent, so anything
// depending on cross-tab storage events (rather than e.g. CONFIG_CHANGE_EVENT in
// use-atn-config) can pass here yet fail in a real browser.
function storageIsBroken(name: "localStorage" | "sessionStorage"): boolean {
    try {
        return !window[name];
    } catch {
        return true;
    }
}

if (typeof window !== "undefined" && (storageIsBroken("localStorage") || storageIsBroken("sessionStorage"))) {
    class MemoryStorage implements Storage {
        private store = new Map<string, string>();
        get length() {
            return this.store.size;
        }
        key(index: number) {
            return [...this.store.keys()][index] ?? null;
        }
        getItem(key: string) {
            return this.store.get(key) ?? null;
        }
        setItem(key: string, value: string) {
            this.store.set(key, String(value));
        }
        removeItem(key: string) {
            this.store.delete(key);
        }
        clear() {
            this.store.clear();
        }
    }
    for (const name of ["localStorage", "sessionStorage"] as const) {
        if (storageIsBroken(name)) {
            const storage = new MemoryStorage();
            Object.defineProperty(window, name, { value: storage, writable: true, configurable: true });
            Object.defineProperty(globalThis, name, { value: storage, writable: true, configurable: true });
        }
    }
}

// jsdom computes `transform` as "" where browsers return "none"; vaul's drag-release
// handler does `transform.match(...)` on that chain and crashes with an unhandled
// pointer-event exception. Normalize to the browser value.
if (typeof window !== "undefined" && typeof window.getComputedStyle === "function") {
    const realGetComputedStyle = window.getComputedStyle.bind(window);
    window.getComputedStyle = (element: Element, pseudo?: string | null) => {
        const style = realGetComputedStyle(element, pseudo);
        if (!style.transform) {
            try {
                Object.defineProperty(style, "transform", { value: "none", configurable: true });
            } catch {
                // Non-configurable in some jsdom versions — leave as-is.
            }
        }
        return style;
    };
}

if (typeof window !== "undefined" && !("IntersectionObserver" in window)) {
    class IntersectionObserverStub {
        observe() {}
        unobserve() {}
        disconnect() {}
        takeRecords() {
            return [];
        }
        root = null;
        rootMargin = "";
        thresholds: ReadonlyArray<number> = [];
    }
    (window as unknown as { IntersectionObserver: typeof IntersectionObserverStub }).IntersectionObserver = IntersectionObserverStub;
    (globalThis as unknown as { IntersectionObserver: typeof IntersectionObserverStub }).IntersectionObserver = IntersectionObserverStub;
}

if (typeof window !== "undefined" && !("ResizeObserver" in window)) {
    class ResizeObserverStub {
        observe() {}
        unobserve() {}
        disconnect() {}
    }
    (window as unknown as { ResizeObserver: typeof ResizeObserverStub }).ResizeObserver = ResizeObserverStub;
    (globalThis as unknown as { ResizeObserver: typeof ResizeObserverStub }).ResizeObserver = ResizeObserverStub;
}

if (typeof window !== "undefined" && !window.matchMedia) {
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
