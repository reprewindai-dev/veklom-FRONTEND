/** @type {import('next').NextConfig} */

// Canonical public deployment: local Docker + Cloudflare Tunnel.
// Browser API traffic stays same-origin. Next proxies it to the locally managed
// BYOS runtime so cookies/session behavior remains consistent and CORS is not
// introduced into the authentication boundary.
const BACKEND_URL = (
  process.env.BACKEND_URL ||
  (process.env.NODE_ENV === "production"
    ? "http://host.docker.internal:8088"
    : "http://127.0.0.1:8088")
).replace(/\/$/, "");

const CAPPO_URL = (process.env.CAPPO_BACKEND_URL || process.env.CAPPO_URL || "https://cappo.veklom.com").replace(/\/$/, "");
const VNP_URL = (process.env.VNP_URL || "https://vnp.veklom.com").replace(/\/$/, "");
const APEX_URL = (process.env.APEX_URL || "https://apex.veklom.com").replace(/\/$/, "");
const ABIDE_URL = (process.env.ABIDE_URL || "https://abide.veklom.com").replace(/\/$/, "");
const PGL_URL = (process.env.PGL_URL || "https://pgl.veklom.com").replace(/\/$/, "");

const nextConfig = {
  output: "standalone",
  reactStrictMode: true,
  typescript: { ignoreBuildErrors: true },
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  images: { unoptimized: true },
  staticPageGenerationTimeout: 1000,
  compress: true,
  turbopack: {},

  async headers() {
    return [
      {
        source: "/images/:all*(svg|jpg|png|webp)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },

  webpack: (config, { isServer }) => {
    if (isServer) {
      const existingExternals = Array.isArray(config.externals)
        ? config.externals
        : config.externals
          ? [config.externals]
          : [];
      config.externals = [
        ...existingExternals,
        "wagmi",
        "viem",
        "@wagmi/core",
        "@wagmi/connectors",
        "mppx",
        "ox",
        "accounts",
      ];
    }
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      { module: /node_modules\/(mppx|ox|wagmi|@wagmi|accounts)/ },
    ];
    return config;
  },

  async redirects() {
    return [
      { source: "/doc", destination: "/docs", permanent: true },
      { source: "/terrrinal/:path*", destination: "/terminal/:path*", permanent: true },
      { source: "/workspace/login", destination: "/login", permanent: true },
      { source: "/workspace/signup", destination: "/signup", permanent: true },
      { source: "/workspace/dashboard", destination: "/os", permanent: true },
      { source: "/onboarding/pgl", destination: "/os/onboarding", permanent: true },
      { source: "/dashboard", destination: "/os", permanent: false },
      { source: "/wallet", destination: "/os", permanent: false },
      { source: "/wallet/:path*", destination: "/os", permanent: false },
      { source: "/token-wallet", destination: "/os", permanent: false },
      { source: "/token-wallet/:path*", destination: "/os", permanent: false },
    ];
  },

  async rewrites() {
    return {
      beforeFiles: [
        { source: "/health/", destination: `${BACKEND_URL}/health/` },
        { source: "/status/", destination: `${BACKEND_URL}/status/` },
        { source: "/protocol.json", destination: `${BACKEND_URL}/protocol.json` },
        { source: "/api/v1/cappo/:path*", destination: `${CAPPO_URL}/api/v1/cappo/:path*` },
        { source: "/api/v1/vnp/:path*", destination: `${VNP_URL}/api/v1/vnp/:path*` },
        { source: "/api/v1/apex/:path*", destination: `${APEX_URL}/api/v1/apex/:path*` },
        { source: "/api/v1/abide/:path*", destination: `${ABIDE_URL}/api/v1/abide/:path*` },
        { source: "/api/v1/ledger/:path*", destination: `${PGL_URL}/api/v1/ledger/:path*` },
        { source: "/gpc", destination: `${BACKEND_URL}/gpc/` },
        { source: "/gpc/:path*", destination: `${BACKEND_URL}/gpc/:path*` },
      ],
      fallback: [
        {
          // All browser API calls remain same-origin and are forwarded to BYOS.
          source: "/api/:path*",
          destination: `${BACKEND_URL}/api/:path*`,
        },
        {
          source: "/v1/:path*",
          destination: `${BACKEND_URL}/v1/:path*`,
        },
      ],
    };
  },
};

export default nextConfig;
