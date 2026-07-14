import { useCallback, useSyncExternalStore } from "react";

export const PASSWORD_STORAGE_KEY = "atn_password";
export const PASSWORD_CHANGE_EVENT = "atn-password-changed";

/**
 * How long a successfully-entered password stays in localStorage before the
 * user has to re-enter it. Tweak this single constant to change session length.
 */
export const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

type PasswordEnvelope = { value: string; expiresAt: number };

export function readStoredPassword(): string | null {
    if (typeof window === "undefined") return null;
    try {
        const raw = window.localStorage.getItem(PASSWORD_STORAGE_KEY);
        if (!raw) return null;
        const env = JSON.parse(raw) as Partial<PasswordEnvelope>;
        if (typeof env?.value !== "string" || typeof env?.expiresAt !== "number") return null;
        if (Date.now() >= env.expiresAt) return null;
        return env.value;
    } catch {
        return null;
    }
}

export function writeStoredPassword(value: string | null): void {
    if (typeof window === "undefined") return;
    try {
        if (value && value.trim().length > 0) {
            const envelope: PasswordEnvelope = { value: value.trim(), expiresAt: Date.now() + SESSION_TTL_MS };
            // Clear-text on purpose: shared gate password, browser-only, with an 8h TTL. Accepted
            // risk — see ADR-001 in docs/project_notes/decisions.md.
            // (CodeQL js/clear-text-storage-of-sensitive-data)
            window.localStorage.setItem(PASSWORD_STORAGE_KEY, JSON.stringify(envelope));
        } else {
            window.localStorage.removeItem(PASSWORD_STORAGE_KEY);
        }
    } catch {
        // ignore quota / disabled storage
    }
    window.dispatchEvent(new Event(PASSWORD_CHANGE_EVENT));
}

function readStoredExpiry(): number | null {
    if (typeof window === "undefined") return null;
    try {
        const raw = window.localStorage.getItem(PASSWORD_STORAGE_KEY);
        if (!raw) return null;
        const env = JSON.parse(raw) as Partial<PasswordEnvelope>;
        return typeof env?.expiresAt === "number" ? env.expiresAt : null;
    } catch {
        return null;
    }
}

function subscribePassword(listener: () => void): () => void {
    let timer: ReturnType<typeof setTimeout> | null = null;

    const scheduleExpiry = () => {
        if (timer !== null) {
            clearTimeout(timer);
            timer = null;
        }
        const expiresAt = readStoredExpiry();
        if (expiresAt === null) return;
        const delay = expiresAt - Date.now();
        if (delay <= 0) return;
        timer = setTimeout(() => {
            timer = null;
            listener();
        }, delay);
    };

    const onChange = () => {
        scheduleExpiry();
        listener();
    };
    const onStorage = (e: StorageEvent) => {
        if (e.key === PASSWORD_STORAGE_KEY) onChange();
    };

    scheduleExpiry();
    window.addEventListener(PASSWORD_CHANGE_EVENT, onChange);
    window.addEventListener("storage", onStorage);
    return () => {
        if (timer !== null) clearTimeout(timer);
        window.removeEventListener(PASSWORD_CHANGE_EVENT, onChange);
        window.removeEventListener("storage", onStorage);
    };
}

/** Stored password — populated by the PasswordGate; expires after SESSION_TTL_MS. */
export function useStoredPassword(): [string | null, (next: string | null) => void] {
    const stored = useSyncExternalStore(subscribePassword, readStoredPassword, () => null);
    const setStored = useCallback((next: string | null) => writeStoredPassword(next), []);
    return [stored, setStored];
}
