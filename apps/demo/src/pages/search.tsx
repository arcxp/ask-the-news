import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Search as SearchIcon } from "lucide-react";
import { AskOverview, type OverviewStatus } from "@/components/search/ask-overview";
import { SearchResultItem } from "@/components/search/search-result-item";
import { SearchInput } from "@arcxp/ask-the-news-components";
import { useAtnClient } from "@arcxp/ask-the-news-components";
import { useAskConfig } from "@arcxp/ask-the-news-components";
import type { Source } from "@arcxp/ask-the-news-components";
import { cn } from "@/lib/utils";

const SKELETON_ROW_COUNT = 5;

export function SearchPage() {
    const client = useAtnClient();
    const { website } = useAskConfig();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [followUp, setFollowUp] = useState("");
    const [emptyQuery, setEmptyQuery] = useState("");

    const [overviewText, setOverviewText] = useState("");
    const [sources, setSources] = useState<Source[]>([]);
    const [streamStatus, setStreamStatus] = useState<OverviewStatus>("idle");
    const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);
    const activeStreamRef = useRef<{ cancelled: boolean } | null>(null);

    let query = "";
    try {
        query = (searchParams.get("q") ?? "").trim();
    } catch {
        query = "";
    }

    useEffect(() => {
        if (!query) {
            setOverviewText("");
            setSources([]);
            setStreamStatus("idle");
            setErrorMessage(undefined);
            return;
        }

        // Cancel any in-flight stream synchronously before starting the next one.
        if (activeStreamRef.current) activeStreamRef.current.cancelled = true;
        const token = { cancelled: false };
        activeStreamRef.current = token;

        setOverviewText("");
        setSources([]);
        setErrorMessage(undefined);
        setStreamStatus("streaming");

        let accumulated = "";

        (async () => {
            try {
                const response = await client.queryStream({ query, website });
                if (token.cancelled) return;

                if (!response.stream) {
                    setErrorMessage(response.error?.detail || "Search failed");
                    setStreamStatus("error");
                    return;
                }

                let finalStatus: OverviewStatus = "answered";
                for await (const chunk of response.stream) {
                    if (token.cancelled) return;
                    if (chunk.type === "output_text.delta") {
                        accumulated += chunk.delta;
                        setOverviewText(accumulated);
                    } else if (chunk.type === "sources") {
                        setSources(chunk.results);
                    } else if (chunk.type === "message_stop") {
                        if (chunk.status) finalStatus = chunk.status;
                    }
                    // video_sources / follow_up_questions / message_start ignored on /search.
                }

                if (!token.cancelled) setStreamStatus(finalStatus);
            } catch (err) {
                if (token.cancelled) return;
                console.error("Search stream failed:", err);
                setErrorMessage(err instanceof Error ? err.message : "Search failed");
                setStreamStatus("error");
            } finally {
                if (activeStreamRef.current === token) activeStreamRef.current = null;
            }
        })();

        return () => {
            token.cancelled = true;
        };
    }, [query, client, website]);

    // Belt-and-suspenders: cancel any active stream on unmount.
    useEffect(() => {
        return () => {
            if (activeStreamRef.current) activeStreamRef.current.cancelled = true;
        };
    }, []);

    const submitSearch = (raw: string) => {
        const q = raw.trim();
        if (!q) return;
        navigate(`/search?q=${encodeURIComponent(q)}`, { viewTransition: true });
    };

    if (!query) {
        return (
            <main className="mx-auto max-w-3xl px-4 py-10">
                <div className="motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300">
                    <div className="text-muted-foreground flex items-center gap-2">
                        <SearchIcon className="size-4" aria-hidden />
                        <p className="text-xs tracking-wider uppercase">Search</p>
                    </div>
                    <h1 className="mt-2 font-serif text-3xl font-bold tracking-tight md:text-4xl">Search Arc Intelligencer</h1>
                    <p className="text-muted-foreground mt-2 text-sm">Find articles, topics, and reporting from across the newsroom.</p>
                </div>
                <div className="mt-6">
                    <SearchInput
                        value={emptyQuery}
                        onChange={setEmptyQuery}
                        onSubmit={() => submitSearch(emptyQuery)}
                        placeholder="Search Arc Intelligencer"
                        disclaimerText=""
                    />
                </div>
            </main>
        );
    }

    const titleSize = query.length > 120 ? "text-2xl" : "text-3xl md:text-4xl";

    const handleFollowUp = () => {
        const q = followUp.trim();
        if (!q) return;
        navigate(`/ask-the-news?q=${encodeURIComponent(q)}`, { viewTransition: true });
    };

    const isTerminal = streamStatus === "answered" || streamStatus === "rejected" || streamStatus === "unanswered" || streamStatus === "error";
    const isStreaming = streamStatus === "streaming";
    const showSkeletons = sources.length === 0 && !isTerminal;
    // Only the "answered" terminal speaks for the result set itself.
    // rejected/unanswered/error already show notices in the overview card — suppress to avoid duplicate messaging.
    const showEmpty = streamStatus === "answered" && sources.length === 0;

    const countLabel = (() => {
        if (sources.length > 0) return `${sources.length} ${sources.length === 1 ? "result" : "results"}`;
        if (isStreaming) return "Searching…";
        if (showEmpty) return "No results";
        return null;
    })();

    return (
        <main className="mx-auto max-w-3xl px-4 py-8">
            <div className="motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300">
                <p className="text-muted-foreground text-xs tracking-wider uppercase">Search results for</p>
                <h1 id="search-results-heading" className={cn("mt-1 line-clamp-2 font-serif font-bold tracking-tight", titleSize)}>
                    &ldquo;{query}&rdquo;
                </h1>
                {/* Reserve vertical space so the layout doesn't jump when the count arrives. */}
                <p className={cn("text-muted-foreground mt-2 text-sm", !countLabel && "invisible")}>{countLabel ?? " "}</p>
            </div>

            <div className="motion-safe:animate-in motion-safe:fade-in motion-safe:duration-500">
                <AskOverview query={query} text={overviewText} status={streamStatus} errorMessage={errorMessage} sources={sources} />
            </div>

            <div className="motion-safe:animate-in motion-safe:fade-in motion-safe:duration-500">
                <SearchInput value={followUp} onChange={setFollowUp} onSubmit={handleFollowUp} placeholder="Have a question instead?" />
            </div>

            <div className="bg-foreground/15 my-8 h-px" aria-hidden />

            {showSkeletons && (
                <ol aria-label="Loading search results" className="m-0 list-none p-0" aria-busy="true">
                    {Array.from({ length: SKELETON_ROW_COUNT }, (_, i) => (
                        <SearchResultSkeleton key={i} index={i} />
                    ))}
                </ol>
            )}

            {sources.length > 0 && (
                <ol aria-labelledby="search-results-heading" className="m-0 list-none p-0">
                    {sources.map((source, i) => (
                        <SearchResultItem key={source.document_id} source={source} index={i} />
                    ))}
                </ol>
            )}

            {showEmpty && <p className="text-muted-foreground py-6 text-sm">We couldn't find any articles for that query.</p>}
        </main>
    );
}

function SearchResultSkeleton({ index }: { index: number }) {
    return (
        <li
            className="border-border -mx-2 flex w-full gap-4 border-b px-2 py-5 last:border-0 motion-safe:animate-pulse"
            style={{ animationDelay: `${index * 40}ms` }}
        >
            <div className="bg-muted size-14 shrink-0 rounded-sm sm:size-20 md:size-24" />
            <div className="min-w-0 flex-1 space-y-2">
                <div className="bg-muted h-5 w-3/4 rounded-sm" />
                <div className="bg-muted/80 h-4 w-full rounded-sm" />
                <div className="bg-muted/80 h-4 w-2/3 rounded-sm" />
                <div className="bg-muted/60 h-3 w-1/3 rounded-sm" />
            </div>
        </li>
    );
}
