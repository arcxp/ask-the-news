import { Link } from "react-router";
import { Sparkles } from "lucide-react";

interface HeroStoryProps {
    headline: string;
    imageUrl: string;
    summary: string;
    href?: string;
    question?: string;
}

export function HeroStory({ headline, imageUrl, summary, href, question }: HeroStoryProps) {
    const headlineNode = (
        <h2 className="mb-6 text-center font-serif text-3xl leading-tight font-bold text-balance md:text-4xl">
            {href ? (
                <Link
                    to={href}
                    viewTransition
                    className="bg-[linear-gradient(currentColor,currentColor)] [box-decoration-break:clone] [background-size:0%_2px] [background-position:0_100%] bg-no-repeat transition-[background-size] duration-[450ms] ease-[cubic-bezier(0.16,1,0.3,1)] [-webkit-box-decoration-break:clone] hover:[background-size:100%_2px]"
                >
                    {headline}
                </Link>
            ) : (
                headline
            )}
        </h2>
    );

    const askQuery = question ?? `Tell me more about ${headline}`;
    const askHref = `/ask-the-news?q=${encodeURIComponent(askQuery)}`;

    return (
        <article className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 mb-8 motion-safe:duration-500">
            {headlineNode}
            <img
                src={imageUrl}
                alt=""
                loading="eager"
                fetchPriority="high"
                decoding="async"
                className="mb-4 aspect-video w-full object-cover outline outline-1 -outline-offset-1 outline-black/10 dark:outline-white/10"
            />
            <p className="text-muted-foreground font-sans text-lg leading-relaxed text-pretty">{summary}</p>
            <Link
                to={askHref}
                viewTransition
                className="border-accent text-accent hover:bg-accent/10 dark:hover:bg-accent/10 mt-2 inline-flex min-h-8 items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-[background-color,scale] duration-150 ease-[cubic-bezier(0.2,0,0,1)] active:scale-[0.96]"
            >
                <Sparkles className="size-4" aria-hidden />
                Ask about this story
            </Link>
        </article>
    );
}
