import { useState, type FormEvent } from "react";
import { ChevronDown, Lock } from "lucide-react";
import { createAskTheNewsClient } from "@arcxp/ask-the-news-sdk";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useStoredPassword } from "@/hooks/use-password";
import { useStoredConfig } from "@/hooks/use-atn-config";
import { decryptToken } from "@/lib/crypto-token";

export function PasswordGate() {
    const [, setStoredPassword] = useStoredPassword();
    const [, setStoredConfig] = useStoredConfig();

    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    // Custom-credentials section state.
    const [showCustom, setShowCustom] = useState(false);
    const [apiKey, setApiKey] = useState("");
    const [baseUrl, setBaseUrl] = useState("");
    const [website, setWebsite] = useState("");
    const [customError, setCustomError] = useState<string | null>(null);
    const [customBusy, setCustomBusy] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!password || busy) return;
        setBusy(true);
        setError(null);
        try {
            // Validate by decrypting once; we discard the plaintext token and
            // persist only the password, so callers re-decrypt per request.
            await decryptToken(password);
            setStoredPassword(password);
        } catch {
            setError("Incorrect password.");
            setBusy(false);
        }
    };

    const handleCustomSubmit = async (e: FormEvent) => {
        e.preventDefault();
        const key = apiKey.trim();
        const url = baseUrl.trim();
        const site = website.trim();
        if (!key || !url || !site || customBusy) return;
        setCustomBusy(true);
        setCustomError(null);
        try {
            // Lightweight probe: a successful getSettings confirms the
            // key/URL/website work before we persist them.
            const probe = createAskTheNewsClient({ baseUrl: url, apiKey: key });
            const result = await probe.getSettings(site);
            if (!result?.data) throw new Error("No data returned");
            setStoredConfig({ apiKey: key, baseUrl: url, website: site });
        } catch {
            setCustomError("Couldn't validate those credentials. Check your API key, URL, and website.");
        } finally {
            setCustomBusy(false);
        }
    };

    return (
        <div className="bg-background flex min-h-screen items-center justify-center px-4">
            <div className="w-full max-w-sm space-y-4">
                <form onSubmit={handleSubmit} className="border-border bg-card space-y-4 rounded-lg border p-6 shadow-sm">
                    <div className="flex items-center gap-2">
                        <Lock className="size-4" aria-hidden />
                        <h1 className="text-lg font-semibold">Enter access password</h1>
                    </div>
                    <p className="text-muted-foreground text-sm">This demo is gated by a shared password. Ask the team for access.</p>
                    <Input
                        type="password"
                        autoFocus
                        aria-label="Access password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                        disabled={busy}
                    />
                    {error && (
                        <p role="alert" className="text-destructive text-sm">
                            {error}
                        </p>
                    )}
                    <Button type="submit" disabled={!password || busy} className="w-full">
                        {busy ? "Unlocking…" : "Unlock"}
                    </Button>
                </form>

                <Collapsible open={showCustom} onOpenChange={setShowCustom} className="border-border bg-card rounded-lg border p-6 shadow-sm">
                    <CollapsibleTrigger asChild>
                        <button
                            type="button"
                            className="text-muted-foreground hover:text-foreground flex w-full items-center justify-between text-sm font-medium transition-colors"
                        >
                            <span>Use your own API credentials</span>
                            <ChevronDown className={`size-4 transition-transform ${showCustom ? "rotate-180" : ""}`} aria-hidden />
                        </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-4">
                        <form onSubmit={handleCustomSubmit} className="space-y-4">
                            <p className="text-muted-foreground text-sm">
                                No password? Bring your own Ask the News credentials. They're stored only in this browser.
                            </p>
                            <div className="space-y-1.5">
                                <Label htmlFor="custom-api-key">API key</Label>
                                <Input
                                    id="custom-api-key"
                                    type="password"
                                    autoComplete="off"
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    placeholder="X-Api-Key value"
                                    disabled={customBusy}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="custom-base-url">CDN / base URL</Label>
                                <Input
                                    id="custom-base-url"
                                    type="url"
                                    inputMode="url"
                                    autoComplete="off"
                                    value={baseUrl}
                                    onChange={(e) => setBaseUrl(e.target.value)}
                                    placeholder="https://api.example.com"
                                    disabled={customBusy}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="custom-website">Website</Label>
                                <Input
                                    id="custom-website"
                                    autoComplete="off"
                                    value={website}
                                    onChange={(e) => setWebsite(e.target.value)}
                                    placeholder="website-id"
                                    disabled={customBusy}
                                />
                            </div>
                            {customError && (
                                <p role="alert" className="text-destructive text-sm">
                                    {customError}
                                </p>
                            )}
                            <Button type="submit" disabled={!apiKey.trim() || !baseUrl.trim() || !website.trim() || customBusy} className="w-full">
                                {customBusy ? "Validating…" : "Use these credentials"}
                            </Button>
                        </form>
                    </CollapsibleContent>
                </Collapsible>
            </div>
        </div>
    );
}
