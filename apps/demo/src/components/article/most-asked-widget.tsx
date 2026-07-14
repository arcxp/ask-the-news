import { useState } from "react";
import { SearchBox } from "@arcxp/ask-the-news-components";
import { SuggestedQuestions } from "@arcxp/ask-the-news-components";
import { useAskNavigate } from "@/components/article/use-ask-navigate";
import { cn } from "@/lib/utils";

interface MostAskedWidgetProps {
    className?: string;
    questions: string[];
    label?: string;
}

export function MostAskedWidget({ className, questions, label = "Ask the News" }: MostAskedWidgetProps) {
    const handleAsk = useAskNavigate();
    const [query, setQuery] = useState("");

    return (
        <section
            id="most-asked"
            aria-labelledby="most-asked-heading"
            className={cn(
                "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 mt-12 scroll-mt-14 duration-500 md:scroll-mt-20",
                "bg-muted/40 -mx-4 rounded-2xl px-4 pt-8 pb-6 md:mx-0 md:bg-transparent md:rounded-none md:border-t md:border-border md:px-0 md:pb-0",
                className
            )}
        >
            <p className="text-accent text-xs font-medium tracking-wider uppercase">{label}</p>
            <h2 id="most-asked-heading" className="mt-1 font-serif text-2xl font-bold text-balance md:text-3xl">
                Keep asking about this story.
            </h2>

            <div className="mt-4">
                <label htmlFor="most-asked-input" className="sr-only">
                    Ask a question about this article
                </label>
                <SearchBox inputId="most-asked-input" value={query} onChange={setQuery} onSubmit={handleAsk} suggestions={questions} />
            </div>

            <p className="text-muted-foreground mt-6 text-xs font-medium tracking-wider uppercase">Recommended</p>
            <div className="mt-1">
                <SuggestedQuestions questions={questions} onSelect={handleAsk} />
            </div>
        </section>
    );
}
