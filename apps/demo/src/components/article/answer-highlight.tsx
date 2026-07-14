import { useId, useState, type ReactNode } from "react";
import { Sparkles, X } from "lucide-react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

export interface AnswerHighlightProps {
    question: string;
    answer: string;
    children: ReactNode;
    sourceLabel?: string;
    /** Extra classes merged onto the highlighted trigger text. */
    className?: string;
}

export function AnswerHighlight({ question, answer, children, sourceLabel = "Ask the News", className }: AnswerHighlightProps) {
    const isMobile = useIsMobile();
    const [open, setOpen] = useState(false);
    const headerId = useId();

    const triggerClass = cn(
        "underline decoration-dotted decoration-2 underline-offset-[3px] decoration-accent/60",
        "rounded-sm px-0.5 -mx-0.5 transition-colors duration-150",
        "hover:decoration-accent hover:bg-highlight",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40",
        !isMobile && "cursor-help",
        className
    );

    if (isMobile) {
        return (
            <Drawer open={open} onOpenChange={setOpen} autoFocus>
                <DrawerTrigger asChild>
                    <span
                        role="button"
                        tabIndex={0}
                        aria-haspopup="dialog"
                        aria-expanded={open}
                        aria-label={`Question: ${question}`}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                setOpen(true);
                            }
                        }}
                        className={triggerClass}
                    >
                        {children}
                    </span>
                </DrawerTrigger>
                <DrawerContent aria-labelledby={headerId} className="max-h-[80dvh]">
                    <DrawerTitle className="sr-only">{question}</DrawerTitle>
                    <DrawerDescription className="sr-only">AI-generated answer about a phrase in this article</DrawerDescription>
                    <AnswerHighlightCard
                        question={question}
                        answer={answer}
                        sourceLabel={sourceLabel}
                        headerId={headerId}
                        showClose
                        onClose={() => setOpen(false)}
                    />
                </DrawerContent>
            </Drawer>
        );
    }

    return (
        <HoverCard open={open} onOpenChange={setOpen} openDelay={80} closeDelay={120}>
            <HoverCardTrigger asChild>
                <span
                    tabIndex={0}
                    aria-label={`Question: ${question}`}
                    aria-haspopup="dialog"
                    aria-expanded={open}
                    className={triggerClass}
                >
                    {children}
                </span>
            </HoverCardTrigger>
            <HoverCardContent role="dialog" aria-labelledby={headerId} side="top" align="start" sideOffset={6} className="w-80 p-0 duration-150">
                <AnswerHighlightCard question={question} answer={answer} sourceLabel={sourceLabel} headerId={headerId} />
            </HoverCardContent>
        </HoverCard>
    );
}

interface CardProps {
    question: string;
    answer: string;
    sourceLabel: string;
    headerId: string;
    showClose?: boolean;
    onClose?: () => void;
}

function AnswerHighlightCard({ question, answer, sourceLabel, headerId, showClose, onClose }: CardProps) {
    return (
        <div className="flex flex-col gap-2 p-4">
            <div className="flex items-start justify-between gap-2">
                <div className="text-muted-foreground flex items-center gap-1.5 text-[10px] font-semibold tracking-widest uppercase">
                    <Sparkles className="size-3 text-accent" />
                    {sourceLabel}
                </div>
                {showClose && (
                    <button
                        type="button"
                        aria-label="Close"
                        onClick={onClose}
                        className="text-muted-foreground hover:text-foreground relative -mt-1 -mr-1 inline-flex size-7 items-center justify-center transition-[color,scale] duration-150 ease-[cubic-bezier(0.2,0,0,1)] active:scale-[0.96]"
                    >
                        <X className="size-4" />
                    </button>
                )}
            </div>
            <p id={headerId} className="text-foreground font-sans text-sm leading-snug font-medium text-pretty">
                {question}
            </p>
            <p className="text-muted-foreground motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1 fill-mode-backwards font-sans text-sm leading-relaxed text-pretty delay-75 duration-200">
                {answer}
            </p>
        </div>
    );
}
