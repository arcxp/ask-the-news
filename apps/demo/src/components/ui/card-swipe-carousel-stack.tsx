import { ArrowRightIcon } from "lucide-react"
import { motion, type PanInfo } from "motion/react"
import { useCallback, useEffect, useState } from "react"
import { useNavigate } from "react-router"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface CarouselQuestion {
    id: string
    kicker?: string
    question: string
    teaser?: string
    href?: string
}

interface CardSwipeCarouselStackProps {
    questions?: CarouselQuestion[]
    eyebrow?: string
    onQuestionClick?: (question: CarouselQuestion) => void
    autoplayMs?: number
    showImages?: boolean
}

// Picsum seed → stable image per card across renders. Sized 2x for retina.
const PICSUM_SIZE = "1200/800"
const picsumUrl = (seed: string) => `https://picsum.photos/seed/${encodeURIComponent(seed)}/${PICSUM_SIZE}`

const DEFAULT_QUESTIONS: CarouselQuestion[] = [
    {
        id: "q1",
        kicker: "Politics",
        question: "What is the Commemorative Works Act?",
        teaser:
            "The 1986 law sets the process for building memorials on federal land in D.C., requiring Congressional authorization for most projects.",
    },
    {
        id: "q2",
        kicker: "Government",
        question: "Who has authority over construction on federal land?",
        teaser:
            "Authority is split: Congress legislates, the Interior Department manages most parks, and agencies like the NCPC review designs.",
    },
    {
        id: "q3",
        kicker: "Economy",
        question: "Why is the Fed signaling rate cuts now?",
        teaser:
            "Core inflation has moderated toward the 2% target for three straight months, giving policymakers room to ease without reigniting prices.",
    },
    {
        id: "q4",
        kicker: "Health",
        question: "How does the new SMA gene therapy work?",
        teaser:
            "It delivers a working copy of the SMN1 gene via a viral vector, addressing the root cause of spinal muscular atrophy rather than symptoms.",
    },
    {
        id: "q5",
        kicker: "Tech",
        question: "What's driving the latest AI chip export rules?",
        teaser:
            "New Commerce restrictions tighten the performance ceiling on advanced GPUs sold abroad, aimed at slowing rival training capacity.",
    },
]

const DEFAULT_AUTOPLAY_MS = 6000
const DRAG_THRESHOLD = 120
const VELOCITY_THRESHOLD = 500

// Cards are always mounted; their visual position derives from how far they
// are ahead of activeIndex in the cyclic order.
function getRelativePosition(cardIndex: number, activeIndex: number, total: number) {
    return (cardIndex - activeIndex + total) % total
}

