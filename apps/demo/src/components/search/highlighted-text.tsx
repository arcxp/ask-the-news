import * as React from "react";
import { cn } from "@/lib/utils";

interface HighlightedTextProps {
    text: string;
    query: string;
    className?: string;
}

const STOPWORDS = new Set(["the", "and", "of", "for", "with", "in", "on", "to", "a", "an", "is", "are"]);

function buildTerms(query: string): string[] {
    const trimmed = query.trim();
    if (!trimmed) return [];

    const terms: string[] = [];
    const seen = new Set<string>();

    const pushTerm = (t: string) => {
        if (!t) return;
        const key = t.toLowerCase();
        if (seen.has(key)) return;
        seen.add(key);
        terms.push(t);
    };

    const hasSpace = /\s/.test(trimmed);
    if (!hasSpace) {
        pushTerm(trimmed);
        return terms;
    }

    pushTerm(trimmed);

    for (const word of trimmed.split(/\s+/)) {
        const stripped = word.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "");
        if (stripped.length < 3) continue;
        if (STOPWORDS.has(stripped.toLowerCase())) continue;
        pushTerm(stripped);
    }

    return terms;
}

interface Segment {
    start: number;
    end: number;
    match: string;
}

function findMatches(text: string, terms: string[]): Segment[] {
    const segments: Segment[] = [];
    const lower = text.toLowerCase();

    for (const term of terms) {
        const needle = term.toLowerCase();
        if (!needle) continue;
        let idx = 0;
        while ((idx = lower.indexOf(needle, idx)) !== -1) {
            const end = idx + needle.length;
            const overlaps = segments.some((s) => idx < s.end && end > s.start);
            if (!overlaps) {
                segments.push({ start: idx, end, match: text.slice(idx, end) });
            }
            idx = end;
        }
    }

    return segments.sort((a, b) => a.start - b.start);
}

export function HighlightedText({ text, query, className }: HighlightedTextProps) {
    const terms = buildTerms(query);
    if (terms.length === 0) return <>{text}</>;

    const matches = findMatches(text, terms);
    if (matches.length === 0) return <>{text}</>;

    const nodes: React.ReactNode[] = [];
    let cursor = 0;
    matches.forEach((seg, i) => {
        if (seg.start > cursor) nodes.push(text.slice(cursor, seg.start));
        nodes.push(
            <mark
                key={`${seg.start}-${i}`}
                className={cn("rounded bg-highlight px-1 py-0.5 font-medium text-highlight-foreground", className)}
            >
                {seg.match}
            </mark>
        );
        cursor = seg.end;
    });
    if (cursor < text.length) nodes.push(text.slice(cursor));

    return <>{nodes}</>;
}
