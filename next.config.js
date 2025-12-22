/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://backend-alb-930091010.us-east-1.elb.amazonaws.com/:path*', // Proxy to Backend
      },
    ];
  },
}

module.exports = nextConfig