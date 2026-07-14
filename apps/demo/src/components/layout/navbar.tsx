import { useEffect, useRef, useState } from "react";
import { Search, Menu, Sun, Moon, MonitorSmartphone, X, Settings as SettingsIcon } from "lucide-react";
import { useNavigate, useLocation } from "react-router";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { isHideOnScrollRoute, useHideOnScroll } from "@/hooks/use-hide-on-scroll";
import { EDITORIAL_CATEGORIES, EDITORIAL_ROUTE_MAP, PATH_TO_EDITORIAL_CATEGORY, REGIONS } from "@/lib/navigation";
import logoDark from "@/assets/logo-dark.svg";
import logoLight from "@/assets/logo-light.svg";
import { useTheme, type Theme } from "@/hooks/use-theme";
import { SignInDialog } from "@/components/demo/SignInDialog";
import { SubscribeDialog } from "@/components/demo/SubscribeDialog";
import { NotificationBell } from "@/components/notifications/notification-bell";

const THEME_OPTIONS: { value: Theme; label: string; icon: typeof Sun }[] = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "auto", label: "Auto", icon: MonitorSmartphone },
];

function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    return (
        <div role="radiogroup" aria-label="Theme" className="bg-muted/40 inline-flex items-center gap-0.5 rounded-md border p-0.5">
            {THEME_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const isActive = theme === opt.value;
                return (
                    <button
                        key={opt.value}
                        type="button"
                        role="radio"
                        aria-checked={isActive}
                        aria-label={opt.label}
                        onClick={() => setTheme(opt.value)}
                        className={cn(
                            "flex size-7 items-center justify-center rounded-sm transition-[background-color,color,scale] duration-150 ease-[cubic-bezier(0.2,0,0,1)] active:scale-[0.96]",
                            isActive ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <Icon className="size-3.5" aria-hidden />
                    </button>
                );
            })}
        </div>
    );
}

function NavbarUtilityBar() {
    const navigate = useNavigate();
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [query, setQuery] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (!isSearchOpen) return;
        const t = setTimeout(() => inputRef.current?.focus(), 320);
        return () => clearTimeout(t);
    }, [isSearchOpen]);

    const close = () => {
        setIsSearchOpen(false);
        setQuery("");
        triggerRef.current?.focus();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const q = query.trim();
        if (!q) return;
        navigate(`/search?q=${encodeURIComponent(q)}`, { viewTransition: true });
        setIsSearchOpen(false);
        setQuery("");
    };

    return (
        <div className="relative flex items-center gap-2 px-4 py-2">
            <div className="z-10 flex min-w-0 items-center gap-2">
                <button
                    ref={triggerRef}
                    type="button"
                    aria-label="Search"
                    aria-expanded={isSearchOpen}
                    aria-controls="header-search-input"
                    onMouseDown={(e) => {
                        if (isSearchOpen) e.preventDefault();
                    }}
                    onClick={() => {
                        if (isSearchOpen) {
                            inputRef.current?.focus();
                        } else {
                            setIsSearchOpen(true);
                        }
                    }}
                    className="text-muted-foreground hover:text-foreground -m-2 inline-flex size-10 shrink-0 items-center justify-center transition-[color,scale] duration-150 ease-[cubic-bezier(0.2,0,0,1)] active:scale-[0.96]"
                >
                    <Search className="size-4" />
                </button>

                <form
                    role="search"
                    onSubmit={handleSubmit}
                    className={cn(
                        "flex items-center gap-1 overflow-hidden transition-[max-width,opacity] duration-300 ease-[cubic-bezier(0.2,0,0,1)]",
                        isSearchOpen ? "max-w-[min(28rem,calc(100vw-7rem))] opacity-100" : "pointer-events-none max-w-0 opacity-0"
                    )}
                >
                    <input
                        ref={inputRef}
                        id="header-search-input"
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Escape") close();
                        }}
                        placeholder="Search Arc Intelligencer"
                        aria-label="Search Arc Intelligencer"
                        autoComplete="off"
                        tabIndex={isSearchOpen ? 0 : -1}
                        className="border-border focus:border-foreground placeholder:text-muted-foreground w-md min-w-0 flex-1 border-b bg-transparent py-1.5 text-base transition-colors duration-150 outline-none md:text-sm"
                    />
                    <button
                        type="button"
                        aria-label="Close search"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={close}
                        tabIndex={isSearchOpen ? 0 : -1}
                        className="text-muted-foreground hover:text-foreground hover:bg-muted inline-flex size-7 shrink-0 items-center justify-center rounded-full transition-[color,background-color,scale] duration-150 ease-[cubic-bezier(0.2,0,0,1)] active:scale-[0.96]"
                    >
                        <X className="size-4" />
                    </button>
                    <button type="submit" className="sr-only" tabIndex={isSearchOpen ? 0 : -1}>
                        Search
                    </button>
                </form>
            </div>

            <nav
                aria-hidden={isSearchOpen}
                className={cn(
                    "text-muted-foreground pointer-events-none absolute left-1/2 flex -translate-x-1/2 items-center gap-1 text-xs font-medium tracking-wider transition-opacity duration-200 ease-[cubic-bezier(0.2,0,0,1)]",
                    isSearchOpen ? "opacity-0" : "pointer-events-auto opacity-100"
                )}
            >
                {REGIONS.map((region, i) => (
                    <span key={region} className="flex items-center gap-1">
                        <a href="#" className="hover:text-foreground transition-colors">
                            {region}
                        </a>
                        {i < REGIONS.length - 1 && <span className="text-border">|</span>}
                    </span>
                ))}
            </nav>
            <div
                className={cn(
                    "ml-auto flex items-center gap-2 transition-opacity duration-150",
                    isSearchOpen && "max-sm:pointer-events-none max-sm:opacity-0"
                )}
            >
                <ThemeToggle />
                <button
                    type="button"
                    aria-label="Settings"
                    onClick={() => navigate("/settings")}
                    className="text-muted-foreground hover:text-foreground -m-2 inline-flex size-10 shrink-0 items-center justify-center transition-[color,scale] duration-150 ease-[cubic-bezier(0.2,0,0,1)] active:scale-[0.96]"
                >
                    <SettingsIcon className="size-4" />
                </button>
                <NotificationBell size="sm" />
            </div>
        </div>
    );
}

