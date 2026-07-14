import { useEffect, useReducer, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import { InlineNotice } from "@arcxp/ask-the-news-components";
import type { DiveDeeperChunk } from "@arcxp/ask-the-news-components";
import { DEFAULT_EXPLAIN_IT_STRINGS, type ExplainItSheetStrings } from "@/components/article/explain-it-strings";
import { cn } from "@/lib/utils";

const BULLET_RE = /^\s*[-•*]\s*(.+)$/;
const MIN_BULLETS_FOR_SUCCESS = 2;
const SKELETON_WIDTHS = ["90%", "75%", "85%"] as const;
const THINKING_DELAY_MS = 800;

export interface ExplainItSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    articleTitle: string;
    /** Prompt is baked into the closure by the caller; takes no args. */
    onExplain: () => AsyncIterable<DiveDeeperChunk>;
    /** Canned bullets rendered when the live API errors or returns nothing useful. */
    fallbackBullets?: string[];
    /** Extra classes merged onto the drawer content. */
    className?: string;
    /** Override display strings (heading, thinking/retry labels). */
    strings?: Partial<ExplainItSheetStrings>;
}

type State =
    | { status: "idle" }
    | { status: "pending" }
    | { status: "streaming"; text: string }
    | { status: "answered"; bullets: string[] }
    | { status: "rejected" }
    | { status: "error"; message: string };

type Action =
    | { type: "submit" }
    | { type: "delta"; text: string }
    | { type: "done" }
    | { type: "rejected" }
    | { type: "error"; message: string }
    | { type: "reset" }
    | { type: "restore"; bullets: string[] };

function reducer(state: State, action: Action): State {
    switch (action.type) {
        case "submit":
            return { status: "pending" };
        case "delta": {
            if (state.status === "pending") return { status: "streaming", text: action.text };
            if (state.status === "streaming") return { status: "streaming", text: state.text + action.text };
            return state;
        }
        case "done": {
            if (state.status === "streaming") {
                // Append a trailing newline so the in-progress last line is treated as complete.
                const { completed } = parseBullets(state.text + (state.text.endsWith("\n") ? "" : "\n"));
                if (completed.length >= MIN_BULLETS_FOR_SUCCESS) return { status: "answered", bullets: completed.slice(0, 3) };
                return { status: "rejected" };
            }
            if (state.status === "pending") return { status: "rejected" };
            return state;
        }
        case "rejected":
            return { status: "rejected" };
        case "error":
            return { status: "error", message: action.message };
        case "restore":
            return { status: "answered", bullets: action.bullets };
        case "reset":
            return { status: "idle" };
    }
}

// eslint-disable-next-line react-refresh/only-export-components -- helper is tightly coupled to this component; export only for testing.
export function parseBullets(text: string): { completed: string[]; inProgress: string | null } {
    const lines = text.split("\n");
    const bulletLines = lines
        .map((l) => l.match(BULLET_RE)?.[1]?.trim())
        .filter((l): l is string => !!l);
    const lastIsComplete = text.endsWith("\n");
    if (lastIsComplete) return { completed: bulletLines, inProgress: null };
    return { completed: bulletLines.slice(0, -1), inProgress: bulletLines.at(-1) ?? null };
}

