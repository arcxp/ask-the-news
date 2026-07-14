import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useSettings, type SettingKey } from "@arcxp/ask-the-news-components";

interface SettingRowDef {
    key: SettingKey;
    label: string;
    description: string;
}

const SETTING_ROWS: SettingRowDef[] = [
    {
        key: "showAnswerHighlights",
        label: "Show Article Answer Highlights",
        description: "Underlined highlights inside paragraphs and the boxed insight cards between paragraphs.",
    },
    {
        key: "showMostAsked",
        label: "Show Most Asked",
        description: "Inline “Most Asked” questions list and the floating widget on article pages.",
    },
    {
        key: "showDiveDeeper",
        label: "Show Dive Deeper",
        description: "The inline “Dive deeper” expandable block within articles.",
    },
    {
        key: "showStorylines",
        label: "Show Storylines",
        description: "The “Storylines” timeline shown before the article's tail paragraphs.",
    },
    {
        key: "showAnswerLeadPhoto",
        label: "Show Lead Photo on Answers",
        description: "The hero / placeholder image displayed above streamed answer text.",
    },
    {
        key: "showKnowMoreNoMore",
        label: "Show Know More, No More",
        description: "The “Know More, No More” carousel shown after the article's tail paragraphs.",
    },
    {
        key: "showAdSlot",
        label: "Show Ad Slot",
        description: "Show the ad slot at the end of the article.",
    },
];

export function SettingsPage() {
    const { settings, setSetting, resetSettings } = useSettings();

    return (
        <main className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 mx-auto max-w-3xl px-4 py-8 motion-safe:duration-500 lg:py-12">
            <header className="mb-8">
                <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">Preferences</p>
                <h1 className="mt-2 font-serif text-3xl leading-tight font-bold text-balance md:text-4xl">Settings</h1>
                <p className="text-muted-foreground mt-3 font-sans text-sm">
                    Toggle which experimental components appear across the app. Preferences are saved locally on this device.
                </p>
            </header>

            <section aria-labelledby="display-heading" className="border-border border-t">
                <h2 id="display-heading" className="sr-only">
                    Display
                </h2>
                <ul>
                    {SETTING_ROWS.map(({ key, label, description }) => (
                        <li key={key} className="border-border border-b">
                            <label
                                htmlFor={`setting-${key}`}
                                className="hover:bg-muted/40 flex cursor-pointer items-start justify-between gap-6 px-2 py-4 transition-colors"
                            >
                                <div className="min-w-0 flex-1">
                                    <div className="text-foreground font-sans text-sm font-semibold">{label}</div>
                                    <p className="text-muted-foreground mt-1 font-sans text-xs leading-relaxed text-pretty">{description}</p>
                                </div>
                                <Switch
                                    id={`setting-${key}`}
                                    checked={settings[key]}
                                    onCheckedChange={(checked) => setSetting(key, checked)}
                                    aria-label={label}
                                    className="mt-1 shrink-0"
                                />
                            </label>
                        </li>
                    ))}
                </ul>
            </section>

            <div className="mt-8 flex justify-end">
                <Button variant="outline" size="sm" onClick={resetSettings}>
                    Reset to defaults
                </Button>
            </div>
        </main>
    );
}
