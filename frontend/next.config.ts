import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'export',
  distDir: '../frontend-dist',
  images: {
    unoptimized: true
  },
  trailingSlash: true
}

export default nextConfig
