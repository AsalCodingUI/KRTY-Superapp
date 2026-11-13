/** @type {import('next').NextConfig} */

const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "lh3.googleusercontent.com",
            },
        ],
    },

    // Redirects
    redirects: async () => {
        return [
            {
                source: "/",
                destination: "/dashboard",
                permanent: true,
            },
        ];
    },

    // Security Headers
    headers: async () => {
        return [
            // The notification sounds and the emoji list: fetched once, then
            // kept a month (public/ files are max-age=0 otherwise). A changed
            // file gets a new name.
            {
                source: "/:dir(sounds|emoji)/:file*",
                headers: [
                    {
                        key: "Cache-Control",
                        value: "public, max-age=2592000, stale-while-revalidate=86400",
                    },
                ],
            },
            {
                source: "/:path*",
                headers: [
                    {
                        key: "X-DNS-Prefetch-Control",
                        value: "on",
                    },
                    {
                        key: "Strict-Transport-Security",
                        value: "max-age=63072000; includeSubDomains; preload",
                    },
                    {
                        key: "X-Frame-Options",
                        value: "SAMEORIGIN",
                    },
                    {
                        key: "X-Content-Type-Options",
                        value: "nosniff",
                    },
                    {
                        key: "X-XSS-Protection",
                        value: "1; mode=block",
                    },
                    {
                        key: "Referrer-Policy",
                        value: "strict-origin-when-cross-origin",
                    },
                    {
                        key: "Permissions-Policy",
                        value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
                    },
                    {
                        key: "Content-Security-Policy",
                        value: [
                            "default-src 'self'",
                            "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
                            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
                            "font-src 'self' https://fonts.gstatic.com data:",
                            "img-src 'self' data: blob: https:",
                            // Library previews: videos and PDFs straight from project storage.
                            "media-src 'self' blob: https://supabase.kretyastudio.com https://*.supabase.co",
                            // Plus embeds in reports and notes (shared/lib/embeds).
                            "frame-src 'self' https://supabase.kretyastudio.com https://*.supabase.co https://www.figma.com https://embed.figma.com https://drive.google.com https://docs.google.com https://www.youtube-nocookie.com https://player.vimeo.com https://www.loom.com",
                            "connect-src 'self' blob: https://supabase.kretyastudio.com wss://supabase.kretyastudio.com https://*.supabase.co wss://*.supabase.co https://*.zeabur.app wss://*.zeabur.app https://n8n-private.kretyastudio.com",
                            "frame-ancestors 'self'",
                            "base-uri 'self'",
                            "form-action 'self'",
                        ].join("; "),
                    },
                ],
            },
        ];
    },

    // Compiler optimizations
    compiler: {
        // Errors and warnings stay, so failures (a mail not sent) show in
        // the server's logs.
        removeConsole:
            process.env.NODE_ENV === "production"
                ? { exclude: ["error", "warn"] }
                : false,
    },

    // Output optimization
    output: "standalone",

    // Performance optimizations
    poweredByHeader: false,
    compress: true,

    // ESLint configuration
    eslint: {
        ignoreDuringBuilds: false, // Keep linting enabled
    },

    // Experimental features for better performance
    experimental: {
        // Only packages actually imported from src (barrel imports rewritten
        // to per-module imports so unused exports never reach the bundle).
        // Not @tanstack/react-query: split per module, its QueryClient
        // context could load twice after a dev reload ("No QueryClient
        // set" from the (main) layout's HydrationBoundary); it's small and
        // side-effect free anyway.
        optimizePackageImports: [
            'motion',
            'radix-ui',
            '@base-ui/react',
            '@dnd-kit/core',
            '@dnd-kit/sortable',
            '@tanstack/react-table',
            'lucide-react',
            'recharts',
            'date-fns',
        ],
        staleTimes: {
            dynamic: 30,
            static: 180,
        },
    },
};

export default nextConfig;
