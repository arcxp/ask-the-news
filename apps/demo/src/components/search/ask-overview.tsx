import { useEffect, useMemo, useRef, useState } from "react";
import { Sparkles, ArrowRight, ChevronDown } from "lucide-react";
import { Link } from "react-router";
import { OverviewImageCarousel, type OverviewImage } from "./overview-image-carousel";
import { HighlightedText } from "./highlighted-text";
import { Skeleton } from "@/components/ui/skeleton";
import { InlineNotice } from "@arcxp/ask-the-news-components";
import { cn } from "@/lib/utils";
import type { Source } from "@arcxp/ask-the-news-components";

export type OverviewStatus = "idle" | "streaming" | "answered" | "rejected" | "unanswered" | "error";

interface AskOverviewProps {
    query: string;
    text: string;
    status: OverviewStatus;
    errorMessage?: string;
    sources?: Source[];
    /** Extra classes merged onto the root section. */
    className?: string;
    /** Heading shown above the overview. */
    headingLabel?: string;
}

const SHIMMER_MIN_DURATION_MS = 300;
const MAX_CAROUSEL_IMAGES = 12;

function buildOverviewImages(sources: Source[]): OverviewImage[] {
    const items: OverviewImage[] = [];

    for (const s of sources) {
        const firstVideo = s.videos?.[0];
        const fallbackThumb = s.images?.lead_art?.thumbnail_url ?? s.images?.basic?.thumbnail_url ?? undefined;

        if (firstVideo?.video_id) {
            const url = firstVideo.thumbnail_url ?? fallbackThumb;
            if (!url) continue;
            items.push({
                id: `v-${firstVideo.video_id}`,
                url,
                alt: firstVideo.title ?? s.headline,
                videoId: firstVideo.video_id,
            });
        } else if (fallbackThumb) {
            items.push({
                id: `s-${s.document_id}`,
                url: fallbackThumb,
                alt: s.headline,
            });
        }
    }

    return items.slice(0, MAX_CAROUSEL_IMAGES);
}

