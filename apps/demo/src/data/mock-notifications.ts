export type Notification = {
    id: string;
    title: string;
    snippet: string;
    timeLabel: string;
    category: string;
    questions: string[];
    unread: boolean;
};

export const mockNotifications: Notification[] = [
    {
        id: "n1",
        title: "Red Sea shipping disruption deepens",
        snippet: "New attacks rerouted three major carriers around the Cape of Good Hope, pushing freight rates to a 12-month high.",
        timeLabel: "5m ago",
        category: "Top Stories",
        questions: [
            "How are global shipping routes being affected by the Red Sea crisis?",
            "Which industries are most exposed to longer freight times?",
            "What is the current status of the UN mission in Hudaydah, Yemen?",
        ],
        unread: true,
    },
    {
        id: "n2",
        title: "Federal budget proposal lands",
        snippet: "The White House unveiled a $7.1T plan with new caps on discretionary spending and an expanded child tax credit.",
        timeLabel: "32m ago",
        category: "Politics",
        questions: [
            "What are the key policy changes proposed in the latest federal budget?",
            "How is the upcoming election shaping the national political landscape?",
            "What are the latest developments in congressional bipartisan negotiations?",
        ],
        unread: true,
    },
    {
        id: "n3",
        title: "Ukraine-Russia talks resume in Geneva",
        snippet: "Negotiators returned to the table after a two-week pause; both sides signaled openness to a phased ceasefire.",
        timeLabel: "1h ago",
        category: "Top Stories",
        questions: [
            "What are the latest developments in the Ukraine-Russia peace negotiations?",
            "What role is AI playing in monitoring conflicts in the Middle East?",
        ],
        unread: true,
    },
    {
        id: "n4",
        title: "Playoff race tightens in the final weeks",
        snippet: "Three teams sit within a single game of the last wild-card spot heading into the holiday schedule.",
        timeLabel: "3h ago",
        category: "Sports",
        questions: [
            "Which teams are leading the playoff race this season?",
            "What are the biggest trades and transfers happening right now?",
            "Which breakout athletes are dominating headlines this week?",
        ],
        unread: false,
    },
    {
        id: "n5",
        title: "New long COVID treatment trial results",
        snippet: "A Phase 2 study reported meaningful symptom reduction in 41% of patients on the experimental antiviral.",
        timeLabel: "Yesterday",
        category: "Health",
        questions: [
            "What are the latest findings on long COVID and its treatments?",
            "How is AI being used to accelerate drug discovery?",
        ],
        unread: false,
    },
];
