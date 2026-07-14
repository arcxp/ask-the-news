import { useCallback, useSyncExternalStore } from "react";

export type Theme = "light" | "dark" | "auto";

const STORAGE_KEY = "arc-theme";

function getSystemDark(): boolean {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function readStored(): Theme {
    if (typeof window === "undefined") return "auto";
    const v = window.localStorage.getItem(STORAGE_KEY);
    return v === "light" || v === "dark" || v === "auto" ? v : "auto";
}

function applyTheme(theme: Theme): void {
    const root = document.documentElement;
    const effective = theme === "auto" ? (getSystemDark() ? "dark" : "light") : theme;
    root.classList.toggle("dark", effective === "dark");
    root.dataset.theme = effective;
}

function computeEffective(theme: Theme): "light" | "dark" {
    return theme === "auto" ? (getSystemDark() ? "dark" : "light") : theme;
}

type State = { theme: Theme; effectiveTheme: "light" | "dark" };

let state: State = (() => {
    const t = readStored();
    return { theme: t, effectiveTheme: computeEffective(t) };
})();

const listeners = new Set<() => void>();

function setState(next: State) {
    if (next.theme === state.theme && next.effectiveTheme === state.effectiveTheme) return;
    state = next;
    listeners.forEach((l) => l());
}

function subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

function getSnapshot(): State {
    return state;
}

function getServerSnapshot(): State {
    return { theme: "auto", effectiveTheme: "light" };
}

if (typeof window !== "undefined") {
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    mql.addEventListener("change", () => {
        if (state.theme !== "auto") return;
        applyTheme("auto");
        setState({ theme: "auto", effectiveTheme: getSystemDark() ? "dark" : "light" });
    });
    window.addEventListener("storage", (e) => {
        if (e.key !== STORAGE_KEY) return;
        const t = readStored();
        applyTheme(t);
        setState({ theme: t, effectiveTheme: computeEffective(t) });
    });
}

/**
 * Theme controller. Reads/writes localStorage, applies `.dark` class on the
 * document element, and tracks `prefers-color-scheme` while in "auto".
 *
 * Backed by a module-level store so every consumer re-renders in lockstep when
 * the theme changes.
 */
export function useTheme() {
    const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

    const setTheme = useCallback((next: Theme) => {
        window.localStorage.setItem(STORAGE_KEY, next);
        applyTheme(next);
        setState({ theme: next, effectiveTheme: computeEffective(next) });
    }, []);

    return { theme: snapshot.theme, effectiveTheme: snapshot.effectiveTheme, setTheme };
}

/**
 * Apply the stored theme as early as possible so first paint matches the
 * user's preference. Call from `main.tsx` before React mounts.
 */
export function initTheme(): void {
    if (typeof window === "undefined") return;
    applyTheme(readStored());
}
