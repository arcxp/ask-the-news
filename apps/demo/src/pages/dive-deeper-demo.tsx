import { DiveDeeper, type DiveDeeperChunk } from "@arcxp/ask-the-news-components";

async function* fakeStream(query: string): AsyncGenerator<DiveDeeperChunk> {
    const answer = `That's a great question about "${query}". Here is a streamed response that arrives one chunk at a time, demonstrating the live region and the answered state of the Dive Deeper card. The text continues for a few more sentences so you can see the internal scroll kick in if the answer is long enough. Sources and follow-ups would come next in a real wiring.`;
    try {
        const words = answer.split(/(\s+)/);
        for (const word of words) {
            await new Promise((r) => setTimeout(r, 25));
            yield { type: "delta", text: word };
        }
        yield { type: "done" };
    } finally {
        // Cleanup hook for cancellation observation in devtools
    }
}

async function* errorStream(_query: string): AsyncGenerator<DiveDeeperChunk> {
    const partial = "Starting to answer but then…";
    for (const word of partial.split(/(\s+)/)) {
        await new Promise((r) => setTimeout(r, 30));
        yield { type: "delta", text: word };
    }
    await new Promise((r) => setTimeout(r, 200));
    yield { type: "error", message: "Something went wrong while answering." };
}

export function DiveDeeperDemoPage() {
    return (
        <div className="mx-auto max-w-2xl px-6 py-12">
            <h1 className="mb-6 font-serif text-3xl font-bold">Dive Deeper — Demo</h1>
            <p className="text-base leading-relaxed text-pretty">
                In a sprawling news cycle, readers often want to pull on a single thread without leaving the page. The{" "}
                <DiveDeeper
                    topic="inline ask"
                    recommendedQuestions={["What is Dive Deeper?", "How does the streaming card work?", "Can I type my own question?"]}
                    onAsk={fakeStream}
                />{" "}
                badge anchors a focused mini-Q&amp;A right where the curiosity arose. Click it to see three recommended follow-ups plus an input for freeform
                questions.
            </p>
            <p className="mt-4 text-base leading-relaxed text-pretty">
                The error path is wired too — try this{" "}
                <DiveDeeper
                    label="broken dive"
                    recommendedQuestions={["This will fail mid-stream", "Then offer a retry", "Useful for testing the error state"]}
                    onAsk={errorStream}
                />{" "}
                to exercise the partial-stream-then-error UX and the retry affordance.
            </p>
        </div>
    );
}