export default function CardSwipeCarouselStack({
    questions,
    eyebrow = "Know more, No more",
    onQuestionClick,
    autoplayMs = DEFAULT_AUTOPLAY_MS,
    showImages = false,
}: CardSwipeCarouselStackProps = {}) {
    const items = questions && questions.length > 0 ? questions : DEFAULT_QUESTIONS
    const total = items.length
    const navigate = useNavigate()
    const [activeIndex, setActiveIndex] = useState(0)
    const [dragging, setDragging] = useState(false)

    const advance = useCallback(
        (direction: 1 | -1) => {
            setActiveIndex(prev => (prev + direction + total) % total)
        },
        [total],
    )

    useEffect(() => {
        if (autoplayMs <= 0) return
        if (dragging) return
        const timer = setInterval(() => advance(1), autoplayMs)
        return () => clearInterval(timer)
    }, [advance, autoplayMs, dragging, activeIndex])

    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === "ArrowLeft") advance(-1)
            if (e.key === "ArrowRight") advance(1)
        }
        window.addEventListener("keydown", handleKey)
        return () => window.removeEventListener("keydown", handleKey)
    }, [advance])

    const handleAsk = (q: CarouselQuestion) => {
        if (onQuestionClick) {
            onQuestionClick(q)
            return
        }
        navigate(q.href ?? `/ask-the-news?q=${encodeURIComponent(q.question)}`)
    }

    const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        setDragging(false)
        const { offset, velocity } = info
        const shouldFling = Math.abs(offset.x) > DRAG_THRESHOLD || Math.abs(velocity.x) > VELOCITY_THRESHOLD
        if (!shouldFling) return
        advance(offset.x < 0 ? 1 : -1)
    }

    return (
        <section className="mx-auto w-full max-w-2xl p-4">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: "easeOut" }}>
                <div className="mx-auto max-w-2xl text-center">
                    <p className="text-accent text-xs font-semibold tracking-widest uppercase">{eyebrow}</p>
                </div>

                <div className="relative mt-2 h-[380px]">
                    {items.map((card, i) => {
                        const rel = getRelativePosition(i, activeIndex, total)
                        const isFront = rel === 0
                        const isFirstPeek = rel === 1
                        const isSecondPeek = rel === 2
                        // Cards beyond the 3-deep peek stack are hidden but stay mounted so
                        // their drag state and contents survive the activeIndex transition.
                        const inStack = isFront || isFirstPeek || isSecondPeek

                        const offsetY = isFront ? 0 : isFirstPeek ? 14 : 28
                        const scale = isFront ? 1 : isFirstPeek ? 0.96 : 0.92
                        const opacity = isFront ? 1 : isFirstPeek ? 0.85 : 0.55

                        return (
                            <motion.figure
                                key={card.id}
                                className={cn(
                                    "absolute inset-0 overflow-hidden rounded-2xl border p-8 shadow-lg sm:p-10",
                                    !showImages && "bg-card",
                                    isFront && "cursor-grab active:cursor-grabbing",
                                )}
                                style={{
                                    zIndex: total - rel,
                                    pointerEvents: inStack ? "auto" : "none",
                                }}
                                initial={false}
                                animate={{
                                    y: offsetY,
                                    scale,
                                    opacity: inStack ? opacity : 0,
                                }}
                                transition={{ type: "spring", stiffness: 260, damping: 26 }}
                                drag={isFront ? "x" : false}
                                dragConstraints={{ left: 0, right: 0 }}
                                dragElastic={0.6}
                                onDragStart={() => setDragging(true)}
                                onDragEnd={handleDragEnd}
                                whileDrag={{ cursor: "grabbing" }}
                            >
                                {showImages ? (
                                    <>
                                        <img
                                            src={picsumUrl(card.id)}
                                            alt=""
                                            aria-hidden="true"
                                            loading="lazy"
                                            decoding="async"
                                            className="pointer-events-none absolute inset-0 h-full w-full object-cover"
                                        />
                                        <div
                                            aria-hidden="true"
                                            className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/30 via-black/55 to-black/85"
                                        />
                                    </>
                                ) : null}

                                <div className={cn("relative flex h-full flex-col", showImages && "text-white")}>
                                    <div className="flex items-center gap-2">
                                        <span
                                            className={cn(
                                                "text-[11px] font-medium tracking-wider uppercase",
                                                showImages ? "text-white/80" : "text-muted-foreground",
                                            )}
                                        >
                                            {card.kicker ?? "Ask the News"}
                                        </span>
                                    </div>

                                    <blockquote
                                        className={cn(
                                            "mt-6 font-serif text-2xl leading-tight font-semibold text-balance sm:text-3xl",
                                            showImages ? "text-white" : "text-foreground",
                                        )}
                                    >
                                        {card.question}
                                    </blockquote>

                                    {card.teaser ? (
                                        <p
                                            className={cn(
                                                "mt-5 text-sm leading-relaxed sm:text-base",
                                                showImages ? "text-white/85" : "text-muted-foreground",
                                            )}
                                        >
                                            {card.teaser}
                                        </p>
                                    ) : null}

                                    <figcaption className="mt-auto flex items-center justify-between pt-8">
                                        <p className={cn("text-xs", showImages ? "text-white/75" : "text-muted-foreground")}>
                                            Swipe to explore · {(i + 1).toString().padStart(2, "0")} / {total.toString().padStart(2, "0")}
                                        </p>
                                        {isFront ? (
                                            <Button
                                                size="sm"
                                                variant={showImages ? "secondary" : "default"}
                                                onClick={() => handleAsk(card)}
                                                className="gap-1.5"
                                            >
                                                Ask
                                                <ArrowRightIcon aria-hidden="true" className="size-3.5" />
                                            </Button>
                                        ) : null}
                                    </figcaption>
                                </div>
                            </motion.figure>
                        )
                    })}
                </div>

                <div className="mt-6 flex items-center justify-center gap-2">
                    {items.map((q, i) => (
                        <Button
                            key={q.id}
                            variant="ghost"
                            size="icon"
                            onClick={() => setActiveIndex(i)}
                            aria-label={`Go to question ${i + 1} of ${items.length}`}
                            aria-current={i === activeIndex ? "true" : undefined}
                            className={cn(
                                "h-1.5 rounded-full transition-all",
                                i === activeIndex ? "bg-foreground w-6" : "bg-muted-foreground/30 hover:bg-muted-foreground/60 w-1.5",
                            )}
                        />
                    ))}
                </div>
            </motion.div>
        </section>
    )
}
