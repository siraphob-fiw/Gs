/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: '../../',
  productionBrowserSourceMaps: false,
  transpilePackages: [
    '@strengthos/shared-external',
    '@strengthos/shared-i18n',
    '@strengthos/shared-logging',
    '@strengthos/shared-types',
    '@strengthos/shared-security',
    '@strengthos/shared-utils',
    '@strengthos/shared-validation',
  ],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
      };
    }
    return config;
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  },
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: 'localhost',
      },
    ],
  },
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;