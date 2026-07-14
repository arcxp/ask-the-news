import { useState } from "react";
import { HashRouter, Routes, Route } from "react-router";
import { Navbar } from "@/components/layout/navbar";
import { BottomTabBar } from "@/components/layout/bottom-tab-bar";
import { MobileNavDrawer } from "@/components/layout/mobile-nav-drawer";
import { PasswordGate } from "@/components/layout/password-gate";
import { Toaster } from "@/components/ui/sonner";
import { HomePage } from "@/pages/home";
import { AskTheNewsPage } from "@/pages/ask-the-news";
import { ForYouPage } from "@/pages/for-you";
import { ArticlePage } from "@/pages/article";
import { DiveDeeperDemoPage } from "@/pages/dive-deeper-demo";
import { SettingsPage } from "@/pages/settings";
import { SearchPage } from "@/pages/search";
import { useStoredPassword } from "@/hooks/use-password";
import { useStoredConfig } from "@/hooks/use-atn-config";
import { hasBundledCiphertext, resolveActiveToken } from "@/lib/crypto-token";
import { AskProvider } from "@arcxp/ask-the-news-components";

function App() {
    const [storedPassword] = useStoredPassword();
    const [storedConfig] = useStoredConfig();
    const [drawerOpen, setDrawerOpen] = useState(false);

    if (!storedPassword && !storedConfig && hasBundledCiphertext()) {
        return <PasswordGate />;
    }

    // Blur whatever element invoked the open so Radix/vaul's aria-hidden on
    // the page region doesn't trap focus inside an aria-hidden ancestor.
    const openMobileNav = () => {
        (document.activeElement as HTMLElement | null)?.blur();
        setDrawerOpen(true);
    };

    // Feed the SDK config to the exported components. A user-supplied (BYO-key)
    // config overrides the build-time env vars; the API key is resolved per call
    // by decrypting the bundled ciphertext with the stored password when needed.
    const baseUrl = storedConfig?.baseUrl || import.meta.env.VITE_ATN_BASE_URL;
    const website = storedConfig?.website || import.meta.env.VITE_ATN_WEBSITE || "my-site";

    return (
        <AskProvider baseUrl={baseUrl} website={website} resolveApiKey={resolveActiveToken}>
            <HashRouter>
                <div className="bg-background min-h-screen">
                    <Navbar drawerOpen={drawerOpen} onDrawerOpenChange={(next) => (next ? openMobileNav() : setDrawerOpen(false))} />
                    <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/ask-the-news" element={<AskTheNewsPage />} />
                        <Route path="/for-you" element={<ForYouPage />} />
                        <Route path="/article/:slug" element={<ArticlePage />} />
                        <Route path="/settings" element={<SettingsPage />} />
                        {import.meta.env.DEV && <Route path="/dive-deeper" element={<DiveDeeperDemoPage />} />}
                        <Route path="/search" element={<SearchPage />} />
                    </Routes>
                    <BottomTabBar onMore={openMobileNav} />
                    <MobileNavDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
                    <Toaster />
                </div>
            </HashRouter>
        </AskProvider>
    );
}

export default App;
