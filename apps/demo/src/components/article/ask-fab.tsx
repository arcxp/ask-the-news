import { useEffect, useId, useRef, useState } from "react";
import { Sparkles, X } from "lucide-react";
import { useLocation } from "react-router";
import { useReducedMotion } from "motion/react";
import { Z } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { isHideOnScrollRoute, useHideOnScroll } from "@/hooks/use-hide-on-scroll";
import { ExplainItSheet } from "@/components/article/explain-it-sheet";
import type { DiveDeeperChunk } from "@arcxp/ask-the-news-components";

// Visibility ratio at which the widget is "meaningfully on screen" and the FAB
// should hide; below this the FAB stays so the user can still tap to scroll.
const HIDE_FAB_AT_RATIO = 0.25;
// Visibility ratio at which we consider the scroll-into-view complete and it's
// safe to focus the input inside the widget without yanking the viewport.
const FOCUS_AT_RATIO = 0.9;
// Duration the action-button exit motion takes — drives the menu→sheet/scroll
// hand-off so the exit animation completes before the next thing starts.
const EXIT_MS = 120;

interface AskFabProps {
    /** Element id of the Most Asked widget. Used to scroll into view on tap. */
    targetId: string;
    label?: string;
    /** Called with the scroll Y captured right before the jump, so a sibling
     *  "back to where you were" button can return the user later. */
    onJump?: (scrollY: number) => void;
    /** Article headline shown in the Explain sheet. */
    articleTitle: string;
    /** Stream factory with the prompt baked in. */
    onExplain: () => AsyncIterable<DiveDeeperChunk>;
    /** Canned bullets shown when the live API errors. If omitted, an error notice is shown instead. */
    fallbackBullets?: string[];
    className?: string;
}

/**
 * Mobile-only floating "Ask" affordance. Tapping the sparkle expands two
 * stacked action buttons: "Explain it to me" opens a bottom sheet that
 * streams a plain-language summary; "Ask a question" jumps to the Most
 * Asked widget like the original FAB did. Sits above the bottom tab bar
 * (offset by `--tab-bar-height`) and respects safe-area.
 */
