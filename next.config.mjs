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
  },
  experimental: {
    serverComponentsExternalPackages: ['@google/genai', 'ws'],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('@google/genai', 'ws')
    }
    return config
  },
}

export default nextConfig
