import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router";

import { SettingsPage } from "./settings";
import { DEFAULT_SETTINGS, SETTINGS_STORAGE_KEY } from "@arcxp/ask-the-news-components";

beforeEach(() => {
    window.localStorage.clear();
});

afterEach(() => {
    cleanup();
});

function renderPage() {
    return render(
        <MemoryRouter>
            <SettingsPage />
        </MemoryRouter>
    );
}

describe("SettingsPage", () => {
    it("renders a switch for every setting, all checked by default", () => {
        renderPage();
        const switches = screen.getAllByRole("switch");
        expect(switches).toHaveLength(Object.keys(DEFAULT_SETTINGS).length);
        for (const s of switches) {
            expect(s).toHaveAttribute("aria-checked", "true");
        }
    });

    it("toggling a switch persists the change to localStorage", () => {
        renderPage();
        const storylinesSwitch = screen.getByRole("switch", { name: /show storylines/i });
        fireEvent.click(storylinesSwitch);

        expect(storylinesSwitch).toHaveAttribute("aria-checked", "false");
        const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
        expect(raw).not.toBeNull();
        expect(JSON.parse(raw!).showStorylines).toBe(false);
    });

    it("Reset to defaults flips toggles back on", () => {
        renderPage();
        const mostAsked = screen.getByRole("switch", { name: /show most asked/i });
        fireEvent.click(mostAsked);
        expect(mostAsked).toHaveAttribute("aria-checked", "false");

        fireEvent.click(screen.getByRole("button", { name: /reset to defaults/i }));
        expect(mostAsked).toHaveAttribute("aria-checked", "true");
    });
});
