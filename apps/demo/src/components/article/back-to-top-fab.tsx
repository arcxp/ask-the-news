import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { useLocation } from "react-router";
import { Z } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import { isHideOnScrollRoute, useHideOnScroll } from "@/hooks/use-hide-on-scroll";

// Delay before the button mounts. Gives the programmatic scrollIntoView() from
// the Ask FAB time to finish so the button doesn't appear mid-scroll.
const SETTLE_MS = 600;
// Distance from the stored return position at which we consider the user to
// have arrived on their own and the FAB has served its purpose. A small
// upward flick won't trigger this — only meaningful progress back toward
// where they were.
export const RETURN_PROXIMITY_PX = 200;

interface BackToTopFabProps {
    /** Scroll Y to return to. When null, the button is hidden. */
    returnY: number | null;
    onDismiss: () => void;
}

/**
 * Mobile-only "back to where you were" button shown after the Ask FAB jumps
 * the user to the Most Asked widget. Returns them to their previous reading
 * position rather than the top of the page. Dismisses on tap or once the
 * user has scrolled back within ~200 px of (or above) their original spot.
 */
export function BackToTopFab({ returnY, onDismiss }: BackToTopFabProps) {
    const location = useLocation();
    const hiddenChrome = useHideOnScroll(isHideOnScrollRoute(location.pathname));
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        if (returnY === null) {
            setMounted(false);
            return;
        }
        const mountTimer = window.setTimeout(() => setMounted(true), SETTLE_MS);
        return () => window.clearTimeout(mountTimer);
    }, [returnY]);

    useEffect(() => {
        if (!mounted || returnY === null) return;
        const onScroll = () => {
            if (window.scrollY <= returnY + RETURN_PROXIMITY_PX) {
                onDismiss();
            }
        };
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, [mounted, returnY, onDismiss]);

    if (returnY === null || !mounted) return null;

    const handleClick = () => {
        window.scrollTo({ top: returnY, behavior: "smooth" });
        onDismiss();
    };

    return (
        <button
            type="button"
            onClick={handleClick}
            aria-label="Scroll back to where you were"
            className={cn(
                "fixed left-1/2 -translate-x-1/2 inline-flex size-11 items-center justify-center rounded-full md:hidden",
                "bg-background/80 text-muted-foreground shadow-lg ring-1 ring-border backdrop-blur",
                "transition-[top,opacity] duration-200 ease-[cubic-bezier(0.2,0,0,1)] active:scale-[0.96] motion-reduce:transition-none",
                "motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 [animation-duration:300ms]"
            )}
            style={{
                zIndex: Z.fab,
                // Sit just below the mobile header (h-14 = 56px) including safe-area.
                // When chrome hides on scroll, the header translates off-screen, so
                // we slide up too instead of floating in empty space.
                top: hiddenChrome ? "calc(env(safe-area-inset-top) + 12px)" : "calc(env(safe-area-inset-top) + 56px + 12px)",
            }}
        >
            <ArrowUp className="size-5" aria-hidden />
        </button>
    );
}
