import { MetadataRoute } from "next";

const PUBLIC_URLS = [
  "",
  "/consequence-authority",
  "/architecture",
  "/proof",
  "/conformance",
  "/docs",
  "/machine",
  "/get",
  "/trust",
  "/security",
  "/api",
  "/cappo",
  "/capi",
  "/vlink",
  "/lockerphycer",
  "/guardian",
  "/pgl",
  "/eee",
  "/vcgb",
  "/vnp",
  "/spine",
  "/privacy",
  "/terms",
  "/acceptable-use",
  "/cookies",
  "/dpa",
  "/subprocessors",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NODE_ENV === "development"
    ? "http://localhost:3000"
    : "https://veklom.com";

  // Do not manufacture freshness. Google only uses lastmod when it is
  // consistently accurate, and ignores priority/changefreq.
  return PUBLIC_URLS.map((path) => ({
    url: `${baseUrl}${path}`,
  }));
}
