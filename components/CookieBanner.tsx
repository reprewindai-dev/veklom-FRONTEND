"use client";

import { useEffect, useState } from "react";

export default function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if the user has already made a choice
    const consent = localStorage.getItem("veklom_cookie_consent");
    if (!consent) {
      setShowBanner(true);
    } else if (consent === "granted") {
      // Ensure the grant is reapplied on subsequent loads
      if (typeof window !== "undefined" && window.gtag) {
        window.gtag("consent", "update", {
          ad_storage: "granted",
          ad_user_data: "granted",
          ad_personalization: "granted",
          analytics_storage: "granted",
        });
      }
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("veklom_cookie_consent", "granted");
    setShowBanner(false);

    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("consent", "update", {
        ad_storage: "granted",
        ad_user_data: "granted",
        ad_personalization: "granted",
        analytics_storage: "granted",
      });
    }
  };

  const handleDecline = () => {
    localStorage.setItem("veklom_cookie_consent", "denied");
    setShowBanner(false);
    // Already defaults to denied, so no need to push an update unless we want to be explicit
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] bg-bg-800 border-t border-ink-800 p-4 shadow-xl">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-sm text-ink-300">
          <p>
            We use cookies to measure performance, improve our platform, and personalize your experience. 
            By clicking "Accept", you consent to our use of cookies for analytics and measurement.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleDecline}
            className="px-4 py-2 text-sm text-ink-400 hover:text-ink-100 transition-colors"
          >
            Decline
          </button>
          <button
            onClick={handleAccept}
            className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-md transition-colors"
          >
            Accept Cookies
          </button>
        </div>
      </div>
    </div>
  );
}
