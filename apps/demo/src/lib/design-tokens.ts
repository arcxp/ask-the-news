/**
 * Cross-component design tokens. Keep this file small and free of imports so
 * it can be referenced from anywhere (components, hooks, tests).
 *
 * Visual tokens (colors, radii, type ramp) live in Tailwind / index.css; this
 * file is for values that need to be referenced from TypeScript.
 */

/**
 * Z-index ladder for the mobile-first stacked UI. Numbers, not strings, so they
 * compose with Tailwind's inline `style` escape hatch.
 *
 *  tabs        → bottom tab bar
 *  fab         → floating action button (article "Ask")
 *  stickySearch→ sticky bottom Ask bar (docks above tab bar)
 *  sheet       → modal sheet / drawer
 *  toast       → top-level transient notifications
 */
export const Z = {
    tabs: 40,
    fab: 45,
    stickySearch: 50,
    sheet: 60,
    toast: 70,
} as const;

/**
 * Motion durations + easing. Cubic-bezier matches the curve already used
 * across the app's `active:scale` and reveal animations.
 */
export const MOTION = {
    fast: "120ms cubic-bezier(0.2,0,0,1)",
    base: "200ms cubic-bezier(0.2,0,0,1)",
    slow: "320ms cubic-bezier(0.2,0,0,1)",
    /** Max combined stagger budget for list entrance animations on mobile. */
    staggerMaxMs: 200,
    /** Per-item delay used in staggers. */
    staggerStepMs: 40,
} as const;

/** Minimum tap area, in CSS pixels. Apple HIG floor. */
export const TAP_MIN_PX = 44;
