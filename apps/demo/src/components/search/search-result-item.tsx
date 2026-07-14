import { cn } from "@/lib/utils";
import type { Source } from "@arcxp/ask-the-news-components";

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function deriveDomain(source: Source): string | null {
    if (source.canonical_url) {
        try {
            return new URL(source.canonical_url).hostname.replace(/^www\./, "");
        } catch {
            // canonical_url isn't a full URL — fall through.
        }
    }
    return source.source?.system ?? null;
}

interface SearchResultItemProps {
    source: Source;
    index?: number;
    /** Extra classes merged onto the root list item. */
    className?: string;
}

export function SearchResultItem({ source, index = 0, className }: SearchResultItemProps) {
    const thumbnailUrl = source.images?.lead_art?.thumbnail_url ?? source.images?.basic?.thumbnail_url ?? null;
    const domain = deriveDomain(source);
    const href = source.canonical_url ?? undefined;

    const inner = (
        <>
            {thumbnailUrl ? (
                <img
                    src={thumbnailUrl}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="size-14 shrink-0 object-cover outline outline-1 -outline-offset-1 outline-border sm:size-20 md:size-24"
                />
            ) : (
                <div
                    aria-hidden
                    className="bg-muted size-14 shrink-0 outline outline-1 -outline-offset-1 outline-border sm:size-20 md:size-24"
                />
            )}
            <div className="min-w-0 flex-1">
                <h3 className="font-serif text-base leading-tight font-semibold group-hover:underline sm:text-lg md:text-xl">{source.headline}</h3>
                {source.description && <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">{source.description}</p>}
                <p className="text-muted-foreground mt-2 text-xs">
                    {domain && <span>{domain}</span>}
                    {domain && source.published_date && " · "}
                    {source.published_date && formatDate(source.published_date)}
                </p>
            </div>
        </>
    );

    const linkClassName =
        "group flex w-full gap-4 py-5 border-b border-border last:border-0 transition-colors duration-150 hover:bg-muted/40 -mx-2 px-2 rounded-sm text-left";

    return (
        <li
            className={cn("motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-500", className)}
            style={{ animationDelay: `${index * 40}ms`, animationFillMode: "both" }}
        >
            {href ? (
                <a href={href} target="_blank" rel="noopener noreferrer" aria-label={`${source.headline} (opens in new tab)`} className={linkClassName}>
                    {inner}
                </a>
            ) : (
                <div className={linkClassName}>{inner}</div>
            )}
        </li>
    );
}
