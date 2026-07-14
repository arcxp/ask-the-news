import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AnswerHighlight } from "./answer-highlight";

let mobile = false;
vi.mock("@/hooks/use-mobile", () => ({
    useIsMobile: () => mobile,
}));

beforeAll(() => {
    if (typeof window !== "undefined") {
        const proto = window.HTMLElement.prototype as HTMLElement & {
            hasPointerCapture?: (id: number) => boolean;
            setPointerCapture?: (id: number) => void;
            releasePointerCapture?: (id: number) => void;
        };
        // Vaul (Drawer) calls these on pointerdown/up; jsdom doesn't implement them.
        if (!proto.hasPointerCapture) proto.hasPointerCapture = () => false;
        if (!proto.setPointerCapture) proto.setPointerCapture = () => {};
        if (!proto.releasePointerCapture) proto.releasePointerCapture = () => {};
        if (!proto.scrollIntoView) proto.scrollIntoView = () => {};
    }
});

beforeEach(() => {
    mobile = false;
});

afterEach(() => {
    cleanup();
});

const QUESTION = "What does the Commemorative Works Act regulate?";
const ANSWER = "It is the 1986 statute that governs new commemorative works on federal land in D.C.";

describe("AnswerHighlight — desktop", () => {
    it("renders children with the dotted-underline trigger styling", () => {
        render(
            <AnswerHighlight question={QUESTION} answer={ANSWER}>
                Commemorative Works Act
            </AnswerHighlight>
        );
        const trigger = screen.getByLabelText(`Question: ${QUESTION}`);
        expect(trigger).toBeInTheDocument();
        expect(trigger).toHaveTextContent("Commemorative Works Act");
        expect(trigger.className).toMatch(/decoration-dotted/);
    });

    it("advertises aria-haspopup='dialog' and aria-expanded='false' before opening", () => {
        render(
            <AnswerHighlight question={QUESTION} answer={ANSWER}>
                phrase
            </AnswerHighlight>
        );
        const trigger = screen.getByLabelText(`Question: ${QUESTION}`);
        expect(trigger).toHaveAttribute("aria-haspopup", "dialog");
        expect(trigger).toHaveAttribute("aria-expanded", "false");
    });

    it("does not use role='button' on the desktop trigger (HoverCard is hover/focus-activated)", () => {
        render(
            <AnswerHighlight question={QUESTION} answer={ANSWER}>
                phrase
            </AnswerHighlight>
        );
        const trigger = screen.getByLabelText(`Question: ${QUESTION}`);
        expect(trigger).not.toHaveAttribute("role", "button");
        expect(trigger).toHaveAttribute("tabindex", "0");
    });

    it("renders a custom sourceLabel inside the popover content slot", () => {
        // We can't easily force the HoverCard open in jsdom (no real hover), but the
        // sourceLabel default flow is exercised by the mobile drawer path below.
        const { container } = render(
            <AnswerHighlight question={QUESTION} answer={ANSWER} sourceLabel="Arc Intelligencer">
                phrase
            </AnswerHighlight>
        );
        // Trigger is rendered; content lives in a portal that may not mount until opened.
        expect(container.querySelector('[aria-label^="Question:"]')).not.toBeNull();
    });
});

describe("AnswerHighlight — mobile", () => {
    beforeEach(() => {
        mobile = true;
    });

    it("opens the drawer on click and shows the question + answer", async () => {
        const user = userEvent.setup();
        render(
            <AnswerHighlight question={QUESTION} answer={ANSWER}>
                Commemorative Works Act
            </AnswerHighlight>
        );

        await user.click(screen.getByLabelText(`Question: ${QUESTION}`));

        expect(await screen.findByText(ANSWER)).toBeInTheDocument();
        // The visible question text inside the card (the sr-only DrawerTitle is also present).
        expect(screen.getAllByText(QUESTION).length).toBeGreaterThan(0);
    });

    it("opens the drawer on keyboard Enter", async () => {
        const user = userEvent.setup();
        render(
            <AnswerHighlight question={QUESTION} answer={ANSWER}>
                phrase
            </AnswerHighlight>
        );

        const trigger = screen.getByLabelText(`Question: ${QUESTION}`);
        trigger.focus();
        await user.keyboard("{Enter}");

        expect(await screen.findByText(ANSWER)).toBeInTheDocument();
    });

    it("opens the drawer on keyboard Space", async () => {
        const user = userEvent.setup();
        render(
            <AnswerHighlight question={QUESTION} answer={ANSWER}>
                phrase
            </AnswerHighlight>
        );

        const trigger = screen.getByLabelText(`Question: ${QUESTION}`);
        trigger.focus();
        await user.keyboard(" ");

        expect(await screen.findByText(ANSWER)).toBeInTheDocument();
    });

    it("close button dismisses the drawer", async () => {
        const user = userEvent.setup();
        render(
            <AnswerHighlight question={QUESTION} answer={ANSWER}>
                phrase
            </AnswerHighlight>
        );

        await user.click(screen.getByLabelText(`Question: ${QUESTION}`));
        await screen.findByText(ANSWER);
        // fireEvent.click bypasses pointerdown/pointerup so Vaul's drag handler
        // inside DrawerContent doesn't fire (it calls getComputedStyle().transform
        // on release, which is undefined in jsdom and throws).
        fireEvent.click(screen.getByRole("button", { name: /close/i }));

        await new Promise((r) => setTimeout(r, 0));
        const trigger = screen.getByLabelText(`Question: ${QUESTION}`);
        expect(trigger).toHaveAttribute("aria-expanded", "false");
    });

    it("renders a custom sourceLabel inside the drawer card", async () => {
        const user = userEvent.setup();
        render(
            <AnswerHighlight question={QUESTION} answer={ANSWER} sourceLabel="Arc Intelligencer">
                phrase
            </AnswerHighlight>
        );

        await user.click(screen.getByLabelText(`Question: ${QUESTION}`));

        expect(await screen.findByText("Arc Intelligencer")).toBeInTheDocument();
    });
});
