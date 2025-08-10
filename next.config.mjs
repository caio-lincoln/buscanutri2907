/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  serverExternalPackages: ['@supabase/supabase-js'],

  // Controle de versão de build para quebrar cache
  generateBuildId: async () => {
    const buildId =
      process.env.BUILD_ID ||
      `build-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    console.log(`🚀 Build ID: ${buildId}`)
    return buildId
  },

  // Headers para controle de cache
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Build-ID',
            value: process.env.BUILD_ID || 'development',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'X-Build-ID',
            value: process.env.BUILD_ID || 'development',
          },
        ],
      },
      {
        source: '/dashboard/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'X-Build-ID',
            value: process.env.BUILD_ID || 'development',
          },
        ],
      },
    ]
  },

  // Revalidação de cache por tag
  experimental: {
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
  },
}

export default nextConfig
