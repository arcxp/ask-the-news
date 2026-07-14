import { Newspaper, Sparkles, UserRound, Search, Menu, type LucideIcon } from "lucide-react";

/**
 * Three navigation concepts intentionally kept separate but co-located:
 *
 *  - PRODUCT_TABS    : mobile bottom tab bar destinations (app surfaces)
 *  - EDITORIAL_CATEGORIES : top-of-page section tabs (publication sections)
 *  - REGIONS         : geographic edition selector
 *
 * They overlap in label but mean different things; do not merge them. A
 * future refactor can dedupe with intent once usage stabilizes.
 */

export interface ProductTab {
    /** Stable id used for active-state matching. */
    id: "stories" | "ask" | "for-you" | "search" | "more";
    /** Short label for the bottom tab bar (space-constrained). */
    label: string;
    /** Long label / aria-label. */
    fullLabel: string;
    /** Route path; `null` for tabs that open a drawer/sheet instead of routing. */
    path: string | null;
    icon: LucideIcon;
}

export const PRODUCT_TABS: readonly ProductTab[] = [
    { id: "stories", label: "Stories", fullLabel: "Top Stories", path: "/", icon: Newspaper },
    { id: "ask", label: "Ask", fullLabel: "Ask the News", path: "/ask-the-news", icon: Sparkles },
    { id: "for-you", label: "For You", fullLabel: "For You", path: "/for-you", icon: UserRound },
    { id: "search", label: "Search", fullLabel: "Search", path: "/search", icon: Search },
    { id: "more", label: "More", fullLabel: "More", path: null, icon: Menu },
] as const;

/**
 * Match a pathname to the active product tab. Article routes count as
 * Stories. The Search tab is active only on `/search`; the masthead search
 * trigger handles ad-hoc queries.
 */
export function activeTabForPath(pathname: string): ProductTab["id"] {
    if (pathname.startsWith("/article/")) return "stories";
    if (pathname.startsWith("/ask-the-news")) return "ask";
    if (pathname.startsWith("/for-you")) return "for-you";
    if (pathname.startsWith("/search")) return "search";
    if (pathname === "/") return "stories";
    return "stories";
}

/** Editorial section tabs shown above the masthead on desktop / inside the hamburger drawer on mobile. */
export const EDITORIAL_CATEGORIES = ["Top Stories", "Ask the News", "For You", "U.S.", "Politics", "Sports", "More"] as const;

/** Routes for the editorial categories that have a real page. */
export const EDITORIAL_ROUTE_MAP: Record<string, string> = {
    "Top Stories": "/",
    "Ask the News": "/ask-the-news",
    "For You": "/for-you",
};

export const PATH_TO_EDITORIAL_CATEGORY: Record<string, string> = {
    "/": "Top Stories",
    "/ask-the-news": "Ask the News",
    "/for-you": "For You",
};

export const REGIONS = ["U.S.", "INTERNATIONAL", "CANADA", "MEXICO"] as const;
