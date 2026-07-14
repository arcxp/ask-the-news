import * as React from "react";

const MOBILE_BREAKPOINT = 768;

// Read synchronously on mount so the first render branches correctly on mobile;
// otherwise components like DiveDeeper flash the desktop branch for one frame.
function readIsMobile(): boolean {
    if (typeof window === "undefined") return false;
    return window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`).matches;
}

export function useIsMobile() {
    const [isMobile, setIsMobile] = React.useState<boolean>(readIsMobile);

    React.useEffect(() => {
        const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
        const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
        mql.addEventListener("change", onChange);
        setIsMobile(mql.matches);
        return () => mql.removeEventListener("change", onChange);
    }, []);

    return isMobile;
}