export function AskFab({ targetId, label = "Ask about this article", onJump, articleTitle, onExplain, fallbackBullets, className }: AskFabProps) {
    const location = useLocation();
    const hiddenChrome = useHideOnScroll(isHideOnScrollRoute(location.pathname));
    const [targetVisible, setTargetVisible] = useState(false);
    const [expanded, setExpanded] = useState(false);
    // True for EXIT_MS after the user picks an action — keeps the menu mounted
    // long enough for the buttons' exit motion to play before the sheet rises
    // or the scroll fires.
    const [menuClosing, setMenuClosing] = useState(false);
    const [explainOpen, setExplainOpen] = useState(false);
    // Set true on tap of "Ask a question"; cleared once the widget arrives and
    // we focus its input. Avoids a magic post-scroll timeout that races browser
    // scroll duration.
    const focusOnArrivalRef = useRef(false);
    const fabRef = useRef<HTMLButtonElement | null>(null);
    const reduceMotion = useReducedMotion();
    const menuId = useId();

    useEffect(() => {
        const target = document.getElementById(targetId);
        if (!target) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                setTargetVisible(entry.intersectionRatio >= HIDE_FAB_AT_RATIO);
                if (focusOnArrivalRef.current && entry.intersectionRatio >= FOCUS_AT_RATIO) {
                    focusOnArrivalRef.current = false;
                    const input = target.querySelector("input");
                    if (input instanceof HTMLInputElement) input.focus();
                }
            },
            { threshold: [HIDE_FAB_AT_RATIO, FOCUS_AT_RATIO] }
        );
        observer.observe(target);
        return () => observer.disconnect();
    }, [targetId]);

    // Collapse the menu when the bottom widget becomes visible.
    useEffect(() => {
        if (targetVisible) {
            setExpanded(false);
            setMenuClosing(false);
        }
    }, [targetVisible]);

    // Escape collapses the menu while expanded.
    useEffect(() => {
        if (!expanded) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setExpanded(false);
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [expanded]);

    // When the Explain sheet closes, return focus to the FAB if visible;
    // otherwise to body. The action button that triggered it no longer exists.
    const prevExplainOpen = useRef(explainOpen);
    useEffect(() => {
        if (prevExplainOpen.current && !explainOpen) {
            if (!targetVisible) fabRef.current?.focus();
            else (document.body as HTMLElement).focus?.();
        }
        prevExplainOpen.current = explainOpen;
    }, [explainOpen, targetVisible]);

    const runExit = (after: () => void) => {
        if (reduceMotion) {
            setExpanded(false);
            after();
            return;
        }
        setMenuClosing(true);
        setExpanded(false);
        window.setTimeout(() => {
            setMenuClosing(false);
            after();
        }, EXIT_MS);
    };

    const handleToggle = () => setExpanded((v) => !v);

    const jumpToAsk = () => {
        const target = document.getElementById(targetId);
        if (!target) return;
        runExit(() => {
            onJump?.(window.scrollY);
            focusOnArrivalRef.current = true;
            target.scrollIntoView({ behavior: "smooth", block: "start" });
        });
    };

    const openExplain = () => {
        runExit(() => setExplainOpen(true));
    };

    const menuVisible = expanded || menuClosing;

    return (
        <>
            {menuVisible && (
                <button
                    type="button"
                    aria-label="Close menu"
                    onClick={() => setExpanded(false)}
                    className={cn(
                        "fixed inset-0 bg-black/10 backdrop-blur-[2px] md:hidden",
                        "transition-opacity duration-150 ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:transition-none",
                        expanded ? "opacity-100" : "opacity-0"
                    )}
                    style={{ zIndex: Z.fab - 1 }}
                />
            )}

            <div
                className={cn("fixed right-4 flex flex-col items-end gap-3 md:hidden", className)}
                style={{
                    zIndex: Z.fab,
                    bottom: hiddenChrome ? "calc(var(--bottom-chrome) - var(--tab-bar-height) + 12px)" : "calc(var(--bottom-chrome) + 12px)",
                }}
            >
                {menuVisible && (
                    <div id={menuId} role="group" aria-label="Article actions" className="flex flex-col items-end gap-3">
                        <Button
                            variant="default"
                            onClick={openExplain}
                            className={cn(
                                "h-11 rounded-full px-5 shadow-lg shadow-black/10",
                                "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-200 motion-safe:ease-[cubic-bezier(0.2,0,0,1)]",
                                expanded ? "opacity-100" : "translate-y-2 opacity-0",
                                "transition-[opacity,transform] duration-[120ms] ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:transition-none active:scale-[0.98]"
                            )}
                        >
                            Explain it to me
                        </Button>
                        <Button
                            variant="default"
                            onClick={jumpToAsk}
                            style={{ animationDelay: "60ms" }}
                            className={cn(
                                "h-11 rounded-full px-5 shadow-lg shadow-black/10",
                                "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-200 motion-safe:ease-[cubic-bezier(0.2,0,0,1)] motion-safe:fill-mode-backwards",
                                expanded ? "opacity-100" : "translate-y-2 opacity-0",
                                "transition-[opacity,transform] duration-[120ms] ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:transition-none active:scale-[0.98]"
                            )}
                        >
                            Ask a question
                        </Button>
                    </div>
                )}

                <button
                    ref={fabRef}
                    type="button"
                    onClick={handleToggle}
                    aria-label={label}
                    aria-expanded={expanded}
                    aria-haspopup="menu"
                    aria-controls={menuId}
                    className={cn(
                        "inline-flex size-12 items-center justify-center rounded-full bg-accent text-white shadow-lg shadow-accent/20",
                        "transition-[box-shadow,opacity,scale] [transition-duration:200ms] ease-[cubic-bezier(0.2,0,0,1)] active:scale-[0.96] motion-reduce:transition-none",
                        "motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 [animation-duration:300ms]",
                        targetVisible && "pointer-events-none opacity-0"
                    )}
                >
                    <span className="relative inline-flex size-5 items-center justify-center">
                        <Sparkles
                            aria-hidden
                            className={cn(
                                "absolute size-5 transition-[opacity,transform,filter] duration-200 ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:transition-none",
                                expanded ? "scale-50 opacity-0 blur-[4px]" : "scale-100 opacity-100 blur-0"
                            )}
                        />
                        <X
                            aria-hidden
                            className={cn(
                                "absolute size-5 transition-[opacity,transform,filter] duration-200 ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:transition-none",
                                expanded ? "scale-100 opacity-100 blur-0" : "scale-50 opacity-0 blur-[4px]"
                            )}
                        />
                    </span>
                </button>
            </div>

            <ExplainItSheet open={explainOpen} onOpenChange={setExplainOpen} articleTitle={articleTitle} onExplain={onExplain} fallbackBullets={fallbackBullets} />
        </>
    );
}
