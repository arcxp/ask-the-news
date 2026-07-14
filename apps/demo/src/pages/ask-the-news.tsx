import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { AskChat } from "@arcxp/ask-the-news-components";

export function AskTheNewsPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    // Capture the ?q= deep link exactly once, then strip it from the URL so a
    // refresh doesn't re-ask. AskChat handles the actual auto-submit.
    const [initialQuery] = useState(() => searchParams.get("q")?.trim() || undefined);

    useEffect(() => {
        if (initialQuery) setSearchParams({}, { replace: true });
    }, [initialQuery, setSearchParams]);

    // Demo-only placeholder so example answers/sources without their own images
    // still render something. Consumers pass their own (or omit for no image).
    return <AskChat initialQuery={initialQuery} fallbackImageUrl="https://picsum.photos/800/450" />;
}
