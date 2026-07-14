import { Fragment } from "react";
import { AdSlot } from "@arcxp/ask-the-news-components";
import type { Story } from "@/data/mock-stories";
import { StoryListItem } from "./story-list-item";

interface StoryListProps {
    stories: Story[];
}

const IN_FEED_AD_INTERVAL = 3;

export function StoryList({ stories }: StoryListProps) {
    return (
        <div>
            {stories.map((story, index) => (
                <Fragment key={story.id}>
                    <StoryListItem
                        index={index}
                        kicker={story.kicker}
                        headline={story.headline}
                        summary={story.summary}
                        readTime={story.readTime}
                        imageUrl={story.imageUrl}
                    />
                    {(index + 1) % IN_FEED_AD_INTERVAL === 0 && index < stories.length - 1 && <AdSlot variant="rectangle" />}
                </Fragment>
            ))}
        </div>
    );
}
