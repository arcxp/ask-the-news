import CardSwipeCarouselStack, { type CarouselQuestion } from "@/components/ui/card-swipe-carousel-stack"

interface KnowMoreNoMoreProps {
    questions?: CarouselQuestion[]
    eyebrow?: string
    showImages?: boolean
}

export function KnowMoreNoMore({ questions, eyebrow, showImages }: KnowMoreNoMoreProps = {}) {
    return <CardSwipeCarouselStack questions={questions} eyebrow={eyebrow} showImages={showImages} />
}
