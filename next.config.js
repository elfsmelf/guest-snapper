/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'lh3.googleusercontent.com',
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