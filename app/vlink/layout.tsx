import type { Metadata } from "next";
import { headers } from "next/headers";
import { brandShareMetadata, originFromHost } from "@/lib/brandMetadata";

/**
 * veklom.com/vlink shares the VLink card. /vlink/connect/ is proxied to the
 * separate VLink app (next.config.mjs rewrite), so its head is set in that app.
 */
export async function generateMetadata(): Promise<Metadata> {
  const origin = originFromHost((await headers()).get("host"));
  return brandShareMetadata("vlink", origin, "/vlink/");
}

export default function VLinkLayout({ children }: { children: React.ReactNode }) {
  return children;
}
