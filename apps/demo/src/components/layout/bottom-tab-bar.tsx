import { useNavigate, useLocation } from "react-router";
import { cn } from "@/lib/utils";
import { PRODUCT_TABS, activeTabForPath } from "@/lib/navigation";
import { Z } from "@/lib/design-tokens";
import { isHideOnScrollRoute, useHideOnScroll } from "@/hooks/use-hide-on-scroll";

interface BottomTabBarProps {
    /** Called when the "More" tab is tapped (it doesn't route — opens a drawer). */
    onMore?: () => void;
}

/**
 * Mobile-only persistent bottom tab bar. Hidden at `md+` (desktop uses the
 * masthead category strip). Renders at z-index `Z.tabs`; the sticky Ask
 * search bar docks above it using the `--tab-bar` CSS var set in index.css.
 */
export function BottomTabBar({ onMore }: BottomTabBarProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const activeId = activeTabForPath(location.pathname);
    const hiddenOnScroll = useHideOnScroll(isHideOnScrollRoute(location.pathname));

    return (
        <nav
            aria-label="Sections"
            className={cn(
                "bg-background/95 supports-backdrop-filter:bg-background/80 fixed inset-x-0 bottom-0 backdrop-blur md:hidden",
                "shadow-[0_-1px_0_rgba(0,0,0,0.04),0_-12px_24px_-16px_rgba(0,0,0,0.08)] dark:border-t dark:shadow-none",
                "transition-transform duration-200 ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:transition-none",
                hiddenOnScroll && "translate-y-full"
            )}
            style={{ zIndex: Z.tabs }}
        >
            <ul className="mx-auto flex h-14 max-w-3xl items-stretch justify-around px-1 pb-[env(safe-area-inset-bottom)]">
                {PRODUCT_TABS.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = tab.id === activeId;
                    const handleClick = () => {
                        if (tab.path) {
                            navigate(tab.path, { viewTransition: true });
                        } else if (tab.id === "more") {
                            onMore?.();
                        }
                    };
                    return (
                        <li key={tab.id} className="flex-1">
                            <button
                                type="button"
                                onClick={handleClick}
                                aria-label={tab.fullLabel}
                                aria-current={isActive ? "page" : undefined}
                                className={cn(
                                    "group flex h-full min-h-11 w-full flex-col items-center justify-center gap-0.5 rounded-md text-[10px] font-medium tracking-wide transition-colors duration-150",
                                    "transition-[color,scale] ease-[cubic-bezier(0.2,0,0,1)] active:scale-[0.96]",
                                    isActive ? "text-accent" : "text-muted-foreground"
                                )}
                            >
                                <Icon className={cn("size-5", isActive ? "text-accent" : "text-muted-foreground group-hover:text-foreground")} aria-hidden />
                                <span
                                    className={cn(
                                        "leading-none transition-[opacity,transform] duration-200 ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:transition-none",
                                        isActive ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1"
                                    )}
                                >
                                    {tab.label}
                                </span>
                            </button>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}
