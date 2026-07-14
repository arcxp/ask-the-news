export interface Story {
    id: string;
    headline: string;
    summary: string;
    imageUrl: string;
    kicker?: string;
    readTime?: string;
    question?: string;
}

export const mockStories: Story[] = [
    {
        id: "1",
        headline: "Trump officials plan to build an arch without congressional authorization",
        summary:
            "Senior Trump administration officials are quietly advancing plans to build a large commemorative arch on federal land in Washington without first seeking authorization from Congress, according to four people familiar with the discussions and internal planning documents reviewed by The Arc Intelligencer.",
        imageUrl: "https://picsum.photos/800/450",
        kicker: "Politics",
        readTime: "6 min read",
        question: "How are Trump officials justifying building the arch without congressional approval?",
    },
    {
        id: "2",
        headline: "Federal Reserve Signals Potential Rate Cut Amid Cooling Inflation",
        summary:
            "The Federal Reserve indicated it may begin lowering interest rates in the coming months as inflation continues to moderate toward the central bank's 2% target.",
        imageUrl: "https://picsum.photos/800/450?random=1",
        kicker: "Economy",
        readTime: "4 min read",
    },
    {
        id: "3",
        headline: "Breakthrough Gene Therapy Shows Promise for Rare Childhood Disease",
        summary: "A new gene therapy treatment has shown remarkable results in clinical trials, offering hope to families affected by spinal muscular atrophy.",
        imageUrl: "https://picsum.photos/800/450?random=2",
        kicker: "Health",
        readTime: "5 min read",
    },
    {
        id: "4",
        headline: "Tech Giants Face New Antitrust Scrutiny in European Markets",
        summary: "European regulators announced sweeping new investigations into major technology companies, focusing on data practices and market dominance.",
        imageUrl: "https://picsum.photos/800/450?random=3",
        kicker: "Technology",
        readTime: "3 min read",
    },
    {
        id: "5",
        headline: "Record-Breaking Heat Wave Sweeps Across Southern United States",
        summary:
            "Temperatures exceeding 110 degrees Fahrenheit have been recorded across multiple southern states, straining power grids and prompting emergency declarations.",
        imageUrl: "https://picsum.photos/800/450?random=4",
        kicker: "Weather",
        readTime: "3 min read",
    },
    {
        id: "6",
        headline: "Space Agency Unveils Plans for Permanent Lunar Research Station",
        summary:
            "NASA and international partners revealed detailed blueprints for a permanently crewed research station on the Moon's south pole, with construction expected to begin by 2030.",
        imageUrl: "https://picsum.photos/800/450?random=5",
        kicker: "Science",
        readTime: "5 min read",
    },
];
