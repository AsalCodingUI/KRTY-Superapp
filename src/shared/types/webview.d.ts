// Type definitions for Electron <webview> tag
// This allows TypeScript to recognize the non-standard element

declare global {
    namespace JSX {
        interface IntrinsicElements {
            webview: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
                src?: string;
                title?: string;
                allowpopups?: string;
                webpreferences?: string;
                partition?: string;
                preload?: string;
                useragent?: string;
            }, HTMLElement>;
        }
    }
}

export { };

