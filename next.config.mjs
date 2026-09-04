/** @type {import('next').NextConfig} */

// Route ownership:
//   auth / users / workspace  → LockerPhycer (identity authority)
//   cappo                     → CAPPO (consequence authority)
//   ledger                    → PGL (evidence)
//   vnp                       → VNP (measurement)
//   apex / abide              → downstream services
//
// BYOS is NOT a fallback target. Any /api/* path not matched above
// must return 404 from Next.js rather than silently reaching BYOS.

const LOCKERPHYCER_URL = (
  process.env.LOCKERPHYCER_URL ||
  (process.env.NODE_ENV === "production"
    ? "http://host.docker.internal:8092"
    : "http://127.0.0.1:8092")
).replace(/\/$/, "");

const CAPPO_URL = (process.env.CAPPO_BACKEND_URL || process.env.CAPPO_URL || "https://cappo.veklom.com").replace(/\/$/, "");
const VNP_URL = (process.env.VNP_URL || "https://vnp.veklom.com").replace(/\/$/, "");
const APEX_URL = (process.env.APEX_URL || "https://apex.veklom.com").replace(/\/$/, "");
const ABIDE_URL = (process.env.ABIDE_URL || "https://abide.veklom.com").replace(/\/$/, "");
const PGL_URL = (process.env.PGL_URL || "https://pgl.veklom.com").replace(/\/$/, "");
const CAPI_URL = (process.env.CAPI_URL || "https://capi.veklom.com").replace(/\/$/, "");

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
        // ── LockerPhycer: identity authority ──────────────────────────────────
        { source: "/api/v1/auth/:path*",      destination: `${LOCKERPHYCER_URL}/api/v1/auth/:path*` },
        { source: "/api/v1/users/:path*",     destination: `${LOCKERPHYCER_URL}/api/v1/users/:path*` },
        { source: "/api/v1/workspace/:path*", destination: `${LOCKERPHYCER_URL}/api/v1/workspace/:path*` },

        // ── Health / protocol sourced from LockerPhycer ───────────────────────
        { source: "/health/",       destination: `${LOCKERPHYCER_URL}/health/` },
        { source: "/status/",       destination: `${LOCKERPHYCER_URL}/health/` },
        { source: "/protocol.json", destination: `${LOCKERPHYCER_URL}/protocol.json` },

        // ── CAPPO: consequence authority ──────────────────────────────────────
        { source: "/api/v1/cappo/:path*",  destination: `${CAPPO_URL}/api/v1/cappo/:path*` },

        // ── VNP: measurement ──────────────────────────────────────────────────
        { source: "/api/v1/vnp/:path*",    destination: `${VNP_URL}/api/v1/vnp/:path*` },

        // ── PGL: evidence ledger ──────────────────────────────────────────────
        { source: "/api/v1/ledger/:path*", destination: `${PGL_URL}/api/v1/ledger/:path*` },

        // ── cAPI: capability registry ─────────────────────────────────────────
        { source: "/api/v1/capi/:path*",   destination: `${CAPI_URL}/api/v1/capi/:path*` },

        // ── Downstream services ───────────────────────────────────────────────
        { source: "/api/v1/apex/:path*",   destination: `${APEX_URL}/api/v1/apex/:path*` },
        { source: "/api/v1/abide/:path*",  destination: `${ABIDE_URL}/api/v1/abide/:path*` },
      ],
      // NO fallback to BYOS. Unmatched /api/* returns 404 from Next.js.
      // This is intentional: silent catch-alls mask ownership regressions.
    };
  },
};

export default nextConfig;
