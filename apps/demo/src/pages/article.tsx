import { Fragment, useMemo, useState, type ReactNode } from "react";
import { AdSlot } from "@arcxp/ask-the-news-components";
import { InlineMostAsked } from "@/components/article/inline-most-asked";
import { MostAskedWidget } from "@/components/article/most-asked-widget";
import { AskFab } from "@/components/article/ask-fab";
import { BackToTopFab } from "@/components/article/back-to-top-fab";
import { AnswerHighlight } from "@/components/article/answer-highlight";
import { AnswerHighlightInline } from "@/components/article/answer-highlight-inline";
import { answerHighlights, mockArticle, mostAskedQuestions, type AnswerHighlight as AnswerHighlightData } from "@/data/mock-article";
import { AskStorylines } from "@/components/article/ask-storylines";
import { DiveDeeper, type DiveDeeperChunk, useAtnClient, useAskConfig, useSettings, useActiveQuestions } from "@arcxp/ask-the-news-components";
import { KnowMoreNoMore } from "@/components/article/know-more-no-more";
import { motion } from "motion/react";

const KNOW_MORE_NO_MORE_LIMIT = 5;

type AtnClient = ReturnType<typeof useAtnClient>;

function makeAskTheNewsStream(client: AtnClient, website: string) {
    return async function* askTheNewsStream(query: string): AsyncGenerator<DiveDeeperChunk> {
        try {
            const response = await client.queryStream({ query, website });
            if (!response.stream) {
                yield { type: "error", message: response.error?.detail || "Request failed" };
                return;
            }
            for await (const chunk of response.stream) {
                if (chunk.type === "output_text.delta") {
                    yield { type: "delta", text: chunk.delta };
                } else if (chunk.type === "message_stop") {
                    if (chunk.status === "rejected" || chunk.status === "unanswered") {
                        yield { type: "rejected" };
                        return;
                    }
                    // Backend may not close the SSE connection itself, so break or the reader hangs forever.
                    break;
                } else if (chunk.type === "error") {
                    yield { type: "error", message: chunk.message };
                    return;
                }
            }
            yield { type: "done" };
        } catch (err) {
            yield { type: "error", message: err instanceof Error ? err.message : "Streaming failed" };
        }
    };
}

// The Ask the News API caps `body.query` at 200 chars; the model already has
// the article indexed via the website parameter, so we don't need to send the
// body — just a short instruction keyed off the headline.
function buildExplainQuery(article: { headline: string }): string {
    return `Explain "${article.headline}" to me like I'm in 5th grade, in 3 short bullets that an adult would write.`;
}

function makeExplainStream(askTheNewsStream: (q: string) => AsyncGenerator<DiveDeeperChunk>, article: { headline: string }) {
    return function explainStream(): AsyncIterable<DiveDeeperChunk> {
        return askTheNewsStream(buildExplainQuery(article));
    };
}

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function renderParagraph(text: string, paragraphIndex: number, highlights: AnswerHighlightData[], enabled: boolean): ReactNode[] {
    if (!enabled) return [text];
    const matches = highlights
        .filter((h) => h.paragraphIndex === paragraphIndex)
        .flatMap((h) => Array.from(text.matchAll(new RegExp(escapeRegex(h.phrase), "g")), (m) => ({ h, start: m.index! })))
        .sort((a, b) => a.start - b.start);

    if (matches.length === 0) return [text];

    const nodes: ReactNode[] = [];
    let cursor = 0;
    matches.forEach((m, idx) => {
        if (m.start < cursor) return;
        if (m.start > cursor) nodes.push(text.slice(cursor, m.start));
        nodes.push(
            <AnswerHighlight key={`hl-${paragraphIndex}-${idx}`} question={m.h.question} answer={m.h.answer}>
                {m.h.phrase}
            </AnswerHighlight>
        );
        cursor = m.start + m.h.phrase.length;
    });
    if (cursor < text.length) nodes.push(text.slice(cursor));
    return nodes;
}

const arcRelatedQuestions: [string, string, string] = [
    "What is the Commemorative Works Act?",
    "Who has authority over construction on federal land?",
    "How is a memorial different from a commemoration legally?",
];

const storylines: { date: string; description: string }[] = [
    {
        date: "May 20, 2026",
        description: "Trump officials are quietly advancing plans to build a large commemorative arch on federal land in Washington without first seeking authorization from Congress, according to four people familiar with the discussions and internal planning documents reviewed by The Arc Intelligencer.",
    },
    {
        date: "May 22, 2026",
        description: "The Federal Reserve indicated it may begin lowering interest rates in the coming months as inflation continues to moderate toward the central bank's 2% target.",
    },
    {
        date: "May 23, 2026",
        description: "A new gene therapy treatment has shown remarkable results in clinical trials, offering hope to families affected by spinal muscular atrophy.",
    },
];

