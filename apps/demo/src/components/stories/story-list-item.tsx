import { Link } from "react-router";
import { MOTION } from "@/lib/design-tokens";

interface StoryListItemProps {
    index: number;
    kicker?: string;
    headline: string;
    summary: string;
    readTime?: string;
    imageUrl: string;
    href?: string;
}

export function StoryListItem({ index, kicker, headline, summary, readTime, imageUrl, href }: StoryListItemProps) {
    return (
        <article
            className="border-border animate-in fade-in slide-in-from-bottom-4 fill-mode-backwards flex gap-4 border-b py-5 duration-500"
            style={{ animationDelay: `${Math.min(index * MOTION.staggerStepMs, MOTION.staggerMaxMs)}ms` }}
        >
            <div className="min-w-0 flex-1">
                {kicker && <span className="text-muted-foreground text-xs font-medium tracking-wider uppercase">{kicker}</span>}
                <h3 className="mt-1 font-serif text-lg leading-snug font-bold text-balance">
                    {href ? (
                        <Link to={href} viewTransition className="decoration-2 underline-offset-4 hover:underline">
                            {headline}
                        </Link>
                    ) : (
                        headline
                    )}
                </h3>
                <p className="text-muted-foreground mt-1 line-clamp-2 font-sans text-sm text-pretty">{summary}</p>
                {readTime && <span className="text-muted-foreground mt-2 inline-block text-xs tabular-nums">{readTime}</span>}
            </div>
            <img
                src={imageUrl}
                alt=""
                aria-hidden={href ? "true" : undefined}
                loading="lazy"
                decoding="async"
                className="size-[88px] flex-shrink-0 rounded object-cover outline outline-1 -outline-offset-1 outline-black/10 sm:size-24 md:h-[120px] md:w-40 dark:outline-white/10"
            />
        </article>
    );
}