export function ExplainItSheet({ open, onOpenChange, articleTitle, onExplain, fallbackBullets, className, strings }: ExplainItSheetProps) {
    const s = { ...DEFAULT_EXPLAIN_IT_STRINGS, ...strings };
    const [state, dispatch] = useReducer(reducer, { status: "idle" });
    // Increments on every kickoff. The stream effect keys on this so intra-stream
    // status transitions (pending → streaming) don't cancel the run mid-flight,
    // and a new kickoff cancels any in-flight previous run via cleanup.
    const [submitId, setSubmitId] = useState(0);
    // TODO(real-routes): switch cache key to article id when route param lands.
    const cacheRef = useRef<{ title: string; bullets: string[] } | null>(null);
    const reduceMotion = useReducedMotion();

    // Latest onExplain held in a ref so prop identity churn doesn't matter.
    const onExplainRef = useRef(onExplain);
    useEffect(() => {
        onExplainRef.current = onExplain;
    }, [onExplain]);

    // Open lifecycle: restore cache for current title, otherwise kick off; on close, cancel + reset.
    useEffect(() => {
        if (open) {
            if (state.status === "idle") {
                if (cacheRef.current?.title === articleTitle) {
                    dispatch({ type: "restore", bullets: cacheRef.current.bullets });
                } else {
                    dispatch({ type: "submit" });
                    setSubmitId((id) => id + 1);
                }
            }
        } else if (state.status !== "idle") {
            // Bumping submitId cancels any in-flight stream via the stream effect's cleanup.
            dispatch({ type: "reset" });
            setSubmitId((id) => id + 1);
        }
    }, [open, articleTitle, state.status]);

    // Stream consumer. Keyed on submitId so intra-stream dispatches (pending → streaming)
    // don't trigger cleanup. The body gate on `pending` distinguishes a real submit from a
    // submitId bump caused by a cancel/reset (which we use to cancel any in-flight stream
    // without restarting). Reading `state.status` directly is intentional — we want the
    // value at effect-commit time, not the latest.
    useEffect(() => {
        if (submitId === 0) return;
        if (state.status !== "pending") return;
        let cancelled = false;
        (async () => {
            try {
                for await (const chunk of onExplainRef.current()) {
                    if (cancelled) return;
                    if (chunk.type === "delta") {
                        dispatch({ type: "delta", text: chunk.text });
                    } else if (chunk.type === "done") {
                        dispatch({ type: "done" });
                        return;
                    } else if (chunk.type === "rejected") {
                        dispatch({ type: "rejected" });
                        return;
                    } else if (chunk.type === "error") {
                        dispatch({ type: "error", message: chunk.message });
                        return;
                    }
                }
                if (!cancelled) dispatch({ type: "done" });
            } catch (err) {
                if (!cancelled) dispatch({ type: "error", message: err instanceof Error ? err.message : "Streaming failed" });
            }
        })();
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: state.status is read at commit time, only submitId drives re-runs.
    }, [submitId]);

    // Cache only from `answered` — half-streams are never cached.
    useEffect(() => {
        if (state.status === "answered") {
            cacheRef.current = { title: articleTitle, bullets: state.bullets };
        }
    }, [state, articleTitle]);

    const showThinking = useShowThinking(state.status === "pending");

    const handleRetry = () => {
        dispatch({ type: "submit" });
        setSubmitId((id) => id + 1);
    };

    const isFailed = state.status === "rejected" || state.status === "error";
    const useFallback = isFailed && !!fallbackBullets && fallbackBullets.length > 0;
    const parsed = state.status === "streaming" ? parseBullets(state.text) : { completed: [], inProgress: null };
    const completed = useFallback ? fallbackBullets! : state.status === "answered" ? state.bullets : parsed.completed;
    const inProgress = state.status === "streaming" ? parsed.inProgress : null;
    const isStreaming = state.status === "pending" || state.status === "streaming";
    // While streaming/pending: 3 rows (mix of completed + typewriter + skeletons).
    // Answered or using fallback: only the bullets we have — no trailing skeletons.
    const rowCount = state.status === "answered" || useFallback ? completed.length : 3;

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            {/* outline-none: vaul focuses DrawerContent (tabindex=-1) on open and we have no interactive
                element to receive focus, so the global outline-ring color would render around the sheet.
                DiveDeeper avoids this by focusing its first question button on open. */}
            <DrawerContent className={cn("max-h-[80vh] outline-none focus-visible:outline-none", className)}>
                <DrawerTitle className="sr-only">{s.heading}</DrawerTitle>
                <DrawerDescription className="sr-only">A short, plain-language summary of this article.</DrawerDescription>

                <div className="space-y-5 px-5 pt-2 pb-6">
                    <div className="space-y-1.5">
                        <p className="text-muted-foreground text-[11px] font-semibold tracking-widest uppercase">{s.heading}</p>
                        <p className="text-muted-foreground text-sm text-pretty">{articleTitle}</p>
                        {showThinking && <p className="text-muted-foreground text-xs italic motion-safe:animate-pulse">{s.thinkingLabel}</p>}
                    </div>

                    {(!isFailed || useFallback) && (
                        <>
                            <ul className="space-y-4" aria-hidden="true">
                                {Array.from({ length: rowCount }, (_, i) => (
                                    <li key={i}>{renderRow({ i, completed, inProgress, isStreaming, reduceMotion })}</li>
                                ))}
                            </ul>
                            <div className="sr-only" aria-live="polite" aria-atomic="false">
                                {completed.map((b, i) => (
                                    <p key={i}>{b}</p>
                                ))}
                            </div>
                        </>
                    )}

                    {isFailed && !useFallback && state.status === "rejected" && (
                        <div>
                            <InlineNotice variant="info" title="No explanation available." body="Try again in a moment." />
                            <button type="button" onClick={handleRetry} className="text-accent mt-3 text-xs font-medium hover:underline">
                                {s.retryLabel}
                            </button>
                        </div>
                    )}

                    {isFailed && !useFallback && state.status === "error" && (
                        <div>
                            <InlineNotice variant="error" title="Something went wrong." body={state.message || "The stream was interrupted."} />
                            <button type="button" onClick={handleRetry} className="text-accent mt-3 text-xs font-medium hover:underline">
                                {s.retryLabel}
                            </button>
                        </div>
                    )}

                    <div className="flex items-center justify-between gap-3 pt-1">
                        <p className="text-muted-foreground/70 text-[10px]">{s.poweredByLabel}</p>
                        {useFallback && (
                            <button
                                type="button"
                                onClick={handleRetry}
                                className="text-muted-foreground/80 hover:text-foreground text-[10px] transition-colors hover:underline"
                            >
                                {s.retryLabel}
                            </button>
                        )}
                    </div>
                </div>
            </DrawerContent>
        </Drawer>
    );
}

interface RowArgs {
    i: number;
    completed: string[];
    inProgress: string | null;
    isStreaming: boolean;
    reduceMotion: boolean | null;
}

function renderRow({ i, completed, inProgress, isStreaming, reduceMotion }: RowArgs) {
    if (i < completed.length) {
        return (
            <p
                className={cn(
                    "font-sans text-base leading-relaxed text-pretty",
                    "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1 motion-safe:duration-200"
                )}
            >
                {completed[i]}
            </p>
        );
    }
    if (i === completed.length && inProgress && isStreaming && !reduceMotion) {
        return (
            <p className="font-sans text-base leading-relaxed text-pretty">
                {inProgress}
                <span aria-hidden className="bg-foreground/70 -mb-[0.15em] ml-0.5 inline-block h-[1em] w-[2px] align-middle motion-safe:animate-pulse" />
            </p>
        );
    }
    return <div className="bg-muted h-4 rounded motion-safe:animate-pulse" style={{ width: SKELETON_WIDTHS[i] }} />;
}

function useShowThinking(active: boolean): boolean {
    const [show, setShow] = useState(false);
    useEffect(() => {
        if (!active) {
            setShow(false);
            return;
        }
        const t = window.setTimeout(() => setShow(true), THINKING_DELAY_MS);
        return () => window.clearTimeout(t);
    }, [active]);
    return show;
}
