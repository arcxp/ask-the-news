export const MOCK_ARTICLE_HREF = "/article/trump-arch";

export interface MockArticle {
    kicker: string;
    headline: string;
    authors: string[];
    publishedDisplay: string;
    publishedISO: string;
    readTime: string;
    leadPhoto: {
        url: string;
        alt: string;
        caption: string;
        credit: string;
    };
    body: string[];
    /** Canned 3-bullet "explain" summary, used as a fallback when the live API errors. */
    explainBullets: string[];
}

export const mockArticle: MockArticle = {
    kicker: "Politics",
    headline: "Trump officials plan to build arch without congressional authorization",
    authors: ["Jane Doe", "John Smith"],
    publishedDisplay: "May 20, 2026 at 6:00 a.m. EDT",
    publishedISO: "2026-05-20T10:00:00Z",
    readTime: "7 min read",
    leadPhoto: {
        url: "https://picsum.photos/800/450",
        alt: "A rendering of a proposed triumphal arch on the National Mall, framed by the Washington Monument in the distance and bordered by rows of American elm trees.",
        caption:
            "An early architectural rendering circulated among administration officials shows a proposed triumphal arch sited near the western end of the National Mall.",
        credit: "Administration handout / Reviewed by The Arc Intelligencer",
    },
    body: [
        "Senior Trump administration officials are quietly advancing plans to build a large commemorative arch on federal land in Washington without first seeking authorization from Congress, according to four people familiar with the discussions and internal planning documents reviewed by The Arc Intelligencer.",
        "The structure, described in preliminary renderings as a triumphal arch roughly the height of an eight-story building, would be sited on a parcel administered by the National Park Service. Officials have framed the project internally as a presidential commemoration rather than a new memorial, a distinction they argue could allow construction to bypass the Commemorative Works Act, the 1986 law that governs new monuments on federal land in the capital region.",
        "Legal scholars and former Park Service officials interviewed for this story disputed that interpretation. They said the proposed arch, by virtue of its scale, permanence, and location, would almost certainly meet the statutory definition of a commemorative work and therefore require explicit authorization from Congress before any ground is broken.",
        '"You cannot simply rename a monument to escape a statute that has governed the Mall for forty years," said one former senior Interior Department lawyer, who spoke on the condition of anonymity to discuss internal deliberations. "The Commemorative Works Act was written precisely to prevent this kind of end-run."',
        'The White House declined to comment on the record. A spokesperson for the Interior Department, which oversees the Park Service, said only that the department "reviews all proposals consistent with applicable law" and declined to confirm or deny the existence of the planning effort.',
        "Internal documents reviewed by The Arc Intelligencer indicate the project has been under active development for at least nine months. An early budget estimate, dated February, pegged the cost at between $180 million and $240 million, with funding to be drawn from a combination of unspent agency appropriations, private donations solicited through a nonprofit being organized for the purpose, and in-kind contributions from construction firms.",
        "Several of the firms named in those documents have prior federal contracting relationships and have donated to political committees aligned with the administration. None responded to requests for comment.",
        'Members of Congress from both parties said they had not been briefed on the project and learned of its existence only when contacted for this story. The chair of the House subcommittee that oversees the Park Service said in a statement that any attempt to construct a permanent monument on the Mall without congressional authorization would be "plainly unlawful" and would draw an immediate legal challenge.',
        'The ranking member of the Senate Energy and Natural Resources Committee said her staff had begun preparing oversight requests. "If the administration is going around Congress to put a permanent structure on federal land, that is not a commemoration. That is a constitutional problem," she said.',
        "Supporters of the project inside the administration argue that previous presidents have authorized structures on federal land through executive action and that the Commemorative Works Act does not apply when the work is characterized as temporary or as an installation rather than a monument. Independent legal experts called that reading strained.",
        "The National Capital Planning Commission and the Commission of Fine Arts, two bodies whose approval is typically required for any significant alteration to the Mall, have not received formal submissions for the project, according to officials at both agencies. A senior planner at one of the commissions said staff had nonetheless seen a draft rendering passed informally through agency channels in March.",
        'Preservation groups warned that the precedent could reshape the Mall for decades. "Once you accept that an administration can put a permanent structure on the Mall by calling it something other than a monument, you\'ve effectively erased the statute," said the director of a nonprofit that advocates for the historic landscape of the capital.',
        "Several of the people familiar with the discussions said internal disagreement about the legal strategy has slowed the timeline, and that no construction contract has yet been signed. One official cautioned that the project could still be scaled back or abandoned if litigation appears likely to succeed.",
        "But two others said the administration has begun identifying construction firms capable of completing the structure within a single calendar year, a pace that would be unusual for federal projects of comparable scale and that they said reflected a desire to present the arch as a fait accompli before the next election.",
        'Congressional aides on both sides said they expect hearings within weeks. "This is going to be litigated, and it is going to be litigated quickly," one Republican aide said. "Whether you support the idea or not, you cannot let a precedent like this stand without a fight."',
        "Reporting contributed by additional Arc Intelligencer staff. This is a developing story and will be updated.",
    ],
    explainBullets: [
        "Trump administration officials are quietly planning a large arch on the National Mall and want to start building without asking Congress first.",
        "They are calling it a commemoration instead of a monument, but legal experts say the law governing the Mall almost certainly still applies.",
        "Members of Congress from both parties say they were not told about the project and warn that any construction without authorization will be challenged in court.",
    ],
};

export interface AnswerHighlight {
    paragraphIndex: number;
    phrase: string;
    question: string;
    answer: string;
}

export const answerHighlights: AnswerHighlight[] = [
    {
        paragraphIndex: 1,
        phrase: "Commemorative Works Act",
        question: "What does the Commemorative Works Act actually regulate?",
        answer: "Passed in 1986, it sets the rules for new commemorative works on federal land in the Washington, D.C. area — requiring explicit congressional authorization, site and design review by federal commissions, and privately raised construction funds before ground can be broken.",
    },
    {
        paragraphIndex: 5,
        phrase: "$180 million and $240 million",
        question: "How does this compare to other federal monument budgets?",
        answer: "It is several times the cost of recent additions to the Mall. The World War II Memorial cost roughly $182 million in today's dollars, and the Martin Luther King Jr. Memorial came in near $120 million — both funded primarily through private donations over multi-year campaigns.",
    },
    {
        paragraphIndex: 10,
        phrase: "National Capital Planning Commission",
        question: "What role does the National Capital Planning Commission play?",
        answer: "It is the federal government's central planning agency for the National Capital Region. Any significant new structure on federal land in D.C. typically requires its review and approval, alongside sign-off from the Commission of Fine Arts.",
    },
];

export const mostAskedQuestions: [string, string, string] = [
    "What authority does the president have over construction on federal land?",
    "How does the Commemorative Works Act limit new monuments in Washington?",
    "What other major monuments were built without congressional authorization?",
];
