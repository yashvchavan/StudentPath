/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  // typescript: {
  //   ignoreBuildErrors: true,
  // },
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
    unoptimized: true,
  },
  // Optimize for production
  compress: true,
  productionBrowserSourceMaps: false,
  // Enable server startup instrumentation (runs initializeDatabase on boot)
  // experimental: {
  //   instrumentationHook: true,
  // },
}

export default nextConfig
