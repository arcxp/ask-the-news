import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { HighlightedText } from "./highlighted-text";

afterEach(cleanup);

describe("HighlightedText", () => {
    it("renders plain text when query is empty", () => {
        const { container } = render(<HighlightedText text="The federal reserve held rates." query="" />);
        expect(container.querySelectorAll("mark")).toHaveLength(0);
        expect(container.textContent).toBe("The federal reserve held rates.");
    });

    it("renders plain text when query is only whitespace", () => {
        const { container } = render(<HighlightedText text="climate summit ends" query="   " />);
        expect(container.querySelectorAll("mark")).toHaveLength(0);
    });

    it("wraps a case-insensitive exact phrase match", () => {
        const { container } = render(<HighlightedText text="The Federal Reserve held rates steady today." query="federal reserve" />);
        const marks = container.querySelectorAll("mark");
        expect(marks).toHaveLength(1);
        expect(marks[0].textContent).toBe("Federal Reserve");
    });

    it("preserves original casing of each match", () => {
        const { container } = render(<HighlightedText text="CLIMATE talks. Climate goals. climate data." query="climate" />);
        const marks = container.querySelectorAll("mark");
        expect(marks).toHaveLength(3);
        expect(Array.from(marks).map((m) => m.textContent)).toEqual(["CLIMATE", "Climate", "climate"]);
    });

    it("falls back to individual words when full phrase isn't present", () => {
        const { container } = render(<HighlightedText text="A climate report and a separate summit briefing arrived today." query="climate summit" />);
        const marks = Array.from(container.querySelectorAll("mark")).map((m) => m.textContent);
        expect(marks).toEqual(["climate", "summit"]);
    });

    it("handles regex metacharacters in the query literally", () => {
        const { container } = render(<HighlightedText text="Reading about C++ today. Who? C++ again." query="C++" />);
        const marks = container.querySelectorAll("mark");
        expect(marks).toHaveLength(2);
        expect(marks[0].textContent).toBe("C++");
    });

    it("does not highlight when query is only stopwords", () => {
        const { container } = render(<HighlightedText text="The fox jumps over the dog." query="the of" />);
        expect(container.querySelectorAll("mark")).toHaveLength(0);
    });

    it("skips short words (< 3 chars) when falling back to per-word matches", () => {
        const { container } = render(<HighlightedText text="AI is reshaping the news." query="AI news" />);
        const marks = Array.from(container.querySelectorAll("mark")).map((m) => m.textContent);
        expect(marks).toEqual(["news"]);
    });

    it("phrase match wins over overlapping word match", () => {
        const { container } = render(<HighlightedText text="The Federal Reserve and another reserve fund." query="Federal Reserve" />);
        const marks = Array.from(container.querySelectorAll("mark")).map((m) => m.textContent);
        expect(marks).toEqual(["Federal Reserve", "reserve"]);
    });

    it("renders interleaved text and marks in order", () => {
        const { container } = render(<HighlightedText text="alpha climate beta climate gamma" query="climate" />);
        expect(container.textContent).toBe("alpha climate beta climate gamma");
        expect(container.querySelectorAll("mark")).toHaveLength(2);
    });
});
