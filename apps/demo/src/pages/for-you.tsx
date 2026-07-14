import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TikTokStory } from "@/components/stories/tiktok-story";
import { mockStories } from "@/data/mock-stories";
import { useActiveQuestions } from "@arcxp/ask-the-news-components";
import { useIsMobile } from "@/hooks/use-mobile";

// Mobile activeIndex debounce — long enough to ignore fast scroll fly-bys,
// short enough not to feel laggy when the user lands on a card.
const ACTIVE_DEBOUNCE_MS = 150;

// On first page load the user is reading the headline; hold off on morphing it
// into the answer for a beat so the question is registered before it transforms.
const FIRST_CARD_DELAY_MS = 1000;

// Desktop hover debounce — protects against cursor pass-through firing streams
// on every card the mouse glides over.
const HOVER_DEBOUNCE_MS = 120;

// Minimum intersectionRatio to consider a card "active" on mobile.
const ACTIVE_INTERSECTION_RATIO = 0.6;

export function ForYouPage() {
    const isMobile = useIsMobile();
    const { questions, status } = useActiveQuestions();
    const [activeId, setActiveId] = useState<string | null>(null);

    const useFallback = status === "error" || !questions;
    const cards = useMemo(
        () =>
            useFallback
                ? mockStories.slice(0, 6).map((s) => ({ id: s.id, title: s.headline }))
                : questions!.slice(0, 6).map((q) => ({ id: q.uuid, title: q.text })),
        [useFallback, questions]
    );

    // Card refs keyed by id for IntersectionObserver wiring (mobile only).
    const cardElsRef = useRef<Map<string, HTMLElement>>(new Map());
    const setCardEl = useCallback((id: string, el: HTMLElement | null) => {
        if (el) cardElsRef.current.set(id, el);
        else cardElsRef.current.delete(id);
    }, []);

    // Pending hover/scroll target. The debounced commit reads this ref at fire time
    // so an enter→leave within the debounce window resolves to "no commit," not a
    // stale enter winning the race.
    const pendingIdRef = useRef<string | null>(null);
    const debounceRef = useRef<number | null>(null);
    const clearDebounce = useCallback(() => {
        if (debounceRef.current !== null) {
            window.clearTimeout(debounceRef.current);
            debounceRef.current = null;
        }
    }, []);
    const schedule = useCallback(
        (id: string | null, delay: number) => {
            pendingIdRef.current = id;
            clearDebounce();
            if (delay === 0) {
                setActiveId(id);
                return;
            }
            debounceRef.current = window.setTimeout(() => {
                debounceRef.current = null;
                // Only commit if pending hasn't been overwritten by a later enter/leave.
                if (pendingIdRef.current === id) setActiveId(id);
            }, delay);
        },
        [clearDebounce]
    );

    // Track whether the user has activated any card yet so we can hold off the
    // very first activation to give them a moment to read the question first.
    const hasActivatedRef = useRef(false);

    // Mobile: IntersectionObserver across all card elements. The most-visible card
    // above the activation threshold becomes active; if none qualifies, active clears.
    useEffect(() => {
        if (!isMobile) return;
        if (cards.length === 0) return;

        const ratios = new Map<string, number>();
        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    const id = entry.target.getAttribute("data-card-id");
                    if (id) ratios.set(id, entry.intersectionRatio);
                }
                let bestId: string | null = null;
                let bestRatio = ACTIVE_INTERSECTION_RATIO;
                ratios.forEach((r, id) => {
                    if (r >= bestRatio) {
                        bestRatio = r;
                        bestId = id;
                    }
                });
                const delay = bestId !== null && !hasActivatedRef.current ? FIRST_CARD_DELAY_MS : ACTIVE_DEBOUNCE_MS;
                schedule(bestId, delay);
                if (bestId !== null) hasActivatedRef.current = true;
            },
            { threshold: [0, 0.25, 0.5, 0.6, 0.75, 1], rootMargin: "-10% 0px" }
        );
        cardElsRef.current.forEach((el) => observer.observe(el));
        return () => {
            observer.disconnect();
            clearDebounce();
            pendingIdRef.current = null;
        };
    }, [isMobile, cards, schedule, clearDebounce]);

    useEffect(() => {
        return () => clearDebounce();
    }, [clearDebounce]);

    // Desktop hover handlers — pointerType-gated to mouse only so touch devices
    // (which fire synthetic mouseenter after a tap) don't trigger a reveal that
    // immediately gets killed by the navigation.
    const onPointerEnter = useCallback(
        (id: string, e: React.PointerEvent<HTMLElement>) => {
            if (isMobile) return;
            if (e.pointerType !== "mouse") return;
            schedule(id, HOVER_DEBOUNCE_MS);
        },
        [isMobile, schedule]
    );
    const onPointerLeave = useCallback(
        (id: string, e: React.PointerEvent<HTMLElement>) => {
            if (isMobile) return;
            if (e.pointerType !== "mouse") return;
            if (pendingIdRef.current === id) pendingIdRef.current = null;
            setActiveId((prev) => (prev === id ? null : prev));
        },
        [isMobile]
    );

    // Keyboard focus-visible parity on desktop — focusing a card via Tab reveals it.
    const onFocus = useCallback(
        (id: string) => {
            if (isMobile) return;
            schedule(id, 0);
        },
        [isMobile, schedule]
    );
    const onBlur = useCallback(
        (id: string) => {
            if (isMobile) return;
            if (pendingIdRef.current === id) pendingIdRef.current = null;
            setActiveId((prev) => (prev === id ? null : prev));
        },
        [isMobile]
    );

    // Compute prefetch id (mobile only): the card immediately after the active one.
    const prefetchId = useMemo(() => {
        if (!isMobile || activeId == null) return null;
        const idx = cards.findIndex((c) => c.id === activeId);
        if (idx < 0 || idx + 1 >= cards.length) return null;
        return cards[idx + 1].id;
    }, [isMobile, activeId, cards]);

    return (
        <main className="mx-auto flex w-full max-w-3xl flex-col items-stretch">
            <div className="mb-4 hidden w-full px-4 lg:block lg:pt-16">
                <h1 className="font-serif text-3xl font-bold">For You</h1>
                <p className="text-muted-foreground mt-1 text-sm text-pretty">Questions we think you'll want to ask about the news.</p>
            </div>

            {status === "loading" ? (
                <div
                    className={[
                        "h-[calc(100dvh-7rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))]",
                        "snap-y snap-mandatory overflow-y-scroll overscroll-contain [scrollbar-width:none] [-webkit-overflow-scrolling:touch]",
                        "[&::-webkit-scrollbar]:hidden",
                        "md:grid md:h-auto md:snap-none md:grid-cols-2 md:gap-6 md:overflow-visible md:overscroll-auto md:px-4 md:pt-16 md:pb-12 lg:py-16",
                    ].join(" ")}
                    aria-busy="true"
                >
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="aspect-[9/16] w-full overflow-hidden bg-neutral-900 animate-pulse md:rounded-xl" aria-hidden="true" />
                    ))}
                </div>
            ) : (
                <div
                    className={[
                        // Mobile: snap feed that fits exactly between the navbar and bottom tab bar.
                        // 7rem = h-14 navbar + h-14 tab bar. Safe-area insets keep the card aligned on notched devices.
                        "h-[calc(100dvh-7rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))]",
                        "snap-y snap-mandatory overflow-y-scroll overscroll-contain [scrollbar-width:none] [-webkit-overflow-scrolling:touch]",
                        "[&::-webkit-scrollbar]:hidden",
                        // Desktop: normal flowing grid, no snap.
                        "md:grid md:h-auto md:snap-none md:grid-cols-2 md:gap-6 md:overflow-visible md:overscroll-auto md:px-4 md:pt-16 md:pb-12 lg:py-16",
                    ].join(" ")}
                >
                    {cards.map((card, i) => (
                        <div
                            key={card.id}
                            ref={(el) => setCardEl(card.id, el)}
                            data-card-id={card.id}
                            onPointerEnter={(e) => onPointerEnter(card.id, e)}
                            onPointerLeave={(e) => onPointerLeave(card.id, e)}
                            onFocus={() => onFocus(card.id)}
                            onBlur={() => onBlur(card.id)}
                            className="h-full snap-start snap-always md:h-auto md:snap-none"
                        >
                            <TikTokStory
                                id={card.id}
                                imageUrl={mockStories[i % mockStories.length].imageUrl}
                                title={card.title}
                                kicker="Ask"
                                href={`/ask-the-news?q=${encodeURIComponent(card.title)}`}
                                active={card.id === activeId}
                                prefetch={card.id === prefetchId}
                            />
                        </div>
                    ))}
                </div>
            )}
        </main>
    );
}
