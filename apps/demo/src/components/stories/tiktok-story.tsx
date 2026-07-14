import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useQuestionAnswerStream } from "@arcxp/ask-the-news-components";
import { ArrowRightIcon } from "lucide-react";
import { motion } from "motion/react";

interface TikTokStoryProps {
    imageUrl: string;
    title: string;
    href: string;
    kicker?: string;
    description?: string;
    id?: string;
    /**
     * When true, the card actively streams the answer to `title` and reveals it.
     * Mobile: set by the parent's IntersectionObserver. Desktop: set by hover.
     */
    active?: boolean;
    /**
     * When true (mobile only, the immediate next card after `active`), the card
     * silently buffers the answer in the background so it appears instantly when
     * the user scrolls to it. Has no visual effect on its own.
     */
    prefetch?: boolean;
}

export function TikTokStory({ imageUrl, title, href, kicker, description, id, active = false, prefetch = false }: TikTokStoryProps) {
    const [imageFailed, setImageFailed] = useState(false);
    const navigate = useNavigate();

    const { bodyText, status } = useQuestionAnswerStream(title, { enabled: active || prefetch });

    // Show the answer overlay when this card is active AND we have something to show.
    // Pre-first-chunk errors silently fall back to the question-only view.
    const hasContent = bodyText.length > 0;
    const isWorking = status === "starting" || status === "streaming";
    const showReveal = active && (isWorking || hasContent);

    return (
        <Link
            to={href}
            viewTransition
            className="group motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 block h-full snap-start snap-always transition-[transform,box-shadow] duration-200 ease-out focus-visible:outline-none active:scale-[0.97] motion-safe:duration-500 md:h-auto md:snap-none md:rounded-xl md:shadow-md md:hover:-translate-y-0.5 md:hover:shadow-xl dark:md:shadow-black/40"
        >
            <article className="relative h-full w-full overflow-hidden bg-neutral-900 md:aspect-[9/16] md:h-auto md:rounded-xl">
                {!imageFailed && (
                    <img
                        src={imageUrl}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        onError={() => setImageFailed(true)}
                        style={id ? { viewTransitionName: `story-${id}` } : undefined}
                        className={cn(
                            "absolute inset-0 h-full w-full object-cover object-center transition-[filter,transform] duration-[400ms] ease-out group-active:brightness-95 md:motion-safe:group-hover:scale-[1.04]",
                            showReveal && "motion-safe:brightness-50 motion-safe:blur-[1px]"
                        )}
                    />
                )}
                <div className="pointer-events-none absolute inset-0 outline outline-1 -outline-offset-1 outline-white/10" />

                {/* Scrim — grows from h-1/2 to h-3/4 during reveal so the longer answer body
                    sits on darker background without changing image treatment too aggressively. */}
                <div
                    className={cn(
                        "pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t via-black/40 to-transparent motion-safe:transition-all motion-safe:duration-[280ms] motion-safe:ease-out",
                        showReveal ? "h-3/4 from-black/85" : "h-1/2 from-black/80"
                    )}
                />

                {/* IDLE content — bottom-anchored question. Stays in the DOM and crossfades
                    with the revealed view so we don't fight `bottom:0` vs `top:0` transitions. */}
                <div
                    className={cn(
                        "pointer-events-none absolute inset-x-0 bottom-0 p-5 text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.3),0_2px_8px_rgba(0,0,0,0.3)] motion-safe:transition-opacity motion-safe:duration-[220ms] motion-safe:ease-out",
                        showReveal ? "opacity-0" : "opacity-100"
                    )}
                    style={{ paddingBottom: "max(2rem, calc(env(safe-area-inset-bottom) + 0.75rem))" }}
                >
                    {kicker && <span className="text-xs font-medium tracking-wider text-white/80 uppercase">{kicker}</span>}
                    <h3 className="mt-1 line-clamp-4 font-serif text-2xl leading-tight font-bold text-balance">{title}</h3>
                    {description && <p className="mt-2 line-clamp-3 font-sans text-sm text-pretty text-white/85">{description}</p>}
                </div>

                {/* REVEALED top — small question. aria-hidden so SRs continue to use the link's
                    accessible name (the original question), not a duplicate. */}
                <div
                    aria-hidden="true"
                    className={cn(
                        "pointer-events-none absolute inset-x-0 top-0 px-5 pt-5 text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.3),0_2px_8px_rgba(0,0,0,0.3)] motion-safe:transition-opacity motion-safe:duration-[220ms] motion-safe:ease-out",
                        showReveal ? "opacity-100" : "opacity-0"
                    )}
                    style={{ paddingTop: "max(1.25rem, calc(env(safe-area-inset-top) + 0.5rem))" }}
                >
                    {kicker && <span className="text-xs font-medium tracking-wider text-white/80 uppercase">{kicker}</span>}
                    <p className="mt-1 line-clamp-3 font-serif text-xl leading-snug font-bold text-balance text-white/95">{title}</p>
                    <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, ease: "easeOut", delay: 3 }}>
                        <Badge className="mt-3 bg-primary/50 text-accent-foreground pl-3 pointer-events-auto" asChild>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    navigate("/ask-the-news");
                                }}
                            >
                                Keep asking <ArrowRightIcon className="size-4" />
                            </button>
                        </Badge>
                    </motion.div>
                </div>

                {/* REVEALED bottom — answer body or skeleton. max-h caps the answer to ~half
                    the card. z-10 ensures the text sits above the scrim's strongest band so
                    the bottom lines stay readable. */}
                <div
                    aria-hidden="true"
                    className={cn(
                        "pointer-events-none absolute inset-x-0 bottom-0 z-10 max-h-[70%] overflow-hidden px-5 text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.3),0_2px_8px_rgba(0,0,0,0.3)] motion-safe:transition-opacity motion-safe:duration-[220ms] motion-safe:ease-out",
                        showReveal ? "opacity-100" : "opacity-0"
                    )}
                    style={{
                        paddingBottom: "max(2rem, calc(env(safe-area-inset-bottom) + 0.75rem))",
                    }}
                >
                    {hasContent ? (
                        <p className="line-clamp-[16] font-sans text-[15px] leading-relaxed text-white/95">
                            {bodyText}
                            {status === "streaming" && (
                                <span className="ml-0.5 inline-block -translate-y-px text-white/70 motion-safe:animate-pulse">▍</span>
                            )}
                        </p>
                    ) : (
                        // Pre-first-chunk shimmer skeleton — 3 lines of varying width.
                        <div className="space-y-2">
                            <div className="h-3 w-full rounded bg-white/15 motion-safe:animate-pulse" />
                            <div className="h-3 w-4/5 rounded bg-white/15 motion-safe:animate-pulse" />
                            <div className="h-3 w-3/5 rounded bg-white/15 motion-safe:animate-pulse" />
                        </div>
                    )}
                </div>

                <div className="pointer-events-none absolute inset-0 opacity-0 ring-white ring-inset group-focus-visible:opacity-100 group-focus-visible:ring-2" />
            </article>
        </Link>
    );
}
