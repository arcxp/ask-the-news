import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { InlineMostAsked } from "./inline-most-asked";

const navigateMock = vi.fn();
vi.mock("react-router", async () => {
    const actual = await vi.importActual<typeof import("react-router")>("react-router");
    return {
        ...actual,
        useNavigate: () => navigateMock,
    };
});

const questions: [string, string, string] = [
    "What authority does the president have over construction on federal land?",
    "How does the Commemorative Works Act limit new monuments in Washington?",
    "What other major monuments were built without congressional authorization?",
];

function renderInRouter(node: React.ReactElement) {
    return render(<MemoryRouter>{node}</MemoryRouter>);
}

afterEach(() => {
    navigateMock.mockClear();
    cleanup();
});

describe("InlineMostAsked", () => {
    it("renders the kicker label and all three questions", () => {
        renderInRouter(<InlineMostAsked questions={questions} />);

        expect(screen.getByText("Most Asked")).toBeDefined();
        for (const q of questions) {
            expect(screen.getByRole("button", { name: q })).toBeDefined();
        }
    });

    it("renders a custom label when provided", () => {
        renderInRouter(<InlineMostAsked questions={questions} label="People also ask" />);
        expect(screen.getByText("People also ask")).toBeDefined();
    });

    it("exposes a complementary landmark labeled by the kicker", () => {
        renderInRouter(<InlineMostAsked questions={questions} />);
        expect(screen.getByRole("complementary", { name: "Most Asked" })).toBeDefined();
    });

    it("navigates to /ask-the-news with the encoded question on click", async () => {
        const user = userEvent.setup();
        renderInRouter(<InlineMostAsked questions={questions} />);

        await user.click(screen.getByRole("button", { name: questions[1] }));

        expect(navigateMock).toHaveBeenCalledTimes(1);
        expect(navigateMock).toHaveBeenCalledWith(`/ask-the-news?q=${encodeURIComponent(questions[1])}`, { viewTransition: true });
    });

    it("encodes special characters in question strings", async () => {
        const user = userEvent.setup();
        const tricky: [string, string, string] = ['What\'s "the deal" with X & Y?', "Plain question?", "Another?"];
        renderInRouter(<InlineMostAsked questions={tricky} />);

        await user.click(screen.getByRole("button", { name: tricky[0] }));

        expect(navigateMock).toHaveBeenCalledWith(`/ask-the-news?q=${encodeURIComponent(tricky[0])}`, { viewTransition: true });
    });

    it("activates on keyboard Enter", async () => {
        const user = userEvent.setup();
        renderInRouter(<InlineMostAsked questions={questions} />);

        const first = screen.getByRole("button", { name: questions[0] });
        first.focus();
        await user.keyboard("{Enter}");

        expect(navigateMock).toHaveBeenCalledWith(`/ask-the-news?q=${encodeURIComponent(questions[0])}`, { viewTransition: true });
    });

    it("mints distinct heading ids for sibling instances", () => {
        renderInRouter(
            <>
                <InlineMostAsked questions={questions} label="First" />
                <InlineMostAsked questions={questions} label="Second" />
            </>
        );

        const asides = screen.getAllByRole("complementary");
        expect(asides).toHaveLength(2);
        const ids = asides.map((a) => a.getAttribute("aria-labelledby"));
        expect(ids[0]).toBeTruthy();
        expect(ids[1]).toBeTruthy();
        expect(ids[0]).not.toBe(ids[1]);
    });

    it("does not navigate on a whitespace-only question", async () => {
        const user = userEvent.setup();
        const bad: [string, string, string] = ["   ", "ok one?", "ok two?"];
        renderInRouter(<InlineMostAsked questions={bad} />);

        const buttons = screen.getAllByRole("button");
        await user.click(buttons[0]);

        expect(navigateMock).not.toHaveBeenCalled();
    });
});
