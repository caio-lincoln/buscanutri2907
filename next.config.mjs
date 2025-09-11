/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['pretty-words-post.loca.lt'],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: false, // Habilitar otimização de imagens no Vercel
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: 'randomuser.me',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.com',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'platform-lookaside.fbsbx.com',
      },
      {
        protocol: 'https',
        hostname: 'graph.facebook.com',
      },
    ],
  },
  serverExternalPackages: ['@supabase/supabase-js'],
  generateBuildId: async () => {
    return 'buscanutri-build-' + Date.now()
  },
  // Configuração para evitar problemas de hidratação no SSR
  reactStrictMode: true,
  // Configuração para otimização de build
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Headers otimizados para produção
  async headers() {
    return [
      {
        source: '/',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, stale-while-revalidate=86400',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate',
          },
        ],
      },
      {
        source: '/dashboard/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
  experimental: {
    missingSuspenseWithCSRBailout: false,
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
    // Otimizações para produção
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  // Configuração para evitar problemas de build no Vercel
  output: 'standalone',
}

export default nextConfig
