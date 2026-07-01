/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  transpilePackages: ['recharts'],
 images: {
  formats: ['image/avif', 'image/webp'],
  deviceSizes: [640, 750, 828, 1080, 1200, 1920],
  imageSizes: [16, 32, 48, 64, 96, 128, 256, 384, 480],
  minimumCacheTTL: 60 * 60 * 24 * 30,
  domains: ['images.pexels.com', 'img.magnific.com'],
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'images.pexels.com',
      pathname: '/**',
    },
    {
      protocol: 'https',
      hostname: 'img.magnific.com',
      pathname: '/**',
    },
  ],
},
  async headers() {
    // In dev, never cache webpack chunks — Chrome keeps immutable chunks and
    // causes "Cannot read properties of undefined (reading 'call')" after rebuilds.
    if (process.env.NODE_ENV !== 'production') {
      return [
        {
          source: '/_next/static/:path*',
          headers: [{ key: 'Cache-Control', value: 'no-store, must-revalidate' }],
        },
        {
          source: '/_next/image',
          headers: [{ key: 'Cache-Control', value: 'no-store, must-revalidate' }],
        },
      ];
    }

    return [
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/image',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=604800',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
