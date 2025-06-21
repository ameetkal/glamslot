import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    // Only apply redirects in production
    if (process.env.NODE_ENV === 'production') {
      return [
        // Redirect old booking URLs to new domain
        {
          source: '/booking/:slug*',
          destination: 'https://booking.glammatic.com/:slug*',
          permanent: true,
        },
      ]
    }
    return []
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ]
  },
};

export default nextConfig;
