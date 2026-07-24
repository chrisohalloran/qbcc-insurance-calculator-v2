const { loadTendrankHomeMetadata } = require("./scripts/tendrank-home-metadata.cjs")

const tendrankHomeMetadata = loadTendrankHomeMetadata(__dirname)

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    TENDRANK_HOME_METADATA_JSON: JSON.stringify(tendrankHomeMetadata),
  },
  experimental: {
    // Disable the CSS optimization that requires critters
    // optimizeCss: true,
  },
  // Optimize images
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60,
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig
