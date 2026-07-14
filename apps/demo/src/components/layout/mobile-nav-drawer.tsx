import { X, Sun, Moon, MonitorSmartphone, Settings as SettingsIcon } from "lucide-react";
import { useNavigate } from "react-router";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerClose } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { EDITORIAL_CATEGORIES, EDITORIAL_ROUTE_MAP, REGIONS } from "@/lib/navigation";
import { useTheme, type Theme } from "@/hooks/use-theme";
import { cn } from "@/lib/utils";

interface MobileNavDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const THEME_OPTIONS: { value: Theme; label: string; icon: typeof Sun }[] = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "auto", label: "Auto", icon: MonitorSmartphone },
];

export function MobileNavDrawer({ open, onOpenChange }: MobileNavDrawerProps) {
    const navigate = useNavigate();
    const { theme, setTheme } = useTheme();

    const handleCategory = (category: string) => {
        const route = EDITORIAL_ROUTE_MAP[category];
        if (route) {
            navigate(route, { viewTransition: true });
            onOpenChange(false);
        }
    };

    return (
        <Drawer direction="left" open={open} onOpenChange={onOpenChange}>
            <DrawerContent className="w-[88vw] max-w-sm">
                <DrawerHeader className="flex flex-row items-center justify-between border-b">
                    <DrawerTitle className="text-muted-foreground text-sm font-semibold tracking-widest uppercase">Sections</DrawerTitle>
                    <DrawerDescription className="sr-only">Navigate the publication's sections, regions, and account</DrawerDescription>
                    <DrawerClose asChild>
                        <button
                            type="button"
                            aria-label="Close menu"
                            className="text-muted-foreground hover:text-foreground -m-2 inline-flex size-10 items-center justify-center transition-[color,scale] duration-150 ease-[cubic-bezier(0.2,0,0,1)] active:scale-[0.96]"
                        >
                            <X className="size-5" />
                        </button>
                    </DrawerClose>
                </DrawerHeader>

                <nav aria-label="Editorial sections" className="flex-1 overflow-y-auto">
                    <ul className="py-2">
                        {EDITORIAL_CATEGORIES.map((category) => {
                            const route = EDITORIAL_ROUTE_MAP[category];
                            const isClickable = Boolean(route);
                            return (
                                <li key={category}>
                                    <button
                                        type="button"
                                        onClick={() => handleCategory(category)}
                                        disabled={!isClickable}
                                        className={cn(
                                            "flex min-h-11 w-full items-center justify-between px-5 py-3 text-left text-base transition-colors duration-150",
                                            isClickable ? "hover:bg-muted active:bg-muted/80" : "text-muted-foreground/60 cursor-default"
                                        )}
                                    >
                                        <span className="font-serif text-lg">{category}</span>
                                        {!isClickable && <span className="text-muted-foreground/60 text-[10px] tracking-widest uppercase">Soon</span>}
                                    </button>
                                </li>
                            );
                        })}
                    </ul>

                    <div className="border-t px-5 py-4">
                        <p className="text-muted-foreground mb-3 text-[11px] font-semibold tracking-widest uppercase">Edition</p>
                        <ul className="space-y-1">
                            {REGIONS.map((region) => (
                                <li key={region}>
                                    <button
                                        type="button"
                                        className="text-foreground hover:bg-muted active:bg-muted/80 flex min-h-11 w-full items-center justify-between rounded-md px-2 py-2 text-sm transition-colors duration-150"
                                    >
                                        <span>{region}</span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="border-t px-5 py-4">
                        <p className="text-muted-foreground mb-3 text-[11px] font-semibold tracking-widest uppercase">Appearance</p>
                        <div role="radiogroup" aria-label="Theme" className="bg-muted/40 grid grid-cols-3 gap-1 rounded-md border p-1">
                            {THEME_OPTIONS.map((opt) => {
                                const Icon = opt.icon;
                                const isActive = theme === opt.value;
                                return (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        role="radio"
                                        aria-checked={isActive}
                                        onClick={() => setTheme(opt.value)}
                                        className={cn(
                                            "flex min-h-10 items-center justify-center gap-1.5 rounded-sm px-2 py-1.5 text-xs font-medium transition-[background-color,color,scale] duration-150 ease-[cubic-bezier(0.2,0,0,1)] active:scale-[0.97]",
                                            isActive ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        <Icon className="size-3.5" aria-hidden />
                                        {opt.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </nav>

                <div className="border-t px-5 py-4">
                    <button
                        type="button"
                        onClick={() => {
                            navigate("/settings", { viewTransition: true });
                            onOpenChange(false);
                        }}
                        className="text-foreground hover:bg-muted active:bg-muted/80 flex min-h-11 w-full items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors duration-150"
                    >
                        <SettingsIcon className="size-4" aria-hidden />
                        <span>Settings</span>
                    </button>
                </div>

                <div className="flex items-center gap-2 border-t px-5 py-4">
                    <Button variant="outline" size="sm" className="flex-1">
                        Sign In
                    </Button>
                    <Button size="sm" className="flex-1">
                        Subscribe
                    </Button>
                </div>
            </DrawerContent>
        </Drawer>
    );
}