function NavbarMasthead() {
    const { effectiveTheme } = useTheme();
    const logo = effectiveTheme === "dark" ? logoLight : logoDark;
    const date = new Date().toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    return (
        <div className="flex items-center justify-between px-4 py-4">
            <span className="text-muted-foreground text-xs tabular-nums">{date}</span>
            <a href="/" title="Home" aria-label="Home">
                <img src={logo} alt="The Arc Intelligencer" className="h-8" />
            </a>
            <div className="flex items-center gap-2">
                <SignInDialog title="Sign in to your account" description="Enter your email below to sign in to your Arc Intelligencer account." />
                <SubscribeDialog title="Subscribe to the Arc Intelligencer" description="Pick a plan to get access to all of our content." />
            </div>
        </div>
    );
}

function NavbarCategoryTabs() {
    const navigate = useNavigate();
    const location = useLocation();
    const activeCategory = PATH_TO_EDITORIAL_CATEGORY[location.pathname] ?? "Top Stories";

    const handleCategoryChange = (value: string) => {
        const route = EDITORIAL_ROUTE_MAP[value];
        if (route) {
            navigate(route);
        }
    };

    return (
        <Tabs value={activeCategory} onValueChange={handleCategoryChange}>
            <TabsList variant="line" className="mx-auto w-fit justify-center gap-4 px-4">
                {EDITORIAL_CATEGORIES.map((category) => (
                    <TabsTrigger key={category} value={category} className="data-[state=active]:font-bold data-[state=active]:after:bg-accent">
                        {category}
                    </TabsTrigger>
                ))}
            </TabsList>
        </Tabs>
    );
}

/** Single-row mobile masthead: hamburger + logo + bell. */
function NavbarMobileBar({ onMenu }: { onMenu: () => void }) {
    const { effectiveTheme } = useTheme();
    const logo = effectiveTheme === "dark" ? logoLight : logoDark;
    return (
        <div className="flex h-14 items-center justify-between px-3 pt-[env(safe-area-inset-top)]">
            <button
                type="button"
                aria-label="Open menu"
                onClick={onMenu}
                className="text-foreground -m-2 inline-flex size-11 items-center justify-center transition-[color,scale] duration-150 ease-[cubic-bezier(0.2,0,0,1)] active:scale-[0.96]"
            >
                <Menu className="size-5" />
            </button>
            <a href="/" title="Home" aria-label="Home" className="-mx-2">
                <img src={logo} alt="The Arc Intelligencer" className="h-7" />
            </a>
            <NotificationBell size="md" />
        </div>
    );
}

interface NavbarProps {
    className?: string;
    drawerOpen?: boolean;
    onDrawerOpenChange?: (open: boolean) => void;
}

export function Navbar({ className, onDrawerOpenChange }: NavbarProps) {
    const location = useLocation();
    const hiddenOnScroll = useHideOnScroll(isHideOnScrollRoute(location.pathname));
    const hideCategoryTabs = location.pathname === "/search";

    return (
        <nav
            className={cn(
                "bg-background sticky top-0 z-40 w-full motion-reduce:transition-none max-md:transition-transform max-md:duration-200 max-md:ease-[cubic-bezier(0.2,0,0,1)]",
                hiddenOnScroll && "max-md:-translate-y-full",
                className
            )}
        >
            {/* Mobile: single-row chrome. */}
            <div className="md:hidden">
                <NavbarMobileBar onMenu={() => onDrawerOpenChange?.(true)} />
            </div>

            {/* Desktop: utility bar + masthead + (optionally) category tabs. */}
            <div className="hidden shadow-sm md:block">
                <NavbarUtilityBar />
                <NavbarMasthead />
                {!hideCategoryTabs && <NavbarCategoryTabs />}
            </div>

            <div className="bg-border h-px" />
        </nav>
    );
}
