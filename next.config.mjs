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
    serverComponentsExternalPackages: ['tesseract.js'],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('tesseract.js')
    }
    return config
  },
}

export default nextConfig