export function ArticlePage() {
    const article = mockArticle;
    const [imageFailed, setImageFailed] = useState(false);
    const [returnScrollY, setReturnScrollY] = useState<number | null>(null);
    const client = useAtnClient();
    const { website } = useAskConfig();
    const askTheNewsStream = useMemo(() => makeAskTheNewsStream(client, website), [client, website]);
    const explainStream = useMemo(() => makeExplainStream(askTheNewsStream, article), [askTheNewsStream, article]);
    const { settings } = useSettings();
    const { questions: knowMoreRaw } = useActiveQuestions({ limit: KNOW_MORE_NO_MORE_LIMIT, enabled: settings.showKnowMoreNoMore });
    const knowMoreQuestions = useMemo(() => knowMoreRaw?.map((q) => ({ id: q.uuid, question: q.text })), [knowMoreRaw]);

    const lede = article.body.slice(0, 3);
    const middle = article.body.slice(3, 8);
    const tail = article.body.slice(8);
    // The 5th paragraph (1-indexed) lives at body[4], which is middle[1].
    const diveDeeperParagraphIndex = 1;

    return (
        <main className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 mx-auto max-w-3xl px-4 py-4 motion-safe:duration-500 lg:py-8">
            <AdSlot variant="leaderboard" />

            <header className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 mt-8 mb-6 motion-safe:duration-300">
                <p className="text-muted-foreground text-center text-xs font-medium tracking-wider uppercase">{article.kicker}</p>
                <h1 className="mt-3 text-center font-serif text-3xl leading-tight font-bold text-balance md:text-4xl lg:text-5xl">{article.headline}</h1>
            </header>

            <figure className="mb-6">
                {imageFailed ? (
                    <div className="bg-muted/50 text-muted-foreground flex aspect-video w-full items-center justify-center text-xs outline outline-1 -outline-offset-1 outline-black/10 dark:outline-white/10">
                        Image unavailable
                    </div>
                ) : (
                    <img
                        src={article.leadPhoto.url}
                        alt={article.leadPhoto.alt}
                        onError={() => setImageFailed(true)}
                        loading="eager"
                        fetchPriority="high"
                        decoding="async"
                        className="aspect-video w-full object-cover outline outline-1 -outline-offset-1 outline-black/10 dark:outline-white/10"
                    />
                )}
                <figcaption className="text-muted-foreground mt-2 font-sans text-sm text-pretty">
                    {article.leadPhoto.caption} <span className="text-xs">({article.leadPhoto.credit})</span>
                </figcaption>
            </figure>

            <div className="flex flex-col gap-0 mb-4">
                <p className="text-muted-foreground font-sans text-sm">
                    By {article.authors.join(" and ")}
                </p>
                <p className="text-muted-foreground font-sans text-[12px]">
                    <time dateTime={article.publishedISO}>{article.publishedDisplay}</time>
                    <span aria-hidden="true"> · </span>
                    <span>{article.readTime}</span>
                </p>
            </div>

            <div className="space-y-6 font-serif text-lg leading-relaxed text-pretty">
                {lede.map((p, i) => (
                    <p key={`lede-${i}`}>{renderParagraph(p, i, answerHighlights, settings.showAnswerHighlights)}</p>
                ))}
            </div>

            {settings.showKnowMoreNoMore && (
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut", delay: 2 }}
                >
                    <KnowMoreNoMore showImages={true} questions={knowMoreQuestions} />
                </motion.div>
            )}

            {/* Render Answer Highlight Inline instead of underline */}
            <div className="mt-6 space-y-6 font-serif text-lg leading-relaxed text-pretty">
                {lede.map((p, i) => {
                    const paragraphHighlights = settings.showAnswerHighlights ? answerHighlights.filter((h) => h.paragraphIndex === i) : [];
                    return (
                        <Fragment key={`lede-inline-${i}`}>
                            <p>{p}</p>
                            {paragraphHighlights.map((h, hi) => (
                                <AnswerHighlightInline key={`hl-inline-${i}-${hi}`} topic={h.phrase} answer={h.answer} />
                            ))}
                        </Fragment>
                    );
                })}
            </div>

            <AdSlot variant="rectangle" className="py-8" />

            <div className="space-y-6 font-serif text-lg leading-relaxed text-pretty">
                {middle.map((p, i) => (
                    <p key={`middle-${i}`}>
                        {renderParagraph(p, i + 3, answerHighlights, settings.showAnswerHighlights)}
                        {settings.showDiveDeeper && i === diveDeeperParagraphIndex && (
                            <>
                                {" "}
                                <DiveDeeper topic="applicable law" recommendedQuestions={arcRelatedQuestions} onAsk={askTheNewsStream} />
                            </>
                        )}
                    </p>
                ))}
            </div>

            {settings.showMostAsked && <InlineMostAsked questions={mostAskedQuestions} />}

            <AdSlot variant="rectangle" className="py-8" />

            {settings.showStorylines && <AskStorylines storylines={storylines} className="border-border border-b pb-8 mb-8" />}

            <div className="space-y-6 font-serif text-lg leading-relaxed text-pretty">
                {tail.map((p, i) => (
                    <p key={`tail-${i}`}>{renderParagraph(p, i + 8, answerHighlights, settings.showAnswerHighlights)}</p>
                ))}
            </div>

            {settings.showKnowMoreNoMore && (
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut", delay: 2 }}
                >
                    <KnowMoreNoMore showImages={false} questions={knowMoreQuestions} />
                </motion.div>
            )}

            <AdSlot variant="leaderboard" className="mt-10" />

            {settings.showMostAsked && (
                <>
                    <MostAskedWidget questions={mostAskedQuestions} />
                    <AskFab
                        targetId="most-asked"
                        onJump={setReturnScrollY}
                        articleTitle={article.headline}
                        onExplain={explainStream}
                        fallbackBullets={article.explainBullets}
                        className="border-none"
                    />
                    <BackToTopFab returnY={returnScrollY} onDismiss={() => setReturnScrollY(null)} />
                </>
            )}
        </main>
    );
}
