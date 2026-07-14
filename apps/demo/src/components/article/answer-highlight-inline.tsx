import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router";
import { cn } from "@/lib/utils";

export interface AnswerHighlightInlineProps {
    topic: string;
    answer: string;
    className?: string;
    sourceLabel?: string;
}

export function AnswerHighlightInline({ topic, answer, className, sourceLabel = "Ask the News Insights" }: AnswerHighlightInlineProps) {
    return (
        <aside
            role="note"
            aria-label={`${sourceLabel} answer`}
            className={cn(
                "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1 motion-safe:duration-300",
                "rounded-md bg-highlight px-4 py-3 font-sans text-base leading-relaxed text-foreground/90",
                "outline outline-1 -outline-offset-1 outline-accent/15",
                "dark:text-foreground/90 dark:outline-accent/25",
                className
            )}
        >
            <div className="text-muted-foreground mb-1 flex items-center gap-1.5 text-[10px] font-semibold tracking-widest uppercase">
                <Sparkles aria-hidden="true" className="size-3 text-accent" />
                {sourceLabel}
            </div>
            <p className="text-pretty text-sm">
                <strong className="text-foreground font-semibold">{topic}</strong>
                <span aria-hidden="true"> — </span>
                {answer}{" "}
                <Link
                    to={`/ask-the-news?q=${encodeURIComponent(`Can you tell me more about ${topic}?`)}`}
                    viewTransition
                    className="text-xs text-accent hover:text-accent/80 group/lm inline-flex items-baseline gap-0.5 font-semibold whitespace-nowrap underline decoration-accent/40 decoration-dotted underline-offset-2 transition-colors hover:decoration-accent"
                >
                    Learn more
                    <ArrowRight aria-hidden="true" className="size-3 self-center transition-transform duration-150 group-hover/lm:translate-x-0.5" />
                </Link>
            </p>
        </aside>
    );
}
