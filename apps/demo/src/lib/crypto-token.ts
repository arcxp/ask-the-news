import data from "./encrypted-token";
import { readStoredPassword, writeStoredPassword } from "@/hooks/use-password";
import { readStoredConfig } from "@/hooks/use-atn-config";

export function hasBundledCiphertext(): boolean {
    return data.ct.length > 0;
}

function b64ToBytes(b64: string): Uint8Array<ArrayBuffer> {
    const binary = atob(b64);
    const bytes = new Uint8Array(new ArrayBuffer(binary.length));
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
}

async function deriveKey(password: string, salt: Uint8Array<ArrayBuffer>, iter: number): Promise<CryptoKey> {
    const passwordBytes = new TextEncoder().encode(password) as Uint8Array<ArrayBuffer>;
    const baseKey = await crypto.subtle.importKey("raw", passwordBytes, { name: "PBKDF2" }, false, ["deriveKey"]);
    return crypto.subtle.deriveKey(
        { name: "PBKDF2", salt, iterations: iter, hash: "SHA-256" },
        baseKey,
        { name: "AES-GCM", length: 256 },
        false,
        ["decrypt"]
    );
}

export async function decryptToken(password: string): Promise<string> {
    if (!hasBundledCiphertext()) throw new Error("No bundled ciphertext");
    const key = await deriveKey(password, b64ToBytes(data.salt), data.iter);
    const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: b64ToBytes(data.iv) }, key, b64ToBytes(data.ct));
    return new TextDecoder().decode(plain);
}

/**
 * Returns the active API token for an outbound SDK call. If the user supplied
 * their own credentials at the gate, that key is used directly; otherwise the
 * bundled ciphertext is decrypted with the stored password. Returns undefined
 * if neither source is available.
 *
 * If decryption fails (stored password no longer matches the bundled
 * ciphertext, e.g. after a redeploy with a new password), the stored password
 * is cleared so the gate re-prompts on the next render. The original error is
 * re-thrown so the caller can surface it.
 */
export async function resolveActiveToken(): Promise<string | undefined> {
    if (typeof window === "undefined") return undefined;
    // User-supplied credentials take precedence over the bundled password token.
    const customKey = readStoredConfig()?.apiKey;
    if (customKey) return customKey;
    const password = readStoredPassword();
    if (!password || !hasBundledCiphertext()) return undefined;
    try {
        return await decryptToken(password);
    } catch (err) {
        writeStoredPassword(null);
        throw err;
    }
}
