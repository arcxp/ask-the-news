import type { DetailedHTMLProps, HTMLAttributes } from "react";

declare module "react" {
    namespace JSX {
        interface IntrinsicElements {
            "koi-video-player": DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
                config?: string;
                "media-id"?: string;
                stream?: string;
                hide?: string;
            };
        }
    }
}

export {};
