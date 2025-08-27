/** @type {import('next').NextConfig} */
const nextConfig = {
    // Exclude directories from file watching to prevent unnecessary recompilation
    watchOptions: {
        ignored: [
            '**/better-auth-ui-main/**',
            '**/node_modules/**',
            '**/.git/**',
            '**/*.txt',
            '**/debug-*.js'
        ]
    },
    // Speed up dev compilation with Turbopack optimizations
    experimental: {
        // Use Turbopack for faster builds (automatically enabled in dev)
        turbo: {
            rules: {
                // Let Turbopack handle optimizations automatically
            }
        },
        turbotrace: {
            logLevel: 'error'
        },
        // Optimize client bundles with tree shaking
        optimizePackageImports: [
            'lucide-react',
            '@radix-ui/react-icons',
            'date-fns',
            'react-hook-form'
        ]
    },
    // Let Next.js handle bundling optimally
    // Remove custom webpack config to use defaults
    images: {
        // Disable Next.js image optimization to serve directly from Cloudflare
        unoptimized: true,
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'lh3.googleusercontent.com',
                port: '',
                pathname: '/a/**',
            },
            {
                protocol: 'https', 
                hostname: '*.googleusercontent.com',
                port: '',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'avatars.githubusercontent.com',
                port: '',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'guestsnapper.com',
                port: '',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'www.guestsnapper.com',
                port: '',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'assets.guestsnapper.com',
                port: '',
                pathname: '/**',
            },
        ],
    },
    async headers() {
        return [
            {
                // Handle CORS for auth endpoints
                source: '/api/auth/:path*',
                headers: [
                    { key: 'Access-Control-Allow-Credentials', value: 'true' },
                    { key: 'Access-Control-Allow-Origin', value: 'https://www.guestsnapper.com' },
                    { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT,OPTIONS' },
                    { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization' },
                ]
            },
            {
                // Cache manifest file for 24 hours
                source: '/manifest.webmanifest',
                headers: [
                    { key: 'Cache-Control', value: 'public, max-age=86400, must-revalidate' },
                    { key: 'Content-Type', value: 'application/manifest+json' }
                ]
            },
            {
                // Cache favicon for 1 week to prevent lambda hits
                source: '/favicon.ico',
                headers: [
                    { key: 'Cache-Control', value: 'public, max-age=604800, must-revalidate' },
                    { key: 'Content-Type', value: 'image/x-icon' }
                ]
            },
            {
                // Cache static chunks for 1 year (they have hashes in filenames)
                source: '/_next/static/:path*',
                headers: [
                    { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }
                ]
            }
        ]
    },
    async redirects() {
        return [
            {
                // Redirect non-www to www
                source: '/(.*)',
                has: [
                    {
                        type: 'host',
                        value: 'guestsnapper.com'
                    }
                ],
                destination: 'https://www.guestsnapper.com/:path*',
                permanent: true
            }
        ]
    }
}

module.exports = nextConfig