/** @type {import('next').NextConfig} */

const nextConfig = {
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
                            "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.zeabur.app wss://*.zeabur.app https://n8n-private.kretyastudio.com",
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
        removeConsole: process.env.NODE_ENV === "production",
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
        optimizePackageImports: [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-popover',
            '@radix-ui/react-select',
            'lucide-react',
            'recharts',
        ],
    },
};

export default nextConfig;
