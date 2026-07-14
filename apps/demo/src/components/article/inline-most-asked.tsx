import { useId } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAskNavigate } from "@/components/article/use-ask-navigate";

interface InlineMostAskedProps {
    questions: [string, string, string];
    label?: string;
    /** Extra classes merged onto the root element. */
    className?: string;
}

export function InlineMostAsked({ questions, label = "Most Asked", className }: InlineMostAskedProps) {
    const headingId = useId();
    const askNavigate = useAskNavigate();

    return (
        <aside aria-labelledby={headingId} className={cn("border-border animate-in fade-in slide-in-from-bottom-3 my-5 border-y py-3 duration-300", className)}>
            <p id={headingId} className="px-2 text-xs font-medium tracking-wider text-accent uppercase">
                {label}
            </p>

            <div className="mt-1.5">
                {questions.map((question, index) => (
                    <button
                        key={question}
                        type="button"
                        onClick={() => askNavigate(question)}
                        className="group hover:bg-muted animate-in fade-in slide-in-from-bottom-2 fill-mode-backwards flex w-full origin-left items-center gap-3 rounded-md px-2 py-1.5 text-left font-sans text-sm transition-[background-color,scale] duration-300 [transition-duration:150ms] ease-[cubic-bezier(0.2,0,0,1)] active:scale-[0.96] motion-reduce:animate-none motion-reduce:transition-none"
                        style={{ animationDelay: `${index * 60}ms` }}
                    >
                        <span className="text-foreground flex-1 text-pretty">{question}</span>
                        <ChevronRight
                            aria-hidden="true"
                            className="text-muted-foreground/60 group-hover:text-muted-foreground size-4 shrink-0 transition-opacity"
                        />
                    </button>
                ))}
            </div>
        </aside>
    );
}
