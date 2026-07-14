import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { OverviewImageCarousel, type OverviewImage } from "./overview-image-carousel";

afterEach(cleanup);

const makeImages = (n: number): OverviewImage[] =>
    Array.from({ length: n }, (_, i) => ({
        id: `img-${i}`,
        url: `https://example.test/${i}.jpg`,
        alt: `Image ${i + 1}`,
    }));

describe("OverviewImageCarousel", () => {
    it("renders null when images is empty", () => {
        const { container } = render(<OverviewImageCarousel images={[]} />);
        expect(container.firstChild).toBeNull();
    });

    it("renders a tile per image with required alt text", () => {
        render(<OverviewImageCarousel images={makeImages(3)} />);
        const imgs = screen.getAllByRole("img");
        expect(imgs).toHaveLength(3);
        for (const img of imgs) {
            expect(img.getAttribute("alt")).toBeTruthy();
        }
    });

    it("hides prev/next buttons when 3 or fewer images", () => {
        render(<OverviewImageCarousel images={makeImages(3)} />);
        expect(screen.queryByText("Previous slide")).toBeNull();
        expect(screen.queryByText("Next slide")).toBeNull();
    });

    it("renders prev/next buttons when more than 3 images", () => {
        render(<OverviewImageCarousel images={makeImages(6)} />);
        expect(screen.getByText("Previous slide")).toBeDefined();
        expect(screen.getByText("Next slide")).toBeDefined();
    });

    it("renders only the image — no source/caption overlay", () => {
        const { container } = render(<OverviewImageCarousel images={makeImages(2)} />);
        expect(container.querySelector("figcaption")).toBeNull();
    });
});
