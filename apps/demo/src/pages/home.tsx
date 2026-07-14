import { AdSlot } from "@arcxp/ask-the-news-components";
import { HeroStory } from "@/components/stories/hero-story";
import { StoryList } from "@/components/stories/story-list";
import { mockStories } from "@/data/mock-stories";
import { MOCK_ARTICLE_HREF } from "@/data/mock-article";

export function HomePage() {
    const [heroStory, ...remainingStories] = mockStories;

    return (
        <main className="animate-in fade-in slide-in-from-bottom-4 mx-auto max-w-3xl px-4 py-8 duration-500">
            <HeroStory
                headline={heroStory.headline}
                imageUrl={heroStory.imageUrl}
                summary={heroStory.summary}
                href={MOCK_ARTICLE_HREF}
                question={heroStory.question}
            />
            <StoryList stories={remainingStories} />
            <AdSlot variant="leaderboard" />
        </main>
    );
}
