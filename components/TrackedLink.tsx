"use client";

import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { trackAnalyticsEvent } from "@/lib/analytics";

type TrackedLinkProps = Omit<ComponentProps<typeof Link>, "children"> & {
  children: ReactNode;
  eventName?: string;
  ctaLabel: string;
  ctaLocation: string;
};

export function TrackedLink({
  children,
  eventName = "cta_click",
  ctaLabel,
  ctaLocation,
  href,
  onClick,
  ...props
}: TrackedLinkProps) {
  return (
    <Link
      href={href}
      {...props}
      onClick={(event) => {
        trackAnalyticsEvent(eventName, {
          journey_stage: "acquisition",
          surface: ctaLocation,
          cta_label: ctaLabel,
          cta_location: ctaLocation,
          destination: typeof href === "string" ? href : href.pathname ?? "unknown",
        });
        onClick?.(event);
      }}
    >
      {children}
    </Link>
  );
}
