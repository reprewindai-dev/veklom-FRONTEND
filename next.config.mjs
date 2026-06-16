/** @type {import('next').NextConfig} */
// Standalone Next.js deployment configuration

const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  images: { unoptimized: true },
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || "https://veklom.com",
    NEXT_PUBLIC_BASE_PATH: "",
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://veklom.com/api/:path*",
      },
    ];
  },
};
export default nextConfig;
