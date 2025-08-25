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
    // Speed up dev compilation and optimize bundles
    experimental: {
        turbotrace: {
            logLevel: 'error'
        },
        // Optimize client bundles
        optimizePackageImports: [
            'lucide-react',
            '@radix-ui/react-icons',
            'date-fns',
            'react-hook-form'
        ]
    },
    // Bundle optimization
    webpack: (config, { isServer }) => {
        if (!isServer) {
            // Optimize chunking strategy
            config.optimization = {
                ...config.optimization,
                splitChunks: {
                    chunks: 'all',
                    cacheGroups: {
                        default: false,
                        vendors: false,
                        // Vendor chunk for large libraries
                        vendor: {
                            name: 'vendor',
                            chunks: 'all',
                            test: /node_modules/,
                            priority: 20,
                            minSize: 100000, // Only create vendor chunk for libs > 100KB
                            maxSize: 250000, // Split vendor chunks larger than 250KB
                        },
                        // Common components chunk
                        commons: {
                            name: 'commons',
                            minChunks: 2,
                            chunks: 'all',
                            priority: 10,
                            reuseExistingChunk: true,
                            enforce: true
                        },
                        // UI components chunk
                        ui: {
                            name: 'ui',
                            test: /[\\/]components[\\/]ui[\\/]/,
                            chunks: 'all',
                            priority: 30,
                            reuseExistingChunk: true,
                            enforce: true
                        },
                        // Gallery specific chunk
                        gallery: {
                            name: 'gallery',
                            test: /[\\/]components[\\/]gallery[\\/]/,
                            chunks: 'all',
                            priority: 25,
                            reuseExistingChunk: true,
                            enforce: true
                        }
                    }
                },
                // Use contenthash for better caching
                moduleIds: 'deterministic',
                runtimeChunk: 'single'
            }
        }
        return config
    },
    // Reduce initial JS payload
    productionBrowserSourceMaps: false,
    // Compress output
    compress: true,
    // Enable SWC minification
    swcMinify: true,
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