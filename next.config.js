/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://54.166.139.53:8000/:path*', // Proxy to Backend
      },
    ];
  },
}

module.exports = nextConfig