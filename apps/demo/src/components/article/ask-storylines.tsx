import { useEffect, useRef, useState, type ReactNode } from "react";

export interface AskStorylinesProps {
    storylines: { date: string; description: string }[];
    sourceLabel?: string;
    icon?: ReactNode;
    className?: string;
}

export function AskStorylines({ storylines, sourceLabel = "Ask Storylines", icon, className }: AskStorylinesProps) {
    const listRef = useRef<HTMLUListElement>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const node = listRef.current;
        if (!node || visible) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setVisible(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.15 }
        );
        observer.observe(node);
        return () => observer.disconnect();
    }, [visible]);

    return (
        <div className={className}>
            <div className="text-muted-foreground mb-2 flex items-center gap-1.5 text-[10px] font-semibold tracking-widest uppercase">
                {icon}
                {sourceLabel}
            </div>
            <ul ref={listRef} className="relative space-y-4 pl-6 text-pretty text-xs">
                {storylines.map((storyline, index) => {
                    const isLast = index === storylines.length - 1;
                    return (
                        <li key={index} className="relative">
                            <span aria-hidden="true" className="absolute left-[-19px] top-0 flex h-5 w-3 items-center justify-center">
                                <span className="bg-accent ring-background relative z-10 size-[11px] rounded-full ring-2" />
                            </span>
                            {!isLast && (
                                <span
                                    aria-hidden="true"
                                    className="bg-muted-foreground/30 pointer-events-none absolute left-[-14px] top-[10px] -bottom-[14px] w-px origin-top motion-safe:transition-transform motion-safe:duration-500 motion-safe:ease-out motion-reduce:transition-none"
                                    style={{
                                        transform: visible ? "scaleY(1)" : "scaleY(0)",
                                        transitionDelay: `${index * 500}ms`,
                                    }}
                                />
                            )}
                            <span className="bg-muted text-muted-foreground mr-1 inline-block rounded-full px-1.5 text-xs font-semibold">{storyline.date}</span>
                            <span className="text-muted-foreground">{storyline.description}</span>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
