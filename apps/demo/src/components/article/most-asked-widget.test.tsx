import { describe, it, expect, afterEach, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { MostAskedWidget } from "./most-asked-widget";

const navigateMock = vi.fn();
vi.mock("react-router", async () => {
    const actual = await vi.importActual<typeof import("react-router")>("react-router");
    return {
        ...actual,
        useNavigate: () => navigateMock,
    };
});

afterEach(() => {
    navigateMock.mockClear();
    cleanup();
});

const questions = [
    "What authority does the president have over construction on federal land?",
    "How does the Commemorative Works Act limit new monuments?",
    "What other major monuments were built without congressional authorization?",
];

function renderWidget(props: Partial<React.ComponentProps<typeof MostAskedWidget>> = {}) {
    return render(
        <MemoryRouter>
            <MostAskedWidget questions={questions} {...props} />
        </MemoryRouter>
    );
}

describe("MostAskedWidget", () => {
    it("renders the kicker, heading, and recommended-questions section", () => {
        renderWidget();
        expect(screen.getByText("Ask the News")).toBeInTheDocument();
        expect(screen.getByRole("heading", { name: /keep asking about this story/i })).toBeInTheDocument();
        expect(screen.getByText("Recommended")).toBeInTheDocument();
    });

    it("renders a custom kicker label when provided", () => {
        renderWidget({ label: "People also ask" });
        expect(screen.getByText("People also ask")).toBeInTheDocument();
    });

    it("wires the sr-only label to the search input via htmlFor / id", () => {
        renderWidget();
        const input = screen.getByLabelText("Ask a question about this article");
        expect(input.tagName).toBe("INPUT");
        expect(input).toHaveAttribute("id", "most-asked-input");
    });

    it("navigates to /ask-the-news with the typed query on submit", async () => {
        const user = userEvent.setup();
        renderWidget();

        const input = screen.getByLabelText("Ask a question about this article");
        await user.type(input, "What is the Commemorative Works Act?");
        await user.keyboard("{Enter}");

        expect(navigateMock).toHaveBeenCalledTimes(1);
        expect(navigateMock).toHaveBeenCalledWith(
            `/ask-the-news?q=${encodeURIComponent("What is the Commemorative Works Act?")}`,
            { viewTransition: true }
        );
    });

    it("navigates when a recommended (suggested) question is selected", async () => {
        const user = userEvent.setup();
        renderWidget();

        await user.click(screen.getByRole("button", { name: questions[1] }));

        expect(navigateMock).toHaveBeenCalledTimes(1);
        expect(navigateMock).toHaveBeenCalledWith(`/ask-the-news?q=${encodeURIComponent(questions[1])}`, { viewTransition: true });
    });

    it("ignores empty submissions", async () => {
        const user = userEvent.setup();
        renderWidget();

        const input = screen.getByLabelText("Ask a question about this article");
        await user.click(input);
        await user.keyboard("{Enter}");

        expect(navigateMock).not.toHaveBeenCalled();
    });

    it("exposes a labelled section landmark", () => {
        renderWidget();
        expect(screen.getByRole("region", { name: /keep asking about this story/i })).toBeInTheDocument();
    });
});
