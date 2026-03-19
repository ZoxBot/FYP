"use client";

import { useEffect } from "react";

export function FetchInterceptor() {
  useEffect(() => {
    // Only intercept if running in browser
    if (typeof window !== "undefined") {
      const originalFetch = window.fetch;

      window.fetch = async (...args) => {
        let [resource, config] = args;
        
        // If config is undefined, initialize it
        if (!config) {
          config = {};
        }

        // Add credentials: 'include' to ensure cookies are sent
        config.credentials = 'include';

        return originalFetch(resource, config);
      };
    }
  }, []);

  return null;
}
