import { useCallback, useSyncExternalStore } from "react";
import { SESSION_TTL_MS } from "@/hooks/use-password";

export const CONFIG_STORAGE_KEY = "atn_custom_config";
export const CONFIG_CHANGE_EVENT = "atn-config-changed";

/** User-supplied API credentials entered at the gate when the shared password is unavailable. */
export interface AtnConfig {
    apiKey: string;
    baseUrl: string;
    website: string;
}

type ConfigEnvelope = { value: AtnConfig; expiresAt: number };

function isAtnConfig(value: unknown): value is AtnConfig {
    if (!value || typeof value !== "object") return false;
    const v = value as Record<string, unknown>;
    return typeof v.apiKey === "string" && typeof v.baseUrl === "string" && typeof v.website === "string";
}

export function readStoredConfig(): AtnConfig | null {
    if (typeof window === "undefined") return null;
    try {
        const raw = window.localStorage.getItem(CONFIG_STORAGE_KEY);
        if (!raw) return null;
        const env = JSON.parse(raw) as Partial<ConfigEnvelope>;
        if (!isAtnConfig(env?.value) || typeof env?.expiresAt !== "number") return null;
        if (Date.now() >= env.expiresAt) return null;
        return env.value;
    } catch {
        return null;
    }
}

export function writeStoredConfig(value: AtnConfig | null): void {
    if (typeof window === "undefined") return;
    try {
        if (value && value.apiKey.trim() && value.baseUrl.trim() && value.website.trim()) {
            const envelope: ConfigEnvelope = {
                value: { apiKey: value.apiKey.trim(), baseUrl: value.baseUrl.trim(), website: value.website.trim() },
                expiresAt: Date.now() + SESSION_TTL_MS,
            };
            // Clear-text on purpose: this is the user's own API key, used only from their own
            // browser in a client-side SPA, with an 8h TTL. Accepted risk — see ADR-001 in
            // docs/project_notes/decisions.md. (CodeQL js/clear-text-storage-of-sensitive-data)
            window.localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(envelope));
        } else {
            window.localStorage.removeItem(CONFIG_STORAGE_KEY);
        }
    } catch {
        // ignore quota / disabled storage
    }
    window.dispatchEvent(new Event(CONFIG_CHANGE_EVENT));
}

function readStoredExpiry(): number | null {
    if (typeof window === "undefined") return null;
    try {
        const raw = window.localStorage.getItem(CONFIG_STORAGE_KEY);
        if (!raw) return null;
        const env = JSON.parse(raw) as Partial<ConfigEnvelope>;
        return typeof env?.expiresAt === "number" ? env.expiresAt : null;
    } catch {
        return null;
    }
}

function subscribeConfig(listener: () => void): () => void {
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
            writeStoredConfig(null);
        }, delay);
    };

    const onChange = () => {
        scheduleExpiry();
        listener();
    };
    const onStorage = (e: StorageEvent) => {
        if (e.key === CONFIG_STORAGE_KEY) onChange();
    };

    scheduleExpiry();
    window.addEventListener(CONFIG_CHANGE_EVENT, onChange);
    window.addEventListener("storage", onStorage);
    return () => {
        if (timer !== null) clearTimeout(timer);
        window.removeEventListener(CONFIG_CHANGE_EVENT, onChange);
        window.removeEventListener("storage", onStorage);
    };
}

/**
 * useSyncExternalStore needs a stable snapshot reference between renders, but
 * readStoredConfig() parses JSON into a fresh object each call. Cache the last
 * parsed value and return the same reference while the underlying string is
 * unchanged so React doesn't loop on a never-equal snapshot.
 */
let cachedRaw: string | null = null;
let cachedConfig: AtnConfig | null = null;

function getConfigSnapshot(): AtnConfig | null {
    if (typeof window === "undefined") return null;
    let raw: string | null = null;
    try {
        raw = window.localStorage.getItem(CONFIG_STORAGE_KEY);
    } catch {
        raw = null;
    }
    if (raw !== cachedRaw) {
        cachedRaw = raw;
        cachedConfig = readStoredConfig();
    }
    return cachedConfig;
}

/** Stored custom API config — populated by the PasswordGate; expires after SESSION_TTL_MS. */
export function useStoredConfig(): [AtnConfig | null, (next: AtnConfig | null) => void] {
    const stored = useSyncExternalStore(subscribeConfig, getConfigSnapshot, () => null);
    const setStored = useCallback((next: AtnConfig | null) => writeStoredConfig(next), []);
    return [stored, setStored];
}
