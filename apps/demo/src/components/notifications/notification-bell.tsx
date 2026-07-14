import { useMemo, useState } from "react";
import { Bell } from "lucide-react";
import { useNavigate } from "react-router";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { mockNotifications, type Notification } from "@/data/mock-notifications";
import { Button } from "@/components/ui/button";

type Size = "sm" | "md";

interface NotificationBellProps {
    size?: Size;
}

export function NotificationBell({ size = "sm" }: NotificationBellProps) {
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
    const navigate = useNavigate();

    const unreadCount = useMemo(() => notifications.filter((n) => n.unread).length, [notifications]);
    const iconSize = size === "md" ? "size-5" : "size-4";
    const buttonSize = size === "md" ? "size-11" : "size-10";

    const markRead = (id: string) => {
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, unread: false } : n)));
    };

    const markAllRead = () => {
        setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
    };

    const handleQuestionClick = (notificationId: string, question: string) => {
        markRead(notificationId);
        setOpen(false);
        navigate(`/ask-the-news?q=${encodeURIComponent(question)}`);
    };

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <button
                    type="button"
                    aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
                    className={cn(
                        "text-muted-foreground hover:text-foreground relative -m-2 inline-flex shrink-0 items-center justify-center transition-[color,scale] duration-150 ease-[cubic-bezier(0.2,0,0,1)] active:scale-[0.96]",
                        buttonSize
                    )}
                >
                    <Bell className={iconSize} />
                    {unreadCount > 0 && (
                        <span
                            aria-hidden
                            className={cn(
                                "ring-background absolute size-2 rounded-full bg-red-500 ring-2",
                                size === "md" ? "top-2.5 right-2.5" : "top-2 right-2"
                            )}
                        />
                    )}
                </button>
            </SheetTrigger>
            <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
                <SheetHeader className="border-b px-4 py-4">
                    <div className="flex items-center justify-between gap-4 pr-8">
                        <SheetTitle className="text-base">
                            Notifications
                            {unreadCount > 0 && <span className="text-muted-foreground ml-2 text-sm font-normal tabular-nums">{unreadCount} new</span>}
                        </SheetTitle>
                        {unreadCount > 0 && (
                            <Button
                                variant="outline"
                                size="xs"
                                onClick={markAllRead}
                                className="text-muted-foreground hover:text-foreground text-xs font-medium transition-colors"
                            >
                                Mark all read
                            </Button>
                        )}
                    </div>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto">
                    {notifications.length === 0 ? (
                        <p className="text-muted-foreground p-6 text-sm">No notifications yet.</p>
                    ) : (
                        <ul className="divide-y">
                            {notifications.map((n) => (
                                <NotificationCard key={n.id} notification={n} onQuestionClick={handleQuestionClick} />
                            ))}
                        </ul>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}

interface NotificationCardProps {
    notification: Notification;
    onQuestionClick: (notificationId: string, question: string) => void;
}

function NotificationCard({ notification, onQuestionClick }: NotificationCardProps) {
    const { id, title, snippet, timeLabel, category, questions, unread } = notification;
    return (
        <li className="relative px-4 py-4">
            <div className="mb-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    {unread && <span aria-hidden className="size-1.5 rounded-full bg-red-500" />}
                    <Badge variant="secondary" className="text-[10px] tracking-wider uppercase">
                        {category}
                    </Badge>
                </div>
                <span className="text-muted-foreground text-xs tabular-nums">{timeLabel}</span>
            </div>
            <h3 className="text-foreground text-sm leading-snug font-semibold">{title}</h3>
            <p className="text-muted-foreground mt-1 text-sm leading-snug">{snippet}</p>
            <div className="mt-3 flex flex-col gap-1.5">
                {questions.map((q, index) => (
                    <button
                        key={`${id}-${index}`}
                        type="button"
                        onClick={() => onQuestionClick(id, q)}
                        className="border-border bg-background hover:border-foreground/40 hover:bg-muted/60 text-foreground rounded-md border px-3 py-2 text-left text-xs leading-snug transition-colors active:scale-[0.99]"
                    >
                        {q}
                    </button>
                ))}
            </div>
        </li>
    );
}
