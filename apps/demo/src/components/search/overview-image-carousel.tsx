import type { CSSProperties } from "react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { cn } from "@/lib/utils";

export interface OverviewImage {
    id: string;
    url: string;
    alt: string;
    /** When set, the carousel renders an inline koi-video-player instead of the image. */
    videoId?: string;
}

interface OverviewImageCarouselProps {
    images: OverviewImage[];
    className?: string;
}

const KOI_CONFIG = JSON.stringify({ orgId: "arclabs", env: "sandbox" });

const KOI_PLAYER_STYLE: CSSProperties = {
    width: "100%",
    height: "100%",
    maxWidth: "100%",
    "--border-radius": "0",
    "--media-primary-color": "#ffffff",
    "--media-secondary-color": "rgba(0, 0, 0, 0.6)",
    "--media-control-background": "rgba(0, 0, 0, 0.6)",
    "--media-control-hover-background": "rgba(0, 0, 0, 0.85)",
} as CSSProperties;

export function OverviewImageCarousel({ images, className }: OverviewImageCarouselProps) {
    if (!images || images.length === 0) return null;

    const showNav = images.length > 3;

    return (
        <Carousel aria-label="Related images" opts={{ align: "start", containScroll: "trimSnaps", dragFree: true }} className={cn("relative", className)}>
            <CarouselContent className="-ml-2">
                {images.map((img) => (
                    <CarouselItem key={img.id} className="basis-[55%] pl-2 md:basis-[40%] lg:basis-[33%]">
                        <div className="bg-muted relative aspect-video overflow-hidden rounded-md outline outline-1 -outline-offset-1 outline-border">
                            {img.videoId ? (
                                <koi-video-player
                                    config={KOI_CONFIG}
                                    media-id={img.videoId}
                                    pillarbox-blur
                                    hide="PlaybackRate,SeekForward,SeekBackward,VolumeRange"
                                    style={KOI_PLAYER_STYLE}
                                />
                            ) : (
                                <img src={img.url} alt={img.alt} loading="lazy" decoding="async" className="block h-full w-full object-cover" />
                            )}
                        </div>
                    </CarouselItem>
                ))}
            </CarouselContent>
            {showNav ? (
                <>
                    <CarouselPrevious className="left-1 [@media(hover:none)]:hidden" />
                    <CarouselNext className="right-1 [@media(hover:none)]:hidden" />
                </>
            ) : null}
        </Carousel>
    );
}