export function AskOverview({ query, text, status, errorMessage, sources = [], className, headingLabel = "Ask the News overview" }: AskOverviewProps) {
    const images = useMemo(() => buildOverviewImages(sources), [sources]);
    const askHref = `/ask-the-news?q=${encodeURIComponent(query)}`;

    const isStreaming = status === "streaming";
    const isTerminalHappy = status === "answered";

    // Hold the shimmer for a beat even if text arrives instantly (cached / fast streams)
    // so the loading→answer swap reads as deliberate, not jittery.
    const [holdElapsed, setHoldElapsed] = useState(false);
    useEffect(() => {
        setHoldElapsed(false);
        const id = window.setTimeout(() => setHoldElapsed(true), SHIMMER_MIN_DURATION_MS);
        return () => window.clearTimeout(id);
    }, [query]);

    // Mobile-only: card collapses to ~1/3 viewport with a fade + "Show overview" affordance.
    const [expanded, setExpanded] = useState(false);
    useEffect(() => {
        setExpanded(false);
    }, [query]);

    const collapsed = !expanded;

    // Gate the bottom mask + button until the body content nears the bottom of the collapsed
    // viewport — otherwise the affordance shows over empty space while the answer is still short.
    const containerRef = useRef<HTMLDivElement | null>(null);
    const contentRef = useRef<HTMLDivElement | null>(null);
    const [nearBottom, setNearBottom] = useState(false);
    useEffect(() => {
        if (!collapsed) return;
        const container = containerRef.current;
        const content = contentRef.current;
        if (!container || !content) return;
        const check = () => {
            const containerH = container.clientHeight;
            const contentH = content.scrollHeight;
            setNearBottom(contentH >= containerH - 40);
        };
        check();
        const ro = new ResizeObserver(check);
        ro.observe(content);
        ro.observe(container);
        return () => ro.disconnect();
    }, [collapsed, text, status]);

    const showStreamingText = isStreaming && text.length > 0 && holdElapsed;
    const showShimmer = isStreaming && !showStreamingText;
    // Mock visuals only appear once the real answer has landed — they shouldn't
    // compete with the streaming text for the user's attention.
    const showCarousel = isTerminalHappy && text.length > 0;
    const showCta = isTerminalHappy && text.length > 0;

    return (
        <section
            aria-label="AI-generated overview"
            className={cn(
                "my-6 rounded-lg border border-accent/20 bg-accent/5 p-4 md:rounded-none md:border-0 md:border-l-2 md:border-accent md:bg-transparent md:py-2 md:pl-5",
                className
            )}
        >
            <div className="mb-3 flex items-center gap-2">
                <Sparkles className="size-4 text-accent" aria-hidden />
                <h2 className="text-accent m-0 text-xs font-semibold tracking-wider uppercase">{headingLabel}</h2>
            </div>

            <div
                ref={containerRef}
                className={cn(
                    "relative md:!max-h-none md:!min-h-0 md:overflow-visible",
                    "motion-safe:transition-[max-height] motion-safe:duration-500 motion-safe:ease-out",
                    collapsed ? "max-h-[33vh] min-h-[33vh] overflow-hidden" : "max-h-[9999px] min-h-[33vh]",
                )}
            >
                <div
                    ref={contentRef}
                    className={cn(
                        "md:[mask-image:none]",
                        collapsed && nearBottom && "[mask-image:linear-gradient(to_bottom,black_calc(100%-72px),transparent_100%)]",
                    )}
                >
                    {showShimmer && (
                        <div role="status" aria-live="polite" aria-busy="true" aria-label="Generating overview" className="space-y-2.5">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-11/12" />
                            <Skeleton className="h-4 w-4/5" />
                        </div>
                    )}

                    {showStreamingText && (
                        <p aria-hidden="true" className="motion-safe:animate-in motion-safe:fade-in text-base leading-relaxed text-pretty duration-200">
                            {text}
                            <span aria-hidden className="bg-foreground/70 -mb-[0.15em] ml-0.5 inline-block h-[1em] w-[2px] align-middle motion-safe:animate-pulse" />
                        </p>
                    )}
                    {isStreaming && (
                        <p aria-live="polite" aria-atomic="false" className="sr-only">
                            {text}
                        </p>
                    )}

                    {isTerminalHappy && text && (
                        <p className="text-base leading-relaxed text-pretty">
                            <HighlightedText text={text} query={query} />
                        </p>
                    )}

                    {isTerminalHappy && !text && (
                        <InlineNotice variant="info" title="No answer is available for this question." body="Try rephrasing or asking something else." />
                    )}

                    {status === "rejected" && (
                        <InlineNotice variant="info" title="We don't have reporting on that yet." body="Try rephrasing or asking something else." />
                    )}

                    {status === "unanswered" && (
                        <InlineNotice variant="info" title="No answer is available for this question." body="Try rephrasing or asking something else." />
                    )}

                    {status === "error" && (
                        <InlineNotice variant="error" title="Something went wrong." body={errorMessage || "The overview couldn't be generated."} />
                    )}

                    {showCarousel && <OverviewImageCarousel images={images} className="mt-4" />}

                    {isTerminalHappy && text && <p className="text-muted-foreground mt-2 text-xs">AI-generated based on Arc Intelligencer coverage</p>}

                    {showCta && (
                        <div className="mt-4 flex flex-wrap items-center gap-3">
                            <Link
                                to={askHref}
                                viewTransition
                                className="bg-accent text-accent-foreground hover:bg-accent/90 inline-flex min-h-8 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-[background-color,scale] duration-150 ease-[cubic-bezier(0.2,0,0,1)] active:scale-[0.96]"
                            >
                                Open in Ask the News
                                <ArrowRight className="size-3" aria-hidden />
                            </Link>
                        </div>
                    )}
                </div>

                {collapsed && nearBottom && (
                    <div className="motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300 absolute inset-x-0 bottom-0 flex justify-center pb-2 md:hidden">
                        <button
                            type="button"
                            onClick={() => setExpanded(true)}
                            className="bg-background text-accent border-accent/30 hover:bg-accent/5 inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-semibold shadow-sm transition-[background-color,scale] duration-150 ease-[cubic-bezier(0.2,0,0,1)] active:scale-[0.96]"
                            aria-expanded={false}
                        >
                            Show overview
                            <ChevronDown className="size-3.5" aria-hidden />
                        </button>
                    </div>
                )}
            </div>
        </section>
    );
}
