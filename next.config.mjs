/** @type {import('next').NextConfig} */
// Standalone Next.js deployment configuration

// BACKEND_URL  — server-side env var set in Coolify / Docker.
//   In prod, point this at the backend service URL (e.g. http://veklom-api:8088)
//   or the public domain if they share a domain (https://api.veklom.com).
//   Production builds fail closed when BACKEND_URL is absent.
const BACKEND_URL = process.env.BACKEND_URL ||
  (process.env.NODE_ENV === "production" ? "" : "http://127.0.0.1:8088");

if (process.env.NODE_ENV === "production" && !BACKEND_URL) {
  throw new Error("BACKEND_URL must be configured for production builds");
}

const nextConfig = {
  output: "standalone",
  reactStrictMode: true,
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  images: { unoptimized: true },
  staticPageGenerationTimeout: 1000,
  webpack: (config, { isServer }) => {
    // wagmi / viem / mppx / ox use dynamic requires incompatible with
    // Next.js server-side bundling. Mark them external on the server —
    // they are client-only wallet packages.
    if (isServer) {
      const existingExternals = Array.isArray(config.externals)
        ? config.externals
        : config.externals
        ? [config.externals]
        : [];
      config.externals = [
        ...existingExternals,
        'wagmi',
        'viem',
        '@wagmi/core',
        '@wagmi/connectors',
        'mppx',
        'ox',
        'accounts',
      ];
    }
    // Suppress "Critical dependency: the request of a dependency is an expression"
    // from wagmi/mppx/ox tempo internals during client bundling.
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      { module: /node_modules\/(mppx|ox|wagmi|@wagmi|accounts)/ },
    ];
    return config;
  },
  // IMPORTANT: Do NOT set NEXT_PUBLIC_API_BASE_URL here.
  // It must remain empty so the browser uses same-origin /api/* paths.
  // The rewrites() block below proxies those to BACKEND_URL server-side.
  // Setting it to https://api.veklom.com causes CORS errors on authenticated requests.
  async redirects() {
    return [
      // Legacy typo fix
      {
        source: "/terrrinal/:path*",
        destination: "/terminal/:path*",
        permanent: true,
      },
      // Legacy auth paths
      {
        source: "/workspace/login",
        destination: "/login",
        permanent: true,
      },
      {
        source: "/workspace/signup",
        destination: "/signup",
        permanent: true,
      },
      {
        source: "/workspace/dashboard",
        destination: "/control-node",
        permanent: true,
      },
      // CANONICAL REDIRECTS: Legacy workspace → UACP v5 canonical routes
      {
        source: "/dashboard",
        destination: "/control-node",
        permanent: false,
      },
      {
        source: "/wallet",
        destination: "/treasury",
        permanent: false,
      },
      {
        source: "/wallet/:path*",
        destination: "/treasury",
        permanent: false,
      },
      {
        source: "/token-wallet",
        destination: "/treasury",
        permanent: false,
      },
      {
        source: "/token-wallet/:path*",
        destination: "/treasury",
        permanent: false,
      },
      // Keep old /terminal route working but now it renders the new page
      // (app/(uacp)/terminal/page.tsx already handles /terminal)
    ];
  },
  async rewrites() {
    return [
      {
        // Serve unauthenticated health status from the backend VPS via local proxy
        source: "/health/",
        destination: `${BACKEND_URL}/health/`,
      },
      {
        // Serve unauthenticated API status page from the backend VPS via local proxy
        source: "/status/",
        destination: `${BACKEND_URL}/status/`,
      },
      {
        // Serve the protocol manifest from the backend
        source: "/protocol.json",
        destination: `${BACKEND_URL}/protocol.json`,
      },
      {
        // PGL calls
        source: "/api/v1/pgl/:path*",
        destination: `${process.env.PGL_URL || "https://pgl.veklom.com"}/api/v1/pgl/:path*`,
      },
      {
        // CAPPO calls
        source: "/api/v1/cappo/:path*",
        destination: `${process.env.CAPPO_URL || "https://cappo.veklom.com"}/api/v1/cappo/:path*`,
      },
      {
        // VNP calls
        source: "/api/v1/vnp/:path*",
        destination: `${process.env.VNP_URL || "https://vnp.veklom.com"}/api/v1/vnp/:path*`,
      },
      {
        // APEX calls
        source: "/api/v1/apex/:path*",
        destination: `${process.env.APEX_URL || "https://apex.veklom.com"}/api/v1/apex/:path*`,
      },
      {
        // ABIDE calls
        source: "/api/v1/abide/:path*",
        destination: `${process.env.ABIDE_URL || "https://abide.veklom.com"}/api/v1/abide/:path*`,
      },
      {
        // PGL ledger calls go to the dedicated ledger service
        source: "/api/v1/ledger/:path*",
        destination: `${process.env.PGL_URL || "https://pgl.veklom.com"}/api/v1/ledger/:path*`,
      },
      {
        // Proxy GPC canvas to backend static mount
        source: "/gpc",
        destination: `${BACKEND_URL}/gpc/`,
      },
      {
        source: "/gpc/:path*",
        destination: `${BACKEND_URL}/gpc/:path*`,
      },
      {
        // All /api/* calls from the browser are proxied to the backend.
        // This avoids CORS entirely — the browser always talks to its own origin.
        source: "/api/:path*",
        destination: `${BACKEND_URL}/api/:path*`,
      },
    ];
  },
};
export default nextConfig;
