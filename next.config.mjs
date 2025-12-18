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

    // Compiler optimizations
    compiler: {
        removeConsole: process.env.NODE_ENV === "production",
    },

    // Output optimization
    output: "standalone",

    // Performance optimizations
    poweredByHeader: false,
    compress: true,

    // Experimental features for better performance
    experimental: {
        optimizePackageImports: [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-popover',
            '@radix-ui/react-select',
            '@remixicon/react',
            'recharts',
        ],
    },
};

export default nextConfig;
