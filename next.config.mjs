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

const sanitizeDestination = (url, fallback) => {
  if (!url) return fallback;
  if (process.env.NODE_ENV === "production") {
    // In production / edge worker builds, purge Docker bridge and local loopback addresses
    if (url.includes("127.0.0.1") || url.includes("localhost") || url.includes("host.docker.internal")) {
      return fallback;
    }
  }
  return url.replace(/\/$/, "");
};

const LOCKERPHYCER_URL = sanitizeDestination(
  process.env.LOCKERPHYCER_URL,
  "https://api.veklom.com"
);

const CAPPO_URL = sanitizeDestination(
  process.env.CAPPO_BACKEND_URL || process.env.CAPPO_URL,
  "https://cappo.veklom.com"
);

const VNP_URL = sanitizeDestination(
  process.env.VNP_URL,
  "https://vnp.veklom.com"
);

const APEX_URL = sanitizeDestination(
  process.env.APEX_URL,
  "https://apex.veklom.com"
);

const ABIDE_URL = sanitizeDestination(
  process.env.ABIDE_URL,
  "https://abide.veklom.com"
);

const PGL_URL = sanitizeDestination(
  process.env.PGL_URL,
  "https://pgl.veklom.com"
);

const CAPI_URL = sanitizeDestination(
  process.env.CAPI_URL || process.env.CAPI_BACKEND_URL,
  "https://capi.veklom.com"
);

const VLINK_URL = sanitizeDestination(
  process.env.VLINK_URL,
  "https://vlink.veklom.com"
);

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

        // ── Edge Health & Protocol Decoupling ────────────────────────────────
        // Health and discovery served directly by local Edge API handlers,
        // decoupled completely from local LockerPhycer or backend daemons.
        { source: "/health",        destination: "/api/health" },
        { source: "/health/",       destination: "/api/health" },
        { source: "/protocol.json", destination: "/api/protocol.json" },
        // NOTE: /status/ and /status are NOT rewritten here; they route directly
        // to the canonical UI status page at app/status/page.tsx.

        // ── CAPPO: consequence authority ──────────────────────────────────────
        { source: "/api/v1/cappo/:path*",  destination: `${CAPPO_URL}/api/v1/cappo/:path*` },

        // ── VNP: measurement ──────────────────────────────────────────────────
        { source: "/api/v1/vnp/:path*",    destination: `${VNP_URL}/api/v1/vnp/:path*` },

        // ── PGL: evidence ledger ──────────────────────────────────────────────
        { source: "/api/v1/ledger/:path*", destination: `${PGL_URL}/api/v1/ledger/:path*` },

        // ── cAPI: capability registry ─────────────────────────────────────────
        { source: "/api/v1/capi/:path*",   destination: `${CAPI_URL}/api/v1/capi/:path*` },

        // ── VLink: complete public protocol boundary ───────────────────────
        // Parameterized via VLINK_URL (defaulting to https://vlink.veklom.com).
        // Order matters: specific before wildcard.
        //
        // UI entry point
        { source: "/vlink/connect",        destination: `${VLINK_URL}/` },
        { source: "/vlink/connect/:path*", destination: `${VLINK_URL}/:path*` },
        //
        // API — create, list, pair, approve, manifest, webhook, activity
        { source: "/api/v1/vlinks",        destination: `${VLINK_URL}/api/v1/vlinks` },
        { source: "/api/v1/vlinks/:path*", destination: `${VLINK_URL}/api/v1/vlinks/:path*` },
        //
        // Phone approval page (QR code scans land here)
        { source: "/pair/:path*",          destination: `${VLINK_URL}/pair/:path*` },
        //
        // OpenAI-compatible API base URL  (generated by VLink as /vlinks/:id/v1)
        { source: "/vlinks/:path*",        destination: `${VLINK_URL}/vlinks/:path*` },
        //
        // Discovery
        { source: "/.well-known/vlink.json", destination: `${VLINK_URL}/.well-known/vlink.json` },


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
