/** @type {import('next').NextConfig} */
// Static export so the control plane can be mounted on the backend at
// https://veklom.com/control-plane-next/ (same-origin => no CORS).
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "/control-plane-next";

const nextConfig = {
  reactStrictMode: true,
  output: "export",
  basePath: BASE_PATH,
  trailingSlash: true,
  images: { unoptimized: true },
  env: {
    // Empty = call the SAME origin the app is served from (no cross-origin CORS).
    // Served at https://veklom.com/control-plane-next/, so API calls hit
    // https://veklom.com/api/v1/... which routes to the same backend.
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL ?? "",
    NEXT_PUBLIC_BASE_PATH: BASE_PATH,
  },
  // Static exports don't support dynamic redirects at runtime in Next.js, but since Next.js allows
  // redirects block during build for clients that support it, or we will add an explicit client-side fallback/route,
  // we add it here as standard practice.
  async redirects() {
    return [
      {
        source: "/token-wallet",
        destination: "/wallet",
        permanent: true,
      },
    ];
  },
};
export default nextConfig;
